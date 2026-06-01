/**
 * Treino do modelo de classificação de gestos LGP, no browser, com TensorFlow.js.
 *
 * Arquitetura: MLP simples (63 → 128 → 64 → NUM_CLASSES) com softmax. Treina
 * sobre os vetores de características capturados (datasetStore) e guarda o
 * modelo em IndexedDB, de onde o classificador o carrega automaticamente.
 */
import * as tf from '@tensorflow/tfjs'
import { NUM_CLASSES } from './labels.js'
import { FEATURE_LENGTH } from './featureExtraction.js'

/** Localização do modelo treinado no browser. */
export const TRAINED_MODEL_STORE = 'indexeddb://gestualai-lgp'

/**
 * @param {{ xs: number[][], ys: number[] }} dataset
 * @param {{ epochs?: number, onEpoch?: (epoch, total, logs) => void }} [opts]
 * @returns {Promise<{ accuracy: number|null, epochs: number }>}
 */
export async function trainModel({ xs, ys }, { epochs = 50, onEpoch } = {}) {
  if (!xs.length) throw new Error('Sem amostras para treinar.')

  const model = tf.sequential()
  model.add(tf.layers.dense({ inputShape: [FEATURE_LENGTH], units: 128, activation: 'relu' }))
  model.add(tf.layers.dropout({ rate: 0.2 }))
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }))
  model.add(tf.layers.dense({ units: NUM_CLASSES, activation: 'softmax' }))
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'sparseCategoricalCrossentropy',
    metrics: ['accuracy'],
  })

  const xt = tf.tensor2d(xs, [xs.length, FEATURE_LENGTH])
  // Os rótulos têm de ser float32: a métrica de accuracy do TF.js aplica floor()
  // e rejeita tensores int32 com sparseCategoricalCrossentropy.
  const yt = tf.tensor1d(ys, 'float32')
  // Só usa validação se houver amostras suficientes para um split com sentido.
  const validationSplit = xs.length >= 40 ? 0.2 : 0

  try {
    const h = await model.fit(xt, yt, {
      epochs,
      batchSize: 16,
      shuffle: true,
      validationSplit,
      callbacks: {
        onEpochEnd: (epoch, logs) => onEpoch?.(epoch + 1, epochs, logs),
      },
    })
    await model.save(TRAINED_MODEL_STORE)
    const accSeries = h.history.acc || h.history.accuracy
    const accuracy = accSeries ? accSeries[accSeries.length - 1] : null
    return { accuracy, epochs }
  } finally {
    xt.dispose()
    yt.dispose()
    model.dispose()
  }
}

/**
 * Exporta o modelo treinado como ficheiros descarregados (model.json +
 * pesos .bin), para colocar em public/models/lgp-gestures/ e distribuir.
 */
export async function downloadTrainedModel() {
  const model = await tf.loadLayersModel(TRAINED_MODEL_STORE)
  await model.save('downloads://model')
  model.dispose()
}

/** Indica se já existe um modelo treinado guardado no browser. */
export async function hasTrainedModel() {
  try {
    const models = await tf.io.listModels()
    return Boolean(models[TRAINED_MODEL_STORE])
  } catch {
    return false
  }
}
