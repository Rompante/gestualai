/**
 * Persistência local com SQLite (node:sqlite) + autenticação local (JWT HS256).
 * Funciona sem qualquer serviço externo — é o modo por omissão.
 */
import { DatabaseSync } from 'node:sqlite'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { hashPassword, verifyPassword, signJwt, verifyJwt } from './crypto.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.GESTUALAI_DB_PATH || path.resolve(__dirname, '../../data/gestualai.db')

export const mode = 'local'

let db = null
let secret = null

function loadSecret(dataDir) {
  if (process.env.GESTUALAI_JWT_SECRET) return process.env.GESTUALAI_JWT_SECRET
  if (dataDir) {
    const file = path.join(dataDir, '.jwt-secret')
    try {
      return fs.readFileSync(file, 'utf8')
    } catch {
      const s = crypto.randomBytes(32).toString('hex')
      try {
        fs.writeFileSync(file, s, { mode: 0o600 })
      } catch {
        /* sem persistência do segredo (ex.: só-leitura) */
      }
      return s
    }
  }
  return crypto.randomBytes(32).toString('hex')
}

function init() {
  if (db) return db
  let dataDir = null
  if (dbPath !== ':memory:') {
    dataDir = path.dirname(dbPath)
    fs.mkdirSync(dataDir, { recursive: true })
  }
  secret = loadSecret(dataDir)
  db = new DatabaseSync(dbPath)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name  TEXT,
      created_at    TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS translation_history (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT NOT NULL,
      gesture_id  TEXT NOT NULL,
      text        TEXT NOT NULL,
      confidence  REAL,
      source      TEXT,
      created_at  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_hist_user ON translation_history (user_id, created_at DESC);
  `)
  return db
}

function fail(status, message) {
  const e = new Error(message)
  e.status = status
  return e
}

export async function register({ email, password, displayName }) {
  init()
  const mail = String(email).toLowerCase().trim()
  if (String(password).length < 6) {
    throw fail(400, 'A palavra-passe deve ter pelo menos 6 caracteres.')
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(mail)
  if (existing) throw fail(409, 'Email já registado.')

  const id = crypto.randomUUID()
  db.prepare(
    'INSERT INTO users (id, email, password_hash, display_name, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, mail, hashPassword(password), displayName ?? null, new Date().toISOString())

  return {
    user: { id, email: mail, display_name: displayName ?? null },
    accessToken: signJwt({ sub: id, email: mail }, secret),
  }
}

export async function login({ email, password }) {
  init()
  const mail = String(email).toLowerCase().trim()
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(mail)
  if (!row || !verifyPassword(password, row.password_hash)) {
    throw fail(401, 'Credenciais inválidas.')
  }
  return {
    user: { id: row.id, email: row.email, display_name: row.display_name },
    accessToken: signJwt({ sub: row.id, email: row.email }, secret),
  }
}

export async function verifyToken(token) {
  init()
  const payload = verifyJwt(token, secret)
  if (!payload?.sub) return null
  const row = db.prepare('SELECT id, email, display_name FROM users WHERE id = ?').get(payload.sub)
  return row ? { id: row.id, email: row.email, display_name: row.display_name } : null
}

export async function getProfile(userId) {
  init()
  const row = db.prepare('SELECT id, display_name FROM users WHERE id = ?').get(userId)
  return row ?? { id: userId, display_name: null }
}

export async function updateProfile(userId, displayName) {
  init()
  db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(displayName ?? null, userId)
  return { id: userId, display_name: displayName ?? null }
}

export async function listHistory(userId, limit = 50) {
  init()
  return db
    .prepare(
      'SELECT * FROM translation_history WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?',
    )
    .all(userId, limit)
}

export async function addHistory(userId, { gestureId, text, confidence, source }) {
  init()
  const createdAt = new Date().toISOString()
  const info = db
    .prepare(
      'INSERT INTO translation_history (user_id, gesture_id, text, confidence, source, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .run(userId, gestureId, text, confidence ?? null, source ?? null, createdAt)
  return {
    id: Number(info.lastInsertRowid),
    user_id: userId,
    gesture_id: gestureId,
    text,
    confidence: confidence ?? null,
    source: source ?? null,
    created_at: createdAt,
  }
}

export async function deleteHistory(userId, id) {
  init()
  const info = db
    .prepare('DELETE FROM translation_history WHERE id = ? AND user_id = ?')
    .run(id, userId)
  return info.changes > 0
}
