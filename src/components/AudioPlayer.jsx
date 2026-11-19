import { useState, useRef, useEffect } from 'react'

// Playback mix when both voice + beat are present.
// Voice-only (no beatSrc) plays voice at default 1.0.
const BEAT_VOLUME = 0.60
const VOICE_VOLUME = 0.40
// A lone track leaves headroom so quiet beats can be trimmed *up* to match.
const SOLO_VOLUME = 0.63

// How far the beat may wander from where it should be before we re-seek it.
const DRIFT_TOLERANCE = 0.08
const TIGHT_TOLERANCE = 0.025
const MAX_TIGHT_FIXES = 4

// Learned start/seek cost of the beat element on this device (seconds).
let beatLead = 0

// Only one player makes sound at a time — starting one stops the rest, and
// the Record page calls stopAllPlayers() before it opens the mic so nothing
// is playing over the take.
let stopActive = null
export function stopAllPlayers() {
  if (stopActive) stopActive()
}

// src: voice (or a lone beat). beatSrc: beat to mix under the voice.
// beatOffsetMs: how far the voice lags the beat in the recording (device
//   latency) — the beat is held back by this much so they line up.
// durationMs: known length of src; MediaRecorder files often report none.
// beatStartMs: where in the beat file the take began (skipped lead-in).
// gainDb / beatGainDb: loudness trim for src (a lone beat) / for beatSrc.
export default function AudioPlayer({
  src, beatSrc, beatOffsetMs = 0, beatStartMs = 0, durationMs,
  gainDb = 0, beatGainDb = 0, accent, preload = 'metadata'
}) {
  const [playing, setPlaying] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [dur, setDur] = useState(0)
  const [cur, setCur] = useState(0)
  const audioRef = useRef(null)
  const beatRef = useRef(null)
  const offsetRef = useRef(0)
  offsetRef.current = (beatOffsetMs || 0) / 1000
  const beatStartRef = useRef(0)
  beatStartRef.current = (beatStartMs || 0) / 1000
  const stopRef = useRef(null)
  const unlockedRef = useRef(null)
  const fixesRef = useRef(0)
  const lastFixRef = useRef(0)

  const knownDur = durationMs ? durationMs / 1000 : (isFinite(dur) ? dur : 0)
  const progress = knownDur ? Math.min((cur / knownDur) * 100, 100) : 0

  // Put the beat where it belongs for the voice's current position.
  // Starting or seeking a media element costs a few tens of ms, which lands
  // the beat late; `beatLead` learns that cost and aims ahead by it.
  const syncBeat = (force) => {
    const audio = audioRef.current
    const beat = beatRef.current
    if (!audio || !beat) return
    let target = audio.currentTime - offsetRef.current
    if (target < 0) {
      // Voice hasn't reached the point where the beat came in yet.
      if (!beat.paused) beat.pause()
      return
    }
    target += beatStartRef.current
    const beatDur = beat.duration
    const loops = isFinite(beatDur) && beatDur > 0
    const wrap = (t) => loops ? ((t % beatDur) + beatDur) % beatDur : Math.max(t, 0)
    const now = performance.now()
    if (beat.paused || force) {
      beat.currentTime = wrap(target + beatLead)
      if (beat.paused) beat.play().catch(() => {})
      fixesRef.current = 0
      lastFixRef.current = now
      return
    }
    // Let the last correction settle before judging it.
    if (now - lastFixRef.current < 450) return
    let err = wrap(target) - beat.currentTime
    if (loops) {
      if (err > beatDur / 2) err -= beatDur
      if (err < -beatDur / 2) err += beatDur
    }
    // A few tight corrections right after starting, then only catch real drift.
    const tolerance = fixesRef.current < MAX_TIGHT_FIXES ? TIGHT_TOLERANCE : DRIFT_TOLERANCE
    if (Math.abs(err) <= tolerance) return
    beatLead = Math.min(Math.max(beatLead + err, -0.3), 0.3)
    beat.currentTime = wrap(target + beatLead)
    fixesRef.current += 1
    lastFixRef.current = now
  }

  const halt = (rewind) => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      if (rewind) { try { audio.currentTime = 0 } catch (e) {} }
    }
    if (beatRef.current) beatRef.current.pause()
    setPlaying(false)
    setBuffering(false)
    if (rewind) setCur(0)
    if (stopActive === stopRef.current) stopActive = null
  }
  stopRef.current = stopRef.current || (() => halt(false))

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTime = () => setCur(audio.currentTime)
    const onMeta = () => setDur(audio.duration || 0)
    const onEnd = () => halt(true)
    const onWaiting = () => {
      setBuffering(true)
      // Don't let the beat run ahead while the voice is stalled.
      if (beatRef.current) beatRef.current.pause()
    }
    const onReady = () => setBuffering(false)
    const onError = () => halt(false)

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('durationchange', onMeta)
    audio.addEventListener('ended', onEnd)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('canplay', onReady)
    audio.addEventListener('playing', onReady)
    audio.addEventListener('error', onError)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('durationchange', onMeta)
      audio.removeEventListener('ended', onEnd)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('canplay', onReady)
      audio.removeEventListener('playing', onReady)
      audio.removeEventListener('error', onError)
    }
  }, [src])

  // New source (or unmount) → stop whatever this player was doing.
  useEffect(() => {
    setCur(0)
    setDur(0)
    return () => halt(false)
  }, [src, beatSrc])

  // 60/40 instrumental-to-vocal mix when both tracks are present
  useEffect(() => {
    const lin = (db) => Math.pow(10, (Number(db) || 0) / 20)
    const clamp = (v) => Math.min(Math.max(v, 0), 1)
    if (audioRef.current) {
      audioRef.current.volume = beatSrc ? VOICE_VOLUME : clamp(SOLO_VOLUME * lin(gainDb))
    }
    if (beatRef.current) beatRef.current.volume = clamp(BEAT_VOLUME * lin(beatGainDb))
  }, [beatSrc, src, gainDb, beatGainDb])

  // While playing, keep the beat locked to the voice.
  useEffect(() => {
    if (!playing || !beatSrc) return
    const t = setInterval(() => {
      const audio = audioRef.current
      if (audio && !audio.paused && audio.readyState >= 3) syncBeat(false)
    }, 100)
    return () => clearInterval(t)
  }, [playing, beatSrc])

  // Offset changed mid-playback (sync nudge) → apply it right away.
  useEffect(() => {
    if (playing) syncBeat(true)
  }, [beatOffsetMs])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      halt(false)
      return
    }
    if (stopActive && stopActive !== stopRef.current) stopActive()
    stopActive = stopRef.current
    setPlaying(true)
    setBuffering(true)
    // Unlock the beat element inside the tap so mobile lets us start it later.
    if (beatRef.current && unlockedRef.current !== beatSrc) {
      unlockedRef.current = beatSrc
      beatRef.current.load()
    }
    const playPromise = audio.play()
    if (playPromise) {
      playPromise.then(() => {
        setBuffering(false)
        syncBeat(true)
      }).catch(() => halt(false))
    }
  }

  const seek = (e) => {
    const audio = audioRef.current
    if (!audio || !knownDur) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1)
    audio.currentTime = pct * knownDur
    setCur(audio.currentTime)
    if (playing) syncBeat(true)
  }

  const fmt = (s) => {
    if (!s || !isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
      <audio ref={audioRef} src={src} preload={preload} playsInline />
      {beatSrc && <audio ref={beatRef} src={beatSrc} preload={preload} loop playsInline />}
      <button onClick={toggle} className="play-btn" aria-label={playing ? 'Pause' : 'Play'}
        style={accent ? { background: 'rgba(255,255,255,0.15)', boxShadow: 'none' } : {}}>
        {buffering ? '...' : playing ? '❚❚' : '▶'}
      </button>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div onClick={seek} style={{ padding: '8px 0', margin: '-8px 0', cursor: 'pointer' }}>
          <div style={{
            height: 4,
            background: 'var(--color-border)',
            borderRadius: 2,
            overflow: 'hidden'
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
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '0.6rem', color: accent ? 'rgba(255,255,255,0.5)' : 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)'
        }}>
          <span>{fmt(cur)}</span>
          <span>{knownDur ? fmt(knownDur) : '--:--'}</span>
        </div>
      </div>
    </div>
  )
}
