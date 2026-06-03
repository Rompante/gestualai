import StatusBadge from './StatusBadge.jsx'

/** Barra de controlo: iniciar/parar e indicadores de estado (FPS, modelo, mãos). */
export default function ControlBar({ status, live, usingModel, onStart, onStop }) {
  const running = status === 'running'
  const loading = status === 'loading'

  return (
    <div className="glass flex flex-wrap items-center gap-3 p-3">
      {running ? (
        <button
          onClick={onStop}
          className="inline-flex items-center gap-2 rounded-xl bg-red-500/90 px-5 py-2.5 font-semibold text-white shadow-lg transition hover:bg-red-500 active:scale-[0.98]"
        >
          <span className="h-2.5 w-2.5 rounded-sm bg-white" />
          Parar câmara
        </button>
      ) : (
        <button
          onClick={onStart}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 font-semibold text-white shadow-glow transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z" />
              </svg>
              A carregar modelos…
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              Iniciar câmara
            </>
          )}
        </button>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <StatusBadge label={`${live.fps} FPS`} tone={live.fps >= 15 ? 'good' : running ? 'warn' : 'neutral'} />
        <StatusBadge
          label={`${live.handsDetected} ${live.handsDetected === 1 ? 'mão' : 'mãos'}`}
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
