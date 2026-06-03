/**
 * Seleção da camada de persistência:
 *   • Supabase — se configurado (SUPABASE_URL + chaves).
 *   • Local (SQLite + JWT) — por omissão, sem necessidade de qualquer serviço.
 */
import { isDbConfigured } from '../supabase.js'
import * as local from './localStore.js'
import * as supabase from './supabaseStore.js'

export const store = isDbConfigured ? supabase : local
export const persistenceMode = isDbConfigured ? 'supabase' : 'local'
