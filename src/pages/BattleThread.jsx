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

  useEffect(() => {
    loadBattle()
  }, [id])

  async function loadBattle() {
    const { data: b } = await supabase.from('battles').select('*, beats(*)').eq('id', id).single()
    if (!b) return
    setBattle(b)
    setBeat(b.beats)

    const { data: f } = await supabase
      .from('freestyles')
      .select('*')
      .eq('battle_id', id)
      .order('round_number', { ascending: true })
    setRounds(f || [])
  }

  if (!battle) return <div className="empty">Loading...</div>

  const isChallenger = battle.challenger_id === user?.id
  const isMyTurn = rounds.length === 0 || rounds[rounds.length - 1].user_id !== user?.id
  const canRespond = battle.status !== 'complete' && isMyTurn

  return (
    <div>
      <div className="page-header">
        <h1>{beat?.title || 'Battle'}</h1>
        <span className={`badge ${battle.status === 'open' ? 'badge-open' : 'badge-active'}`}>
          {battle.status}
        </span>
      </div>

      {rounds.map((round, i) => {
        const isMine = round.user_id === user?.id
        return (
          <div key={round.id} className={`round ${isMine ? 'mine' : 'theirs'}`}>
            <span className="round-label">
              Round {round.round_number} &middot; {isMine ? 'You' : 'Opponent'}
            </span>
            <div className="audio-bubble">
              <AudioPlayer src={round.audio_url} accent={isMine} />
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
