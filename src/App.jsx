import { Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Nav from './components/Nav'
import Auth from './pages/Auth'
import Beats from './pages/Beats'
import Record from './pages/Record'
import Battles from './pages/Battles'
import BattleThread from './pages/BattleThread'
import Challenge from './pages/Challenge'
import Install from './pages/Install'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return <div className="empty">Loading...</div>

  return (
    <>
      <Routes>
        <Route path="/battle/:code" element={<Challenge />} />
        {!user ? (
          <Route path="*" element={<Auth />} />
        ) : (
          <>
            <Route path="/" element={<Beats />} />
            <Route path="/record" element={<Record />} />
            <Route path="/battles" element={<Battles />} />
            <Route path="/battles/:id" element={<BattleThread />} />
            <Route path="/install" element={<Install />} />
          </>
        )}
      </Routes>
      {user && <Nav />}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
