import { useState, useEffect, useRef } from 'react'
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
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadChallenge()
  }, [code])

  async function loadChallenge() {
    const { data: b } = await supabase
      .from('battles')
      .select('*, beats(*)')
      .eq('share_code', code)
      .single()
    if (!b) { setNotFound(true); return }
    setBattle(b)
    setBeat(b.beats)

    const { data: f } = await supabase
      .from('freestyles')
      .select('*')
      .eq('battle_id', b.id)
      .order('round_number', { ascending: false })
      .limit(1)
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
      state: { beat, battleId: battle.id, roundNumber: (freestyle?.round_number || 1) + 1 }
    })
  }

  function shareChallenge() {
    const url = window.location.href
    const text = "Someone just dropped a freestyle on Trappin Japan. You gonna let that slide?"
    if (navigator.share) {
      navigator.share({ title: 'Trappin Japan Challenge', text, url })
    } else {
      navigator.clipboard.writeText(url)
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

      <div className="card" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div className="beat-title">{beat?.title}</div>
            <div className="beat-meta">Round {freestyle?.round_number || 1}</div>
          </div>
          <span className="badge badge-open">Listen First</span>
        </div>
        {freestyle && <AudioPlayer src={freestyle.audio_url} />}
      </div>

      <button className="btn btn-primary btn-full" onClick={acceptChallenge} style={{ maxWidth: 400 }}>
        {user ? 'Accept Challenge & Record' : 'Sign In to Accept'}
      </button>

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
