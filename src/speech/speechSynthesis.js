/**
 * Síntese de voz via Web Speech API (Fase 2).
 * Locução em português europeu (pt-PT), com fallback para pt-BR / qualquer pt.
 */

let cachedVoice = null

function pickPortugueseVoice() {
  if (cachedVoice) return cachedVoice
  const voices = window.speechSynthesis?.getVoices?.() ?? []
  cachedVoice =
    voices.find((v) => v.lang === 'pt-PT') ||
    voices.find((v) => v.lang?.startsWith('pt')) ||
    null
  return cachedVoice
}

// As vozes podem carregar de forma assíncrona.
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null
    pickPortugueseVoice()
  }
}

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * Fala o texto fornecido. Cancela locuções pendentes para evitar acumulação.
 * @param {string} text
 * @param {{ rate?: number, pitch?: number }} [opts]
 */
export function speak(text, opts = {}) {
  if (!isSpeechSupported() || !text) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'pt-PT'
  utterance.rate = opts.rate ?? 1
  utterance.pitch = opts.pitch ?? 1
  const voice = pickPortugueseVoice()
  if (voice) utterance.voice = voice
  window.speechSynthesis.speak(utterance)
}

export function cancelSpeech() {
  if (isSpeechSupported()) window.speechSynthesis.cancel()
}
