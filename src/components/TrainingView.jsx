import { useRef } from 'react'
import { GESTURE_LABELS, CATEGORY_LABELS } from '../ml/labels.js'

/**
 * Modo de treino: grava amostras de cada gesto, mostra o dataset e treina o
 * modelo. A pré-visualização da câmara (com marcos) é a mesma do modo de
 * tradução — partilha o CameraView via os refs do hook.
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

  return (
    <aside className="flex h-full flex-col gap-4">
      {/* Gravação */}
      <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Gravar amostras
        </h2>

        <label className="mb-2 block text-sm text-slate-300">Gesto a gravar</label>
        <select
          value={selectedGestureId}
          onChange={(e) => onSelectGesture(e.target.value)}
          className="mb-3 w-full rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-brand-500"
        >
          {GESTURE_LABELS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label} ({CATEGORY_LABELS[g.category]}) — {counts[g.id] || 0}
            </option>
          ))}
        </select>

        <button
          onClick={onToggleRecording}
          disabled={!handDetected && !recording}
          className={`w-full rounded-xl px-4 py-2.5 font-semibold text-white transition disabled:opacity-50 ${
            recording ? 'bg-red-500 hover:bg-red-600' : 'bg-accent-500 hover:brightness-110'
          }`}
        >
          {recording ? `⏺ A gravar… (${selectedCount})` : 'Gravar amostras'}
        </button>
        <p className="mt-2 text-xs text-slate-500">
          {handDetected
            ? 'Faça o gesto e mantenha-o enquanto grava. Recomendado: 50–100 amostras por gesto, com variações.'
            : 'Aguardando deteção da mão para poder gravar…'}
        </p>
      </section>

      {/* Dataset */}
      <section className="flex min-h-0 flex-1 flex-col rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Dataset
          </h2>
          <span className="text-xs text-slate-400">{totalSamples} amostras</span>
        </div>
        <ul className="flex-1 space-y-1 overflow-y-auto pr-1 text-sm">
          {GESTURE_LABELS.filter((g) => counts[g.id] > 0).map((g) => (
            <li key={g.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5">
              <span className="text-white">{g.label}</span>
              <span className="text-xs text-slate-400">{counts[g.id]}</span>
            </li>
          ))}
          {totalSamples === 0 && (
            <li className="text-slate-500">Ainda sem amostras. Grave alguns gestos acima.</li>
          )}
        </ul>

        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={onExportDataset} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/20">
            Exportar dataset
          </button>
          <button onClick={() => fileRef.current?.click()} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/20">
            Importar
          </button>
          <button onClick={onClear} className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/30">
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
      <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Treinar modelo
        </h2>
        <button
          onClick={onTrain}
          disabled={trainingBusy}
          className="w-full rounded-xl bg-brand-500 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {trainingBusy ? 'A treinar…' : 'Treinar com o dataset'}
        </button>

        {training.status === 'training' && (
          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-accent-500 transition-all"
                style={{ width: `${Math.round((training.progress || 0) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Época {training.epoch || 0}/{training.totalEpochs || 50}
              {training.acc != null && ` · precisão ${Math.round(training.acc * 100)}%`}
            </p>
          </div>
        )}

        {training.status === 'done' && (
          <div className="mt-3 rounded-lg bg-accent-500/15 px-3 py-2 text-sm text-accent-500">
            ✓ Modelo treinado e ativo
            {training.accuracy != null && ` (precisão ${Math.round(training.accuracy * 100)}%)`}.
            Volte a <strong>Traduzir</strong> para o usar.
            <button onClick={onExportModel} className="mt-2 block text-xs text-slate-300 underline">
              Exportar modelo (ficheiros)
            </button>
          </div>
        )}

        {training.status === 'error' && (
          <p className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">
            {training.error}
          </p>
        )}
      </section>
    </aside>
  )
}
