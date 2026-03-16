import { useState, useRef, useCallback } from 'react'
import { useVoiceEffects } from './useVoiceEffects'

export function useRecorder() {
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [duration, setDuration] = useState(0)
  const mediaRecorder = useRef(null)
  const chunks = useRef([])
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const audioCtxRef = useRef(null)
  const beatSourceRef = useRef(null)
  const { createChain } = useVoiceEffects()

  // Start recording with beat playing and mixed into output
  const start = useCallback(async (beatAudioElement) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false, // off — we don't want it killing the beat bleed
        noiseSuppression: true,
        autoGainControl: true
      }
    })

    const audioCtx = new AudioContext()
    audioCtxRef.current = audioCtx

    // Voice → effects chain
    const micSource = audioCtx.createMediaStreamSource(stream)
    const effectsOutput = createChain(audioCtx, micSource)

    // Mix destination for final recording (beat + processed voice)
    const dest = audioCtx.createMediaStreamDestination()

    // Connect processed voice to mix
    effectsOutput.connect(dest)

    // Also let the user hear themselves (monitor through speakers)
    // effectsOutput.connect(audioCtx.destination) // uncomment to hear yourself live

    // If beat element provided, route it through AudioContext too
    if (beatAudioElement) {
      try {
        const beatSource = audioCtx.createMediaElementSource(beatAudioElement)
        beatSourceRef.current = beatSource

        // Beat goes to both speakers (so user hears it) and recording mix
        beatSource.connect(audioCtx.destination)
        beatSource.connect(dest)

        beatAudioElement.currentTime = 0
        beatAudioElement.play()
      } catch (e) {
        // If already connected to a context, just play it normally
        beatAudioElement.currentTime = 0
        beatAudioElement.play()
      }
    }

    const recorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus' })
    chunks.current = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunks.current, { type: 'audio/webm' })
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

  return { recording, audioBlob, duration, start, stop, reset }
}
