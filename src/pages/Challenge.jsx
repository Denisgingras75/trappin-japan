import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AudioPlayer from '../components/AudioPlayer'

export default function Challenge() {
  const { code } = useParams()
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const [battle, setBattle] = useState(null)
  const [freestyle, setFreestyle] = useState(null)
  const [beat, setBeat] = useState(null)

  useEffect(() => {
    loadChallenge()
  }, [code])

  async function loadChallenge() {
    const { data: b } = await supabase
      .from('battles')
      .select('*, beats(*)')
      .eq('share_code', code)
      .single()
    if (!b) return
    setBattle(b)
    setBeat(b.beats)

    const { data: f } = await supabase
      .from('freestyles')
      .select('*')
      .eq('battle_id', b.id)
      .eq('round_number', 1)
      .single()
    setFreestyle(f)
  }

  async function acceptChallenge() {
    if (!user) { signIn(); return }

    await supabase
      .from('battles')
      .update({ opponent_id: user.id, status: 'active' })
      .eq('id', battle.id)

    navigate('/record', {
      state: { beat, battleId: battle.id, roundNumber: 2 }
    })
  }

  if (!battle) return <div className="empty">Loading challenge...</div>

  return (
    <div className="record-page">
      <h1>You've Been Challenged</h1>
      <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
        Listen to their freestyle, then fire back
      </p>

      <div className="card" style={{ width: '100%' }}>
        <div className="beat-title">{beat?.title}</div>
        <div className="beat-meta" style={{ marginBottom: 12 }}>Beat</div>
        {freestyle && <AudioPlayer src={freestyle.audio_url} />}
      </div>

      <button className="btn btn-primary btn-full" onClick={acceptChallenge}>
        {user ? 'Accept & Record' : 'Sign In to Accept'}
      </button>
    </div>
  )
}
