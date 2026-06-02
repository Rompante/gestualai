import StatusBadge from './StatusBadge.jsx'

/** Barra de controlo: iniciar/parar e indicadores de estado (FPS, modelo, mãos). */
export default function ControlBar({ status, live, usingModel, mode, onModeChange, onStart, onStop }) {
  const running = status === 'running'
  return (
    <div className="flex flex-wrap items-center gap-3">
      {running ? (
        <button
          onClick={onStop}
          className="rounded-xl bg-red-500/90 px-5 py-2.5 font-semibold text-white transition hover:bg-red-500"
        >
          Parar câmara
        </button>
      ) : (
        <button
          onClick={onStart}
          disabled={status === 'loading'}
          className="rounded-xl bg-brand-500 px-5 py-2.5 font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {status === 'loading' ? 'A carregar modelos…' : 'Iniciar câmara'}
        </button>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <span>Modo:</span>
          <select
            value={mode}
            onChange={(event) => onModeChange?.(event.target.value)}
            className="rounded-lg border border-white/10 bg-slate-950/80 px-2 py-1 text-xs text-slate-100"
          >
            <option value="gestures">Gestos</option>
            <option value="alphabet">Alfabeto</option>
          </select>
        </label>
        <StatusBadge label={`${live.fps} FPS`} tone={live.fps >= 15 ? 'good' : 'warn'} />
        <StatusBadge
          label={`Mãos: ${live.handsDetected}`}
          tone={live.handsDetected > 0 ? 'good' : 'neutral'}
        />
        <StatusBadge
          label={usingModel ? (mode === 'alphabet' ? 'Modelo Alfabeto' : 'Modelo LGP') : 'Heurística (demo)'}
          tone={usingModel ? 'brand' : 'warn'}
        />
      </div>
    </div>
  )
}
