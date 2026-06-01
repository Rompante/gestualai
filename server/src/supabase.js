import { createClient } from '@supabase/supabase-js'
import { config } from './config.js'

const options = { auth: { autoRefreshToken: false, persistSession: false } }

// Cliente service-role — acesso total à BD (apenas servidor). O isolamento por
// utilizador é imposto em código (filtro por user_id do JWT verificado).
export const supabaseAdmin =
  config.supabaseUrl && config.serviceRoleKey
    ? createClient(config.supabaseUrl, config.serviceRoleKey, options)
    : null

// Cliente anónimo — usado apenas para os fluxos de autenticação (register/login).
export const supabaseAuth =
  config.supabaseUrl && config.anonKey
    ? createClient(config.supabaseUrl, config.anonKey, options)
    : null

export const isDbConfigured = Boolean(supabaseAdmin)
export const isAuthConfigured = Boolean(supabaseAuth)

if (!isDbConfigured) {
  console.warn(
    '[GestualAI API] Supabase service-role não configurado — endpoints de perfil/histórico devolvem 503. ' +
      'Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em server/.env.',
  )
}
