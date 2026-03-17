import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Battles() {
  const { user } = useAuth()
  const [battles, setBattles] = useState([])

  useEffect(() => {
    if (!user) return
    loadBattles()
  }, [user])

  async function loadBattles() {
    // Get battles where user is a participant (via battle_participants or legacy columns)
    const { data: participantBattles } = await supabase
      .from('battle_participants')
      .select('battle_id')
      .eq('user_id', user.id)

    const battleIds = (participantBattles || []).map(p => p.battle_id)

    let query = supabase
      .from('battles')
      .select('*, beats(title), freestyles(count), battle_participants(user_id, role)')
      .order('created_at', { ascending: false })

    if (battleIds.length > 0) {
      query = query.or(
        `challenger_id.eq.${user.id},opponent_id.eq.${user.id},id.in.(${battleIds.join(',')})`
      )
    } else {
      query = query.or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
    }

    const { data } = await query
    setBattles(data || [])
  }

  return (
    <div>
      <div className="page-header"><h1>Battles</h1></div>

      {battles.length === 0 && (
        <div className="empty">
          No battles yet. Record a freestyle and challenge someone!
        </div>
      )}

      {battles.map(battle => {
        const isCreator = battle.challenger_id === user.id
        const rounds = battle.freestyles?.[0]?.count || 0
        const participantCount = battle.battle_participants?.length || 0

        return (
          <Link key={battle.id} to={`/battles/${battle.id}`}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{battle.beats?.title || 'Unknown beat'}</div>
                  <div className="beat-meta">
                    {isCreator ? 'You started' : 'You joined'}
                    {participantCount > 2 && ` · ${participantCount} people`}
                    {' '}&middot; {rounds} round{rounds !== 1 ? 's' : ''}
                  </div>
                </div>
                <span className={`badge ${battle.status === 'open' ? 'badge-open' : 'badge-active'}`}>
                  {battle.status}
                </span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
