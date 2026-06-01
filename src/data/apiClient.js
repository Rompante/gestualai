/**
 * Cliente da API backend do GestualAI.
 *
 * Base URL: `VITE_API_URL` (produção) ou `/api` (dev, via proxy do Vite).
 * O token de autenticação é mantido em memória e injetado nos pedidos
 * protegidos como `Authorization: Bearer <token>`.
 */
const BASE = import.meta.env.VITE_API_URL || '/api'

let authToken = null

export function setAuthToken(token) {
  authToken = token || null
}

export function getAuthToken() {
  return authToken
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (auth && authToken) headers['Authorization'] = `Bearer ${authToken}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json() : null
  if (!res.ok) {
    const message = data?.error || `Erro ${res.status}`
    const err = new Error(message)
    err.status = res.status
    throw err
  }
  return data
}

export const api = {
  health: () => request('/health'),
  vocabulary: () => request('/vocabulary'),
  modelManifest: () => request('/model/manifest'),

  register: (email, password, displayName) =>
    request('/auth/register', { method: 'POST', body: { email, password, displayName } }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password } }),

  getProfile: () => request('/profile', { auth: true }),
  updateProfile: (displayName) =>
    request('/profile', { method: 'PUT', auth: true, body: { displayName } }),

  getHistory: (limit = 50) => request(`/history?limit=${limit}`, { auth: true }),
  addHistory: (entry) => request('/history', { method: 'POST', auth: true, body: entry }),
  deleteHistory: (id) => request(`/history/${id}`, { method: 'DELETE', auth: true }),
}
