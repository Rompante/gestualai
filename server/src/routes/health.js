import { Router } from 'express'
import { isDbConfigured, isAuthConfigured } from '../supabase.js'

const router = Router()

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'gestualai-api',
    db: isDbConfigured,
    auth: isAuthConfigured,
    time: new Date().toISOString(),
  })
})

export default router
