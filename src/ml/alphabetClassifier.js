import * as tf from '@tensorflow/tfjs'
import { ALPHABET_LABELS, alphabetByIndex } from './labels.js'
import { normalizeHandLandmarks } from './featureExtraction.js'

const MODEL_URL = import.meta.env.VITE_ALPHABET_MODEL_URL || '/models/sign-alphabet/model.json'

let model = null
let modelLoadAttempted = false

export async function loadAlphabetModel() {
  if (modelLoadAttempted) return model
  modelLoadAttempted = true
  try {
    const loaded = await tf.loadLayersModel(MODEL_URL)
    const outputUnits = loaded.outputs[0].shape.at(-1)
    if (outputUnits !== ALPHABET_LABELS.length) {
      console.warn(
        `[GestualAI] Modelo de alfabeto carregado tem ${outputUnits} classes, esperadas ${ALPHABET_LABELS.length}. A ignorar.`,
      )
      loaded.dispose?.()
      return null
    }
    model = loaded
    console.info('[GestualAI] Modelo de alfabeto carregado.')
  } catch {
    model = null
  }
  return model
}

export function isAlphabetModelLoaded() {
  return model !== null
}

export function classifyAlphabet(landmarks) {
  if (!model || !landmarks || landmarks.length !== 21) {
    return { gesture: null, confidence: 0, source: 'none' }
  }
  return classifyWithModel(landmarks)
}

function classifyWithModel(landmarks) {
  const features = normalizeHandLandmarks(landmarks)
  if (!features) return { gesture: null, confidence: 0, source: 'none' }

  return tf.tidy(() => {
    const input = tf.tensor2d([features])
    const output = model.predict(input)
    const probs = output.dataSync()
    let best = 0
    for (let i = 1; i < probs.length; i += 1) {
      if (probs[i] > probs[best]) best = i
    }
    return {
      gesture: alphabetByIndex(best),
      confidence: probs[best],
      source: 'model',
    }
  })
}
