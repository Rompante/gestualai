import { Router } from 'express'
import { store } from '../store/index.js'

const router = Router()

function handleError(err, res, next) {
  if (err.status) return res.status(err.status).json({ error: err.message })
  next(err)
}

/** Registo de um novo utilizador. */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'email e password são obrigatórios.' })
    }
    const { user, accessToken } = await store.register({ email, password, displayName })
    res.status(201).json({ user, access_token: accessToken })
  } catch (err) {
    handleError(err, res, next)
  }
})

/** Login — devolve o access_token a usar nas rotas protegidas. */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'email e password são obrigatórios.' })
    }
    const { user, accessToken } = await store.login({ email, password })
    if (!accessToken) {
      return res.status(403).json({ error: 'Sessão não iniciada (confirme o email, se aplicável).' })
    }
    res.json({ user, access_token: accessToken })
  } catch (err) {
    handleError(err, res, next)
  }
})

export default router
