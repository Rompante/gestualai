import StatusBadge from './StatusBadge.jsx'

/** Barra de controlo: iniciar/parar e indicadores de estado (FPS, modelo, mãos). */
export default function ControlBar({ status, live, usingModel, onStart, onStop }) {
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
        <StatusBadge label={`${live.fps} FPS`} tone={live.fps >= 15 ? 'good' : 'warn'} />
        <StatusBadge
          label={`Mãos: ${live.handsDetected}`}
          tone={live.handsDetected > 0 ? 'good' : 'neutral'}
        />
        <StatusBadge
          label={usingModel ? 'Modelo LGP' : 'Heurística (demo)'}
          tone={usingModel ? 'brand' : 'warn'}
        />
      </div>
    </div>
  )
}
