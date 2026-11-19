import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { uploadBeat } from '../lib/beats'

// Upload your own beat. It goes into the shared library, so everyone can
// rap on it. Calls onAdded(beat) when it's in.
export default function AddBeat({ onAdded }) {
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  const handleFile = async (file) => {
    if (!file || busy) return
    setBusy(true)
    setError(null)
    const { beat, error } = await uploadBeat(supabase, file, title)
    setBusy(false)
    if (fileRef.current) fileRef.current.value = ''
    if (error) { setError(error); return }
    setTitle('')
    onAdded?.(beat)
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="beat-meta" style={{ marginBottom: 8 }}>
        Add your own beat &middot; everyone gets it
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input type="text" className="text-input" placeholder="Beat name (optional)"
          value={title} onChange={e => setTitle(e.target.value)} disabled={busy} maxLength={60} />
        <div
          className="upload-area"
          onClick={() => !busy && fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]) }}
        >
          {busy ? 'Uploading...' : 'Tap to choose an MP3, M4A or WAV'}
        </div>
        <input ref={fileRef} type="file" accept="audio/*,.mp3,.m4a,.wav" hidden
          onChange={e => handleFile(e.target.files?.[0])} />
        {error && <div className="form-error">{error}</div>}
      </div>
    </div>
  )
}
