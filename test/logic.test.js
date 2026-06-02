import { test } from 'node:test'
import assert from 'node:assert/strict'

import { normalizeHandLandmarks, distance, FEATURE_LENGTH } from '../src/ml/featureExtraction.js'
import {
  computeTemporalFeature,
  TEMPORAL_FEATURE_LENGTH,
  WINDOW,
} from '../src/ml/temporalFeatures.js'
import { interpretExpression } from '../src/vision/faceExpressions.js'
import { GESTURE_LABELS, NUM_CLASSES, gestureByIndex, gestureById } from '../src/ml/labels.js'

// ---------- featureExtraction ----------
function fakeHand(offset = 0) {
  return Array.from({ length: 21 }, (_, i) => ({
    x: 0.5 + (i * 0.01) + offset,
    y: 0.5 + (i * 0.005) + offset,
    z: i * 0.001,
  }))
}

test('normalizeHandLandmarks devolve 63 valores e pulso na origem', () => {
  const f = normalizeHandLandmarks(fakeHand())
  assert.equal(f.length, FEATURE_LENGTH)
  assert.equal(f.length, 63)
  // O pulso (índice 0) é a referência → componentes ≈ 0.
  assert.ok(Math.abs(f[0]) < 1e-9 && Math.abs(f[1]) < 1e-9 && Math.abs(f[2]) < 1e-9)
})

test('normalizeHandLandmarks é invariante à translação', () => {
  const a = normalizeHandLandmarks(fakeHand(0))
  const b = normalizeHandLandmarks(fakeHand(0.2)) // mesma mão deslocada
  for (let i = 0; i < a.length; i++) assert.ok(Math.abs(a[i] - b[i]) < 1e-9)
})

test('normalizeHandLandmarks rejeita entradas inválidas', () => {
  assert.equal(normalizeHandLandmarks(null), null)
  assert.equal(normalizeHandLandmarks([{ x: 0, y: 0, z: 0 }]), null) // poucos marcos
})

test('normalizeHandLandmarks devolve null se todos os pontos coincidirem', () => {
  const same = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }))
  assert.equal(normalizeHandLandmarks(same), null) // maxDist === 0
})

test('distance calcula a norma euclidiana 3D', () => {
  assert.equal(distance({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 }), 5)
})

// ---------- temporalFeatures ----------
test('computeTemporalFeature devolve 189 valores (3×63)', () => {
  const buffer = Array.from({ length: 5 }, () => Array(63).fill(0.1))
  const t = computeTemporalFeature(buffer)
  assert.equal(t.length, TEMPORAL_FEATURE_LENGTH)
  assert.equal(t.length, 189)
})

test('gesto estático → desvio e deslocamento ≈ 0', () => {
  const buffer = Array.from({ length: WINDOW }, () => Array(63).fill(0.42))
  const t = computeTemporalFeature(buffer)
  const std = t.slice(63, 126)
  const delta = t.slice(126, 189)
  assert.ok(std.every((v) => Math.abs(v) < 1e-9))
  assert.ok(delta.every((v) => Math.abs(v) < 1e-9))
  // A média deve igualar o valor constante.
  assert.ok(t.slice(0, 63).every((v) => Math.abs(v - 0.42) < 1e-9))
})

test('movimento → deslocamento líquido capta a direção', () => {
  // dim 0 cresce de 0 a 1 ao longo da janela.
  const buffer = Array.from({ length: WINDOW }, (_, i) => {
    const v = Array(63).fill(0)
    v[0] = i / (WINDOW - 1)
    return v
  })
  const t = computeTemporalFeature(buffer)
  assert.ok(t[126] > 0.99) // delta da dim 0 ≈ 1 (last - first)
  assert.ok(t[63] > 0) // std da dim 0 > 0
})

test('computeTemporalFeature devolve null para buffer vazio', () => {
  assert.equal(computeTemporalFeature([]), null)
})

// ---------- faceExpressions ----------
const bs = (obj) => Object.entries(obj).map(([categoryName, score]) => ({ categoryName, score }))

test('sobrancelhas levantadas → marcador interrogativo', () => {
  const r = interpretExpression(
    bs({ browInnerUp: 0.6, browOuterUpLeft: 0.6, browOuterUpRight: 0.6 }),
  )
  assert.equal(r.grammatical, 'interrogativa')
})

test('sorriso → emoção feliz', () => {
  const r = interpretExpression(bs({ mouthSmileLeft: 0.7, mouthSmileRight: 0.7 }))
  assert.equal(r.emotion, 'feliz')
})

test('sem blendshapes → tudo nulo', () => {
  const r = interpretExpression([])
  assert.equal(r.grammatical, null)
  assert.equal(r.emotion, null)
})

// ---------- labels ----------
test('vocabulário tem 20 gestos com a ordem esperada', () => {
  assert.equal(NUM_CLASSES, 20)
  assert.equal(GESTURE_LABELS.length, 20)
  assert.equal(gestureByIndex(0).id, 'ola')
  assert.equal(gestureById('agua').label, 'Água')
  assert.equal(gestureByIndex(999), null)
  assert.equal(gestureById('inexistente'), null)
})

test('todos os gestos têm id, label e category únicos', () => {
  const ids = new Set(GESTURE_LABELS.map((g) => g.id))
  assert.equal(ids.size, 20)
  for (const g of GESTURE_LABELS) {
    assert.ok(g.id && g.label && g.category)
  }
})

// ---------- datasetStore (requer localStorage) ----------
test('datasetStore: captura, contagens, treino e limpeza', async () => {
  global.localStorage = {
    _s: {},
    getItem(k) {
      return this._s[k] ?? null
    },
    setItem(k, v) {
      this._s[k] = String(v)
    },
    removeItem(k) {
      delete this._s[k]
    },
  }
  const dataset = await import('../src/ml/datasetStore.js')

  const vec = Array(TEMPORAL_FEATURE_LENGTH).fill(0.3)
  dataset.addSample('ola', vec)
  dataset.addSample('ola', vec)
  dataset.addSample('agua', vec)

  assert.equal(dataset.counts().ola, 2)
  assert.equal(dataset.counts().agua, 1)
  assert.equal(dataset.totalSamples(), 3)
  assert.equal(dataset.labelsWithData().length, 2)

  // Amostra com comprimento errado é ignorada.
  dataset.addSample('ola', [1, 2, 3])
  assert.equal(dataset.counts().ola, 2)

  const { xs, ys } = dataset.getTrainingData()
  assert.equal(xs.length, 3)
  assert.equal(ys.length, 3)
  // ys são índices de classe alinhados com GESTURE_LABELS (ola=0, agua=11).
  assert.deepEqual([...ys].sort((a, b) => a - b), [0, 0, 11])

  dataset.commit()
  assert.ok(global.localStorage.getItem('gestualai.dataset.v2'))

  dataset.clearDataset()
  assert.equal(dataset.totalSamples(), 0)
})
