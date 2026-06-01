/**
 * Vocabulário inicial do GestualAI (Fase 0).
 *
 * 20 gestos de alta frequência da Língua Gestual Portuguesa (LGP), organizados
 * por categoria. A ordem deste array define os índices das classes esperados
 * pelo modelo de classificação exportado (TensorFlow.js): o índice do array
 * corresponde ao neurónio de saída do modelo.
 *
 * `id`     — identificador estável usado em código e na base de dados.
 * `label`  — texto apresentado ao utilizador / sintetizado em voz (pt-PT).
 * `category` — agrupamento para a interface.
 */
export const GESTURE_LABELS = [
  // Saudações e cortesia
  { id: 'ola', label: 'Olá', category: 'saudacoes' },
  { id: 'adeus', label: 'Adeus', category: 'saudacoes' },
  { id: 'bom_dia', label: 'Bom dia', category: 'saudacoes' },
  { id: 'obrigado', label: 'Obrigado', category: 'saudacoes' },
  { id: 'por_favor', label: 'Por favor', category: 'saudacoes' },
  { id: 'desculpa', label: 'Desculpa', category: 'saudacoes' },

  // Respostas básicas
  { id: 'sim', label: 'Sim', category: 'respostas' },
  { id: 'nao', label: 'Não', category: 'respostas' },
  { id: 'talvez', label: 'Talvez', category: 'respostas' },
  { id: 'nao_sei', label: 'Não sei', category: 'respostas' },

  // Pedidos / necessidades
  { id: 'ajuda', label: 'Ajuda', category: 'pedidos' },
  { id: 'agua', label: 'Água', category: 'pedidos' },
  { id: 'comer', label: 'Comer', category: 'pedidos' },
  { id: 'casa_de_banho', label: 'Casa de banho', category: 'pedidos' },
  { id: 'esperar', label: 'Esperar', category: 'pedidos' },

  // Estados / sentimentos
  { id: 'bem', label: 'Estou bem', category: 'estados' },
  { id: 'mal', label: 'Estou mal', category: 'estados' },
  { id: 'dor', label: 'Dor', category: 'estados' },

  // Emergência
  { id: 'emergencia', label: 'Emergência', category: 'emergencia' },
  { id: 'medico', label: 'Médico', category: 'emergencia' },
]

export const CATEGORY_LABELS = {
  saudacoes: 'Saudações',
  respostas: 'Respostas',
  pedidos: 'Pedidos',
  estados: 'Estados',
  emergencia: 'Emergência',
}

/** Número total de classes — usado para validar a forma da saída do modelo. */
export const NUM_CLASSES = GESTURE_LABELS.length

/** Procura um gesto pelo seu índice de classe. */
export function gestureByIndex(index) {
  return GESTURE_LABELS[index] ?? null
}

/** Procura um gesto pelo seu id estável. */
export function gestureById(id) {
  return GESTURE_LABELS.find((g) => g.id === id) ?? null
}
