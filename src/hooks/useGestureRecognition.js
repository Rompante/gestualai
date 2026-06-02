import { useCallback, useEffect, useRef, useState } from 'react'
import { createHandLandmarker, createFaceLandmarker, createGestureRecognizer } from '../vision/landmarker.js'
import { clearCanvas, drawHands, drawFaces } from '../vision/drawing.js'
import { loadGestureModel, classify } from '../ml/gestureClassifier.js'
import { loadAlphabetModel, classifyAlphabet } from '../ml/alphabetClassifier.js'
import { gestureById } from '../ml/labels.js'
import { interpretExpression } from '../vision/faceExpressions.js'

const CANONICAL_MP_GESTURES = {
  Open_Palm: 'ola',
  Closed_Fist: 'nao',
  Pointing_Up: 'esperar',
  Thumb_Up: 'bem',
  Thumb_Down: 'mal',
  Victory: 'talvez',
  ILoveYou: 'ajuda',
}

function mapMediaPipeGesture(categoryName, score) {
  const id = CANONICAL_MP_GESTURES[categoryName]
  if (!id) return null
  return { id, confidence: score, source: 'mediapipe' }
}

function getGestureFromRecognizerResult(result) {
  const handGestures = result?.gestures?.[0]
  if (!handGestures?.length) return null
  let best = handGestures[0]
  for (const gesture of handGestures) {
    if (gesture.score > best.score) best = gesture
  }
  return mapMediaPipeGesture(best.categoryName, best.score)
}

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
  const {
    confirmFrames = 8,
    minConfidence = 0.5,
    onConfirm,
    mode = 'gestures',
  } = options

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const handLandmarkerRef = useRef(null)
  const faceLandmarkerRef = useRef(null)
  const gestureRecognizerRef = useRef(null)
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

  // Mantemos o callback mais recente sem reiniciar o loop.
  const onConfirmRef = useRef(onConfirm)
  useEffect(() => {
    onConfirmRef.current = onConfirm
  }, [onConfirm])

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
      const recognizer = gestureRecognizerRef.current
      const recognizerResult = recognizer ? recognizer.recognizeForVideo(video, now) : null
      const face = faceLandmarkerRef.current
      const faceResult = face ? face.detectForVideo(video, now) : null

      clearCanvas(ctx)
      if (faceResult?.faceLandmarks?.length) drawFaces(ctx, faceResult.faceLandmarks)
      if (handResult?.landmarks?.length) drawHands(ctx, handResult.landmarks)

      // Tenta detecção de gestos ou de letras, consoante o modo.
      let gesture = null
      let confidence = 0
      let source = 'heuristic'
      if (mode === 'alphabet') {
        if (handResult?.landmarks?.length) {
          const out = classifyAlphabet(handResult.landmarks[0])
          gesture = out.gesture
          confidence = out.confidence
          source = out.source
        }
      } else {
        const mpGesture = getGestureFromRecognizerResult(recognizerResult)
        if (mpGesture) {
          gesture = gestureById(mpGesture.id)
          confidence = mpGesture.confidence
          source = 'mediapipe'
        } else if (handResult?.landmarks?.length) {
          const out = classify(handResult.landmarks[0])
          gesture = out.gesture
          confidence = out.confidence
          source = out.source
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
  }, [confirmFrames, minConfidence, mode])

  const start = useCallback(async () => {
    if (status === 'loading' || status === 'running') return
    setStatus('loading')
    setError(null)
    try {
      const [hand, face, recognizer] = await Promise.all([
        createHandLandmarker(),
        createFaceLandmarker(),
        createGestureRecognizer().catch((err) => {
          console.warn('[GestualAI] GestureRecognizer fallback indisponível:', err)
          return null
        }),
      ])
      handLandmarkerRef.current = hand
      faceLandmarkerRef.current = face
      gestureRecognizerRef.current = recognizer
      const gestureModel = await loadGestureModel()
      const alphabetModel = await loadAlphabetModel()
      setUsingModel(Boolean(mode === 'alphabet' ? alphabetModel : gestureModel))
      setStatus('running')
      rafRef.current = requestAnimationFrame(tick)
    } catch (err) {
      console.error('[GestualAI] Erro ao iniciar reconhecimento:', err)
      setError(err.message || 'Falha ao inicializar os modelos de visão.')
      setStatus('error')
    }
  }, [tick, mode])

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    handLandmarkerRef.current?.close?.()
    faceLandmarkerRef.current?.close?.()
    gestureRecognizerRef.current?.close?.()
    handLandmarkerRef.current = null
    faceLandmarkerRef.current = null
    gestureRecognizerRef.current = null
    setStatus('idle')
  }, [])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      handLandmarkerRef.current?.close?.()
      faceLandmarkerRef.current?.close?.()
      gestureRecognizerRef.current?.close?.()
    }
  }, [])

  return { videoRef, canvasRef, status, error, usingModel, live, start, stop }
}
