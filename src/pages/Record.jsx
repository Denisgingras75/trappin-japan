import { useState, useRef, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRecorder } from '../hooks/useRecorder'
import { useAuth } from '../hooks/useAuth'
import AudioPlayer, { stopAllPlayers } from '../components/AudioPlayer'
import BeatPicker from '../components/BeatPicker'
import { isPlayableBeat } from '../lib/beats'

// null = no limit: rap until you hit Stop.
const HEAT_LENGTHS = [
  { value: 60, label: '60s' },
  { value: 90, label: '90s' },
  { value: 120, label: '2 min' },
  { value: 180, label: '3 min' },
  { value: null, label: 'No limit' }
]
const NUDGE_KEY = 'tj_sync_nudge_ms'
const readNudge = () => {
  try { return parseInt(localStorage.getItem(NUDGE_KEY), 10) || 0 } catch (e) { return 0 }
}

const newShareCode = () => {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join('')
}

const FX_PRESETS = [
  { key: 'raw', label: 'Raw', desc: 'No processing' },
  { key: 'clean', label: 'Clean', desc: 'Polish + clarity' },
  { key: 'studio', label: 'Studio', desc: 'Full production' }
]

export default function Record() {
  const location = useLocation()
  const navigate = useNavigate()
  const beat = location.state?.beat
  const battleId = location.state?.battleId
  const roundNumber = location.state?.roundNumber

  const { user } = useAuth()
  const {
    recording, loading, audioBlob, duration, durationMs, timeRemaining, error: micError,
    start, stop, reset, destroy, toggleMonitor, getInputLatency
  } = useRecorder()
  const [saving, setSaving] = useState(false)
  const [monitoring, setMonitoring] = useState(false)
  // Remembered per device — most people record the same way every time.
  const [headphones, setHeadphonesState] = useState(() => {
    try { return localStorage.getItem('tj_headphones') === '1' } catch (e) { return false }
  })
  const setHeadphones = (on) => {
    setHeadphonesState(on)
    try { localStorage.setItem('tj_headphones', on ? '1' : '0') } catch (e) {}
  }
  const [shareCode, setShareCode] = useState(null)
  const [copied, setCopied] = useState(false)
  const [selectedBeat, setSelectedBeat] = useState(isPlayableBeat(beat) ? beat : null)
  const [picking, setPicking] = useState(!!location.state?.pickBeat || !isPlayableBeat(beat))
  const [saveError, setSaveError] = useState(null)
  // How far the recorded voice lags the beat (device audio latency), plus
  // the user's own fine-tune, remembered per device.
  const [latencyMs, setLatencyMs] = useState(0)
  const [nudgeMs, setNudgeMs] = useState(readNudge)
  const wakeLockRef = useRef(null)
  const [heatLength, setHeatLength] = useState(90)
  const [preset, setPreset] = useState('clean')
  const [beatVol, setBeatVol] = useState(0.7)
  const [beatBuffer, setBeatBuffer] = useState(null)
  const [beatLoading, setBeatLoading] = useState(false)
  const [targets, setTargets] = useState([])
  const [participants, setParticipants] = useState([])
  // Beat playback lives in its OWN AudioContext — isolated from the mic /
  // effects / MediaRecorder pipeline so the mic-side CPU load can't starve
  // the beat's audio thread (that was the mid-playback sputter).
  const beatCtxRef = useRef(null)
  const beatGainRef = useRef(null)
  const beatSourceRef = useRef(null)
  const blobUrl = useMemo(() => {
    return audioBlob ? URL.createObjectURL(audioBlob) : null
  }, [audioBlob])

  // Decode the beat into an AudioBuffer as soon as it's selected. The
  // BufferSource plays instantly on Rec tap — no network fetch, no
  // MediaElement seek latency. This is in the SAME context we'll play on.
  useEffect(() => {
    if (!selectedBeat?.audio_url) return
    let cancelled = false
    stopBeat()
    setBeatLoading(true)
    setBeatBuffer(null)
    ;(async () => {
      try {
        if (!beatCtxRef.current || beatCtxRef.current.state === 'closed') {
          beatCtxRef.current = new AudioContext({ sampleRate: 48000 })
          const g = beatCtxRef.current.createGain()
          g.gain.value = beatVol
          g.connect(beatCtxRef.current.destination)
          beatGainRef.current = g
        }
        const res = await fetch(selectedBeat.audio_url)
        if (!res.ok) throw new Error('beat fetch failed')
        const arr = await res.arrayBuffer()
        const buf = await beatCtxRef.current.decodeAudioData(arr)
        if (cancelled) return
        setBeatBuffer(buf)
      } catch (e) {} finally {
        if (!cancelled) setBeatLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [selectedBeat?.audio_url])

  const stopBeat = () => {
    if (beatSourceRef.current) {
      try { beatSourceRef.current.stop() } catch (e) {}
      try { beatSourceRef.current.disconnect() } catch (e) {}
      beatSourceRef.current = null
    }
  }

  // Stop the beat when recording ends (heat timer, mic lost, etc.)
  const prevRecordingRef = useRef(false)
  useEffect(() => {
    if (prevRecordingRef.current && !recording) stopBeat()
    prevRecordingRef.current = recording
  }, [recording])

  // Keep the screen awake during a take — a sleeping phone kills the mic.
  useEffect(() => {
    if (!recording) return
    let released = false
    navigator.wakeLock?.request('screen').then(lock => {
      if (released) lock.release().catch(() => {})
      else wakeLockRef.current = lock
    }).catch(() => {})
    return () => {
      released = true
      wakeLockRef.current?.release().catch(() => {})
      wakeLockRef.current = null
    }
  }, [recording])

  // Full teardown on page leave
  useEffect(() => {
    return () => {
      destroy()
      stopBeat()
      if (beatCtxRef.current && beatCtxRef.current.state !== 'closed') {
        beatCtxRef.current.close()
        beatCtxRef.current = null
      }
      beatGainRef.current = null
    }
  }, [destroy])

  // Load participants if responding to a battle (for tagging)
  useEffect(() => {
    if (battleId) {
      supabase
        .from('battle_participants')
        .select('user_id')
        .eq('battle_id', battleId)
        .then(({ data }) => setParticipants(data || []))
    }
  }, [battleId])

  const formatTime = (s) => {
    if (s == null) return '--:--'
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handleRecord = async () => {
    if (recording) {
      stop()
      stopBeat()
    } else {
      if (!beatBuffer || !beatCtxRef.current) return
      // Nothing else may be making sound while the mic is open.
      stopAllPlayers()
      stopBeat()
      setSaveError(null)
      const ctx = beatCtxRef.current

      // Mic pipeline first — settles the OS audio session before the beat
      // starts, so iOS doesn't mode-switch under a playing BufferSource.
      // The beat context is resumed before recording begins, then the beat
      // and the recorder start in the same tick so they share a zero point.
      // Separate context from the recorder → no CPU contention → no sputter.
      // The beat loops, so its length never cuts a take short.
      const ok = await start({
        preset,
        heatLength,
        beforeStart: async () => {
          if (ctx.state === 'suspended') await ctx.resume()
        },
        onStart: () => {
          const src = ctx.createBufferSource()
          src.buffer = beatBuffer
          src.loop = true
          src.connect(beatGainRef.current)
          beatSourceRef.current = src
          src.start(0)
          // The rapper hears the beat late (output latency) and the mic
          // hears the rapper late (input latency), so the voice sits that
          // far behind the beat in the take. Playback holds the beat back
          // by the same amount.
          const lat = (ctx.outputLatency || 0) + (ctx.baseLatency || 0) + getInputLatency()
          setLatencyMs(Math.round(Math.min(Math.max(lat, 0), 0.5) * 1000))
        }
      })
      // Hearing yourself through the browser arrives late (badly so on
      // Bluetooth) and throws your timing, so it stays off unless asked for.
      if (ok && headphones && monitoring) toggleMonitor(true)
    }
  }

  const beatOffsetMs = Math.min(Math.max(latencyMs + nudgeMs, 0), 1000)

  const handleNudge = (delta) => {
    setNudgeMs(prev => {
      const next = Math.min(Math.max(prev + delta, -latencyMs), 600)
      try { localStorage.setItem(NUDGE_KEY, String(next)) } catch (e) {}
      return next
    })
  }

  const pickBeat = (b) => {
    stopAllPlayers()
    setSelectedBeat(b)
    setPicking(false)
  }

  const handleBeatVolume = (val) => {
    setBeatVol(val)
    if (beatGainRef.current && beatCtxRef.current) {
      beatGainRef.current.gain.setTargetAtTime(val, beatCtxRef.current.currentTime, 0.01)
    }
  }

  const toggleTarget = (userId) => {
    setTargets(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  // Insert a freestyle row. If the database hasn't got the per-round beat
  // columns yet, fall back to the original shape so the take still lands.
  const insertFreestyle = async (row) => {
    const { error } = await supabase.from('freestyles').insert({
      ...row,
      beat_id: selectedBeat.id,
      beat_offset_ms: beatOffsetMs,
      duration_ms: durationMs || null
    })
    if (error && (error.code === 'PGRST204' || error.code === '42703')) {
      return (await supabase.from('freestyles').insert(row)).error
    }
    return error
  }

  const handleSave = async (mode) => {
    if (!audioBlob || !selectedBeat || saving) return
    stopAllPlayers()
    setSaving(true)
    setSaveError(null)
    const fail = (msg) => { setSaveError(msg); setSaving(false) }

    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return fail('You got signed out — sign in again to send it')

      const type = audioBlob.type || 'audio/webm'
      const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm'
      const path = `freestyles/${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('audio')
        .upload(path, audioBlob, { contentType: type })
      if (uploadError) return fail('Upload failed — check your connection and try again')

      const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(path)
      const taggedTargets = targets.length > 0 ? targets : []

      if (battleId) {
        // Make sure we're in the battle (no-op if already joined).
        await supabase.from('battle_participants').upsert(
          { battle_id: battleId, user_id: user.id, role: 'participant' },
          { onConflict: 'battle_id,user_id', ignoreDuplicates: true }
        )
        const error = await insertFreestyle({
          battle_id: battleId,
          user_id: user.id,
          audio_url: publicUrl,
          round_number: roundNumber || 2,
          targets: taggedTargets
        })
        if (error) return fail('Could not send your response — try again')
        setSaving(false)
        navigate(`/battles/${battleId}`)
        return
      }

      if (mode === 'challenge') {
        const code = newShareCode()
        const { data: battle, error: battleError } = await supabase.from('battles').insert({
          challenger_id: user.id,
          beat_id: selectedBeat.id,
          share_code: code,
          status: 'open'
        }).select().single()
        if (battleError || !battle) return fail('Could not create the challenge — try again')

        await supabase.from('battle_participants').insert({
          battle_id: battle.id,
          user_id: user.id,
          role: 'creator'
        })

        const error = await insertFreestyle({
          battle_id: battle.id,
          user_id: user.id,
          audio_url: publicUrl,
          round_number: 1,
          targets: taggedTargets
        })
        if (error) return fail('Could not save your freestyle — try again')

        setShareCode(code)
        setSaving(false)
      }
    } catch (e) {
      fail('Something went wrong — try again')
    }
  }

  if (picking || !selectedBeat) {
    return (
      <BeatPicker
        title={battleId ? 'Pick Your Beat' : 'Pick a Beat'}
        currentBeatId={selectedBeat?.id}
        onPick={pickBeat}
        onCancel={selectedBeat ? () => setPicking(false) : null}
      />
    )
  }

  return (
    <div className="record-page">
      <h2>{selectedBeat.title}</h2>
      <div className="beat-meta">
        {battleId ? `Round ${roundNumber} response` : 'Recording over this beat'}
      </div>
      {!recording && !audioBlob && (
        <button className="link-btn" onClick={() => { stopBeat(); setPicking(true) }}>
          Change beat
        </button>
      )}
      <div className="beat-meta" style={{ fontSize: '0.6rem', opacity: 0.5 }}>
        build {typeof __BUILD_TAG__ !== 'undefined' ? __BUILD_TAG__ : 'dev'}
      </div>

      {/* Settings — visible when not actively recording */}
      {!recording && (
        <div className="record-settings">
          <div className="setting-group">
            <div className="setting-label">Heat</div>
            <div className="setting-options">
              {HEAT_LENGTHS.map(h => (
                <button
                  key={h.label}
                  className={`setting-btn ${heatLength === h.value ? 'active' : ''}`}
                  onClick={() => setHeatLength(h.value)}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-group">
            <div className="setting-label">Voice FX</div>
            <div className="setting-options">
              {FX_PRESETS.map(p => (
                <button
                  key={p.key}
                  className={`setting-btn ${preset === p.key ? 'active' : ''}`}
                  onClick={() => setPreset(p.key)}
                  title={p.desc}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-group">
            <div className="setting-label">Mode</div>
            <div className="setting-options">
              <button
                className={`setting-btn ${!headphones ? 'active' : ''}`}
                onClick={() => { setHeadphones(false); setMonitoring(false) }}
              >
                Speakers
              </button>
              <button
                className={`setting-btn ${headphones ? 'active' : ''}`}
                onClick={() => setHeadphones(true)}
              >
                Headphones
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Beat volume slider — always visible */}
      {selectedBeat && (
        <div className="setting-group" style={{ width: '100%', padding: '0 16px' }}>
          <div className="setting-label">Beat Vol</div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={beatVol}
            onChange={e => handleBeatVolume(parseFloat(e.target.value))}
            style={{
              flex: 1,
              accentColor: 'var(--color-neon-pink)',
              height: 4
            }}
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', minWidth: 30 }}>
            {Math.round(beatVol * 100)}%
          </span>
        </div>
      )}

      {/* Active badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div className="fx-badge">{preset === 'raw' ? 'Raw' : preset === 'clean' ? 'Clean FX' : 'Studio FX'}</div>
        <div className="fx-badge" style={{
          background: 'rgba(0,240,255,0.1)',
          borderColor: 'rgba(0,240,255,0.2)',
          color: 'var(--color-neon-cyan)'
        }}>
          {headphones ? 'Headphones' : 'Speakers'}
        </div>
        {headphones && (
          <button
            className="fx-badge"
            onClick={() => {
              const next = !monitoring
              setMonitoring(next)
              toggleMonitor(next)
            }}
            style={{
              cursor: 'pointer',
              background: monitoring ? 'rgba(0,230,118,0.1)' : 'rgba(107,107,128,0.1)',
              borderColor: monitoring ? 'rgba(0,230,118,0.2)' : 'rgba(107,107,128,0.2)',
              color: monitoring ? 'var(--color-green)' : 'var(--color-text-muted)'
            }}
          >
            {monitoring ? 'Hear myself: ON' : 'Hear myself: OFF'}
          </button>
        )}
      </div>

      {recording && (
        <div className="viz-bars">
          {[...Array(7)].map((_, i) => <div key={i} className="viz-bar" />)}
        </div>
      )}

      {/* Timer */}
      <div className="record-timer">{formatTime(duration)}</div>
      {recording && (
        <div style={{
          fontSize: '0.75rem',
          color: timeRemaining != null && timeRemaining <= 10 ? 'var(--color-red)' : 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
          marginTop: -12,
          transition: 'color 0.3s'
        }}>
          {timeRemaining != null ? `${formatTime(timeRemaining)} remaining` : 'No limit — hit Stop when you\'re done'}
        </div>
      )}
      {micError && !recording && <div className="form-error">{micError}</div>}

      <button
        className={`btn-record ${recording ? 'recording' : ''}`}
        onClick={handleRecord}
        disabled={loading || (!recording && !beatBuffer)}
      >
        {loading ? '...' : recording ? 'Stop' : beatLoading ? 'Loading beat...' : !beatBuffer ? 'Beat unavailable' : 'Rec'}
      </button>

      {audioBlob && !recording && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div className="beat-meta" style={{ marginBottom: 8 }}>Your freestyle ({preset} FX)</div>
            <AudioPlayer
              src={blobUrl}
              beatSrc={selectedBeat.audio_url}
              beatOffsetMs={beatOffsetMs}
              durationMs={durationMs}
            />
            <div className="setting-group" style={{ marginTop: 12, justifyContent: 'center' }}>
              <div className="setting-label" style={{ minWidth: 0 }}>Off beat?</div>
              <button className="setting-btn" onClick={() => handleNudge(-20)}>Voice later</button>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', minWidth: 44, textAlign: 'center' }}>
                {nudgeMs > 0 ? '+' : ''}{nudgeMs}ms
              </span>
              <button className="setting-btn" onClick={() => handleNudge(20)}>Voice earlier</button>
            </div>
          </div>


          {/* Tag targets (when in a battle) */}
          {battleId && participants.length > 0 && (
            <div className="card">
              <div className="beat-meta" style={{ marginBottom: 8 }}>Who you dissing?</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {participants
                  .filter(p => p.user_id !== user?.id)
                  .map(p => (
                    <button
                      key={p.user_id}
                      className={`setting-btn ${targets.includes(p.user_id) ? 'active' : ''}`}
                      onClick={() => toggleTarget(p.user_id)}
                      style={{ fontSize: '0.65rem' }}
                    >
                      @ {p.user_id.slice(0, 6)}
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-full" onClick={() => { stopAllPlayers(); setSaveError(null); reset() }} disabled={saving}>Redo</button>
            <button
              className="btn btn-primary btn-full"
              onClick={() => handleSave(battleId ? 'respond' : 'challenge')}
              disabled={saving}
            >
              {saving ? 'Sending...' : battleId ? 'Send Response' : 'Challenge'}
            </button>
          </div>
          {saveError && <div className="form-error">{saveError}</div>}
        </div>
      )}

      {shareCode && (
        <div className="share-overlay" onClick={() => { setShareCode(null); reset() }}>
          <div className="share-card" onClick={e => e.stopPropagation()}>
            <h2>Challenge Ready</h2>
            <p style={{ color: 'var(--color-text-muted)' }}>Send this to whoever you want to battle</p>

            <button
              className="btn btn-primary btn-full"
              onClick={() => {
                const url = `${window.location.origin}/battle/${shareCode}`
                const text = `I just dropped a freestyle on Trappin Japan. Think you can do better? ${url}`
                if (navigator.share) {
                  navigator.share({ title: 'Trappin Japan', text }).catch(() => {})
                } else {
                  window.open(`sms:?&body=${encodeURIComponent(text)}`, '_self')
                }
              }}
            >
              Send to a Friend
            </button>

            <button
              className="btn btn-secondary btn-full"
              onClick={() => {
                navigator.clipboard?.writeText(`${window.location.origin}/battle/${shareCode}`)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>

            <button
              className="btn btn-secondary btn-full"
              onClick={() => { setShareCode(null); navigate('/battles') }}
              style={{ color: 'var(--color-text-muted)' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
