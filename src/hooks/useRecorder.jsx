import { useState, useRef, useCallback } from 'react'
import { useVoiceEffects } from './useVoiceEffects'

export function useRecorder() {
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [duration, setDuration] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const mediaRecorder = useRef(null)
  const chunks = useRef([])
  const timerRef = useRef(null)
  const countdownRef = useRef(null)
  const startTimeRef = useRef(null)
  const audioCtxRef = useRef(null)
  const beatSourceRef = useRef(null)
  const monitorRef = useRef(null)
  const streamRef = useRef(null)
  const { createChain } = useVoiceEffects()

  const start = useCallback(async (beatAudioElement, { preset = 'studio', heatLength = 90 } = {}) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,  // off — we no longer record beat through mic
        noiseSuppression: false,
        autoGainControl: false,
        sampleRate: { ideal: 48000 },
        channelCount: { ideal: 1 }
      }
    })
    streamRef.current = stream

    const audioCtx = new AudioContext({ sampleRate: 48000 })
    audioCtxRef.current = audioCtx

    // Voice → effects chain (preset-aware)
    const micSource = audioCtx.createMediaStreamSource(stream)
    const effectsOutput = createChain(audioCtx, micSource, preset)

    // Recording destination — VOICE ONLY (no beat)
    const dest = audioCtx.createMediaStreamDestination()
    effectsOutput.connect(dest)

    // Live monitoring — OFF by default (speakers = feedback risk)
    const monitorGain = audioCtx.createGain()
    monitorGain.gain.value = 0
    effectsOutput.connect(monitorGain)
    monitorGain.connect(audioCtx.destination)
    monitorRef.current = monitorGain

    // Beat plays through speakers ONLY — NOT routed to recording
    if (beatAudioElement) {
      try {
        const beatSource = audioCtx.createMediaElementSource(beatAudioElement)
        beatSourceRef.current = beatSource
        beatSource.connect(audioCtx.destination)
        beatAudioElement.currentTime = 0
        beatAudioElement.loop = true
        beatAudioElement.play()
      } catch (e) {
        // Already connected — just play
        beatAudioElement.currentTime = 0
        beatAudioElement.loop = true
        beatAudioElement.play()
      }
    }

    // Codec selection
    let mimeType = 'audio/webm;codecs=opus'
    if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : ''
    }

    const recorderOpts = { audioBitsPerSecond: 256000 }
    if (mimeType) recorderOpts.mimeType = mimeType

    const recorder = new MediaRecorder(dest.stream, recorderOpts)
    chunks.current = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunks.current, { type: mimeType || 'audio/webm' })
      setAudioBlob(blob)
      cleanup()
    }

    mediaRecorder.current = recorder
    recorder.start(100)
    setRecording(true)
    setAudioBlob(null)
    setDuration(0)
    setTimeRemaining(heatLength)
    startTimeRef.current = Date.now()

    // Duration counter
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setDuration(elapsed)
      const remaining = heatLength - elapsed
      setTimeRemaining(remaining > 0 ? remaining : 0)
    }, 200)

    // Auto-stop at heat length
    countdownRef.current = setTimeout(() => {
      if (mediaRecorder.current?.state === 'recording') {
        mediaRecorder.current.stop()
        setRecording(false)
        if (beatAudioElement) beatAudioElement.pause()
      }
    }, heatLength * 1000)
  }, [createChain])

  const stop = useCallback((beatAudioElement) => {
    if (countdownRef.current) clearTimeout(countdownRef.current)
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop()
      setRecording(false)
    }
    if (beatAudioElement) {
      beatAudioElement.pause()
      beatAudioElement.loop = false
    }
  }, [])

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current)
    clearTimeout(countdownRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    monitorRef.current = null
    beatSourceRef.current = null
  }, [])

  const reset = useCallback(() => {
    setAudioBlob(null)
    setDuration(0)
    setTimeRemaining(null)
  }, [])

  const toggleMonitor = useCallback((on) => {
    if (monitorRef.current) {
      monitorRef.current.gain.value = on ? 0.8 : 0
    }
  }, [])

  return {
    recording, audioBlob, duration, timeRemaining,
    start, stop, reset, cleanup, toggleMonitor
  }
}
