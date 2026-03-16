import { useAuth } from '../hooks/useAuth'

export default function Auth() {
  const { signIn } = useAuth()

  return (
    <div className="auth-page">
      <h1>Trappin Japan</h1>
      <p>Async rap battles with friends</p>
      <button className="btn btn-primary" onClick={signIn}>
        Sign in with Google
      </button>
    </div>
  )
}
