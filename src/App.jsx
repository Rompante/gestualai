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

      {/* Separadores de modo */}
      <div className="flex gap-1 rounded-xl bg-white/5 p-1 text-sm font-medium ring-1 ring-white/10 sm:w-fit">
        {[
          ['translate', 'Traduzir'],
          ['train', 'Treinar'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`rounded-lg px-4 py-1.5 transition ${
              mode === key ? 'bg-brand-500 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {(error || cameraError) && (
        <div className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200 ring-1 ring-red-500/30">
          {cameraError || error}{' '}
          {error && !cameraError && 'Verifique a ligação à Internet (modelos MediaPipe via CDN).'}
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
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

      <footer className="border-t border-white/10 pt-4 text-xs text-slate-500">
        <strong className="text-slate-400">Aviso:</strong> ferramenta de apoio à comunicação
        informal. Não substitui intérpretes de LGP em contextos formais ou críticos. Nenhum vídeo é
        enviado para a nuvem — todo o processamento ocorre no seu dispositivo.
      </footer>
    </div>
  )
}
