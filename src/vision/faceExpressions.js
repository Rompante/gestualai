/**
 * Interpretação de expressões faciais a partir dos blendshapes do FaceLandmarker.
 *
 * Na LGP, as expressões faciais têm função GRAMATICAL (ex.: sobrancelhas
 * levantadas em perguntas, distinção interrogativa) além de transmitirem
 * estado EMOCIONAL. Este módulo traduz os blendshapes do MediaPipe num pequeno
 * conjunto de marcadores interpretáveis. É uma base heurística (Fase 2) a
 * refinar com dados anotados.
 *
 * Os blendshapes vêm como [{ categoryName, score }, ...].
 */

function score(blendshapes, name) {
  const b = blendshapes.find((x) => x.categoryName === name)
  return b ? b.score : 0
}

/**
 * @param {Array<{categoryName:string, score:number}>} blendshapes
 * @returns {{ grammatical: string|null, emotion: string|null, raw: object }}
 */
export function interpretExpression(blendshapes) {
  if (!blendshapes || blendshapes.length === 0) {
    return { grammatical: null, emotion: null, raw: {} }
  }

  const browUp = (score(blendshapes, 'browInnerUp') +
    score(blendshapes, 'browOuterUpLeft') +
    score(blendshapes, 'browOuterUpRight')) / 3
  const browDown = (score(blendshapes, 'browDownLeft') + score(blendshapes, 'browDownRight')) / 2
  const smile = (score(blendshapes, 'mouthSmileLeft') + score(blendshapes, 'mouthSmileRight')) / 2
  const frown = (score(blendshapes, 'mouthFrownLeft') + score(blendshapes, 'mouthFrownRight')) / 2
  const mouthOpen = score(blendshapes, 'jawOpen')

  // Marcador gramatical (LGP): sobrancelhas levantadas ↔ pergunta;
  // sobrancelhas franzidas ↔ ênfase/interrogativa-wh.
  let grammatical = null
  if (browUp > 0.5) grammatical = 'interrogativa'
  else if (browDown > 0.45) grammatical = 'enfase'

  // Estado emocional aproximado.
  let emotion = null
  if (smile > 0.45) emotion = 'feliz'
  else if (frown > 0.4) emotion = 'triste'
  else if (browUp > 0.6 && mouthOpen > 0.4) emotion = 'surpresa'

  return {
    grammatical,
    emotion,
    raw: { browUp, browDown, smile, frown, mouthOpen },
  }
}

export const GRAMMATICAL_LABELS = {
  interrogativa: 'Interrogativa (?)',
  enfase: 'Ênfase',
}

export const EMOTION_LABELS = {
  feliz: 'Feliz',
  triste: 'Triste',
  surpresa: 'Surpresa',
}
