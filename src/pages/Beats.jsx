import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AudioPlayer from '../components/AudioPlayer'
import YouTubePlayer from '../components/YouTubePlayer'

export default function Beats() {
  const [beats, setBeats] = useState([])
  const [tab, setTab] = useState('curated')
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addMode, setAddMode] = useState('file') // file | url | youtube
  const [urlValue, setUrlValue] = useState('')
  const [urlTitle, setUrlTitle] = useState('')
  const [ytUrl, setYtUrl] = useState('')
  const [ytStatus, setYtStatus] = useState('')
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

  async function handleYouTubeAdd() {
    if (!ytUrl.trim()) return
    setYtStatus('Getting video info...')
    try {
      const res = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: ytUrl.trim() })
      })
      const data = await res.json()
      if (!res.ok) { setYtStatus(data.error || 'Failed'); return }

      setYtStatus('Saving beat...')
      const user = (await supabase.auth.getUser()).data.user
      const title = urlTitle.trim() || data.title || 'YouTube Beat'
      await supabase.from('beats').insert({
        title,
        audio_url: `youtube:${data.videoId}`,
        uploaded_by: user.id,
        is_curated: false
      })
      setYtUrl('')
      setUrlTitle('')
      setYtStatus('')
      setShowAdd(false)
      setTab('mine')
      loadBeats()
    } catch (e) {
      setYtStatus('Failed — check the URL and try again')
    }
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
    fontSize: '0.85rem',
    width: '100%',
    fontFamily: 'var(--font-mono)'
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {dragging && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(255,45,85,0.08)',
          border: '3px dashed var(--color-neon-pink)',
          borderRadius: 'var(--radius)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', fontWeight: 500, zIndex: 300, pointerEvents: 'none',
          fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em',
          color: 'var(--color-neon-pink)'
        }}>
          Drop beat here
        </div>
      )}

      <div className="page-header">
        <h1>Beats</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}
          style={{ padding: '8px 16px', fontSize: '0.75rem' }}>
          {showAdd ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="tabs" style={{ marginBottom: 12 }}>
            {[
              { key: 'file', label: 'File' },
              { key: 'youtube', label: 'YouTube' },
              { key: 'url', label: 'URL' }
            ].map(m => (
              <button key={m.key}
                className={`tab ${addMode === m.key ? 'active' : ''}`}
                onClick={() => setAddMode(m.key)}>
                {m.label}
              </button>
            ))}
          </div>

          {addMode === 'file' && (
            <>
              <div className="upload-area" onClick={() => fileRef.current?.click()}>
                {uploading ? 'Uploading...' : 'Tap to choose or drag & drop'}
              </div>
              <input ref={fileRef} type="file" accept="audio/*" hidden onChange={e => uploadFile(e.target.files?.[0])} />
            </>
          )}

          {addMode === 'youtube' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input type="text" placeholder="Beat name (optional)" value={urlTitle}
                onChange={e => setUrlTitle(e.target.value)} style={inputStyle} />
              <input type="url" placeholder="Paste YouTube URL" value={ytUrl}
                onChange={e => setYtUrl(e.target.value)} style={{
                  ...inputStyle,
                  borderColor: ytUrl ? 'var(--color-neon-pink)' : 'var(--color-border)'
                }} />
              {ytStatus && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-neon-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {ytStatus}
                </div>
              )}
              <button className="btn btn-primary btn-full" onClick={handleYouTubeAdd}
                disabled={!ytUrl.trim() || ytStatus.includes('...')}>
                {ytStatus.includes('...') ? ytStatus : 'Add Beat'}
              </button>
            </div>
          )}

          {addMode === 'url' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input type="text" placeholder="Beat name (optional)" value={urlTitle}
                onChange={e => setUrlTitle(e.target.value)} style={inputStyle} />
              <input type="url" placeholder="Direct audio URL (MP3, WAV)" value={urlValue}
                onChange={e => setUrlValue(e.target.value)} style={inputStyle} />
              <button className="btn btn-primary btn-full" onClick={handleUrlImport}
                disabled={!urlValue.trim() || uploading}>
                {uploading ? 'Adding...' : 'Add Beat'}
              </button>
            </div>
          )}
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
          {tab === 'mine' ? 'Drop a file, paste a URL, or rip from YouTube'
            : tab === 'curated' ? 'Loading curated beats...'
            : 'No community beats yet'}
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
              style={{ padding: '8px 14px', fontSize: '0.7rem' }}>
              Spit
            </button>
          </div>
          <div style={{ marginTop: 10 }}>
            {beat.audio_url.startsWith('youtube:')
              ? <YouTubePlayer videoId={beat.audio_url.replace('youtube:', '')} small />
              : <AudioPlayer src={beat.audio_url} />}
          </div>
        </div>
      ))}
    </div>
  )
}
