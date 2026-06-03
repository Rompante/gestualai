import { Router } from 'express'
import { persistenceMode } from '../store/index.js'

const router = Router()

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'gestualai-api',
    persistence: true, // sempre disponível (local por omissão)
    mode: persistenceMode, // 'local' | 'supabase'
    time: new Date().toISOString(),
  })
})

export default router
