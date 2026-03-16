import { useState, useEffect } from 'react'

export default function Install() {
  const [platform, setPlatform] = useState('ios')
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent || ''
    if (/android/i.test(ua)) setPlatform('android')
    else if (/windows|linux/i.test(ua) && !/mobile/i.test(ua)) setPlatform('desktop')

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const shareApp = () => {
    const url = window.location.origin
    const text = `Trappin Japan — freestyle rap battles with your boys. Pull up: ${url}`
    if (navigator.share) {
      navigator.share({ title: 'Trappin Japan', text, url })
    } else {
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  return (
    <div className="install-page">
      <div className="page-header"><h1>Share</h1></div>

      <div className="card" style={{ textAlign: 'center', padding: '24px 20px' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Send this to your crew
        </div>
        <button className="btn btn-primary btn-full" onClick={shareApp} style={{ fontSize: '0.9rem', padding: '14px 24px' }}>
          {copied ? 'Link Copied!' : 'Share Trappin Japan'}
        </button>
        <div style={{ marginTop: 12, fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-neon-cyan)', wordBreak: 'break-all' }}>
          {window.location.origin}
        </div>
      </div>

      {deferredPrompt && (
        <button className="btn btn-secondary btn-full" onClick={handleInstall} style={{ marginTop: 4 }}>
          Install as App
        </button>
      )}

      <div style={{ marginTop: 8 }}>
        <h2 style={{ marginBottom: 12 }}>Install on Your Phone</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: 16 }}>
          Add to your home screen for the full experience — no browser chrome, instant access.
        </p>

        <div className="tabs">
          {[
            { key: 'ios', label: 'iPhone' },
            { key: 'android', label: 'Android' },
            { key: 'desktop', label: 'Desktop' }
          ].map(p => (
            <button key={p.key}
              className={`tab ${platform === p.key ? 'active' : ''}`}
              onClick={() => setPlatform(p.key)}>
              {p.label}
            </button>
          ))}
        </div>

        {platform === 'ios' && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="install-step">
              <div className="install-step-num">1</div>
              <div className="install-step-text">Open in <strong>Safari</strong> (not Chrome)</div>
            </div>
            <div className="install-step">
              <div className="install-step-num">2</div>
              <div className="install-step-text">Tap the <strong>Share button</strong> (square with arrow up)</div>
            </div>
            <div className="install-step">
              <div className="install-step-num">3</div>
              <div className="install-step-text">Scroll down, tap <strong>"Add to Home Screen"</strong></div>
            </div>
            <div className="install-step">
              <div className="install-step-num">4</div>
              <div className="install-step-text">Tap <strong>"Add"</strong> — done</div>
            </div>
          </div>
        )}

        {platform === 'android' && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="install-step">
              <div className="install-step-num">1</div>
              <div className="install-step-text">Open in <strong>Chrome</strong></div>
            </div>
            <div className="install-step">
              <div className="install-step-num">2</div>
              <div className="install-step-text">Tap <strong>three dots menu</strong> (top right)</div>
            </div>
            <div className="install-step">
              <div className="install-step-num">3</div>
              <div className="install-step-text">Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></div>
            </div>
            <div className="install-step">
              <div className="install-step-num">4</div>
              <div className="install-step-text">Tap <strong>"Install"</strong> — done</div>
            </div>
          </div>
        )}

        {platform === 'desktop' && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="install-step">
              <div className="install-step-num">1</div>
              <div className="install-step-text">In <strong>Chrome</strong>, click install icon in address bar</div>
            </div>
            <div className="install-step">
              <div className="install-step-num">2</div>
              <div className="install-step-text">Click <strong>"Install"</strong> — opens as its own app</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
