import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AudioPlayer from '../components/AudioPlayer'

export default function BattleThread() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [battle, setBattle] = useState(null)
  const [rounds, setRounds] = useState([])
  const [beat, setBeat] = useState(null)
  const [participants, setParticipants] = useState([])

  useEffect(() => {
    loadBattle()
  }, [id])

  async function loadBattle() {
    const { data: b } = await supabase
      .from('battles')
      .select('*, beats(*), battle_participants(user_id, role, joined_at)')
      .eq('id', id)
      .single()
    if (!b) return
    setBattle(b)
    setBeat(b.beats)
    setParticipants(b.battle_participants || [])

    const { data: f } = await supabase
      .from('freestyles')
      .select('*')
      .eq('battle_id', id)
      .order('round_number', { ascending: true })
    setRounds(f || [])
  }

  if (!battle) return <div className="empty">Loading...</div>

  const isParticipant = participants.some(p => p.user_id === user?.id) ||
    battle.challenger_id === user?.id ||
    battle.opponent_id === user?.id

  const canRespond = battle.status !== 'complete' && isParticipant

  return (
    <div>
      <div className="page-header">
        <h1>{beat?.title || 'Battle'}</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {participants.length > 2 && (
            <span className="badge badge-active">{participants.length} people</span>
          )}
          <span className={`badge ${battle.status === 'open' ? 'badge-open' : 'badge-active'}`}>
            {battle.status}
          </span>
        </div>
      </div>

      {/* Invite more people (if battle is open) */}
      {battle.status === 'open' && battle.challenger_id === user?.id && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="beat-meta" style={{ marginBottom: 8 }}>Invite more people</div>
          <button
            className="btn btn-secondary btn-full"
            onClick={() => {
              const url = `${window.location.origin}/battle/${battle.share_code}`
              if (navigator.share) {
                navigator.share({ title: 'Trappin Japan Battle', text: 'Jump in this battle', url })
              } else {
                navigator.clipboard.writeText(url)
              }
            }}
            style={{ fontSize: '0.75rem' }}
          >
            Share Battle Link
          </button>
        </div>
      )}

      {rounds.map((round) => {
        const isMine = round.user_id === user?.id
        const targets = round.targets || []
        const targetNames = targets.length > 0
          ? participants.filter(p => targets.includes(p.user_id)).map(p => p.user_id.slice(0, 6))
          : []

        return (
          <div key={round.id} className={`round ${isMine ? 'mine' : 'theirs'}`}>
            <span className="round-label">
              Round {round.round_number} &middot; {isMine ? 'You' : 'Opponent'}
              {targets.length > 0 && (
                <span style={{ color: 'var(--color-neon-pink)', marginLeft: 6 }}>
                  @ {targetNames.length > 0 ? targetNames.join(', ') : `${targets.length} tagged`}
                </span>
              )}
            </span>
            <div className="audio-bubble">
              <AudioPlayer src={round.audio_url} beatSrc={beat?.audio_url} accent={isMine} />
            </div>
          </div>
        )
      })}

      {canRespond && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            className="btn btn-primary btn-full"
            onClick={() => navigate('/record', {
              state: {
                beat,
                battleId: battle.id,
                roundNumber: rounds.length + 1
              }
            })}
          >
            {rounds.length === 0 ? 'Drop Your Verse' : 'Fire Back'}
          </button>
        </div>
      )}
    </div>
  )
}
