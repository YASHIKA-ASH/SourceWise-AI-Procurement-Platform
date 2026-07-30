import { createContext, useContext, useEffect, useState } from 'react'
import { api, authStorage } from './api'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthGate({ children }) {
  const [user, setUser] = useState(authStorage.user())
  const [checking, setChecking] = useState(Boolean(authStorage.accessToken()))
  const [error, setError] = useState('')
  const [needsSetup, setNeedsSetup] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function initialize() {
      try {
        const status = await api.authStatus()
        if (!cancelled) setNeedsSetup(!status.configured)
        if (authStorage.accessToken()) {
          const currentUser = await api.me()
          if (!cancelled) setUser(currentUser)
        }
      } catch (err) {
        if (!cancelled) {
          authStorage.clear()
          setUser(null)
          setError(err.message)
        }
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    initialize()
    const sync = () => setUser(authStorage.user())
    window.addEventListener('sourcewise-auth-changed', sync)
    return () => {
      cancelled = true
      window.removeEventListener('sourcewise-auth-changed', sync)
    }
  }, [])

  async function login(email, password) {
    setError('')
    try {
      const session = await api.login({ email, password })
      authStorage.save(session)
      setUser(session.user)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  async function logout() {
    try {
      await api.logout()
    } catch {
      authStorage.clear()
    }
    setUser(null)
  }

  if (checking) {
    return <div className="auth-page"><div className="auth-card"><div className="spinner" /><p>Checking secure session…</p></div></div>
  }

  if (!user) {
    return <LoginScreen onLogin={login} error={error} needsSetup={needsSetup} />
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      <div className="session-chip" title={`Signed in as ${user.email}`}>
        <span><strong>{user.full_name}</strong><small>{user.role}</small></span>
        <button type="button" onClick={logout}>Sign out</button>
      </div>
      {children}
    </AuthContext.Provider>
  )
}

function LoginScreen({ onLogin, error, needsSetup }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    await onLogin(email.trim(), password)
    setSubmitting(false)
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand"><div className="brand-mark">S</div><div><strong>SourceWise</strong><span>Secure procurement intelligence</span></div></div>
        <div>
          <p className="eyebrow">ENTERPRISE ACCESS</p>
          <h1>Sign in</h1>
          <p className="auth-helper">Use your company account to access procurement data and AI recommendations.</p>
        </div>
        {needsSetup && <div className="alert error">No administrator exists. Add INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD to backend/.env, then restart the backend.</div>}
        {error && <div className="alert error">{error}</div>}
        <form className="auth-form" onSubmit={submit}>
          <label><span>Email address</span><input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label><span>Password</span><input type="password" required minLength="8" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button className="primary-button auth-submit" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in securely'}</button>
        </form>
      </section>
    </main>
  )
}
