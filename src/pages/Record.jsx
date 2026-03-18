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
    recording, loading, audioBlob, duration, timeRemaining, transcript, micReady,
    start, stop, reset, cleanup, destroy, toggleMonitor
  } = useRecorder()
  const [saving, setSaving] = useState(false)
  const [monitoring, setMonitoring] = useState(false)
  const [headphones, setHeadphones] = useState(false)
  const [shareCode, setShareCode] = useState(null)
  const [selectedBeat, setSelectedBeat] = useState(beat)
  const [beats, setBeats] = useState([])
  const [heatLength, setHeatLength] = useState(90)
  const [preset, setPreset] = useState('studio')
  const [beatVol, setBeatVol] = useState(0.7)
  const [targets, setTargets] = useState([])
  const [participants, setParticipants] = useState([])
  const beatAudioRef = useRef(null)
  const blobUrl = useMemo(() => {
    return audioBlob ? URL.createObjectURL(audioBlob) : null
  }, [audioBlob])

  // When recording stops (heat timer, beat end, etc.) — pause beat
  const prevRecordingRef = useRef(false)
  useEffect(() => {
    if (prevRecordingRef.current && !recording && beatAudioRef.current) {
      beatAudioRef.current.pause()
    }
    prevRecordingRef.current = recording
  }, [recording])

  // Full teardown on page leave (close AudioContext)
  useEffect(() => {
    return () => {
      destroy()
      if (beatAudioRef.current) {
        beatAudioRef.current.pause()
        beatAudioRef.current.currentTime = 0
      }
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
      if (beatAudioRef.current) {
        beatAudioRef.current.pause()
      }
    } else {
      // Start beat IMMEDIATELY — no waiting for mic/AudioContext setup
      if (beatAudioRef.current) {
        beatAudioRef.current.currentTime = 0
        beatAudioRef.current.play()
      }
      if (headphones) setMonitoring(true)
      await start(null, { preset, heatLength, headphones })
      if (headphones) toggleMonitor(true)
    }
  }

  const handleBeatVolume = (val) => {
    setBeatVol(val)
    if (beatAudioRef.current) beatAudioRef.current.volume = val
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
      <audio
        ref={beatAudioRef}
        src={selectedBeat.audio_url}
        preload="auto"
        onEnded={() => {
          // Beat ran out — stop recording automatically
          if (recording) {
            stop()
          }
        }}
      />

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

      {/* Live transcript while recording */}
      {recording && transcript && (
        <div style={{
          width: '100%',
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
          maxHeight: 80,
          overflow: 'hidden',
          textAlign: 'center',
          lineHeight: 1.4
        }}>
          {transcript}
        </div>
      )}

      <button
        className={`btn-record ${recording ? 'recording' : ''}`}
        onClick={handleRecord}
        disabled={loading}
      >
        {loading ? '...' : recording ? 'Stop' : 'Rec'}
      </button>

      {audioBlob && !recording && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div className="beat-meta" style={{ marginBottom: 8 }}>Your freestyle ({preset} FX)</div>
            <AudioPlayer src={blobUrl} beatSrc={selectedBeat.audio_url} />
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="card">
              <div className="beat-meta" style={{ marginBottom: 8 }}>Transcript</div>
              <div style={{
                fontSize: '0.8rem',
                lineHeight: 1.5,
                color: 'var(--color-text)',
                fontFamily: 'var(--font-mono)'
              }}>
                {transcript}
              </div>
            </div>
          )}

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
