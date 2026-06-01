import { useCallback, useEffect, useState } from 'react'
import CameraView from './components/CameraView.jsx'
import TranslationPanel from './components/TranslationPanel.jsx'
import ControlBar from './components/ControlBar.jsx'
import AuthBar from './components/AuthBar.jsx'
import { useGestureRecognition } from './hooks/useGestureRecognition.js'
import { useAuth } from './context/AuthContext.jsx'
import { speak } from './speech/speechSynthesis.js'
import { saveTranslation, fetchRecentTranslations } from './services/historyService.js'

function toHistoryItem(row) {
  return {
    key: String(row.id),
    text: row.text,
    time: new Date(row.created_at).toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  }
}

export default function App() {
  const [history, setHistory] = useState([])
  const [speechOn, setSpeechOn] = useState(true)
  const { isAuthenticated } = useAuth()

  // Ao autenticar, carrega o histórico persistido do utilizador.
  useEffect(() => {
    if (!isAuthenticated) return
    let active = true
    fetchRecentTranslations(50).then((rows) => {
      if (active && rows.length) setHistory(rows.map(toHistoryItem))
    })
    return () => {
      active = false
    }
  }, [isAuthenticated])

  const handleConfirm = useCallback(
    ({ gesture, confidence, source, expression }) => {
      if (!gesture) return

      // Sufixo gramatical: marcador interrogativo → ponto de interrogação.
      const text = expression?.grammatical === 'interrogativa' ? `${gesture.label}?` : gesture.label

      setHistory((prev) => [
        {
          key: `${Date.now()}-${gesture.id}`,
          text,
          time: new Date().toLocaleTimeString('pt-PT', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        },
        ...prev,
      ].slice(0, 50))

      if (speechOn) speak(text)

      // Persistência via API (apenas se autenticado; falha silenciosa caso contrário).
      saveTranslation({ gestureId: gesture.id, text, confidence, source })
    },
    [speechOn],
  )

  const { videoRef, canvasRef, status, error, usingModel, live, start, stop } =
    useGestureRecognition({ confirmFrames: 8, minConfidence: 0.5, onConfirm: handleConfirm })

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Gestual<span className="text-accent-500">AI</span>
          </h1>
          <p className="text-sm text-slate-400">
            Tradução de Língua Gestual Portuguesa — processada localmente no seu dispositivo.
          </p>
        </div>
        <AuthBar />
      </header>

      {error && (
        <div className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200 ring-1 ring-red-500/30">
          {error} Verifique as permissões da câmara e a ligação à Internet (modelos via CDN).
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <CameraView videoRef={videoRef} canvasRef={canvasRef} />
          <ControlBar
            status={status}
            live={live}
            usingModel={usingModel}
            onStart={start}
            onStop={stop}
          />
        </div>
        <TranslationPanel
          live={live}
          history={history}
          speechOn={speechOn}
          onToggleSpeech={() => setSpeechOn((v) => !v)}
        />
      </div>

      <footer className="border-t border-white/10 pt-4 text-xs text-slate-500">
        <strong className="text-slate-400">Aviso:</strong> ferramenta de apoio à comunicação
        informal. Não substitui intérpretes de LGP em contextos formais ou críticos. Nenhum vídeo é
        enviado para a nuvem — todo o processamento ocorre no seu dispositivo.
      </footer>
    </div>
  )
}
