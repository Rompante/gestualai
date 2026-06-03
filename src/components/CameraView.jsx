import { useEffect, useRef } from 'react'
import Webcam from 'react-webcam'

/**
 * Vista da câmara com canvas de marcos sobreposto.
 * Recebe os refs do hook de reconhecimento (videoRef, canvasRef) e mantém-nos
 * sincronizados com o elemento <video> interno do react-webcam.
 */
export default function CameraView({ videoRef, canvasRef, mirrored = true, onCameraError }) {
  const webcamRef = useRef(null)

  // Expõe o elemento <video> interno ao hook de reconhecimento.
  useEffect(() => {
    const id = setInterval(() => {
      if (webcamRef.current?.video) {
        videoRef.current = webcamRef.current.video
        clearInterval(id)
      }
    }, 100)
    return () => clearInterval(id)
  }, [videoRef])

  // Contexto inseguro (sem HTTPS nem localhost) → getUserMedia indisponível.
  useEffect(() => {
    if (typeof navigator !== 'undefined' && !navigator.mediaDevices?.getUserMedia) {
      onCameraError?.(
        'A câmara requer HTTPS ou localhost. Aceda por https:// ou http://localhost:5173.',
      )
    }
  }, [onCameraError])

  function handleUserMediaError(err) {
    const name = err?.name || ''
    const msg =
      name === 'NotAllowedError'
        ? 'Acesso à câmara negado. Autorize a câmara nas permissões do navegador.'
        : name === 'NotFoundError'
          ? 'Nenhuma câmara encontrada neste dispositivo.'
          : `Não foi possível aceder à câmara (${name || err?.message || 'erro desconhecido'}).`
    onCameraError?.(msg)
  }

  return (
    <div className="group relative aspect-video w-full overflow-hidden rounded-3xl bg-ink-900 shadow-card ring-1 ring-white/10">
      <Webcam
        ref={webcamRef}
        audio={false}
        mirrored={mirrored}
        videoConstraints={{ facingMode: 'user', width: 1280, height: 720 }}
        onUserMediaError={handleUserMediaError}
        className="h-full w-full object-cover"
      />
      <canvas
        ref={canvasRef}
        className={`pointer-events-none absolute inset-0 h-full w-full ${mirrored ? 'mirror' : ''}`}
      />
      {/* Vinheta subtil para destacar a sobreposição de marcos. */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10 [box-shadow:inset_0_0_60px_-20px_rgba(0,0,0,0.9)]" />
    </div>
  )
}
