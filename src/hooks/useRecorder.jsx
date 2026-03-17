import { useState, useRef, useCallback, useEffect } from 'react'
import { useVoiceEffects } from './useVoiceEffects'

export function useRecorder() {
  const [recording, setRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [duration, setDuration] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [transcript, setTranscript] = useState('')
  const [micReady, setMicReady] = useState(false)
  const mediaRecorder = useRef(null)
  const chunks = useRef([])
  const timerRef = useRef(null)
  const countdownRef = useRef(null)
  const startTimeRef = useRef(null)
  const audioCtxRef = useRef(null)
  const monitorRef = useRef(null)
  const streamRef = useRef(null)
  const recognitionRef = useRef(null)
  const { createChain } = useVoiceEffects()

  // Pre-warm mic on mount — get permission + activate hardware early
  useEffect(() => {
    let warmStream = null
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        warmStream = stream
        setMicReady(true)
        // Keep stream alive briefly, then release (permission is now cached)
        setTimeout(() => {
          stream.getTracks().forEach(t => t.stop())
        }, 500)
      })
      .catch(() => {})

    return () => {
      if (warmStream) warmStream.getTracks().forEach(t => t.stop())
    }
  }, [])

  const start = useCallback(async (beatAudioElement, { preset = 'studio', heatLength = 90, headphones = false } = {}) => {
    if (mediaRecorder.current?.state === 'recording') return
    setLoading(true)

    // Get mic stream first (fast — pre-warmed, permission cached)
    // Do this BEFORE beat so main thread isn't blocked during playback
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: !headphones,
        noiseSuppression: false,
        autoGainControl: false,
        sampleRate: { ideal: 48000 },
        channelCount: { ideal: 1 }
      }
    })
    streamRef.current = stream

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
      stopTranscription()
      setTimeout(() => cleanup(), 150)
    }

    mediaRecorder.current = recorder

    // Start beat right before recorder — everything is wired up, no more blocking work
    if (beatAudioElement) {
      beatAudioElement.currentTime = 0
      beatAudioElement.loop = true
      beatAudioElement.play()
    }

    recorder.start(100)
    setRecording(true)
    setLoading(false)
    setAudioBlob(null)
    setDuration(0)
    setTranscript('')
    setTimeRemaining(heatLength)
    startTimeRef.current = Date.now()

    startTranscription()

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

    recognition.onerror = () => {}
    recognition.onend = () => {
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
    // Keep AudioContext alive for reuse — only suspend it
    if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
      audioCtxRef.current.suspend()
    }
    monitorRef.current = null
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

  // Full teardown — close AudioContext (call on unmount)
  const destroy = useCallback(() => {
    cleanup()
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
  }, [cleanup])

  return {
    recording, loading, audioBlob, duration, timeRemaining, transcript, micReady,
    start, stop, reset, cleanup, destroy, toggleMonitor
  }
}
