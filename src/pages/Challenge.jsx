import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AudioPlayer from '../components/AudioPlayer'
import { loadRounds, roundBeat } from '../lib/battles'

export default function Challenge() {
  const { code } = useParams()
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const [battle, setBattle] = useState(null)
  const [freestyle, setFreestyle] = useState(null)
  const [beat, setBeat] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    loadChallenge()
  }, [code])

  async function loadChallenge() {
    const { data: b } = await supabase
      .from('battles')
      .select('*, beats(*), battle_participants(user_id)')
      .eq('share_code', code)
      .single()
    if (!b) { setNotFound(true); return }
    setBattle(b)
    setBeat(b.beats)
    setParticipantCount(b.battle_participants?.length || 1)

    const rounds = await loadRounds(b.id)
    setFreestyle(rounds[rounds.length - 1] || null)
  }

  const alreadyIn = !!user && !!battle && (
    battle.challenger_id === user.id ||
    (battle.battle_participants || []).some(p => p.user_id === user.id)
  )
  // The beat the latest verse was spit over — "same beat" means this one.
  const currentBeat = roundBeat(freestyle, beat)

  async function acceptChallenge(pickBeat) {
    if (!user) { signIn(); return }
    if (joining) return
    setJoining(true)

    if (!alreadyIn) {
      // Join as participant
      await supabase.from('battle_participants').upsert(
        { battle_id: battle.id, user_id: user.id, role: 'participant' },
        { onConflict: 'battle_id,user_id', ignoreDuplicates: true }
      )

      // First taker flips the battle from open to active
      if (battle.status === 'open') {
        await supabase
          .from('battles')
          .update({ opponent_id: user.id, status: 'active' })
          .eq('id', battle.id)
      }
    }

    navigate('/record', {
      state: {
        beat: currentBeat,
        battleId: battle.id,
        roundNumber: (freestyle?.round_number || 1) + 1,
        pickBeat
      }
    })
  }

  function shareChallenge() {
    const url = window.location.href
    const text = "Someone just dropped a freestyle on Trappin Japan. You gonna let that slide?"
    if (navigator.share) {
      navigator.share({ title: 'Trappin Japan Challenge', text, url }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (notFound) {
    return (
      <div className="auth-page">
        <h1>Trappin Japan</h1>
        <p>This challenge doesn't exist or expired</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
      </div>
    )
  }

  if (!battle) {
    return (
      <div className="auth-page">
        <div className="record-timer" style={{ fontSize: '1.5rem' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="record-page">
      <h1 style={{ fontSize: '2rem' }}>You've Been Called Out</h1>
      <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: 300 }}>
        Someone dropped a freestyle and thinks you can't match it. Prove them wrong.
      </p>

      {participantCount > 2 && (
        <div className="badge badge-active" style={{ fontSize: '0.7rem' }}>
          {participantCount} people in this battle
        </div>
      )}

      <div className="card" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div className="beat-title">{currentBeat?.title}</div>
            <div className="beat-meta">Round {freestyle?.round_number || 1}</div>
          </div>
          <span className="badge badge-open">Listen First</span>
        </div>
        {freestyle ? (
          <AudioPlayer
            src={freestyle.audio_url}
            beatSrc={currentBeat?.audio_url}
            beatOffsetMs={freestyle.beat_offset_ms}
            durationMs={freestyle.duration_ms}
          />
        ) : (
          <div className="beat-meta">No verse on this one yet</div>
        )}
      </div>

      {!user ? (
        <button className="btn btn-primary btn-full" onClick={() => acceptChallenge(false)} style={{ maxWidth: 400 }}>
          Sign In to Respond
        </button>
      ) : (
        <>
          <button className="btn btn-primary btn-full" onClick={() => acceptChallenge(false)}
            disabled={joining} style={{ maxWidth: 400 }}>
            Respond on This Beat
          </button>
          <button className="btn btn-secondary btn-full" onClick={() => acceptChallenge(true)}
            disabled={joining} style={{ maxWidth: 400 }}>
            Respond on Your Own Beat
          </button>
          {alreadyIn && (
            <button className="btn btn-secondary btn-full" onClick={() => navigate(`/battles/${battle.id}`)}
              style={{ maxWidth: 400 }}>
              Open Full Battle
            </button>
          )}
        </>
      )}

      <button
        className="btn btn-secondary btn-full"
        onClick={shareChallenge}
        style={{ maxWidth: 400 }}
      >
        {copied ? 'Link Copied!' : 'Share This Challenge'}
      </button>
    </div>
  )
}
