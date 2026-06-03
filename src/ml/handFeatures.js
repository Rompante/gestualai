/**
 * Características de um frame com DUAS mãos.
 *
 * Muitos sinais de LGP usam as duas mãos. Cada frame é descrito por dois
 * "slots" fixos — mão direita e mão esquerda — atribuídos pela handedness do
 * MediaPipe (para serem estáveis entre frames). Cada slot tem o vetor de 63
 * marcos normalizados (ver featureExtraction.js); uma mão ausente fica a zeros
 * (o que o modelo aprende como "essa mão não está presente").
 *
 * Resultado: vetor de 126 valores por frame (2 × 63).
 */
import { normalizeHandLandmarks, FEATURE_LENGTH } from './featureExtraction.js'

export const HANDS = 2
export const PER_HAND = FEATURE_LENGTH // 63
export const FRAME_FEATURE_LENGTH = HANDS * PER_HAND // 126

function handednessLabel(handednesses, i) {
  // tasks-vision: handednesses[i] = [{ categoryName: 'Left' | 'Right', score }]
  return handednesses?.[i]?.[0]?.categoryName ?? null
}

/**
 * @param {Array<Array<{x,y,z}>>} landmarksList - lista de mãos (cada uma 21 marcos).
 * @param {Array} handednesses - handedness por mão (do resultado do HandLandmarker).
 * @returns {number[] | null} vetor de 126 valores (direita||esquerda), ou null.
 */
export function buildFrameFeature(landmarksList, handednesses) {
  if (!landmarksList || landmarksList.length === 0) return null

  const slots = [new Array(PER_HAND).fill(0), new Array(PER_HAND).fill(0)] // [direita, esquerda]
  let any = false
  for (let i = 0; i < landmarksList.length && i < HANDS; i++) {
    const norm = normalizeHandLandmarks(landmarksList[i])
    if (!norm) continue
    const slot = handednessLabel(handednesses, i) === 'Left' ? 1 : 0
    slots[slot] = norm
    any = true
  }
  return any ? [...slots[0], ...slots[1]] : null
}
