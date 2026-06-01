/**
 * Utilitários de desenho dos marcos sobre um canvas 2D, sobreposto ao vídeo.
 * Coordenadas dos marcos são normalizadas [0,1]; multiplicamos pela dimensão
 * do canvas. O canvas é espelhado via CSS em conjunto com o vídeo (modo selfie).
 */

// Conexões entre marcos da mão (esqueleto), segundo o modelo do MediaPipe.
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // polegar
  [0, 5], [5, 6], [6, 7], [7, 8], // indicador
  [5, 9], [9, 10], [10, 11], [11, 12], // médio
  [9, 13], [13, 14], [14, 15], [15, 16], // anelar
  [13, 17], [17, 18], [18, 19], [19, 20], // mindinho
  [0, 17], // base da palma
]

export function clearCanvas(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
}

/**
 * Desenha o esqueleto e os pontos de uma ou mais mãos.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<Array<{x,y}>>} hands - lista de mãos (cada uma com 21 marcos).
 */
export function drawHands(ctx, hands) {
  const { width, height } = ctx.canvas
  for (const landmarks of hands) {
    ctx.strokeStyle = '#13c6a5'
    ctx.lineWidth = 3
    for (const [a, b] of HAND_CONNECTIONS) {
      ctx.beginPath()
      ctx.moveTo(landmarks[a].x * width, landmarks[a].y * height)
      ctx.lineTo(landmarks[b].x * width, landmarks[b].y * height)
      ctx.stroke()
    }
    ctx.fillStyle = '#2b6cff'
    for (const p of landmarks) {
      ctx.beginPath()
      ctx.arc(p.x * width, p.y * height, 4, 0, 2 * Math.PI)
      ctx.fill()
    }
  }
}

/**
 * Desenha uma nuvem leve dos marcos faciais (sem ligações, por desempenho).
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<Array<{x,y}>>} faces
 */
export function drawFaces(ctx, faces) {
  const { width, height } = ctx.canvas
  ctx.fillStyle = 'rgba(230, 235, 245, 0.45)'
  for (const landmarks of faces) {
    for (const p of landmarks) {
      ctx.fillRect(p.x * width, p.y * height, 1.4, 1.4)
    }
  }
}
