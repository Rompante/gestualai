# Guia de Treino de Modelos — GestualAI

Este documento explica como treinar modelos de reconhecimento de gestos e alfabeto com seus dados anotados de LGP.

## 📋 Pré-requisitos

- Vídeos anotados/classificados de LGP (gestos ou letras)
- Conta no [Google Teachable Machine](https://teachablemachine.withgoogle.com/) ou acesso ao [MediaPipe Studio](https://mediapipe-studio.webapps.google.com)
- Navegador moderno

## 🎯 Opção 1: Treino com Teachable Machine (mais fácil)

### Passo 1: Preparar dados

1. Organize seus vídeos em pastas por gesto/letra:
   ```
   dados/
   ├── ola/
   ├── adeus/
   ├── obrigado/
   └── ... (mais gestos)
   ```

2. Certifique-se de que cada vídeo:
   - Tem entre 2-5 segundos
   - Mostra apenas a(s) mão(s) e eventualmente o rosto
   - Tem boa iluminação

### Passo 2: Criar projeto no Teachable Machine

1. Aceda a https://teachablemachine.withgoogle.com/
2. Clique em **"Get Started"** → **"Pose"** (para gestos) ou **"Hand"** (para alfabeto)
3. Para cada classe (gesto/letra):
   - Clique **"Upload samples"**
   - Selecione vídeos da pasta correspondente
   - Teachable Machine extrai frames automaticamente

### Passo 3: Treinar o modelo

1. Clique **"Train Model"** e aguarde (geralmente 1-5 minutos)
2. Teste o modelo na webcam — arraste o cursor para sair quando terminar
3. Se a precisão for boa (>90%), prossiga

### Passo 4: Exportar para TensorFlow.js

1. Clique **"Export Model"** → **"TensorFlow.js"**
2. Selecione **"Download"** (ficheiros `.json` e `.bin`)
3. Guarde num local seguro

### Passo 5: Publicar no app

1. Copie os ficheiros para:
   - **Gestos**: `public/models/lgp-gestures/`
   - **Alfabeto**: `public/models/sign-alphabet/`

2. Estrutura final:
   ```
   public/models/lgp-gestures/
   ├── model.json
   └── group1-shard1of1.bin
   
   public/models/sign-alphabet/
   ├── model.json
   └── group1-shard1of1.bin
   ```

3. Reinicie o dev server:
   ```bash
   npm run dev
   ```

## 🎬 Opção 2: Treino com MediaPipe Studio (mais controlo)

### Passo 1: Preparar dataset

1. Crie um ficheiro CSV com:
   ```csv
   FILE_PATH,LABEL
   video1.mp4,ola
   video2.mp4,ola
   video3.mp4,adeus
   ```

2. Estruture os vídeos:
   ```
   dataset/
   ├── video1.mp4
   ├── video2.mp4
   └── ...
   ```

### Passo 2: Upload e treino

1. Aceda a https://mediapipe-studio.webapps.google.com
2. Clique **"Gesture Recognizer"** ou **"Hand Landmarker"**
3. Faça upload do CSV e dos vídeos
4. Configure os parâmetros de treino (taxa de aprendizagem, épocas, etc.)
5. Clique **"Train"**

### Passo 3: Exportar e publicar

Siga o mesmo procedimento da **Opção 1, Passo 4-5**.

## 📊 Validação do Modelo

Depois de publicar, teste no app:

1. Inicie a app: `npm run dev`
2. Abra http://localhost:5173
3. Clique **"Iniciar câmara"**
4. Selecione o modo (`Gestos` ou `Alfabeto`)
5. Faça os gestos/letras treináveis à câmara
6. Verifique o painel de reconhecimento em tempo real

**Dicas:**
- Se o reconhecimento estiver impreciso, é provável que:
  - O modelo precisa de mais exemplos de treino (100+ por classe)
  - Os dados de treino são muito diferentes dos dados de teste
  - A iluminação, ângulo ou fundo variam muito

## 🔧 Ajustes Avançados

### Adicionar novos gestos

1. Edite `src/ml/labels.js`
2. Adicione o novo gesto ao array `GESTURE_LABELS`:
   ```javascript
   { id: 'novo_gesto', label: 'Novo Gesto', category: 'categoria' }
   ```
3. Retreine o modelo com esse novo gesto incluído
4. Exporte e publique

### Variar a confiança mínima

Em `src/App.jsx`, ajuste `minConfidence`:
```javascript
const { videoRef, canvasRef, ... } = useGestureRecognition({
  confirmFrames: 8,
  minConfidence: 0.6,  // ← aumentar para ser mais exigente
  ...
})
```

### Variar o debounce (confirmação)

Em `src/App.jsx`, ajuste `confirmFrames`:
```javascript
minConfidence: 0.5,
confirmFrames: 4,  // ← menos frames = mais rápido; mais frames = mais estável
```

## 📈 Boas Práticas de Treino

1. **Qualidade sobre quantidade**: 50 vídeos bons > 500 vídeos ruins
2. **Diversidade**: inclua vários ângulos, iluminações, fundos
3. **Variação**: diferentes velocidades de gesto, diferentes pessoas
4. **Teste em produção**: o modelo precisa funcionar em tempo real com câmaras reais
5. **Iteração**: retreine regularmente com novos dados

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| Modelo não carrega | Verifique se `model.json` existe em `public/models/` |
| Reconhecimento muito lento | Reduza `confirmFrames` ou aumente a resolução do modelo |
| Muitos falsos positivos | Aumente `minConfidence` ou `confirmFrames` |
| App não reconhece o gesto | Retreine com mais exemplos variados |

## 📚 Recursos

- [Teachable Machine](https://teachablemachine.withgoogle.com/)
- [MediaPipe Studio](https://mediapipe-studio.webapps.google.com)
- [TensorFlow.js Documentation](https://js.tensorflow.org/)
- [MediaPipe Tasks Vision](https://developers.google.com/mediapipe/solutions/vision)

---

**Dúvidas?** Consulte `docs/ARCHITECTURE.md` para mais detalhes sobre a arquitetura da app.
