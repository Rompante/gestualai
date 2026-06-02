import { GESTURE_LABELS, CATEGORY_LABELS, ALPHABET_LETTERS } from '../ml/labels.js'

function groupLabelsByCategory() {
  return Object.entries(CATEGORY_LABELS).map(([category, title]) => ({
    title,
    labels: GESTURE_LABELS.filter((item) => item.category === category),
  }))
}

export default function VocabularyPanel({ mode = 'gestures' }) {
  const groups = groupLabelsByCategory()
  const isAlphabetMode = mode === 'alphabet'

  if (isAlphabetMode) {
    return (
      <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Alfabeto de sinais (A-Z)
        </h2>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          {ALPHABET_LETTERS.map((letter) => (
            <span
              key={letter}
              className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200"
            >
              {letter}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-400">
          Modo: reconhecimento automático de letras A-Z. Faça os sinais das letras à câmara.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Vocabulário disponível
      </h2>

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {group.title}
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {group.labels.map((label) => (
                <span
                  key={label.id}
                  className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200"
                >
                  {label.label}
                </span>
              ))}
            </div>
          </div>
        ))}

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Alfabeto (A-Z)
          </h3>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
            {ALPHABET_LETTERS.map((letter) => (
              <span
                key={letter}
                className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200"
              >
                {letter}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-400">
            Nota: no modo Gestos, mostra-se o vocabulário suportado e o alfabeto como referência.
            No modo Alfabeto, o app reconhece automaticamente as letras A-Z.
          </p>
        </div>
      </div>
    </section>
  )
}
