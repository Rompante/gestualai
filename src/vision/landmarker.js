/**
 * Inicialização dos modelos de visão do MediaPipe Tasks (tasks-vision).
 *
 * - HandLandmarker — 21 marcos por mão (até 2 mãos).
 * - FaceLandmarker — 478 marcos faciais + blendshapes (expressões), usados
 *   como marcadores gramaticais/emocionais (Fase 2).
 *
 * Os ficheiros do modelo e o runtime WASM são carregados a partir da CDN do
 * Google. Todo o processamento ocorre localmente no browser — nenhuma imagem
 * sai do dispositivo (ver Considerações Éticas no README).
 */
import {
  FilesetResolver,
  HandLandmarker,
  FaceLandmarker,
  GestureRecognizer,
} from '@mediapipe/tasks-vision'

const WASM_PATH =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'

const HAND_MODEL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

const FACE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

const GESTURE_RECOGNIZER_MODEL =
  'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task'

let visionFileset = null

async function getFileset() {
  if (!visionFileset) {
    visionFileset = await FilesetResolver.forVisionTasks(WASM_PATH)
  }
  return visionFileset
}

/** Cria um HandLandmarker em modo VIDEO (vídeo em tempo real). */
export async function createHandLandmarker() {
  const fileset = await getFileset()
  return HandLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: HAND_MODEL, delegate: 'GPU' },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })
}

/** Cria um FaceLandmarker com saída de blendshapes (expressões faciais). */
export async function createFaceLandmarker() {
  const fileset = await getFileset()
  return FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: FACE_MODEL, delegate: 'GPU' },
    runningMode: 'VIDEO',
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: false,
  })
}

export async function createGestureRecognizer() {
  const fileset = await getFileset()
  return GestureRecognizer.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: GESTURE_RECOGNIZER_MODEL, delegate: 'GPU' },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    cannedGesturesClassifierOptions: {
      scoreThreshold: 0.5,
    },
  })
}
