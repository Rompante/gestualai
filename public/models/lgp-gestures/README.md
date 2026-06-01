# Modelo de gestos LGP (TensorFlow.js)

Coloque aqui o modelo de classificação exportado na **Fase 2**:

```
public/models/lgp-gestures/
├── model.json        # topologia + manifesto de pesos
└── group1-shard1of1.bin   # pesos (ignorado pelo git — ver .gitignore)
```

## Origem do modelo

Treine o modelo no **Teachable Machine** ou no **MediaPipe Studio** sobre as
características de mão normalizadas (vetor de 63 valores — ver
`src/ml/featureExtraction.js`) e exporte para o formato TensorFlow.js
(`tf.loadLayersModel`).

## Contrato esperado

- **Entrada:** tensor `[1, 63]` (21 marcos × 3 eixos, normalizados).
- **Saída:** tensor `[1, 20]` — distribuição softmax sobre as 20 classes
  definidas, **pela mesma ordem** de `src/ml/labels.js`.

Enquanto este ficheiro não existir, a aplicação usa automaticamente o
classificador heurístico de demonstração (`src/ml/gestureClassifier.js`).

A localização pode ser alterada via `VITE_GESTURE_MODEL_URL` (ver `.env.example`).

https://sthimqqzjwrdewweubbq.supabase.co/rest/v1/
