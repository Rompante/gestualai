import { useRef } from 'react'
import { TRAINING_LABELS, CATEGORY_LABELS } from '../ml/labels.js'

/**
 * Modo de treino: grava amostras de cada gesto, mostra o dataset, dá uma
 * pré-visualização ao vivo do que o modelo prevê, e treina o modelo.
 */
export default function TrainingView({
  live,
  counts,
  totalSamples,
  selectedGestureId,
  onSelectGesture,
  recording,
  onToggleRecording,
  training,
  onTrain,
  onExportDataset,
  onImportDataset,
  onExportModel,
  onClear,
}) {
  const fileRef = useRef(null)
  const handDetected = live.handsDetected > 0
  const trainingBusy = training.status === 'training'
  const selectedCount = counts[selectedGestureId] || 0
  const pct = Math.round((live.confidence || 0) * 100)

  return (
    <aside className="flex h-full flex-col gap-4">
      {/* Pré-visualização ao vivo */}
      <section className="glass p-5">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Pré-visualização do modelo
        </h2>
        {live.source === 'model' ? (
          <>
            <div className="flex min-h-[2rem] items-center text-2xl font-bold text-white">
              {live.gesture ? live.gesture.label : <span className="text-base text-slate-500">— (neutro)</span>}
            </div>
            {live.gesture && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-brand-gradient transition-all" style={{ width: `${pct}%` }} />
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-500">
            Ainda sem modelo treinado. Grave amostras e treine para ver previsões aqui.
          </p>
        )}
      </section>

      {/* Gravação */}
      <section className="glass p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Gravar amostras
        </h2>

        <label className="mb-2 block text-sm text-slate-300">Classe a gravar</label>
        <select
          value={selectedGestureId}
          onChange={(e) => onSelectGesture(e.target.value)}
          className="mb-2 w-full rounded-xl bg-ink-900/70 px-3 py-2.5 text-sm text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-brand-500"
        >
          {TRAINING_LABELS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label} ({CATEGORY_LABELS[g.category]}) — {counts[g.id] || 0}
            </option>
          ))}
        </select>
        <p className="mb-3 text-xs text-slate-500">
          Grave também a classe <strong>«Neutro / sem gesto»</strong> (mão parada ou movimentos
          aleatórios) para a app saber quando <em>não</em> há gesto.
        </p>

        <button
          onClick={onToggleRecording}
          disabled={!handDetected && !recording}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white transition active:scale-[0.98] disabled:opacity-50 ${
            recording ? 'bg-red-500 hover:bg-red-600' : 'bg-accent-500 hover:bg-accent-600 shadow-glow-accent'
          }`}
        >
          <span className={`h-3 w-3 rounded-full bg-white ${recording ? 'animate-rec-pulse' : ''}`} />
          {recording ? `A gravar…  ${selectedCount} amostras` : 'Gravar amostras'}
        </button>
        <p className="mt-2 text-xs text-slate-500">
          {handDetected
            ? 'Mantenha o gesto enquanto grava. ~50–100 amostras por classe, com variações.'
            : 'Aguardando deteção da mão para poder gravar…'}
        </p>
      </section>

      {/* Dataset */}
      <section className="glass flex min-h-0 flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dataset</h2>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-400">
            {totalSamples} amostras
          </span>
        </div>
        <ul className="flex-1 space-y-1 overflow-y-auto pr-1 text-sm">
          {TRAINING_LABELS.filter((g) => counts[g.id] > 0).map((g) => (
            <li
              key={g.id}
              className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-1.5 ring-1 ring-white/5"
            >
              <span className="text-white">{g.label}</span>
              <span className="text-xs tabular-nums text-slate-400">{counts[g.id]}</span>
            </li>
          ))}
          {totalSamples === 0 && (
            <li className="text-slate-500">Ainda sem amostras. Grave algumas classes acima.</li>
          )}
        </ul>

        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={onExportDataset} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/20">
            Exportar
          </button>
          <button onClick={() => fileRef.current?.click()} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/20">
            Importar
          </button>
          <button onClick={onClear} className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs text-red-200 ring-1 ring-red-500/20 transition hover:bg-red-500/25">
            Limpar tudo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onImportDataset(f)
              e.target.value = ''
            }}
          />
        </div>
      </section>

      {/* Treino */}
      <section className="glass p-5">
        <button
          onClick={onTrain}
          disabled={trainingBusy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-3 font-semibold text-white shadow-glow transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {trainingBusy ? 'A treinar…' : 'Treinar com o dataset'}
        </button>

        {training.status === 'training' && (
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-brand-gradient transition-all"
                style={{ width: `${Math.round((training.progress || 0) * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Época {training.epoch || 0}/{training.totalEpochs || 50}
              {training.acc != null && ` · precisão ${Math.round(training.acc * 100)}%`}
            </p>
          </div>
        )}

        {training.status === 'done' && (
          <div className="mt-3 animate-fade-in rounded-xl bg-accent-500/12 px-3 py-2.5 text-sm text-accent-300 ring-1 ring-accent-500/25">
            ✓ Modelo treinado e ativo
            {training.accuracy != null && ` (precisão ${Math.round(training.accuracy * 100)}%)`}.
            Volte a <strong>Traduzir</strong> para o usar.
            <button onClick={onExportModel} className="mt-2 block text-xs text-slate-300 underline underline-offset-2 hover:text-white">
              Exportar modelo (ficheiros)
            </button>
          </div>
        )}

        {training.status === 'error' && (
          <p className="mt-3 rounded-xl bg-red-500/12 px-3 py-2.5 text-sm text-red-200 ring-1 ring-red-500/25">
            {training.error}
          </p>
        )}
      </section>
    </aside>
  )
}
