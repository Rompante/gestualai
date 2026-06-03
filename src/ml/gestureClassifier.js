/**
 * Motor de classificação de gestos LGP.
 *
 * Arquitetura em duas camadas:
 *
 *   1. Modelo treinado (Fase 2) — carregado via TensorFlow.js a partir de
 *      `VITE_GESTURE_MODEL_URL`. Espera um vetor de 63 características
 *      (ver featureExtraction.js) e devolve uma distribuição sobre as
 *      NUM_CLASSES classes de `labels.js`.
 *
 *   2. Classificador heurístico (demonstração) — usado automaticamente
 *      enquanto não existir modelo treinado. Reconhece um pequeno conjunto
 *      de poses da mão a partir da geometria dos marcos, para que a aplicação
 *      seja demonstrável de ponta a ponta desde a Fase 1.
 *
 * A interface pública é idêntica nos dois casos: `classify(landmarks)`.
 */
import * as tf from '@tensorflow/tfjs'
import { GESTURE_LABELS, OUTPUT_CLASSES, NEUTRAL_INDEX, gestureByIndex } from './labels.js'
import { distance } from './featureExtraction.js'
import { TEMPORAL_FEATURE_LENGTH } from './temporalFeatures.js'
import { TRAINED_MODEL_STORE } from './trainModel.js'

const MODEL_URL = import.meta.env.VITE_GESTURE_MODEL_URL || '/models/lgp-gestures/model.json'

let model = null
let modelLoadAttempted = false

/** Validação defensiva das formas de entrada/saída do modelo. */
function validate(loaded) {
  const outputUnits = loaded.outputs[0].shape.at(-1)
  const inputUnits = loaded.inputs[0].shape.at(-1)
  if (outputUnits !== OUTPUT_CLASSES || inputUnits !== TEMPORAL_FEATURE_LENGTH) {
    console.warn(
      `[GestualAI] Modelo incompatível (entrada ${inputUnits}/${TEMPORAL_FEATURE_LENGTH}, ` +
        `saída ${outputUnits}/${OUTPUT_CLASSES}). A ignorar.`,
    )
    loaded.dispose?.()
    return null
  }
  return loaded
}

/**
 * Carrega o modelo TF.js, por ordem de prioridade:
 *   1. Modelo treinado no browser (IndexedDB), via modo de treino.
 *   2. Modelo publicado em MODEL_URL (public/models ou /api/model).
 * Se nenhum existir, devolve null e o sistema usa o classificador heurístico.
 */
export async function loadGestureModel() {
  if (modelLoadAttempted) return model
  modelLoadAttempted = true

  // 1. Modelo treinado no browser.
  try {
    const local = await tf.loadLayersModel(TRAINED_MODEL_STORE)
    model = validate(local)
    if (model) {
      console.info('[GestualAI] Modelo treinado no browser carregado.')
      return model
    }
  } catch {
    // Nenhum modelo local — segue para o publicado.
  }

  // 2. Modelo publicado.
  try {
    const remote = await tf.loadLayersModel(MODEL_URL)
    model = validate(remote)
    if (model) console.info('[GestualAI] Modelo de gestos LGP carregado de', MODEL_URL)
  } catch {
    model = null
  }
  return model
}

/** Força nova tentativa de carregamento (ex.: após treinar um modelo novo). */
export async function reloadGestureModel() {
  model?.dispose?.()
  model = null
  modelLoadAttempted = false
  return loadGestureModel()
}

export function isModelLoaded() {
  return model !== null
}

/**
 * Classifica um gesto.
 * @param {Array<{x,y,z}>} landmarks - 21 marcos da mão (usado pela heurística).
 * @param {number[]|null} temporalFeature - descritor espácio-temporal (usado pelo modelo).
 * @returns {{ gesture: object|null, confidence: number, source: 'model'|'heuristic' }}
 */
export function classify(landmarks, temporalFeature) {
  // Com modelo treinado, usa-se exclusivamente o modelo (e só com a janela
  // temporal completa, fornecida pelo chamador) — nunca a heurística.
  if (model) {
    if (!temporalFeature) return { gesture: null, confidence: 0, source: 'model' }
    return classifyWithModel(temporalFeature) ?? { gesture: null, confidence: 0, source: 'model' }
  }
  return { ...classifyHeuristic(landmarks), source: 'heuristic' }
}

function classifyWithModel(features) {
  if (!features || features.length !== TEMPORAL_FEATURE_LENGTH) return null
  return tf.tidy(() => {
    const input = tf.tensor2d([features])
    const output = model.predict(input)
    const probs = output.dataSync()
    let best = 0
    for (let i = 1; i < probs.length; i++) if (probs[i] > probs[best]) best = i
    // A classe neutra significa "sem gesto" → não dispara tradução.
    return {
      gesture: best === NEUTRAL_INDEX ? null : gestureByIndex(best),
      confidence: probs[best],
      source: 'model',
    }
  })
}

// ---------------------------------------------------------------------------
// Classificador heurístico de demonstração
// ---------------------------------------------------------------------------

const FINGER = {
  thumb: { tip: 4, pip: 2, mcp: 1 },
  index: { tip: 8, pip: 6, mcp: 5 },
  middle: { tip: 12, pip: 10, mcp: 9 },
  ring: { tip: 16, pip: 14, mcp: 13 },
  pinky: { tip: 20, pip: 18, mcp: 17 },
}

/** Devolve um objeto {thumb,index,middle,ring,pinky} de booleanos (dedo esticado?). */
function extendedFingers(lm) {
  const wrist = lm[0]
  const state = {}
  for (const [name, j] of Object.entries(FINGER)) {
    if (name === 'thumb') {
      // O polegar move-se lateralmente: comparamos a distância tip↔mcp vs pip↔mcp.
      state[name] = distance(lm[j.tip], lm[j.mcp]) > distance(lm[j.pip], lm[j.mcp]) * 1.4
    } else {
      // Esticado se a ponta estiver mais longe do pulso do que a articulação PIP.
      state[name] = distance(lm[j.tip], wrist) > distance(lm[j.pip], wrist) * 1.05
    }
  }
  return state
}

/**
 * Mapeamento de POSES DE DEMONSTRAÇÃO → gestos do vocabulário.
 * NOTA: estes mapeamentos são apenas ilustrativos (Fase 1) e serão substituídos
 * pelo modelo treinado em dados reais de LGP (Fase 2).
 */
function classifyHeuristic(landmarks) {
  if (!landmarks || landmarks.length !== 21) {
    return { gesture: null, confidence: 0 }
  }
  const f = extendedFingers(landmarks)
  const count = Object.values(f).filter(Boolean).length

  let id = null
  if (count === 5) id = 'ola' // mão aberta (aceno)
  else if (count === 0) id = 'nao' // punho fechado
  else if (f.thumb && count === 1) id = 'bem' // polegar para cima
  else if (f.index && count === 1) id = 'esperar' // indicador
  else if (f.index && f.middle && count === 2) id = 'talvez' // "V"
  else if (f.index && f.pinky && count === 2) id = 'emergencia' // indicador + mindinho
  else if (f.thumb && f.index && f.pinky && count === 3) id = 'ajuda'

  if (!id) return { gesture: null, confidence: 0 }
  const gesture = GESTURE_LABELS.find((g) => g.id === id) ?? null
  // Confiança fixa moderada — sinaliza que é uma deteção heurística, não probabilística.
  return { gesture, confidence: 0.6 }
}
