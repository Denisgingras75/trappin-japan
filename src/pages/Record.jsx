import { useState, useRef, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRecorder } from '../hooks/useRecorder'
import { useAuth } from '../hooks/useAuth'
import AudioPlayer from '../components/AudioPlayer'

const HEAT_LENGTHS = [60, 90, 120, 180]
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
    recording, loading, audioBlob, duration, timeRemaining, micReady,
    start, stop, reset, cleanup, destroy, toggleMonitor
  } = useRecorder()
  const [saving, setSaving] = useState(false)
  const [monitoring, setMonitoring] = useState(false)
  const [headphones, setHeadphones] = useState(false)
  const [shareCode, setShareCode] = useState(null)
  const [selectedBeat, setSelectedBeat] = useState(beat)
  const [beats, setBeats] = useState([])
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

  // Stop the beat when recording ends (heat timer, beat ran out, etc.)
  const prevRecordingRef = useRef(false)
  useEffect(() => {
    if (prevRecordingRef.current && !recording) stopBeat()
    prevRecordingRef.current = recording
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

  useEffect(() => {
    if (!selectedBeat) {
      supabase.from('beats').select('*').order('created_at', { ascending: false }).limit(20)
        .then(({ data }) => setBeats(data || []))
    }
  }, [selectedBeat])

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
      if (headphones) setMonitoring(true)

      // Mic pipeline first — settles the OS audio session before the beat
      // starts, so iOS doesn't mode-switch under a playing BufferSource.
      await start({ preset, heatLength, headphones })
      if (headphones) toggleMonitor(true)

      // Resume the beat context (user gesture) and fire the BufferSource.
      // Separate context from the recorder → no CPU contention → no sputter.
      const ctx = beatCtxRef.current
      if (ctx.state === 'suspended') await ctx.resume()
      const src = ctx.createBufferSource()
      src.buffer = beatBuffer
      src.connect(beatGainRef.current)
      src.onended = () => { if (recording) stop() }
      beatSourceRef.current = src
      src.start(0)
    }
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

  const handleSave = async (mode) => {
    if (!audioBlob || !selectedBeat) return
    setSaving(true)

    const user = (await supabase.auth.getUser()).data.user
    const path = `freestyles/${user.id}/${Date.now()}.webm`

    const { error: uploadError } = await supabase.storage.from('audio').upload(path, audioBlob)
    if (uploadError) { setSaving(false); return }

    const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(path)

    if (battleId) {
      await supabase.from('freestyles').insert({
        battle_id: battleId,
        user_id: user.id,
        audio_url: publicUrl,
        round_number: roundNumber || 2,
        targets: targets.length > 0 ? targets : []
      })
      setSaving(false)
      navigate(`/battles/${battleId}`)
      return
    }

    if (mode === 'challenge') {
      const code = Math.random().toString(36).slice(2, 8)
      const { data: battle } = await supabase.from('battles').insert({
        challenger_id: user.id,
        beat_id: selectedBeat.id,
        share_code: code,
        status: 'open'
      }).select().single()

      await supabase.from('battle_participants').insert({
        battle_id: battle.id,
        user_id: user.id,
        role: 'creator'
      })

      await supabase.from('freestyles').insert({
        battle_id: battle.id,
        user_id: user.id,
        audio_url: publicUrl,
        round_number: 1,
        targets: targets.length > 0 ? targets : []
      })

      setShareCode(code)
      setSaving(false)
    } else {
      setSaving(false)
      reset()
    }
  }

  if (!selectedBeat) {
    return (
      <div>
        <div className="page-header"><h1>Pick a Beat</h1></div>
        {beats.length === 0 && (
          <div className="empty">No beats yet. Upload some on the Beats page!</div>
        )}
        {beats.map(b => (
          <div key={b.id} className="card beat-row" onClick={() => setSelectedBeat(b)} style={{ cursor: 'pointer' }}>
            <div style={{ flex: 1 }}>
              <div className="beat-title">{b.title}</div>
              <div className="beat-meta">{b.is_curated ? 'Curated' : 'User upload'}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="record-page">
      <h2>{selectedBeat.title}</h2>
      <div className="beat-meta">
        {battleId ? `Round ${roundNumber} response` : 'Recording over this beat'}
      </div>

      {/* Settings — visible when not actively recording */}
      {!recording && (
        <div className="record-settings">
          <div className="setting-group">
            <div className="setting-label">Heat</div>
            <div className="setting-options">
              {HEAT_LENGTHS.map(len => (
                <button
                  key={len}
                  className={`setting-btn ${heatLength === len ? 'active' : ''}`}
                  onClick={() => setHeatLength(len)}
                >
                  {len}s
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
        {recording && (
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
            {monitoring ? 'Monitor ON' : 'Monitor OFF'}
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
      {recording && timeRemaining != null && (
        <div style={{
          fontSize: '0.75rem',
          color: timeRemaining <= 10 ? 'var(--color-red)' : 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
          marginTop: -12,
          transition: 'color 0.3s'
        }}>
          {formatTime(timeRemaining)} remaining
        </div>
      )}

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
            <AudioPlayer src={blobUrl} beatSrc={selectedBeat.audio_url} />
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
            <button className="btn btn-secondary btn-full" onClick={reset}>Redo</button>
            <button
              className="btn btn-primary btn-full"
              onClick={() => handleSave(battleId ? 'respond' : 'challenge')}
              disabled={saving}
            >
              {saving ? 'Sending...' : battleId ? 'Send Response' : 'Challenge'}
            </button>
          </div>
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
                  navigator.share({ title: 'Trappin Japan', text })
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
                navigator.clipboard.writeText(`${window.location.origin}/battle/${shareCode}`)
                const btn = document.activeElement
                btn.textContent = 'Copied!'
                setTimeout(() => { btn.textContent = 'Copy Link' }, 2000)
              }}
            >
              Copy Link
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
