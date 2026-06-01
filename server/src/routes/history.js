import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabaseAdmin } from '../supabase.js'

const router = Router()
router.use(requireAuth)

/** Lista as traduções do utilizador (mais recentes primeiro). */
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200)
    const { data, error } = await supabaseAdmin
      .from('translation_history')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    res.json({ history: data ?? [] })
  } catch (err) {
    next(err)
  }
})

/** Insere uma tradução (apenas texto — nunca imagem/vídeo). */
router.post('/', async (req, res, next) => {
  try {
    const { gestureId, text, confidence, source } = req.body || {}
    if (!gestureId || !text) {
      return res.status(400).json({ error: 'gestureId e text são obrigatórios.' })
    }
    const { data, error } = await supabaseAdmin
      .from('translation_history')
      .insert({
        user_id: req.user.id,
        gesture_id: gestureId,
        text,
        confidence: confidence ?? null,
        source: source ?? null,
      })
      .select()
      .single()
    if (error) throw error
    res.status(201).json({ entry: data })
  } catch (err) {
    next(err)
  }
})

/** Remove uma entrada do próprio utilizador. */
router.delete('/:id', async (req, res, next) => {
  try {
    // O id é um bigint — valida antes de consultar (evita erro de cast no Postgres).
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'id inválido.' })
    }
    const { data, error } = await supabaseAdmin
      .from('translation_history')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select('id')
    if (error) throw error
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Entrada não encontrada.' })
    }
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

export default router
