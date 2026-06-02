import { useMemo, useState } from 'react'
import { speak } from '../speech/speechSynthesis.js'
import { GESTURE_LABELS, CATEGORY_LABELS, ALPHABET_LETTERS } from '../ml/labels.js'

function groupLabelsByCategory() {
  return Object.entries(CATEGORY_LABELS).map(([category, title]) => ({
    title,
    labels: GESTURE_LABELS.filter((item) => item.category === category),
  }))
}

export default function SentenceBuilder({ mode = 'gestures' }) {
  const [draft, setDraft] = useState('')
  const isAlphabetMode = mode === 'alphabet'
  const groups = useMemo(() => (isAlphabetMode ? [] : groupLabelsByCategory()), [isAlphabetMode])

  const appendText = (text) => {
    setDraft((current) => (current ? `${current} ${text}` : text))
  }

  const appendLetter = (letter) => {
    setDraft((current) => (current ? `${current}${letter}` : letter))
  }

  return (
    <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            {isAlphabetMode ? 'Soletrar palavra' : 'Formar frase/letra'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {isAlphabetMode
              ? 'Clique em letras para soletrar palavras.'
              : 'Clique em palavras ou letras para construir uma frase que pode ser lida em voz alta.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => speak(draft)}
            disabled={!draft}
            className="rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            Falar
          </button>
          <button
            type="button"
            onClick={() => setDraft('')}
            className="rounded-xl bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-600"
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900/40 p-4 text-sm text-slate-200">
        {draft || 'A frase construída aparece aqui.'}
      </div>

      <div className="mt-4 space-y-4">
        {!isAlphabetMode && groups.map((group) => (
          <div key={group.title}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {group.title}
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {group.labels.map((label) => (
                <button
                  type="button"
                  key={label.id}
                  onClick={() => appendText(label.label)}
                  className="rounded-full border border-white/10 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
                >
                  {label.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {isAlphabetMode ? 'Alfabeto A-Z' : 'Letras A-Z'}
          </h3>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
            {ALPHABET_LETTERS.map((letter) => (
              <button
                type="button"
                key={letter}
                onClick={() => appendLetter(letter)}
                className="rounded-full border border-white/10 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
