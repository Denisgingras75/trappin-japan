import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AudioPlayer from '../components/AudioPlayer'

export default function Beats() {
  const [beats, setBeats] = useState([])
  const [tab, setTab] = useState('curated')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadBeats()
  }, [tab])

  async function loadBeats() {
    let query = supabase.from('beats').select('*').order('created_at', { ascending: false })
    if (tab === 'curated') query = query.eq('is_curated', true)
    if (tab === 'mine') query = query.eq('uploaded_by', (await supabase.auth.getUser()).data.user?.id)
    const { data } = await query
    setBeats(data || [])
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const user = (await supabase.auth.getUser()).data.user
    const path = `beats/${user.id}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage.from('audio').upload(path, file)
    if (uploadError) { setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(path)

    await supabase.from('beats').insert({
      title: file.name.replace(/\.[^/.]+$/, ''),
      audio_url: publicUrl,
      uploaded_by: user.id,
      is_curated: false
    })

    setUploading(false)
    setTab('mine')
    loadBeats()
  }

  return (
    <div>
      <div className="page-header">
        <h1>Beats</h1>
        <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
          {uploading ? 'Uploading...' : '+ Upload'}
        </button>
        <input ref={fileRef} type="file" accept="audio/*" hidden onChange={handleUpload} />
      </div>

      <div className="tabs">
        {['curated', 'community', 'mine'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {beats.length === 0 && (
        <div className="empty">
          {tab === 'mine' ? 'Upload your first beat' : 'No beats yet'}
        </div>
      )}

      {beats.map(beat => (
        <div key={beat.id} className="card beat-row">
          <div style={{ flex: 1 }}>
            <div className="beat-title">{beat.title}</div>
            <div className="beat-meta">{beat.is_curated ? 'Curated' : 'User upload'}</div>
            <div style={{ marginTop: 8 }}>
              <AudioPlayer src={beat.audio_url} />
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
            onClick={() => navigate('/record', { state: { beat } })}
          >
            Spit
          </button>
        </div>
      ))}
    </div>
  )
}
