import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { store } from '../store/index.js'

const router = Router()
router.use(requireAuth)

/** Lista as traduções do utilizador (mais recentes primeiro). */
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200)
    res.json({ history: await store.listHistory(req.user.id, limit) })
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
    const entry = await store.addHistory(req.user.id, { gestureId, text, confidence, source })
    res.status(201).json({ entry })
  } catch (err) {
    next(err)
  }
})

/** Remove uma entrada do próprio utilizador. */
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'id inválido.' })
    }
    const deleted = await store.deleteHistory(req.user.id, id)
    if (!deleted) {
      return res.status(404).json({ error: 'Entrada não encontrada.' })
    }
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

export default router
