/**
 * Extração e normalização de características a partir dos marcos (landmarks) da mão.
 *
 * O MediaPipe HandLandmarker devolve 21 marcos por mão, cada um com (x, y, z)
 * em coordenadas normalizadas relativas à imagem. Para que o classificador seja
 * invariante à posição e escala da mão no enquadramento, normalizamos:
 *
 *   1. Translação — todos os pontos passam a ser relativos ao pulso (índice 0).
 *   2. Escala       — dividimos pela distância máxima ao pulso (mão "unitária").
 *
 * O resultado é um vetor de 63 valores (21 marcos × 3 eixos) pronto a alimentar
 * o modelo TensorFlow.js, ou o classificador heurístico de demonstração.
 */

export const LANDMARKS_PER_HAND = 21
export const FEATURE_LENGTH = LANDMARKS_PER_HAND * 3 // 63

/**
 * @param {Array<{x:number,y:number,z:number}>} landmarks - 21 marcos de uma mão.
 * @returns {number[] | null} vetor normalizado de 63 valores, ou null se inválido.
 */
export function normalizeHandLandmarks(landmarks) {
  if (!landmarks || landmarks.length !== LANDMARKS_PER_HAND) return null

  const wrist = landmarks[0]

  // 1. Translação relativa ao pulso.
  const centered = landmarks.map((p) => ({
    x: p.x - wrist.x,
    y: p.y - wrist.y,
    z: (p.z ?? 0) - (wrist.z ?? 0),
  }))

  // 2. Escala pela distância máxima ao pulso.
  let maxDist = 0
  for (const p of centered) {
    const d = Math.hypot(p.x, p.y, p.z)
    if (d > maxDist) maxDist = d
  }
  if (maxDist === 0) return null

  const features = []
  for (const p of centered) {
    features.push(p.x / maxDist, p.y / maxDist, p.z / maxDist)
  }
  return features
}

/** Distância euclidiana entre dois marcos (no espaço normalizado da imagem). */
export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0))
}
