# Modelo de gestos LGP (TensorFlow.js)

Coloque aqui o modelo de classificação exportado na **Fase 2**:

```
public/models/lgp-gestures/
├── model.json        # topologia + manifesto de pesos
└── group1-shard1of1.bin   # pesos (ignorado pelo git — ver .gitignore)
```

## Origem do modelo

A forma mais simples de o gerar é o **modo "Treinar"** da própria app, que
treina e exporta no formato TensorFlow.js (`tf.loadLayersModel`). Em
alternativa, treine externamente respeitando o contrato abaixo.

## Contrato esperado

- **Entrada:** tensor `[1, 189]` — descritor espácio-temporal de uma janela de
  frames: média + desvio-padrão + deslocamento dos 63 marcos normalizados
  (ver `src/ml/temporalFeatures.js`).
- **Saída:** tensor `[1, 20]` — distribuição softmax sobre as 20 classes
  definidas, **pela mesma ordem** de `src/ml/labels.js`.

Enquanto este ficheiro não existir, a aplicação usa automaticamente o
classificador heurístico de demonstração (`src/ml/gestureClassifier.js`).

A localização pode ser alterada via `VITE_GESTURE_MODEL_URL` (ver `.env.example`).
