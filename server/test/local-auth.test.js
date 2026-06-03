import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

// Persistência local em memória (sem ficheiro, sem rede) — definido ANTES de
// importar a app, para o localStore arrancar neste modo.
process.env.GESTUALAI_DB_PATH = ':memory:'
process.env.GESTUALAI_JWT_SECRET = 'test-secret-123'

const { createApp } = await import('../src/app.js')
const app = createApp()

test('fluxo local: registo → login → perfil → histórico', async () => {
  const email = `u${Date.now()}@local.test`
  const password = 'segredo123'

  let r = await request(app)
    .post('/api/auth/register')
    .send({ email, password, displayName: 'Teste' })
  assert.equal(r.status, 201)
  assert.ok(r.body.access_token)
  assert.equal(r.body.user.email, email)

  r = await request(app).post('/api/auth/login').send({ email, password })
  assert.equal(r.status, 200)
  const token = r.body.access_token
  assert.ok(token)

  // Perfil (protegido).
  r = await request(app).get('/api/profile').set('Authorization', `Bearer ${token}`)
  assert.equal(r.status, 200)
  assert.equal(r.body.profile.display_name, 'Teste')

  // Sem token → 401.
  r = await request(app).get('/api/profile')
  assert.equal(r.status, 401)

  // Token inválido → 401.
  r = await request(app).get('/api/profile').set('Authorization', 'Bearer xxx.yyy.zzz')
  assert.equal(r.status, 401)

  // Adiciona histórico.
  r = await request(app)
    .post('/api/history')
    .set('Authorization', `Bearer ${token}`)
    .send({ gestureId: 'ola', text: 'Olá', confidence: 0.9, source: 'model' })
  assert.equal(r.status, 201)
  const id = r.body.entry.id
  assert.ok(Number.isInteger(id))

  // Lista e confirma.
  r = await request(app).get('/api/history').set('Authorization', `Bearer ${token}`)
  assert.equal(r.status, 200)
  assert.ok(r.body.history.some((h) => h.id === id && h.text === 'Olá'))

  // Apaga.
  r = await request(app).delete(`/api/history/${id}`).set('Authorization', `Bearer ${token}`)
  assert.equal(r.status, 204)

  // Apagar de novo → 404.
  r = await request(app).delete(`/api/history/${id}`).set('Authorization', `Bearer ${token}`)
  assert.equal(r.status, 404)

  // id inválido → 400.
  r = await request(app).delete('/api/history/abc').set('Authorization', `Bearer ${token}`)
  assert.equal(r.status, 400)
})

test('registo duplicado → 409', async () => {
  const email = `dup${Date.now()}@local.test`
  await request(app).post('/api/auth/register').send({ email, password: 'segredo123' })
  const r = await request(app).post('/api/auth/register').send({ email, password: 'segredo123' })
  assert.equal(r.status, 409)
})

test('password curta → 400', async () => {
  const r = await request(app)
    .post('/api/auth/register')
    .send({ email: `short${Date.now()}@local.test`, password: '123' })
  assert.equal(r.status, 400)
})

test('login com credenciais erradas → 401', async () => {
  const r = await request(app)
    .post('/api/auth/login')
    .send({ email: 'naoexiste@local.test', password: 'x' })
  assert.equal(r.status, 401)
})

test('isolamento: utilizador não vê histórico de outro', async () => {
  const mk = async (n) => {
    const email = `iso${n}-${Date.now()}@local.test`
    await request(app).post('/api/auth/register').send({ email, password: 'segredo123' })
    const r = await request(app).post('/api/auth/login').send({ email, password: 'segredo123' })
    return r.body.access_token
  }
  const tokenA = await mk('a')
  const tokenB = await mk('b')

  await request(app)
    .post('/api/history')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ gestureId: 'sim', text: 'Sim' })

  // B não vê o histórico de A.
  const r = await request(app).get('/api/history').set('Authorization', `Bearer ${tokenB}`)
  assert.equal(r.status, 200)
  assert.equal(r.body.history.length, 0)
})
