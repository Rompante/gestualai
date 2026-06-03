import crypto from 'node:crypto'

/**
 * Hashing de palavras-passe com scrypt + sal aleatório. Formato: "sal:hash" (hex).
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(password, salt, 64)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

export function verifyPassword(password, stored) {
  const [saltHex, hashHex] = String(stored).split(':')
  if (!saltHex || !hashHex) return false
  const hash = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), 64)
  const expected = Buffer.from(hashHex, 'hex')
  return hash.length === expected.length && crypto.timingSafeEqual(hash, expected)
}

// --- JWT mínimo (HS256), sem dependências ---

function b64url(input) {
  return Buffer.from(input).toString('base64url')
}

export function signJwt(payload, secret, expSeconds = 3600) {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = b64url(JSON.stringify({ ...payload, iat: now, exp: now + expSeconds }))
  const data = `${header}.${body}`
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url')
  return `${data}.${sig}`
}

export function verifyJwt(token, secret) {
  if (typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const data = `${parts[0]}.${parts[1]}`
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url')
  const sig = Buffer.from(parts[2])
  const exp = Buffer.from(expected)
  if (sig.length !== exp.length || !crypto.timingSafeEqual(sig, exp)) return null
  let payload
  try {
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
  } catch {
    return null
  }
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
  return payload
}
