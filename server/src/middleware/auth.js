import { supabaseAdmin } from '../supabase.js'

/**
 * Exige um JWT válido do Supabase Auth no header Authorization: Bearer <token>.
 * Valida o token via service-role e popula `req.user`.
 */
export async function requireAuth(req, res, next) {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Persistência não configurada no servidor.' })
  }
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'Autenticação necessária.' })
  }
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' })
    }
    req.user = data.user
    next()
  } catch (err) {
    next(err)
  }
}
