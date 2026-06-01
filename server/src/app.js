import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import health from './routes/health.js'
import auth from './routes/auth.js'
import profile from './routes/profile.js'
import history from './routes/history.js'
import vocabulary from './routes/vocabulary.js'
import model from './routes/model.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

/** Factory da aplicação Express — separada do bootstrap para ser testável. */
export function createApp() {
  const app = express()

  app.use(cors({ origin: config.corsOrigin }))
  app.use(express.json({ limit: '256kb' })) // só texto — limite pequeno propositadamente

  app.use('/api/health', health)
  app.use('/api/vocabulary', vocabulary)
  app.use('/api/model', model)
  app.use('/api/auth', auth)
  app.use('/api/profile', profile)
  app.use('/api/history', history)

  app.use('/api', notFound)
  app.use(errorHandler)

  return app
}
