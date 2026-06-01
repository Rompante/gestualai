/**
 * Histórico de traduções (Fase 3).
 *
 * Estratégia híbrida: as entradas são sempre mantidas em memória durante a
 * sessão; se o Supabase estiver configurado, são também persistidas na tabela
 * `translation_history` (ver esquema sugerido em docs/ARCHITECTURE.md).
 */
import { supabase, isSupabaseConfigured } from '../data/supabaseClient.js'

const TABLE = 'translation_history'

/**
 * Persiste uma entrada de tradução.
 * @param {{ gestureId: string, text: string, confidence: number, source: string }} entry
 * @returns {Promise<{ persisted: boolean }>}
 */
export async function saveTranslation(entry) {
  if (!isSupabaseConfigured) return { persisted: false }
  try {
    const { error } = await supabase.from(TABLE).insert({
      gesture_id: entry.gestureId,
      text: entry.text,
      confidence: entry.confidence,
      source: entry.source,
      created_at: new Date().toISOString(),
    })
    if (error) throw error
    return { persisted: true }
  } catch (err) {
    console.warn('[GestualAI] Falha ao persistir tradução:', err.message)
    return { persisted: false }
  }
}

/**
 * Lê as traduções mais recentes (quando o Supabase está configurado).
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function fetchRecentTranslations(limit = 50) {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.warn('[GestualAI] Falha ao ler histórico:', error.message)
    return []
  }
  return data ?? []
}
