import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AudioPlayer from '../components/AudioPlayer'
import AddBeat from '../components/AddBeat'
import { CATEGORIES, isPlayableBeat, formatLength } from '../lib/beats'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'community', label: 'Added by people' },
  { key: 'mine', label: 'Mine' }
]

export default function Beats() {
  const { user } = useAuth()
  const [beats, setBeats] = useState(null)
  const [tab, setTab] = useState('all')
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [reload, setReload] = useState(0)
  const navigate = useNavigate()

  // Debounce search — 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    let cancelled = false
    // Newest first, so a beat someone just added is at the top for everyone.
    let query = supabase.from('beats').select('*')
      .order('created_at', { ascending: false })
      .order('title', { ascending: true })
      .limit(300)
    if (tab === 'community') query = query.eq('is_curated', false)
    if (tab === 'mine') query = query.eq('uploaded_by', user?.id)
    if (tab === 'all' && category !== 'all') query = query.eq('category', category)
    if (debouncedSearch) query = query.ilike('title', `%${debouncedSearch}%`)
    query.then(({ data }) => {
      if (!cancelled) setBeats((data || []).filter(isPlayableBeat))
    })
    return () => { cancelled = true }
  }, [tab, category, debouncedSearch, reload, user?.id])

  return (
    <div>
      <div className="page-header">
        <h1>Beats</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}
          style={{ padding: '8px 16px', fontSize: '0.75rem' }}>
          {showAdd ? 'Close' : '+ Add Beat'}
        </button>
      </div>

      {showAdd && (
        <AddBeat onAdded={() => {
          setShowAdd(false)
          setSearch('')
          setTab('all')
          setCategory('all')
          setReload(n => n + 1)
        }} />
      )}

      <input
        type="text"
        placeholder="Search beats..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="text-input"
        style={{ marginBottom: 12 }}
      />

      <div className="tabs">
        {TABS.map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'all' && (
        <div className="category-pills">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              className={`pill ${category === c.key ? 'active' : ''}`}
              onClick={() => setCategory(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {beats === null && <div className="empty">Loading beats...</div>}
      {beats?.length === 0 && (
        <div className="empty">
          {search ? `No beats matching "${search}"`
            : tab === 'mine' ? 'You haven\'t added a beat yet — hit + Add Beat'
            : tab === 'community' ? 'Nobody has added a beat yet — be the first'
            : 'No beats in this category'}
        </div>
      )}

      {(beats || []).map(beat => (
        <div key={beat.id} className="card">
          <div className="beat-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="beat-title">{beat.title}</div>
              <div className="beat-meta">
                {beat.is_curated ? beat.category || 'Curated' : beat.uploaded_by === user?.id ? 'Added by you' : 'Added by people'}
                {beat.duration_ms ? ` \u00b7 ${formatLength(beat.duration_ms)}` : ''}
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/record', { state: { beat } })}
              style={{ padding: '8px 14px', fontSize: '0.7rem' }}>
              Spit
            </button>
          </div>
          <div style={{ marginTop: 10 }}>
            <AudioPlayer src={beat.audio_url} preload="none" gainDb={beat.gain_db} durationMs={beat.duration_ms} />
          </div>
        </div>
      ))}
    </div>
  )
}
