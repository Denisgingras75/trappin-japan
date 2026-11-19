import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { CATEGORIES, isPlayableBeat, formatLength } from '../lib/beats'
import AudioPlayer from './AudioPlayer'

// Searchable beat list with preview. Calls onPick(beat) when one is chosen.
export default function BeatPicker({ onPick, onCancel, currentBeatId, title = 'Pick a Beat' }) {
  const [beats, setBeats] = useState(null)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    let cancelled = false
    let query = supabase.from('beats').select('*')
      .order('is_curated', { ascending: false })
      .order('title', { ascending: true })
      .limit(200)
    if (category !== 'all') query = query.eq('category', category)
    if (debounced) query = query.ilike('title', `%${debounced}%`)
    query.then(({ data }) => {
      if (!cancelled) setBeats((data || []).filter(isPlayableBeat))
    })
    return () => { cancelled = true }
  }, [category, debounced])

  return (
    <div>
      <div className="page-header">
        <h1>{title}</h1>
        {onCancel && (
          <button className="btn btn-secondary" onClick={onCancel}
            style={{ padding: '8px 16px', fontSize: '0.75rem' }}>
            Back
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search beats..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="text-input"
        style={{ marginBottom: 12 }}
      />

      <div className="category-pills">
        {CATEGORIES.map(c => (
          <button key={c.key}
            className={`pill ${category === c.key ? 'active' : ''}`}
            onClick={() => setCategory(c.key)}>
            {c.label}
          </button>
        ))}
      </div>

      {beats === null && <div className="empty">Loading beats...</div>}
      {beats?.length === 0 && (
        <div className="empty">{search ? `No beats matching "${search}"` : 'No beats here yet'}</div>
      )}

      {(beats || []).map(b => (
        <div key={b.id} className="card">
          <div className="beat-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="beat-title">{b.title}</div>
              <div className="beat-meta">
                {b.is_curated ? b.category || 'Curated' : 'Community'}
                {b.duration_ms ? ` · ${formatLength(b.duration_ms)}` : ''}
                {b.id === currentBeatId && ' · current'}
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => onPick(b)}
              style={{ padding: '8px 14px', fontSize: '0.7rem' }}>
              Use
            </button>
          </div>
          <div style={{ marginTop: 10 }}>
            <AudioPlayer src={b.audio_url} preload="none" gainDb={b.gain_db} durationMs={b.duration_ms} />
          </div>
        </div>
      ))}
    </div>
  )
}
