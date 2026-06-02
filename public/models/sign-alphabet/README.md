# Modelo de alfabeto de sinais (TensorFlow.js)

Use este diretório para armazenar um modelo de classificação de letras de A-Z.

```
public/models/sign-alphabet/
├── model.json
└── group1-shard1of1.bin
```

## Contrato esperado

- **Entrada:** tensor `[1, 63]`
  - 21 marcos da mão normalizados.
  - Mesmo formato de `src/ml/featureExtraction.js`.
- **Saída:** tensor `[1, 26]`
  - Distribuição softmax sobre as 26 letras do alfabeto em ordem A, B, C, ..., Z.

## Uso

- Defina `VITE_ALPHABET_MODEL_URL=/models/sign-alphabet/model.json`
  no `.env` se quiser publicar o modelo localmente.
- A app tenta carregar automaticamente o modelo de alfabeto na inicialização.
- Se o modelo não existir, a app continuará a funcionar, mas sem reconhecimento automático de letras.
