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
  { id: 'boa_tarde', label: 'Boa tarde', category: 'saudacoes' },
  { id: 'boa_noite', label: 'Boa noite', category: 'saudacoes' },
  { id: 'obrigado', label: 'Obrigado', category: 'saudacoes' },
  { id: 'de_nada', label: 'De nada', category: 'saudacoes' },
  { id: 'por_favor', label: 'Por favor', category: 'saudacoes' },
  { id: 'desculpa', label: 'Desculpa', category: 'saudacoes' },
  { id: 'com_licenca', label: 'Com licença', category: 'saudacoes' },

  // Respostas básicas
  { id: 'sim', label: 'Sim', category: 'respostas' },
  { id: 'nao', label: 'Não', category: 'respostas' },
  { id: 'talvez', label: 'Talvez', category: 'respostas' },
  { id: 'nao_sei', label: 'Não sei', category: 'respostas' },
  { id: 'correto', label: 'Correto', category: 'respostas' },
  { id: 'errado', label: 'Errado', category: 'respostas' },

  // Pedidos / necessidades
  { id: 'ajuda', label: 'Ajuda', category: 'pedidos' },
  { id: 'agua', label: 'Água', category: 'pedidos' },
  { id: 'comida', label: 'Comida', category: 'pedidos' },
  { id: 'comer', label: 'Comer', category: 'pedidos' },
  { id: 'beber', label: 'Beber', category: 'pedidos' },
  { id: 'Casa_de_banho', label: 'Casa de banho', category: 'pedidos' },
  { id: 'esperar', label: 'Esperar', category: 'pedidos' },
  { id: 'vir', label: 'Vir', category: 'pedidos' },
  { id: 'ir', label: 'Ir', category: 'pedidos' },
  { id: 'parar', label: 'Parar', category: 'pedidos' },

  // Estados / sentimentos
  { id: 'bem', label: 'Estou bem', category: 'estados' },
  { id: 'mal', label: 'Estou mal', category: 'estados' },
  { id: 'cansado', label: 'Cansado', category: 'estados' },
  { id: 'feliz', label: 'Feliz', category: 'estados' },
  { id: 'triste', label: 'Triste', category: 'estados' },
  { id: 'assustado', label: 'Assustado', category: 'estados' },
  { id: 'dor', label: 'Dor', category: 'estados' },
  { id: 'frio', label: 'Frio', category: 'estados' },
  { id: 'calor', label: 'Calor', category: 'estados' },
  { id: 'sono', label: 'Sono', category: 'estados' },

  // Pessoas / relacionamentos
  { id: 'eu', label: 'Eu', category: 'pessoas' },
  { id: 'tu', label: 'Tu', category: 'pessoas' },
  { id: 'ele', label: 'Ele', category: 'pessoas' },
  { id: 'ela', label: 'Ela', category: 'pessoas' },
  { id: 'nos', label: 'Nós', category: 'pessoas' },
  { id: 'eles', label: 'Eles', category: 'pessoas' },
  { id: 'mae', label: 'Mãe', category: 'pessoas' },
  { id: 'pai', label: 'Pai', category: 'pessoas' },
  { id: 'filho', label: 'Filho', category: 'pessoas' },
  { id: 'amigo', label: 'Amigo', category: 'pessoas' },

  // Saúde / bem-estar
  { id: 'medico', label: 'Médico', category: 'saude' },
  { id: 'hospital', label: 'Hospital', category: 'saude' },
  { id: 'doenca', label: 'Doença', category: 'saude' },
  { id: 'medicamento', label: 'Medicamento', category: 'saude' },
  { id: 'febre', label: 'Febre', category: 'saude' },
  { id: 'tosse', label: 'Tosse', category: 'saude' },

  // Emergência
  { id: 'emergencia', label: 'Emergência', category: 'emergencia' },
  { id: 'perigo', label: 'Perigo', category: 'emergencia' },
  { id: 'chamada_ambulancia', label: 'Chamada ambulância', category: 'emergencia' },
  { id: 'policia', label: 'Polícia', category: 'emergencia' },
]

export const CATEGORY_LABELS = {
  saudacoes: 'Saudações',
  respostas: 'Respostas',
  pedidos: 'Pedidos',
  estados: 'Estados',
  pessoas: 'Pessoas',
  saude: 'Saúde',
  emergencia: 'Emergência',
}

export const ALPHABET_LABELS = Array.from({ length: 26 }, (_, i) => {
  const letter = String.fromCharCode(65 + i)
  return { id: letter, label: letter, category: 'alfabeto' }
})

export const ALPHABET_LETTERS = ALPHABET_LABELS.map((item) => item.label)

/** Número total de classes — usado para validar a forma da saída do modelo. */
export const NUM_CLASSES = GESTURE_LABELS.length

/** Procura um gesto pelo seu índice de classe. */
export function gestureByIndex(index) {
  return GESTURE_LABELS[index] ?? null
}

export function alphabetByIndex(index) {
  return ALPHABET_LABELS[index] ?? null
}

/** Procura um gesto pelo seu id estável. */
export function gestureById(id) {
  return GESTURE_LABELS.find((g) => g.id === id) ?? null
}

export function alphabetById(id) {
  return ALPHABET_LABELS.find((g) => g.id === id) ?? null
}
