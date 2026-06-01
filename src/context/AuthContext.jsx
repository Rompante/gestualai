import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, setAuthToken } from '../data/apiClient.js'

const AuthContext = createContext(null)
const TOKEN_KEY = 'gestualai.token'

// Normaliza o utilizador para uma forma consistente { id, email, displayName },
// quer venha do login (auth user) quer do restauro (perfil).
function normalizeUser(source) {
  if (!source) return null
  return {
    id: source.id ?? null,
    email: source.email ?? null,
    displayName: source.display_name ?? source.user_metadata?.display_name ?? null,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  // Restaura a sessão a partir do token guardado.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setReady(true)
      return
    }
    setAuthToken(token)
    api
      .getProfile()
      .then((d) => setUser(normalizeUser(d?.profile)))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setAuthToken(null)
      })
      .finally(() => setReady(true))
  }, [])

  const login = useCallback(async (email, password) => {
    const d = await api.login(email, password)
    if (!d?.access_token) {
      throw new Error('Sessão não iniciada (confirme o email, se aplicável).')
    }
    localStorage.setItem(TOKEN_KEY, d.access_token)
    setAuthToken(d.access_token)
    const u = normalizeUser(d.user)
    setUser(u)
    return u
  }, [])

  const register = useCallback(
    async (email, password, displayName) => {
      await api.register(email, password, displayName)
      // Se a confirmação de email estiver desativada, o login funciona logo.
      return login(email, password)
    },
    [login],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setAuthToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, ready, login, register, logout, isAuthenticated: Boolean(user) }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.')
  return ctx
}
