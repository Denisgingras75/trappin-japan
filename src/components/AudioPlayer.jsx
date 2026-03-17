import { useState, useRef, useEffect } from 'react'

export default function AudioPlayer({ src, beatSrc, accent }) {
  const [playing, setPlaying] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dur, setDur] = useState(0)
  const [cur, setCur] = useState(0)
  const audioRef = useRef(null)
  const beatRef = useRef(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTime = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100)
        setCur(audio.currentTime)
      }
    }
    const onMeta = () => setDur(audio.duration || 0)
    const onEnd = () => {
      setPlaying(false)
      setProgress(0)
      setCur(0)
      if (beatRef.current) {
        beatRef.current.pause()
        beatRef.current.currentTime = 0
      }
    }
    const onWaiting = () => setBuffering(true)
    const onCanPlay = () => setBuffering(false)
    const onPlaying = () => setBuffering(false)

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('ended', onEnd)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('playing', onPlaying)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('ended', onEnd)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('playing', onPlaying)
    }
  }, [src])

  // Set beat volume lower so voice cuts through
  useEffect(() => {
    if (beatRef.current) {
      beatRef.current.volume = 0.55
    }
  }, [beatSrc])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      if (beatRef.current) beatRef.current.pause()
      setPlaying(false)
    } else {
      setPlaying(true)
      setBuffering(true)
      if (beatRef.current) {
        const beatDur = beatRef.current.duration || 1
        beatRef.current.currentTime = audio.currentTime % beatDur
      }
      const playPromise = audio.play()
      if (playPromise) {
        playPromise.then(() => {
          setBuffering(false)
          if (beatRef.current) beatRef.current.play()
        }).catch(() => {
          setPlaying(false)
          setBuffering(false)
        })
      }
    }
  }

  const seek = (e) => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audio.currentTime = pct * audio.duration
    if (beatRef.current) {
      const beatDur = beatRef.current.duration || 1
      beatRef.current.currentTime = (pct * audio.duration) % beatDur
    }
  }

  const fmt = (s) => {
    if (!s || !isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
      <audio ref={audioRef} src={src} preload="auto" />
      {beatSrc && <audio ref={beatRef} src={beatSrc} preload="auto" loop />}
      <button onClick={toggle} className="play-btn"
        style={accent ? { background: 'rgba(255,255,255,0.15)', boxShadow: 'none' } : {}}>
        {buffering ? '...' : playing ? '\u275A\u275A' : '\u25B6'}
      </button>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div onClick={seek} style={{
          height: 4,
          background: 'var(--color-border)',
          borderRadius: 2,
          overflow: 'hidden',
          cursor: 'pointer',
          position: 'relative'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: accent
              ? 'rgba(255,255,255,0.7)'
              : 'linear-gradient(90deg, var(--color-neon-pink), var(--color-neon-cyan))',
            borderRadius: 2,
            transition: 'width 0.1s linear',
            boxShadow: accent ? 'none' : '0 0 8px rgba(255,45,85,0.3)'
          }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '0.6rem', color: accent ? 'rgba(255,255,255,0.5)' : 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)'
        }}>
          <span>{fmt(cur)}</span>
          <span>{fmt(dur)}</span>
        </div>
      </div>
    </div>
  )
}
