/** Tratamento de erros uniforme — devolve sempre { error: string }. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || 500
  if (status >= 500) console.error('[GestualAI API]', err)
  res.status(status).json({ error: err.message || 'Erro interno do servidor.' })
}

/** 404 para rotas não definidas. */
export function notFound(req, res) {
  res.status(404).json({ error: 'Recurso não encontrado.' })
}
