import { useCallback, useEffect, useRef, useState } from 'react'
import { createHandLandmarker, createFaceLandmarker } from '../vision/landmarker.js'
import { clearCanvas, drawHands, drawFaces } from '../vision/drawing.js'
import { loadGestureModel, reloadGestureModel, classify } from '../ml/gestureClassifier.js'
import { normalizeHandLandmarks } from '../ml/featureExtraction.js'
import { interpretExpression } from '../vision/faceExpressions.js'

/**
 * Hook central de reconhecimento. Liga vídeo → MediaPipe → classificador →
 * desenho no canvas, e produz um gesto "confirmado" estável.
 *
 * Um gesto só é confirmado quando é detetado de forma consistente durante
 * `confirmFrames` frames consecutivos acima de `minConfidence`, evitando
 * disparos por leituras momentâneas (debounce temporal).
 *
 * @param {{ confirmFrames?: number, minConfidence?: number,
 *           onConfirm?: (g) => void }} [options]
 */
export function useGestureRecognition(options = {}) {
  const { confirmFrames = 8, minConfidence = 0.5, onConfirm, onFeatures } = options

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const handLandmarkerRef = useRef(null)
  const faceLandmarkerRef = useRef(null)
  const rafRef = useRef(0)
  const lastVideoTimeRef = useRef(-1)

  // Debounce temporal do gesto candidato.
  const candidateRef = useRef({ id: null, count: 0 })
  const confirmedIdRef = useRef(null)

  // FPS.
  const fpsRef = useRef({ frames: 0, last: performance.now() })

  const [status, setStatus] = useState('idle') // idle | loading | running | error
  const [error, setError] = useState(null)
  const [usingModel, setUsingModel] = useState(false)
  const [live, setLive] = useState({
    gesture: null,
    confidence: 0,
    source: 'heuristic',
    handsDetected: 0,
    expression: { grammatical: null, emotion: null },
    fps: 0,
  })

  // Mantemos os callbacks mais recentes sem reiniciar o loop.
  const onConfirmRef = useRef(onConfirm)
  const onFeaturesRef = useRef(onFeatures)
  useEffect(() => {
    onConfirmRef.current = onConfirm
    onFeaturesRef.current = onFeatures
  }, [onConfirm, onFeatures])

  const tick = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const hand = handLandmarkerRef.current
    if (!video || !canvas || !hand || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(tick)
      return
    }

    // Alinhar canvas com as dimensões reais do vídeo.
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }
    const ctx = canvas.getContext('2d')

    const now = performance.now()
    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime

      const handResult = hand.detectForVideo(video, now)
      const face = faceLandmarkerRef.current
      const faceResult = face ? face.detectForVideo(video, now) : null

      clearCanvas(ctx)
      if (faceResult?.faceLandmarks?.length) drawFaces(ctx, faceResult.faceLandmarks)
      if (handResult?.landmarks?.length) drawHands(ctx, handResult.landmarks)

      // Classificação a partir da primeira mão detetada.
      let gesture = null
      let confidence = 0
      let source = 'heuristic'
      if (handResult?.landmarks?.length) {
        const out = classify(handResult.landmarks[0])
        gesture = out.gesture
        confidence = out.confidence
        source = out.source

        // Emite o vetor de características normalizado (usado no modo de treino).
        if (onFeaturesRef.current) {
          const feats = normalizeHandLandmarks(handResult.landmarks[0])
          if (feats) onFeaturesRef.current(feats)
        }
      }

      // Expressão facial.
      let expression = { grammatical: null, emotion: null }
      if (faceResult?.faceBlendshapes?.length) {
        const interp = interpretExpression(faceResult.faceBlendshapes[0].categories)
        expression = { grammatical: interp.grammatical, emotion: interp.emotion }
      }

      // Debounce + confirmação.
      const candidateId = gesture && confidence >= minConfidence ? gesture.id : null
      const c = candidateRef.current
      if (candidateId && candidateId === c.id) {
        c.count += 1
      } else {
        c.id = candidateId
        c.count = candidateId ? 1 : 0
      }
      if (
        candidateId &&
        c.count >= confirmFrames &&
        confirmedIdRef.current !== candidateId
      ) {
        confirmedIdRef.current = candidateId
        onConfirmRef.current?.({ gesture, confidence, source, expression })
      }
      if (!candidateId) confirmedIdRef.current = null

      // FPS (média por segundo).
      const f = fpsRef.current
      f.frames += 1
      let fps = live.fps
      if (now - f.last >= 1000) {
        fps = Math.round((f.frames * 1000) / (now - f.last))
        f.frames = 0
        f.last = now
      }

      setLive({
        gesture,
        confidence,
        source,
        handsDetected: handResult?.landmarks?.length ?? 0,
        expression,
        fps,
      })
    }

    rafRef.current = requestAnimationFrame(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmFrames, minConfidence])

  const start = useCallback(async () => {
    if (status === 'loading' || status === 'running') return
    setStatus('loading')
    setError(null)
    try {
      const [hand, face] = await Promise.all([
        createHandLandmarker(),
        createFaceLandmarker(),
      ])
      handLandmarkerRef.current = hand
      faceLandmarkerRef.current = face
      const model = await loadGestureModel()
      setUsingModel(Boolean(model))
      setStatus('running')
      rafRef.current = requestAnimationFrame(tick)
    } catch (err) {
      console.error('[GestualAI] Erro ao iniciar reconhecimento:', err)
      setError(err.message || 'Falha ao inicializar os modelos de visão.')
      setStatus('error')
    }
  }, [status, tick])

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    setStatus('idle')
  }, [])

  // Recarrega o modelo (ex.: depois de treinar um modelo novo no browser).
  const refreshModel = useCallback(async () => {
    const m = await reloadGestureModel()
    setUsingModel(Boolean(m))
    return Boolean(m)
  }, [])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      handLandmarkerRef.current?.close?.()
      faceLandmarkerRef.current?.close?.()
    }
  }, [])

  return { videoRef, canvasRef, status, error, usingModel, live, start, stop, refreshModel }
}
