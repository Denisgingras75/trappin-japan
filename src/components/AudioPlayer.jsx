import { useState, useRef, useEffect } from 'react'

export default function AudioPlayer({ src, accent }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTime = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100)
    }
    const onEnd = () => { setPlaying(false); setProgress(0) }

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnd)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('ended', onEnd)
    }
  }, [src])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      audio.play()
    }
    setPlaying(!playing)
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        onClick={toggle}
        className="play-btn"
        style={accent ? { background: 'rgba(255,255,255,0.2)' } : {}}
      >
        {playing ? '||' : '\u25B6'}
      </button>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{
          height: 4,
          background: 'var(--color-border)',
          borderRadius: 2,
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: accent ? 'white' : 'var(--color-accent)',
            borderRadius: 2,
            transition: 'width 0.1s linear'
          }} />
        </div>
        <span style={{ fontSize: '0.7rem', color: accent ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)' }}>
          {audioRef.current ? formatTime(audioRef.current.currentTime) : '0:00'}
        </span>
      </div>
    </div>
  )
}
