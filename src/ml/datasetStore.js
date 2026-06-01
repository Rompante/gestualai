/**
 * Armazenamento do dataset de treino (no browser).
 *
 * Guarda, por gesto, uma lista de vetores de características normalizados
 * (63 valores — ver featureExtraction.js), capturados pelo modo de treino.
 * Persiste em localStorage; durante a gravação as amostras ficam em memória e
 * só são persistidas em `commit()` (evita escritas a cada frame).
 */
import { GESTURE_LABELS } from './labels.js'
import { FEATURE_LENGTH } from './featureExtraction.js'

const KEY = 'gestualai.dataset.v1'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

let data = load()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch (err) {
    console.warn('[GestualAI] Não foi possível guardar o dataset (localStorage cheio?).', err)
  }
}

/** Acrescenta uma amostra em memória (sem persistir — chame commit() depois). */
export function addSample(gestureId, features) {
  if (!features || features.length !== FEATURE_LENGTH) return
  if (!data[gestureId]) data[gestureId] = []
  // Arredonda para 4 casas para poupar espaço de armazenamento.
  data[gestureId].push(features.map((v) => Math.round(v * 1e4) / 1e4))
}

/** Persiste o estado atual em localStorage. */
export function commit() {
  persist()
}

/** Contagem de amostras por gesto. */
export function counts() {
  const c = {}
  for (const g of GESTURE_LABELS) c[g.id] = data[g.id]?.length || 0
  return c
}

export function totalSamples() {
  return Object.values(data).reduce((acc, arr) => acc + arr.length, 0)
}

/** Gestos que já têm pelo menos uma amostra. */
export function labelsWithData() {
  return GESTURE_LABELS.filter((g) => (data[g.id]?.length || 0) > 0)
}

export function clearDataset() {
  data = {}
  persist()
}

export function clearGesture(gestureId) {
  delete data[gestureId]
  persist()
}

/**
 * Constrói os tensores de treino. `ys` são índices de classe alinhados com a
 * ordem de GESTURE_LABELS (i.e., compatíveis com a saída do modelo).
 */
export function getTrainingData() {
  const xs = []
  const ys = []
  GESTURE_LABELS.forEach((g, index) => {
    for (const vec of data[g.id] || []) {
      xs.push(vec)
      ys.push(index)
    }
  })
  return { xs, ys }
}

export function exportDataset() {
  return JSON.stringify(data)
}

export function importDataset(json) {
  const parsed = typeof json === 'string' ? JSON.parse(json) : json
  data = parsed || {}
  persist()
}
