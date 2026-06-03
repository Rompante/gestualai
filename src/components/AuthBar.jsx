import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Barra de autenticação minimalista no cabeçalho.
 * Permite registar/entrar (email + password) e terminar sessão. Quando a API
 * não está configurada, mostra simplesmente o erro devolvido.
 */
export default function AuthBar() {
  const { user, isAuthenticated, login, register, logout, ready } = useAuth()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (!ready) return null

  if (isAuthenticated) {
    const name = user?.displayName || user?.email || 'Sessão iniciada'
    const initial = (name || '?').trim().charAt(0).toUpperCase()
    return (
      <div className="flex items-center gap-2.5 text-sm">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
          {initial}
        </span>
        <span className="max-w-[10rem] truncate text-slate-300">{name}</span>
        <button
          onClick={logout}
          className="rounded-lg bg-white/10 px-3 py-1.5 font-medium text-slate-200 transition hover:bg-white/20"
        >
          Sair
        </button>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/15"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
        Entrar
      </button>
    )
  }

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'login') await login(email, password)
      else await register(email, password)
      setOpen(false)
      setEmail('')
      setPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="glass flex animate-fade-in flex-col gap-2 p-3 sm:flex-row sm:items-center"
    >
      <input
        type="email"
        required
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-lg bg-ink-900/70 px-3 py-1.5 text-sm text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-brand-500"
      />
      <input
        type="password"
        required
        placeholder="palavra-passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded-lg bg-ink-900/70 px-3 py-1.5 text-sm text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-brand-500"
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-brand-gradient px-4 py-1.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {busy ? '…' : mode === 'login' ? 'Entrar' : 'Registar'}
      </button>
      <button
        type="button"
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        className="text-xs text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline"
      >
        {mode === 'login' ? 'Criar conta' : 'Já tenho conta'}
      </button>
      {error && <span className="text-xs text-red-300">{error}</span>}
    </form>
  )
}
