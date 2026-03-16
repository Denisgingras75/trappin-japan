import { useState, useEffect } from 'react'

export default function Install() {
  const [platform, setPlatform] = useState('ios')
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent || ''
    if (/android/i.test(ua)) setPlatform('android')
    else if (/windows|linux/i.test(ua) && !/mobile/i.test(ua)) setPlatform('desktop')

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setDeferredPrompt(null)
  }

  if (installed) {
    return (
      <div className="install-page" style={{ textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: '3rem' }}>&#x2705;</div>
        <h2>You're locked in</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>Trappin Japan is installed. Check your home screen.</p>
      </div>
    )
  }

  return (
    <div className="install-page">
      <div className="page-header"><h1>Get the App</h1></div>

      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
        Install Trappin Japan on your phone for the full experience — instant access, no browser chrome, works offline.
      </p>

      {deferredPrompt && (
        <button className="btn btn-primary btn-full" onClick={handleInstall}>
          Install Now
        </button>
      )}

      <div className="tabs" style={{ marginTop: 4 }}>
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
            <div className="install-step-text">
              Open this page in <strong>Safari</strong> (not Chrome or other browsers)
            </div>
          </div>
          <div className="install-step">
            <div className="install-step-num">2</div>
            <div className="install-step-text">
              Tap the <strong>Share button</strong> at the bottom of the screen (the square with an arrow pointing up)
            </div>
          </div>
          <div className="install-step">
            <div className="install-step-num">3</div>
            <div className="install-step-text">
              Scroll down and tap <strong>"Add to Home Screen"</strong>
            </div>
          </div>
          <div className="install-step">
            <div className="install-step-num">4</div>
            <div className="install-step-text">
              Tap <strong>"Add"</strong> in the top right. That's it — you'll see the app on your home screen
            </div>
          </div>
        </div>
      )}

      {platform === 'android' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="install-step">
            <div className="install-step-num">1</div>
            <div className="install-step-text">
              Open this page in <strong>Chrome</strong>
            </div>
          </div>
          <div className="install-step">
            <div className="install-step-num">2</div>
            <div className="install-step-text">
              Tap the <strong>three dots menu</strong> in the top right corner
            </div>
          </div>
          <div className="install-step">
            <div className="install-step-num">3</div>
            <div className="install-step-text">
              Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>
            </div>
          </div>
          <div className="install-step">
            <div className="install-step-num">4</div>
            <div className="install-step-text">
              Tap <strong>"Install"</strong>. The app icon will appear on your home screen
            </div>
          </div>
        </div>
      )}

      {platform === 'desktop' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="install-step">
            <div className="install-step-num">1</div>
            <div className="install-step-text">
              In <strong>Chrome</strong>, look for the install icon in the address bar (right side)
            </div>
          </div>
          <div className="install-step">
            <div className="install-step-num">2</div>
            <div className="install-step-text">
              Click <strong>"Install"</strong> in the popup
            </div>
          </div>
          <div className="install-step">
            <div className="install-step-num">3</div>
            <div className="install-step-text">
              The app opens in its own window — works like a native app
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
          Share this link with your crew
        </div>
        <button
          className="btn btn-secondary"
          style={{ marginTop: 8, fontSize: '0.75rem' }}
          onClick={() => {
            const url = window.location.origin
            const text = `Download Trappin Japan — async freestyle battles with your boys. ${url}`
            if (navigator.share) {
              navigator.share({ title: 'Trappin Japan', text })
            } else {
              navigator.clipboard.writeText(url)
              const btn = document.activeElement
              btn.textContent = 'Copied!'
              setTimeout(() => { btn.textContent = 'Share Link' }, 2000)
            }
          }}
        >
          Share Link
        </button>
      </div>
    </div>
  )
}
