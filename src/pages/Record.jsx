import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRecorder } from '../hooks/useRecorder'
import AudioPlayer from '../components/AudioPlayer'

export default function Record() {
  const location = useLocation()
  const navigate = useNavigate()
  const beat = location.state?.beat
  const battleId = location.state?.battleId
  const roundNumber = location.state?.roundNumber

  const { recording, audioBlob, duration, start, stop, reset } = useRecorder()
  const [saving, setSaving] = useState(false)
  const [shareCode, setShareCode] = useState(null)
  const [selectedBeat, setSelectedBeat] = useState(beat)
  const [beats, setBeats] = useState([])
  const beatAudioRef = useRef(null)

  useEffect(() => {
    if (!selectedBeat) {
      supabase.from('beats').select('*').order('created_at', { ascending: false }).limit(20)
        .then(({ data }) => setBeats(data || []))
    }
  }, [selectedBeat])

  const formatDuration = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handleRecord = async () => {
    if (recording) {
      stop(beatAudioRef.current)
    } else {
      // Pass beat audio element so it gets mixed into the recording
      await start(beatAudioRef.current)
    }
  }

  const handleShare = async (code) => {
    const url = `${window.location.origin}/battle/${code}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Freestyle Challenge',
          text: 'I just dropped a freestyle. Think you can do better?',
          url
        })
      } catch (e) {
        // user cancelled share — fall through to copy
      }
    }
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
        round_number: roundNumber || 2
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

      await supabase.from('freestyles').insert({
        battle_id: battle.id,
        user_id: user.id,
        audio_url: publicUrl,
        round_number: 1
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
      {selectedBeat && (
        <audio ref={beatAudioRef} src={selectedBeat.audio_url} loop preload="auto" crossOrigin="anonymous" />
      )}

      <h2>{selectedBeat.title}</h2>
      <div className="beat-meta">
        {battleId ? `Round ${roundNumber} response` : 'Recording over this beat'}
      </div>
      <div className="fx-badge">Studio FX Active</div>

      {recording && (
        <div className="viz-bars">
          {[...Array(7)].map((_, i) => <div key={i} className="viz-bar" />)}
        </div>
      )}

      <div className="record-timer">{formatDuration(duration)}</div>

      <button
        className={`btn-record ${recording ? 'recording' : ''}`}
        onClick={handleRecord}
      >
        {recording ? 'Stop' : 'Rec'}
      </button>

      {audioBlob && !recording && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div className="beat-meta" style={{ marginBottom: 8 }}>Your freestyle (with effects)</div>
            <AudioPlayer src={URL.createObjectURL(audioBlob)} />
          </div>
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
