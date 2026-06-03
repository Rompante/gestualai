import { useCallback, useEffect, useRef, useState } from 'react'
import CameraView from './components/CameraView.jsx'
import TranslationPanel from './components/TranslationPanel.jsx'
import TrainingView from './components/TrainingView.jsx'
import ControlBar from './components/ControlBar.jsx'
import AuthBar from './components/AuthBar.jsx'
import { useGestureRecognition } from './hooks/useGestureRecognition.js'
import { useAuth } from './context/AuthContext.jsx'
import { speak } from './speech/speechSynthesis.js'
import { saveTranslation, fetchRecentTranslations } from './services/historyService.js'
import { GESTURE_LABELS } from './ml/labels.js'
import * as dataset from './ml/datasetStore.js'
import { trainModel, downloadTrainedModel } from './ml/trainModel.js'

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

function download(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const [mode, setMode] = useState('translate') // 'translate' | 'train'
  const [history, setHistory] = useState([])
  const [speechOn, setSpeechOn] = useState(true)
  const [cameraError, setCameraError] = useState(null)
  const { isAuthenticated } = useAuth()

  // Estado do modo de treino.
  const [selectedGestureId, setSelectedGestureId] = useState(GESTURE_LABELS[0].id)
  const [recording, setRecording] = useState(false)
  const [counts, setCounts] = useState(dataset.counts())
  const [totalSamples, setTotalSamples] = useState(dataset.totalSamples())
  const [training, setTraining] = useState({ status: 'idle' })

  // Refs lidos dentro do loop de reconhecimento (sem recriar callbacks).
  const modeRef = useRef(mode)
  const recordingRef = useRef(recording)
  const selectedRef = useRef(selectedGestureId)
  const lastCountUpdate = useRef(0)
  useEffect(() => {
    modeRef.current = mode
  }, [mode])
  useEffect(() => {
    recordingRef.current = recording
  }, [recording])
  useEffect(() => {
    selectedRef.current = selectedGestureId
  }, [selectedGestureId])

  // Ao autenticar, carrega o histórico persistido e funde-o com as traduções
  // feitas nesta sessão antes do login (chaves locais contêm '-').
  useEffect(() => {
    if (!isAuthenticated) return
    let active = true
    fetchRecentTranslations(50).then((rows) => {
      if (!active) return
      const serverItems = rows.map(toHistoryItem)
      setHistory((prev) => {
        const localOnly = prev.filter((p) => p.key.includes('-'))
        return [...localOnly, ...serverItems].slice(0, 50)
      })
    })
    return () => {
      active = false
    }
  }, [isAuthenticated])

  const handleConfirm = useCallback(
    ({ gesture, confidence, source, expression }) => {
      if (modeRef.current !== 'translate' || !gesture) return

      const text = expression?.grammatical === 'interrogativa' ? `${gesture.label}?` : gesture.label

      setHistory((prev) =>
        [
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
        ].slice(0, 50),
      )

      if (speechOn) speak(text)
      saveTranslation({ gestureId: gesture.id, text, confidence, source })
    },
    [speechOn],
  )

  // Captura de amostras no modo de treino.
  const handleFeatures = useCallback((features) => {
    if (modeRef.current !== 'train' || !recordingRef.current) return
    dataset.addSample(selectedRef.current, features)
    // Atualiza contagens e persiste com throttle (~5x/s) — evita re-render por
    // frame e garante que os dados não se perdem se a gravação não for parada.
    const now = performance.now()
    if (now - lastCountUpdate.current > 200) {
      lastCountUpdate.current = now
      dataset.commit()
      setCounts(dataset.counts())
      setTotalSamples(dataset.totalSamples())
    }
  }, [])

  const { videoRef, canvasRef, status, error, usingModel, live, start, stop, refreshModel } =
    useGestureRecognition({
      confirmFrames: 8,
      minConfidence: 0.5,
      onConfirm: handleConfirm,
      onFeatures: handleFeatures,
    })

  const toggleRecording = useCallback(() => {
    setRecording((on) => {
      if (on) {
        // Ao parar, persiste o dataset e sincroniza contagens.
        dataset.commit()
        setCounts(dataset.counts())
        setTotalSamples(dataset.totalSamples())
      }
      return !on
    })
  }, [])

  const handleTrain = useCallback(async () => {
    dataset.commit()
    const { xs, ys } = dataset.getTrainingData()
    if (xs.length < 20 || dataset.labelsWithData().length < 2) {
      setTraining({
        status: 'error',
        error:
          'Capture pelo menos 2 classes (idealmente «Neutro» + 1 gesto) e ~20 amostras no total antes de treinar.',
      })
      return
    }
    const totalEpochs = 50
    setTraining({ status: 'training', progress: 0, totalEpochs })
    try {
      const { accuracy } = await trainModel(
        { xs, ys },
        {
          epochs: totalEpochs,
          onEpoch: (epoch, total, logs) =>
            setTraining({
              status: 'training',
              epoch,
              progress: epoch / total,
              totalEpochs: total,
              acc: logs.acc ?? logs.accuracy,
            }),
        },
      )
      await refreshModel()
      setTraining({ status: 'done', accuracy })
    } catch (err) {
      setTraining({ status: 'error', error: err.message })
    }
  }, [refreshModel])

  const handleClear = useCallback(() => {
    if (!confirm('Apagar todas as amostras gravadas?')) return
    dataset.clearDataset()
    setCounts(dataset.counts())
    setTotalSamples(0)
  }, [])

  const handleImport = useCallback(async (file) => {
    try {
      dataset.importDataset(await file.text())
      setCounts(dataset.counts())
      setTotalSamples(dataset.totalSamples())
    } catch {
      alert('Ficheiro de dataset inválido.')
    }
  }, [])

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 11V6a1.5 1.5 0 0 1 3 0v4M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10.5V6a1.5 1.5 0 0 1 3 0v6.5" />
              <path d="M16 9.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-1.5a5 5 0 0 1-4-2l-3-4a1.6 1.6 0 0 1 2.5-2L7 12" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Gestual<span className="bg-brand-gradient bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="text-sm text-slate-400">
              Língua Gestual Portuguesa — traduzida localmente, em privado.
            </p>
          </div>
        </div>
        <AuthBar />
      </header>

      {/* Separadores de modo (segmented control) */}
      <div className="flex w-full gap-1 rounded-2xl bg-white/[0.04] p-1.5 text-sm font-semibold ring-1 ring-white/10 sm:w-fit">
        {[
          ['translate', 'Traduzir'],
          ['train', 'Treinar'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2 transition sm:flex-none ${
              mode === key
                ? 'bg-brand-gradient text-white shadow-glow'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={label === 'Treinar' ? 'M12 3v3m0 12v3m9-9h-3M6 12H3m13.5-6.5L14 8M8 16l-2.5 2.5' : 'M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2M7 20h10M9 4v16'} /></svg>
            {label}
          </button>
        ))}
      </div>

      {(error || cameraError) && (
        <div className="flex animate-fade-in items-start gap-3 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200 ring-1 ring-red-500/30">
          <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-red-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 8v5M12 16h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
          <span>
            {cameraError || error}{' '}
            {error && !cameraError && 'Verifique a ligação à Internet (modelos MediaPipe via CDN).'}
          </span>
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div className="flex flex-col gap-4">
          <CameraView videoRef={videoRef} canvasRef={canvasRef} onCameraError={setCameraError} />
          <ControlBar
            status={status}
            live={live}
            usingModel={usingModel}
            onStart={start}
            onStop={stop}
          />
        </div>

        {mode === 'translate' ? (
          <TranslationPanel
            live={live}
            history={history}
            speechOn={speechOn}
            onToggleSpeech={() => setSpeechOn((v) => !v)}
          />
        ) : (
          <TrainingView
            live={live}
            counts={counts}
            totalSamples={totalSamples}
            selectedGestureId={selectedGestureId}
            onSelectGesture={setSelectedGestureId}
            recording={recording}
            onToggleRecording={toggleRecording}
            training={training}
            onTrain={handleTrain}
            onExportDataset={() => download('gestualai-dataset.json', dataset.exportDataset())}
            onImportDataset={handleImport}
            onExportModel={downloadTrainedModel}
            onClear={handleClear}
          />
        )}
      </div>

      <footer className="flex items-start gap-2.5 border-t border-white/10 pt-4 text-xs text-slate-500">
        <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-accent-500/80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5l-8-3Z" /></svg>
        <span>
          <strong className="text-slate-400">Privado e informal.</strong> Nenhum vídeo sai do
          dispositivo. Ferramenta de apoio à comunicação — não substitui intérpretes de LGP em
          contextos formais ou críticos.
        </span>
      </footer>
    </div>
  )
}
