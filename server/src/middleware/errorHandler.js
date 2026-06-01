/** Tratamento de erros uniforme — devolve sempre { error: string }. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || 500
  if (status >= 500) {
    // Não expor detalhes internos (ex.: mensagens do Postgres/Supabase) ao cliente.
    console.error('[GestualAI API]', err)
    return res.status(status).json({ error: 'Erro interno do servidor.' })
  }
  res.status(status).json({ error: err.message || 'Pedido inválido.' })
}

/** 404 para rotas não definidas. */
export function notFound(req, res) {
  res.status(404).json({ error: 'Recurso não encontrado.' })
}
