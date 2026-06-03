#!/usr/bin/env node
/**
 * Script de validação ponta-a-ponta da API GestualAI.
 *
 * Exercita: health → vocabulary → register → login → profile (GET/PUT) →
 * history (POST/GET/DELETE). Reporta ✓/✗ por passo e termina com código != 0
 * se algum passo falhar.
 *
 * Uso:
 *   node scripts/smoke.mjs                 # usa http://localhost:8787
 *   API_URL=https://... node scripts/smoke.mjs
 *   TEST_EMAIL=a@b.c TEST_PASSWORD=... node scripts/smoke.mjs
 */
const API_URL = process.env.API_URL || 'http://localhost:8787'
const EMAIL = process.env.TEST_EMAIL || `smoke+${Date.now()}@gestualai.test`
const PASSWORD = process.env.TEST_PASSWORD || `Pw_${Math.random().toString(36).slice(2)}!1`

const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
}

let failures = 0
function ok(label, extra = '') {
  console.log(`  ${c.green('✓')} ${label} ${c.dim(extra)}`)
}
function fail(label, extra = '') {
  failures++
  console.log(`  ${c.red('✗')} ${label} ${c.red(extra)}`)
}

async function req(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json() : null
  return { status: res.status, data }
}

async function main() {
  console.log(`\nGestualAI · smoke test → ${c.dim(API_URL)}\n`)

  // 1. Health
  let health
  try {
    health = await req('/api/health')
    if (health.status === 200 && health.data?.status === 'ok') {
      ok('GET /api/health', `persistência=${health.data.mode}`)
    } else {
      fail('GET /api/health', `status ${health.status}`)
    }
  } catch (err) {
    fail('GET /api/health', `servidor inacessível em ${API_URL} (${err.message})`)
    return finish()
  }

  // 2. Vocabulary
  const vocab = await req('/api/vocabulary')
  if (vocab.status === 200 && vocab.data?.count === 20) {
    ok('GET /api/vocabulary', `${vocab.data.count} gestos`)
  } else {
    fail('GET /api/vocabulary', `status ${vocab.status}, count ${vocab.data?.count}`)
  }

  console.log(`  ${c.dim(`persistência: ${health.data.mode}`)}`)
  // A persistência está sempre disponível (local por omissão).
  if (!health.data.persistence) {
    console.log(`\n${c.yellow('!')} Persistência indisponível — passos de auth/histórico ignorados.`)
    return finish()
  }

  // 3. Register
  const reg = await req('/api/auth/register', {
    method: 'POST',
    body: { email: EMAIL, password: PASSWORD, displayName: 'Smoke Test' },
  })
  if (reg.status === 201) ok('POST /api/auth/register', EMAIL)
  else fail('POST /api/auth/register', `status ${reg.status}: ${reg.data?.error ?? ''}`)

  // 4. Login
  const login = await req('/api/auth/login', {
    method: 'POST',
    body: { email: EMAIL, password: PASSWORD },
  })
  const token = login.data?.access_token
  if (login.status === 200 && token) {
    ok('POST /api/auth/login', 'token obtido')
  } else {
    fail(
      'POST /api/auth/login',
      `status ${login.status}: ${login.data?.error ?? 'sem token (confirmação de email ativa?)'}`,
    )
    return finish()
  }

  // 5. Profile GET
  const prof = await req('/api/profile', { token })
  if (prof.status === 200) ok('GET /api/profile', `id=${prof.data?.profile?.id?.slice(0, 8)}…`)
  else fail('GET /api/profile', `status ${prof.status}`)

  // 6. Profile PUT
  const profPut = await req('/api/profile', {
    method: 'PUT',
    token,
    body: { displayName: 'Smoke Atualizado' },
  })
  if (profPut.status === 200 && profPut.data?.profile?.display_name === 'Smoke Atualizado') {
    ok('PUT /api/profile', 'display_name atualizado')
  } else {
    fail('PUT /api/profile', `status ${profPut.status}`)
  }

  // 7. History POST
  const add = await req('/api/history', {
    method: 'POST',
    token,
    body: { gestureId: 'ola', text: 'Olá', confidence: 0.9, source: 'heuristic' },
  })
  const entryId = add.data?.entry?.id
  if (add.status === 201 && entryId) ok('POST /api/history', `id=${entryId}`)
  else fail('POST /api/history', `status ${add.status}: ${add.data?.error ?? ''}`)

  // 8. History GET (verifica que a entrada aparece)
  const list = await req('/api/history', { token })
  const found = list.data?.history?.some((h) => h.id === entryId)
  if (list.status === 200 && found) ok('GET /api/history', `${list.data.history.length} entrada(s)`)
  else fail('GET /api/history', `status ${list.status}, entrada presente=${found}`)

  // 9. History DELETE
  if (entryId) {
    const del = await req(`/api/history/${entryId}`, { method: 'DELETE', token })
    if (del.status === 204) ok('DELETE /api/history/:id', 'removida')
    else fail('DELETE /api/history/:id', `status ${del.status}`)
  }

  finish()
}

function finish() {
  console.log('')
  if (failures === 0) {
    console.log(c.green('✓ Tudo OK — a API está operacional.\n'))
    process.exit(0)
  } else {
    console.log(c.red(`✗ ${failures} passo(s) falharam.\n`))
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(c.red(`\nErro inesperado: ${err.stack || err.message}\n`))
  process.exit(1)
})
