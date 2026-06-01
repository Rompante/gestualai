/**
 * Características espácio-temporais a partir de uma janela de frames.
 *
 * Um classificador de um único frame só distingue POSES estáticas. Muitos
 * sinais de LGP envolvem MOVIMENTO. Para captar isso sem um modelo de
 * sequência pesado, resumimos uma janela dos últimos N frames (cada um com o
 * vetor de 63 marcos normalizados) num descritor de tamanho fixo:
 *
 *   • média        (63) — pose média na janela
 *   • desvio-padrão (63) — quantidade de movimento por eixo
 *   • deslocamento  (63) — movimento líquido (último − primeiro), capta direção
 *
 * Resultado: vetor de 189 valores, classificável pelo mesmo MLP. Mantém o
 * dataset pequeno (um vetor por amostra) e funciona tanto para gestos
 * estáticos (desvio/deslocamento ≈ 0) como dinâmicos.
 */
import { FEATURE_LENGTH as PER_FRAME } from './featureExtraction.js'

/** Número de frames considerados na janela (~0,5 s a 30 fps). */
export const WINDOW = 16

/** Dimensão do descritor espácio-temporal: média + desvio + deslocamento. */
export const TEMPORAL_FEATURE_LENGTH = PER_FRAME * 3 // 189

/**
 * @param {number[][]} buffer - até WINDOW vetores de PER_FRAME valores.
 * @returns {number[] | null} descritor de TEMPORAL_FEATURE_LENGTH valores.
 */
export function computeTemporalFeature(buffer) {
  const n = buffer.length
  if (n === 0) return null
  const D = buffer[0].length

  const mean = new Array(D).fill(0)
  for (const f of buffer) {
    for (let i = 0; i < D; i++) mean[i] += f[i]
  }
  for (let i = 0; i < D; i++) mean[i] /= n

  const std = new Array(D).fill(0)
  for (const f of buffer) {
    for (let i = 0; i < D; i++) {
      const d = f[i] - mean[i]
      std[i] += d * d
    }
  }
  for (let i = 0; i < D; i++) std[i] = Math.sqrt(std[i] / n)

  // Deslocamento líquido na janela (capta a direção do movimento).
  const delta = new Array(D).fill(0)
  if (n >= 2) {
    const first = buffer[0]
    const last = buffer[n - 1]
    for (let i = 0; i < D; i++) delta[i] = last[i] - first[i]
  }

  return [...mean, ...std, ...delta]
}
