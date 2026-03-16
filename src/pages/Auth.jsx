import { useAuth } from '../hooks/useAuth'

export default function Auth() {
  const { signIn } = useAuth()

  return (
    <div className="auth-page">
      <div className="auth-kanji" style={{ top: '10%', left: '-5%' }}>trap</div>
      <div className="auth-kanji" style={{ bottom: '15%', right: '-10%', fontSize: '8rem' }}>battle</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-neon-cyan)', fontFamily: 'var(--font-mono)', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
        async rap battles
      </div>
      <h1>Trappin Japan</h1>
      <p style={{ maxWidth: 260, lineHeight: 1.6 }}>
        Drop a freestyle. Challenge your boys. Back and forth til someone folds.
      </p>
      <button className="btn btn-primary" onClick={signIn} style={{ padding: '14px 40px' }}>
        Sign In
      </button>
    </div>
  )
}
