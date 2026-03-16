import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Battles() {
  const { user } = useAuth()
  const [battles, setBattles] = useState([])

  useEffect(() => {
    if (!user) return
    supabase
      .from('battles')
      .select('*, beats(title), freestyles(count)')
      .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .then(({ data }) => setBattles(data || []))
  }, [user])

  return (
    <div>
      <div className="page-header"><h1>Battles</h1></div>

      {battles.length === 0 && (
        <div className="empty">
          No battles yet. Record a freestyle and challenge someone!
        </div>
      )}

      {battles.map(battle => {
        const isChallenger = battle.challenger_id === user.id
        const rounds = battle.freestyles?.[0]?.count || 0
        return (
          <Link key={battle.id} to={`/battles/${battle.id}`}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{battle.beats?.title || 'Unknown beat'}</div>
                  <div className="beat-meta">
                    {isChallenger ? 'You challenged' : 'Challenged you'} &middot; {rounds} round{rounds !== 1 ? 's' : ''}
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
