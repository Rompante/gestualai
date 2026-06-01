import { Router } from 'express'
import express from 'express'
import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { config } from '../config.js'

const router = Router()

/**
 * Lista os modelos TF.js disponíveis (subdiretórios de modelsDir que contenham
 * um model.json). Vazio até que um modelo treinado seja publicado.
 */
router.get('/manifest', (req, res) => {
  const dir = config.modelsDir
  const models = []
  if (existsSync(dir)) {
    for (const name of readdirSync(dir)) {
      try {
        const modelPath = path.join(dir, name)
        if (statSync(modelPath).isDirectory() && existsSync(path.join(modelPath, 'model.json'))) {
          models.push({ name, url: `/api/model/${name}/model.json` })
        }
      } catch {
        // Ignora entradas inacessíveis (ex.: symlink quebrado, corrida de I/O).
      }
    }
  }
  res.json({ models })
})

// Servir os ficheiros estáticos do modelo (model.json + shards .bin).
router.use('/', express.static(config.modelsDir))

export default router
