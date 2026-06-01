import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabaseAdmin } from '../supabase.js'

const router = Router()
router.use(requireAuth)

/** Perfil do utilizador autenticado. */
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle()
    if (error) throw error
    res.json({ profile: data ?? { id: req.user.id, display_name: null } })
  } catch (err) {
    next(err)
  }
})

/** Cria/atualiza o perfil. */
router.put('/', async (req, res, next) => {
  try {
    const { displayName } = req.body || {}
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: req.user.id, display_name: displayName ?? null })
      .select()
      .single()
    if (error) throw error
    res.json({ profile: data })
  } catch (err) {
    next(err)
  }
})

export default router
