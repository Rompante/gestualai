/**
 * Persistência via Supabase (auth + Postgres). Usado quando o Supabase está
 * configurado (SUPABASE_URL + chaves). Mesma interface que o localStore.
 */
import { supabaseAdmin, supabaseAuth } from '../supabase.js'

export const mode = 'supabase'

function fail(status, message) {
  const e = new Error(message)
  e.status = status
  return e
}

export async function register({ email, password, displayName }) {
  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName ?? null } },
  })
  if (error) throw fail(400, error.message)
  return {
    user: { id: data.user?.id, email: data.user?.email, display_name: displayName ?? null },
    accessToken: data.session?.access_token ?? null,
  }
}

export async function login({ email, password }) {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password })
  if (error) throw fail(401, error.message)
  return {
    user: {
      id: data.user?.id,
      email: data.user?.email,
      display_name: data.user?.user_metadata?.display_name ?? null,
    },
    accessToken: data.session?.access_token ?? null,
  }
}

export async function verifyToken(token) {
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data?.user) return null
  return {
    id: data.user.id,
    email: data.user.email,
    display_name: data.user.user_metadata?.display_name ?? null,
  }
}

export async function getProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data ?? { id: userId, display_name: null }
}

export async function updateProfile(userId, displayName) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: userId, display_name: displayName ?? null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listHistory(userId, limit = 50) {
  const { data, error } = await supabaseAdmin
    .from('translation_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function addHistory(userId, { gestureId, text, confidence, source }) {
  const { data, error } = await supabaseAdmin
    .from('translation_history')
    .insert({
      user_id: userId,
      gesture_id: gestureId,
      text,
      confidence: confidence ?? null,
      source: source ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteHistory(userId, id) {
  const { data, error } = await supabaseAdmin
    .from('translation_history')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
  if (error) throw error
  return Boolean(data && data.length)
}
