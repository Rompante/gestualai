/**
 * Cliente Supabase (Fase 3 — perfis e histórico de traduções).
 *
 * É opcional: se as variáveis de ambiente não estiverem definidas, o cliente
 * é `null` e a aplicação funciona normalmente sem persistência remota
 * (o histórico permanece apenas em memória durante a sessão).
 */
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null

if (!isSupabaseConfigured) {
  console.info(
    '[GestualAI] Supabase não configurado — persistência remota desativada. ' +
      'https://sthimqqzjwrdewweubbq.supabase.co',
  )
}
