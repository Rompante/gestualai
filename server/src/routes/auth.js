import { Router } from 'express'
import { supabaseAuth } from '../supabase.js'

const router = Router()

function ensureConfigured(res) {
  if (!supabaseAuth) {
    res.status(503).json({ error: 'Autenticação não configurada no servidor.' })
    return false
  }
  return true
}

/** Registo de um novo utilizador via Supabase Auth. */
router.post('/register', async (req, res, next) => {
  try {
    if (!ensureConfigured(res)) return
    const { email, password, displayName } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'email e password são obrigatórios.' })
    }
    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName ?? null } },
    })
    if (error) return res.status(400).json({ error: error.message })
    res.status(201).json({
      user: data.user,
      // session pode ser null se a confirmação de email estiver ativa no projeto.
      access_token: data.session?.access_token ?? null,
    })
  } catch (err) {
    next(err)
  }
})

/** Login — devolve o access_token (JWT) a usar nas rotas protegidas. */
router.post('/login', async (req, res, next) => {
  try {
    if (!ensureConfigured(res)) return
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'email e password são obrigatórios.' })
    }
    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password })
    if (error) return res.status(401).json({ error: error.message })
    res.json({
      user: data.user,
      access_token: data.session?.access_token ?? null,
      expires_at: data.session?.expires_at ?? null,
    })
  } catch (err) {
    next(err)
  }
})

export default router
