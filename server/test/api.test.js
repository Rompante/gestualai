import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'

const app = createApp()

test('GET /api/health devolve status ok', async () => {
  const res = await request(app).get('/api/health')
  assert.equal(res.status, 200)
  assert.equal(res.body.status, 'ok')
  assert.equal(res.body.service, 'gestualai-api')
})

test('GET /api/vocabulary devolve os 20 gestos LGP', async () => {
  const res = await request(app).get('/api/vocabulary')
  assert.equal(res.status, 200)
  assert.equal(res.body.count, 20)
  assert.equal(res.body.gestures.length, 20)
  assert.ok(res.body.gestures.some((g) => g.id === 'ola'))
})

test('GET /api/model/manifest devolve um array de modelos', async () => {
  const res = await request(app).get('/api/model/manifest')
  assert.equal(res.status, 200)
  assert.ok(Array.isArray(res.body.models))
})

test('rotas protegidas exigem autenticação', async () => {
  // Sem Supabase configurado nos testes, deve responder 503; com Supabase mas
  // sem token, 401. Em qualquer caso, nunca 200.
  const res = await request(app).get('/api/history')
  assert.ok([401, 503].includes(res.status))
})

test('rota /api desconhecida devolve 404 JSON', async () => {
  const res = await request(app).get('/api/inexistente')
  assert.equal(res.status, 404)
  assert.equal(res.body.error, 'Recurso não encontrado.')
})
