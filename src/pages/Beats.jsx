import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AudioPlayer from '../components/AudioPlayer'

export default function Beats() {
  const [beats, setBeats] = useState([])
  const [tab, setTab] = useState('curated')
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [urlValue, setUrlValue] = useState('')
  const [urlTitle, setUrlTitle] = useState('')
  const fileRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => { loadBeats() }, [tab])

  async function loadBeats() {
    let query = supabase.from('beats').select('*').order('created_at', { ascending: false })
    if (tab === 'curated') query = query.eq('is_curated', true)
    if (tab === 'mine') query = query.eq('uploaded_by', (await supabase.auth.getUser()).data.user?.id)
    const { data } = await query
    setBeats(data || [])
  }

  async function uploadFile(file) {
    if (!file) return
    setUploading(true)
    const user = (await supabase.auth.getUser()).data.user
    const path = `beats/${user.id}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('audio').upload(path, file)
    if (error) { setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(path)
    await supabase.from('beats').insert({
      title: file.name.replace(/\.[^/.]+$/, ''),
      audio_url: publicUrl,
      uploaded_by: user.id,
      is_curated: false
    })
    setUploading(false)
    setShowAdd(false)
    setTab('mine')
    loadBeats()
  }

  async function handleUrlImport() {
    if (!urlValue.trim()) return
    setUploading(true)
    const user = (await supabase.auth.getUser()).data.user
    await supabase.from('beats').insert({
      title: urlTitle.trim() || urlValue.split('/').pop().split('?')[0] || 'Imported beat',
      audio_url: urlValue.trim(),
      uploaded_by: user.id,
      is_curated: false
    })
    setUrlValue('')
    setUrlTitle('')
    setShowAdd(false)
    setUploading(false)
    setTab('mine')
    loadBeats()
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('audio/')) uploadFile(file)
  }

  const inputStyle = {
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 12px',
    color: 'var(--color-text)',
    fontSize: '0.9rem',
    width: '100%'
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {dragging && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(255,61,0,0.15)',
          border: '3px dashed var(--color-accent)', borderRadius: 'var(--radius)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem', fontWeight: 700, zIndex: 300, pointerEvents: 'none'
        }}>
          Drop beat here
        </div>
      )}

      <div className="page-header">
        <h1>Beats</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          {showAdd ? 'Cancel' : '+ Add Beat'}
        </button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div
            className="upload-area"
            onClick={() => fileRef.current?.click()}
            style={{ marginBottom: 12, padding: 20 }}
          >
            {uploading ? 'Uploading...' : 'Tap to choose file or drag & drop'}
          </div>
          <input ref={fileRef} type="file" accept="audio/*" hidden onChange={e => uploadFile(e.target.files?.[0])} />

          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: '8px 0' }}>
            — or paste a link —
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input type="text" placeholder="Beat name (optional)" value={urlTitle}
              onChange={e => setUrlTitle(e.target.value)} style={inputStyle} />
            <input type="url" placeholder="Paste audio URL" value={urlValue}
              onChange={e => setUrlValue(e.target.value)} style={inputStyle} />
            <button className="btn btn-primary btn-full" onClick={handleUrlImport}
              disabled={!urlValue.trim() || uploading}>
              {uploading ? 'Adding...' : 'Add from URL'}
            </button>
          </div>
        </div>
      )}

      <div className="tabs">
        {['curated', 'community', 'mine'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {beats.length === 0 && (
        <div className="empty">
          {tab === 'mine' ? 'Drop a file or paste a URL to add your first beat'
            : tab === 'curated' ? 'Loading curated beats...'
            : 'No community beats yet — be the first'}
        </div>
      )}

      {beats.map(beat => (
        <div key={beat.id} className="card">
          <div className="beat-row">
            <div style={{ flex: 1 }}>
              <div className="beat-title">{beat.title}</div>
              <div className="beat-meta">{beat.is_curated ? 'Curated' : 'Community'}</div>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/record', { state: { beat } })}
              style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
              Spit
            </button>
          </div>
          <div style={{ marginTop: 10 }}>
            <AudioPlayer src={beat.audio_url} />
          </div>
        </div>
      ))}
    </div>
  )
}
