import StatusBadge from './StatusBadge.jsx'
import { GRAMMATICAL_LABELS, EMOTION_LABELS } from '../vision/faceExpressions.js'

/**
 * Painel de tradução: gesto ao vivo, expressão facial e histórico confirmado.
 */
export default function TranslationPanel({ live, history, speechOn, onToggleSpeech }) {
  const { gesture, confidence, expression, handsDetected } = live
  const grammatical = expression?.grammatical
  const emotion = expression?.emotion
  const pct = Math.round(confidence * 100)

  return (
    <aside className="flex h-full flex-col gap-4">
      {/* Gesto ao vivo — destaque principal */}
      <section className="glass relative overflow-hidden p-6">
        <div className="absolute inset-x-0 top-0 h-px bg-brand-gradient opacity-70" />
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Gesto detetado
        </h2>
        <div className="flex min-h-[4rem] items-center">
          {gesture ? (
            <span className="animate-fade-in bg-gradient-to-br from-white to-slate-300 bg-clip-text text-4xl font-extrabold leading-tight tracking-tight text-transparent">
              {gesture.label}
            </span>
          ) : (
            <span className="text-lg text-slate-500">
              {handsDetected === 0 ? '👋 Mostre as mãos à câmara…' : 'A interpretar…'}
            </span>
          )}
        </div>
        {gesture && (
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-brand-gradient transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-10 text-right text-xs font-semibold text-slate-300">{pct}%</span>
          </div>
        )}
      </section>

      {/* Expressão facial */}
      <section className="glass p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Expressão facial
        </h2>
        <div className="flex flex-wrap gap-2">
          {grammatical ? (
            <StatusBadge label={GRAMMATICAL_LABELS[grammatical] ?? grammatical} tone="brand" />
          ) : (
            <StatusBadge label="Sem marcador gramatical" tone="neutral" />
          )}
          {emotion && <StatusBadge label={EMOTION_LABELS[emotion] ?? emotion} tone="good" />}
        </div>
      </section>

      {/* Síntese de voz */}
      <button
        type="button"
        onClick={onToggleSpeech}
        className="glass flex items-center justify-between p-5 text-left transition hover:bg-white/[0.07]"
      >
        <span className="flex items-center gap-3 text-sm font-medium text-slate-200">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-accent-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z" />{speechOn && <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />}</svg>
          Ler traduções em voz alta
        </span>
        <span
          className={`relative h-6 w-11 rounded-full transition ${speechOn ? 'bg-accent-500' : 'bg-white/15'}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${speechOn ? 'left-[1.375rem]' : 'left-0.5'}`}
          />
        </span>
      </button>

      {/* Histórico */}
      <section className="glass flex min-h-0 flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Histórico</h2>
          {history.length > 0 && (
            <span className="text-xs text-slate-500">{history.length}</span>
          )}
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-slate-500">As traduções confirmadas aparecem aqui.</p>
        ) : (
          <ul className="flex-1 space-y-1.5 overflow-y-auto pr-1">
            {history.map((h) => (
              <li
                key={h.key}
                className="flex animate-fade-in items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2.5 text-sm ring-1 ring-white/5"
              >
                <span className="font-medium text-white">{h.text}</span>
                <span className="text-xs tabular-nums text-slate-500">{h.time}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  )
}
