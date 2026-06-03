import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { store } from '../store/index.js'

const router = Router()
router.use(requireAuth)

/** Perfil do utilizador autenticado. */
router.get('/', async (req, res, next) => {
  try {
    res.json({ profile: await store.getProfile(req.user.id) })
  } catch (err) {
    next(err)
  }
})

/** Cria/atualiza o perfil. */
router.put('/', async (req, res, next) => {
  try {
    res.json({ profile: await store.updateProfile(req.user.id, req.body?.displayName) })
  } catch (err) {
    next(err)
  }
})

export default router
