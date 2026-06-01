import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Carrega server/.env explicitamente (independente do diretório de trabalho).
dotenv.config({ path: path.resolve(__dirname, '../.env') })

export const config = {
  port: Number(process.env.PORT) || 8787,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  supabaseUrl: process.env.SUPABASE_URL || '',
  anonKey: process.env.SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  // Diretório dos modelos TF.js (raiz do repo: ../../public/models).
  modelsDir: process.env.MODELS_DIR || path.resolve(__dirname, '../../public/models'),
}
