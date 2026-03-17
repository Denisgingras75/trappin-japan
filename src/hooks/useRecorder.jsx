import { useState, useRef, useCallback } from 'react'
import { useVoiceEffects } from './useVoiceEffects'

export function useRecorder() {
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [duration, setDuration] = useState(0)
  const [beatInMix, setBeatInMix] = useState(false)
  const mediaRecorder = useRef(null)
  const chunks = useRef([])
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const audioCtxRef = useRef(null)
  const beatSourceRef = useRef(null)
  const { createChain } = useVoiceEffects()

  const start = useCallback(async (beatAudioElement) => {
    // Request raw mic — disable ALL browser processing for best quality
    // These algorithms (noise suppression, AGC, echo cancel) destroy vocal tone
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        // Request high quality if available
        sampleRate: { ideal: 48000 },
        channelCount: { ideal: 1 }
      }
    })

    const audioCtx = new AudioContext({ sampleRate: 48000 })
    audioCtxRef.current = audioCtx

    // Voice → effects chain
    const micSource = audioCtx.createMediaStreamSource(stream)
    const effectsOutput = createChain(audioCtx, micSource)

    // Mix destination for final recording (beat + processed voice)
    const dest = audioCtx.createMediaStreamDestination()

    // Connect processed voice to recording mix
    effectsOutput.connect(dest)

    // Live monitoring — user hears their processed voice in headphones
    // Uses a small gain to prevent any feedback if not on headphones
    const monitorGain = audioCtx.createGain()
    monitorGain.gain.value = 0.85
    effectsOutput.connect(monitorGain)
    monitorGain.connect(audioCtx.destination)

    // If beat element provided, route it through AudioContext
    if (beatAudioElement) {
      try {
        const beatSource = audioCtx.createMediaElementSource(beatAudioElement)
        beatSourceRef.current = beatSource

        // Beat goes to speakers (user hears it) AND recording mix
        beatSource.connect(audioCtx.destination)
        beatSource.connect(dest)

        beatAudioElement.currentTime = 0
        beatAudioElement.play()
        setBeatInMix(true)
      } catch (e) {
        // Already connected to a context — just play (beat won't be in recording)
        beatAudioElement.currentTime = 0
        beatAudioElement.play()
        setBeatInMix(false)
      }
    }

    // Use highest quality codec available
    let mimeType = 'audio/webm;codecs=opus'
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus'
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4'
    }

    const recorder = new MediaRecorder(dest.stream, {
      mimeType,
      audioBitsPerSecond: 256000
    })
    chunks.current = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunks.current, { type: mimeType })
      setAudioBlob(blob)
      stream.getTracks().forEach(t => t.stop())
      audioCtx.close()
      clearInterval(timerRef.current)
    }

    mediaRecorder.current = recorder
    recorder.start(100)
    setRecording(true)
    setAudioBlob(null)
    setDuration(0)
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 200)
  }, [createChain])

  const stop = useCallback((beatAudioElement) => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop()
      setRecording(false)
    }
    if (beatAudioElement) {
      beatAudioElement.pause()
    }
  }, [])

  const reset = useCallback(() => {
    setAudioBlob(null)
    setDuration(0)
  }, [])

  return { recording, audioBlob, duration, beatInMix, start, stop, reset }
}
