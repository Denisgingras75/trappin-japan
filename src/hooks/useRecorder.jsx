import { useState, useRef, useCallback, useEffect } from 'react'
import { useVoiceEffects } from './useVoiceEffects'

// Mic-only recorder. Beat playback lives in Record.jsx on a separate
// AudioContext so the mic/effects/MediaRecorder pipeline can't starve
// the beat's audio thread (that was causing the mid-playback sputter).

// echoCancellation is OFF on purpose. Android Chrome routes AEC-enabled
// streams through VOICE_COMMUNICATION mode, which triggers the phone-call
// notification + "call ended" popup. Since the beat isn't in the recording
// (voice-only), bleed is minimal.
// "No limit" heats still stop eventually so a forgotten phone doesn't
// record forever (and the upload stays well under storage limits).
export const MAX_RECORD_SECONDS = 20 * 60

// Frames quieter than this (-45 dBFS) don't count toward a take's level.
const VOICED_FLOOR = Math.pow(10, -45 / 10)

const MIC_CONSTRAINTS = {
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    sampleRate: { ideal: 48000 },
    channelCount: { ideal: 1 }
  }
}

export function useRecorder() {
  const [recording, setRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [duration, setDuration] = useState(0)
  const [durationMs, setDurationMs] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [micReady, setMicReady] = useState(false)
  const [error, setError] = useState(null)
  const mediaRecorder = useRef(null)
  const chunks = useRef([])
  const timerRef = useRef(null)
  const countdownRef = useRef(null)
  const startTimeRef = useRef(null)
  const audioCtxRef = useRef(null)
  const monitorRef = useRef(null)
  const streamRef = useRef(null)
  const nodesRef = useRef([])
  const levelRef = useRef({ sum: 0, n: 0 })
  const [levelDb, setLevelDb] = useState(null)
  const { createChain } = useVoiceEffects()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS)
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        setMicReady(true)
      } catch (e) {}
    })()

    return () => { cancelled = true }
  }, [])

  // heatLength: seconds, or null for "no limit" (capped at MAX_RECORD_SECONDS).
  // beforeStart: awaited once the mic pipeline is up, right before recording.
  // onStart: called synchronously in the same tick the recorder starts —
  //   the beat is started there so voice and beat share a zero point.
  // Returns true if recording actually started.
  const start = useCallback(async ({ preset = 'clean', heatLength = 90, beforeStart, onStart } = {}) => {
    if (mediaRecorder.current?.state === 'recording') return false
    setLoading(true)
    setError(null)

    let stream, audioCtx
    try {
      const needNewStream = !streamRef.current
        || streamRef.current.getTracks().some(t => t.readyState === 'ended')
      if (needNewStream) {
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS)
        setMicReady(true)
      }
      stream = streamRef.current

      audioCtx = audioCtxRef.current
      if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = new AudioContext({ sampleRate: 48000 })
        audioCtxRef.current = audioCtx
      }
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume()
      }
      if (beforeStart) await beforeStart()
    } catch (e) {
      setLoading(false)
      setError(e?.name === 'NotAllowedError' || e?.name === 'NotFoundError'
        ? 'Mic blocked — allow microphone access and try again'
        : 'Could not start recording — try again')
      return false
    }

    // Drop the previous take's graph so old effect chains don't pile up
    // on the mic (each take used to leave its chain connected).
    nodesRef.current.forEach(n => { try { n.disconnect() } catch (e) {} })

    const micSource = audioCtx.createMediaStreamSource(stream)
    const effectsOutput = createChain(audioCtx, micSource, preset)

    const dest = audioCtx.createMediaStreamDestination()
    effectsOutput.connect(dest)

    const monitorGain = audioCtx.createGain()
    monitorGain.gain.value = 0
    effectsOutput.connect(monitorGain)
    monitorGain.connect(audioCtx.destination)
    monitorRef.current = monitorGain

    // Meter the processed voice so playback can balance it against the beat.
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 2048
    effectsOutput.connect(analyser)
    const meterBuf = new Float32Array(analyser.fftSize)
    levelRef.current = { sum: 0, n: 0 }
    nodesRef.current = [micSource, effectsOutput, monitorGain, analyser]

    let mimeType = 'audio/webm;codecs=opus'
    if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : ''
    }

    const recorderOpts = { audioBitsPerSecond: 128000 }
    if (mimeType) recorderOpts.mimeType = mimeType

    const recorder = new MediaRecorder(dest.stream, recorderOpts)
    chunks.current = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunks.current, { type: recorder.mimeType || mimeType || 'audio/webm' })
      setDurationMs(Date.now() - startTimeRef.current)
      const { sum, n } = levelRef.current
      setLevelDb(n >= 5 ? 10 * Math.log10(sum / n) : null)
      setAudioBlob(blob)
      setRecording(false)
      setTimeout(() => cleanup(), 150)
    }

    mediaRecorder.current = recorder

    // If the mic dies mid-take (unplugged, permission pulled), keep what we have.
    stream.getAudioTracks().forEach(t => {
      t.onended = () => { if (recorder.state === 'recording') recorder.stop() }
    })

    recorder.start(1000)
    startTimeRef.current = Date.now()
    if (onStart) { try { onStart() } catch (e) {} }

    const limit = Math.min(heatLength || MAX_RECORD_SECONDS, MAX_RECORD_SECONDS)
    setRecording(true)
    setLoading(false)
    setAudioBlob(null)
    setDuration(0)
    setDurationMs(0)
    setTimeRemaining(heatLength || null)

    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setDuration(elapsed)
      // Average power of the moments with voice in them (silence is skipped).
      analyser.getFloatTimeDomainData(meterBuf)
      let sq = 0
      for (let i = 0; i < meterBuf.length; i++) sq += meterBuf[i] * meterBuf[i]
      sq /= meterBuf.length
      if (sq > VOICED_FLOOR) { levelRef.current.sum += sq; levelRef.current.n += 1 }
      if (heatLength) setTimeRemaining(Math.max(heatLength - elapsed, 0))
    }, 100)

    countdownRef.current = setTimeout(() => {
      if (mediaRecorder.current?.state === 'recording') {
        mediaRecorder.current.stop()
        setRecording(false)
      }
    }, limit * 1000)
    return true
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
    monitorRef.current = null
  }, [])

  const reset = useCallback(() => {
    setAudioBlob(null)
    setDuration(0)
    setDurationMs(0)
    setTimeRemaining(null)
  }, [])

  // Rough mic-side latency in seconds (0 where the browser doesn't say).
  const getInputLatency = useCallback(() => {
    const track = streamRef.current?.getAudioTracks?.()[0]
    const l = track?.getSettings?.().latency
    return typeof l === 'number' && isFinite(l) ? l : 0
  }, [])

  const toggleMonitor = useCallback((on) => {
    if (monitorRef.current) {
      monitorRef.current.gain.value = on ? 0.8 : 0
    }
  }, [])

  const destroy = useCallback(() => {
    cleanup()
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.onstop = null
      try { mediaRecorder.current.stop() } catch (e) {}
    }
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
    recording, loading, audioBlob, duration, durationMs, levelDb, timeRemaining, micReady, error,
    start, stop, reset, cleanup, destroy, toggleMonitor, getInputLatency
  }
}
