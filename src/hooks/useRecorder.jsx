import { useState, useRef, useCallback } from 'react'
import { useVoiceEffects } from './useVoiceEffects'

export function useRecorder() {
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [duration, setDuration] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [transcript, setTranscript] = useState('')
  const mediaRecorder = useRef(null)
  const chunks = useRef([])
  const timerRef = useRef(null)
  const countdownRef = useRef(null)
  const startTimeRef = useRef(null)
  const audioCtxRef = useRef(null)
  const beatSourceRef = useRef(null)
  const beatGainRef = useRef(null)
  const monitorRef = useRef(null)
  const streamRef = useRef(null)
  const recognitionRef = useRef(null)
  const { createChain } = useVoiceEffects()

  const start = useCallback(async (beatAudioElement, { preset = 'studio', heatLength = 90 } = {}) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
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

    // Beat plays through speakers with volume control — NOT routed to recording
    if (beatAudioElement) {
      try {
        const beatSource = audioCtx.createMediaElementSource(beatAudioElement)
        beatSourceRef.current = beatSource
        const beatGain = audioCtx.createGain()
        beatGain.gain.value = 0.7  // default beat volume (lower than full)
        beatGainRef.current = beatGain
        beatSource.connect(beatGain)
        beatGain.connect(audioCtx.destination)
        beatAudioElement.currentTime = 0
        beatAudioElement.loop = true
        beatAudioElement.play()
      } catch (e) {
        beatAudioElement.currentTime = 0
        beatAudioElement.loop = true
        beatAudioElement.volume = 0.7
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
      stopTranscription()
      cleanup()
    }

    mediaRecorder.current = recorder
    recorder.start(100)
    setRecording(true)
    setAudioBlob(null)
    setDuration(0)
    setTranscript('')
    setTimeRemaining(heatLength)
    startTimeRef.current = Date.now()

    // Start speech recognition for transcript
    startTranscription()

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

  function startTranscription() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    let finalText = ''
    recognition.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          finalText += t + ' '
        } else {
          interim = t
        }
      }
      setTranscript(finalText + interim)
    }

    recognition.onerror = () => {} // silently ignore
    recognition.onend = () => {
      // Restart if still recording (browser cuts off after ~60s)
      if (mediaRecorder.current?.state === 'recording') {
        try { recognition.start() } catch (e) {}
      }
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
    } catch (e) {}
  }

  function stopTranscription() {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch (e) {}
      recognitionRef.current = null
    }
  }

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
    beatGainRef.current = null
  }, [])

  const reset = useCallback(() => {
    setAudioBlob(null)
    setDuration(0)
    setTimeRemaining(null)
    setTranscript('')
  }, [])

  const toggleMonitor = useCallback((on) => {
    if (monitorRef.current) {
      monitorRef.current.gain.value = on ? 0.8 : 0
    }
  }, [])

  const setBeatVolume = useCallback((val) => {
    if (beatGainRef.current) {
      beatGainRef.current.gain.value = val
    }
  }, [])

  return {
    recording, audioBlob, duration, timeRemaining, transcript,
    start, stop, reset, cleanup, toggleMonitor, setBeatVolume
  }
}
