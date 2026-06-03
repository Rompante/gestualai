import { store } from '../store/index.js'

/**
 * Exige um token Bearer válido. Valida-o através da camada de persistência
 * ativa (local ou Supabase) e popula `req.user`.
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'Autenticação necessária.' })
  }
  try {
    const user = await store.verifyToken(token)
    if (!user) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' })
    }
    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}
