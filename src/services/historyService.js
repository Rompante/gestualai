/**
 * Histórico de traduções (Fase 3) — via API backend.
 *
 * A persistência exige autenticação. Quando o utilizador não está autenticado
 * ou a API está indisponível, as funções falham de forma silenciosa: o
 * histórico permanece apenas em memória durante a sessão (gerido pelo App).
 */
import { api, getAuthToken } from '../data/apiClient.js'

/**
 * Persiste uma entrada de tradução (apenas texto — nunca imagem/vídeo).
 * @param {{ gestureId: string, text: string, confidence: number, source: string }} entry
 * @returns {Promise<{ persisted: boolean }>}
 */
export async function saveTranslation(entry) {
  if (!getAuthToken()) return { persisted: false }
  try {
    await api.addHistory({
      gestureId: entry.gestureId,
      text: entry.text,
      confidence: entry.confidence,
      source: entry.source,
    })
    return { persisted: true }
  } catch (err) {
    console.warn('[GestualAI] Falha ao persistir tradução:', err.message)
    return { persisted: false }
  }
}

/**
 * Lê as traduções mais recentes do utilizador autenticado.
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function fetchRecentTranslations(limit = 50) {
  if (!getAuthToken()) return []
  try {
    const data = await api.getHistory(limit)
    return data.history ?? []
  } catch (err) {
    console.warn('[GestualAI] Falha ao ler histórico:', err.message)
    return []
  }
}
