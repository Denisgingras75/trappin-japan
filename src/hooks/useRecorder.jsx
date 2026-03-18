import { useState, useRef, useCallback, useEffect } from 'react'
import { useVoiceEffects } from './useVoiceEffects'

export function useRecorder() {
  const [recording, setRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [duration, setDuration] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [micReady, setMicReady] = useState(false)
  const mediaRecorder = useRef(null)
  const chunks = useRef([])
  const timerRef = useRef(null)
  const countdownRef = useRef(null)
  const startTimeRef = useRef(null)
  const audioCtxRef = useRef(null)
  const monitorRef = useRef(null)
  const streamRef = useRef(null)
  const { createChain } = useVoiceEffects()

  const lastHeadphonesRef = useRef(null)

  // Pre-warm mic + AudioContext on mount — keep stream alive for instant start
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: { ideal: 48000 },
            channelCount: { ideal: 1 }
          }
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream

        const ctx = new AudioContext({ sampleRate: 48000 })
        audioCtxRef.current = ctx
        // Suspend until needed (saves battery, avoids autoplay issues)
        if (ctx.state === 'running') ctx.suspend()

        setMicReady(true)
      } catch (e) {}
    })()

    return () => { cancelled = true }
  }, [])

  const start = useCallback(async (beatAudioElement, { preset = 'studio', heatLength = 90, headphones = false } = {}) => {
    if (mediaRecorder.current?.state === 'recording') return
    setLoading(true)

    // Reuse pre-warmed mic stream if alive and echoCancellation mode hasn't changed
    const ecChanged = lastHeadphonesRef.current !== null && lastHeadphonesRef.current !== headphones
    const needNewStream = !streamRef.current
      || streamRef.current.getTracks().some(t => t.readyState === 'ended')
      || ecChanged
    if (needNewStream) {
      // Stop old stream if any
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: !headphones,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: { ideal: 48000 },
          channelCount: { ideal: 1 }
        }
      })
    }
    lastHeadphonesRef.current = headphones
    const stream = streamRef.current

    // Reuse AudioContext if we already have one, otherwise create
    let audioCtx = audioCtxRef.current
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContext({ sampleRate: 48000 })
      audioCtxRef.current = audioCtx
    }
    // Resume if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume()
    }

    const micSource = audioCtx.createMediaStreamSource(stream)
    const effectsOutput = createChain(audioCtx, micSource, preset)

    const dest = audioCtx.createMediaStreamDestination()
    effectsOutput.connect(dest)

    const monitorGain = audioCtx.createGain()
    monitorGain.gain.value = 0
    effectsOutput.connect(monitorGain)
    monitorGain.connect(audioCtx.destination)
    monitorRef.current = monitorGain

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
      setTimeout(() => cleanup(), 150)
    }

    mediaRecorder.current = recorder

    recorder.start(100)
    setRecording(true)
    setLoading(false)
    setAudioBlob(null)
    setDuration(0)
    setTimeRemaining(heatLength)
    startTimeRef.current = Date.now()

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setDuration(elapsed)
      const remaining = heatLength - elapsed
      setTimeRemaining(remaining > 0 ? remaining : 0)
    }, 200)

    countdownRef.current = setTimeout(() => {
      if (mediaRecorder.current?.state === 'recording') {
        mediaRecorder.current.stop()
        setRecording(false)
      }
    }, heatLength * 1000)
  }, [createChain])

  const stop = useCallback(() => {
    if (countdownRef.current) clearTimeout(countdownRef.current)
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop()
      setRecording(false)
    }
  }, [])

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current)
    clearTimeout(countdownRef.current)
    // Keep mic stream + AudioContext alive for instant re-record
    if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
      audioCtxRef.current.suspend()
    }
    monitorRef.current = null
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

  // Full teardown — release mic + close AudioContext (call on unmount)
  const destroy = useCallback(() => {
    cleanup()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
  }, [cleanup])

  return {
    recording, loading, audioBlob, duration, timeRemaining, micReady,
    start, stop, reset, cleanup, destroy, toggleMonitor
  }
}
