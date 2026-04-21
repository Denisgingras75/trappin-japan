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
  const beatSourceRef = useRef(null)
  const beatGainRef = useRef(null)
  const { createChain } = useVoiceEffects()

  const lastHeadphonesRef = useRef(null)

  // Pre-warm mic on mount. Keep the stream alive so iOS stays in
  // record+playback audio-session mode and the OS doesn't switch modes
  // (which is what caused the 9–15s beat cutout on Rec tap).
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
        setMicReady(true)
      } catch (e) {}
    })()

    return () => { cancelled = true }
  }, [])

  // start() now drives the beat itself — give it a decoded AudioBuffer and
  // it'll play the beat via a BufferSourceNode in the same AudioContext that
  // captures the mic. No <audio> element → no network re-buffer → no seek
  // latency → no lag.
  const start = useCallback(async (
    beatBuffer,
    { preset = 'studio', heatLength = 90, headphones = false, beatVolume = 0.7 } = {}
  ) => {
    if (mediaRecorder.current?.state === 'recording') return
    setLoading(true)

    const ecChanged = lastHeadphonesRef.current !== null && lastHeadphonesRef.current !== headphones
    const needNewStream = !streamRef.current
      || streamRef.current.getTracks().some(t => t.readyState === 'ended')
      || ecChanged
    if (needNewStream) {
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

    let audioCtx = audioCtxRef.current
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContext({ sampleRate: 48000 })
      audioCtxRef.current = audioCtx
    }
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume()
    }

    // Mic → effects → dest → MediaRecorder (voice only, beat NOT in recording)
    const micSource = audioCtx.createMediaStreamSource(stream)
    const effectsOutput = createChain(audioCtx, micSource, preset)

    const dest = audioCtx.createMediaStreamDestination()
    effectsOutput.connect(dest)

    const monitorGain = audioCtx.createGain()
    monitorGain.gain.value = 0
    effectsOutput.connect(monitorGain)
    monitorGain.connect(audioCtx.destination)
    monitorRef.current = monitorGain

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
      stopBeat()
      setTimeout(() => cleanup(), 150)
    }

    mediaRecorder.current = recorder

    // Build the beat playback graph in the SAME context — instant start,
    // perfect volume control via GainNode, AEC reference available to the
    // browser.
    if (beatBuffer) {
      const gain = audioCtx.createGain()
      gain.gain.value = beatVolume
      const src = audioCtx.createBufferSource()
      src.buffer = beatBuffer
      src.connect(gain)
      gain.connect(audioCtx.destination)
      beatSourceRef.current = src
      beatGainRef.current = gain
      src.start(0)
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

  function stopBeat() {
    if (beatSourceRef.current) {
      try { beatSourceRef.current.stop() } catch (e) {}
      try { beatSourceRef.current.disconnect() } catch (e) {}
      beatSourceRef.current = null
    }
    if (beatGainRef.current) {
      try { beatGainRef.current.disconnect() } catch (e) {}
      beatGainRef.current = null
    }
  }

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
    monitorRef.current = null
    stopBeat()
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

  // Live beat volume — updates GainNode immediately, no re-render, no glitches
  const setBeatVolume = useCallback((v) => {
    if (beatGainRef.current) {
      beatGainRef.current.gain.setTargetAtTime(v, audioCtxRef.current?.currentTime || 0, 0.01)
    }
  }, [])

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
    recording, loading, audioBlob, duration, timeRemaining, transcript, micReady,
    start, stop, reset, cleanup, destroy, toggleMonitor, setBeatVolume
  }
}
