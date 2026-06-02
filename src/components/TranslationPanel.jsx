import StatusBadge from './StatusBadge.jsx'
import { GRAMMATICAL_LABELS, EMOTION_LABELS } from '../vision/faceExpressions.js'

/**
 * Painel de tradução: gesto ao vivo, expressão facial e histórico confirmado.
 */
export default function TranslationPanel({ live, history, speechOn, onToggleSpeech }) {
  const { gesture, confidence, expression, handsDetected } = live
  const grammatical = expression?.grammatical
  const emotion = expression?.emotion

  return (
    <aside className="flex h-full flex-col gap-4">
      {/* Gesto ao vivo */}
      {showGestureRecognition && (
      <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Gesto detetado
        </h2>
        <div className="flex min-h-[3rem] items-center">
          {gesture ? (
            <span className="text-3xl font-bold text-white">{gesture.label}</span>
          ) : (
            <span className="text-lg text-slate-500">
              {handsDetected === 0 ? 'Aguardando mãos…' : 'A interpretar…'}
            </span>
          )}
        </div>
        {gesture && (
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-accent-500 transition-all"
                style={{ width: `${Math.round(confidence * 100)}%` }}
              />
            </div>
            <span className="text-xs text-slate-400">
              {Math.round(confidence * 100)}%
            </span>
          </div>
        )}
      </section>
      )}

      {/* Expressão facial */}
      <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Expressão facial
        </h2>
        <div className="flex flex-wrap gap-2">
          {grammatical ? (
            <StatusBadge label={GRAMMATICAL_LABELS[grammatical] ?? grammatical} tone="brand" />
          ) : (
            <StatusBadge label="Sem marcador gramatical" />
          )}
          {emotion && <StatusBadge label={EMOTION_LABELS[emotion] ?? emotion} tone="good" />}
        </div>
      </section>

      {/* Síntese de voz */}
      <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-sm font-medium text-slate-200">Ler traduções em voz alta</span>
          <input
            type="checkbox"
            checked={speechOn}
            onChange={onToggleSpeech}
            className="h-5 w-5 accent-brand-500"
          />
        </label>
      </section>

      {/* Histórico */}
      <section className="flex min-h-0 flex-1 flex-col rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Histórico
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-slate-500">As traduções confirmadas aparecem aqui.</p>
        ) : (
          <ul className="flex-1 space-y-1.5 overflow-y-auto pr-1">
            {history.map((h) => (
              <li
                key={h.key}
                className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
              >
                <span className="font-medium text-white">{h.text}</span>
                <span className="text-xs text-slate-500">{h.time}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  )
}
