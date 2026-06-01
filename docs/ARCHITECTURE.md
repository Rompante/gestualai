# GestualAI — Arquitetura Técnica

> Versão de implementação alinhada com o *Plano de Desenvolvimento e Arquitetura v3.2*.

## 1. Princípios

- **Edge AI / 100% JavaScript** — todo o processamento de imagem ocorre no
  browser. Nenhum vídeo ou dado biométrico sai do dispositivo.
- **Privacidade por desenho** — sem upload de imagem; persistência opcional
  (apenas texto da tradução) via Supabase, ativada explicitamente.
- **Iterativo** — fundação funcional desde a Fase 1, com pontos de extensão
  claros para as Fases 2 e 3.

## 2. Fluxo de dados

```
 Câmara (react-webcam)
        │  frames (HTMLVideoElement)
        ▼
 MediaPipe Tasks Vision  ──►  HandLandmarker (21 marcos/mão)
   (src/vision/landmarker.js)  FaceLandmarker (478 marcos + blendshapes)
        │
        ├─► Desenho no canvas (src/vision/drawing.js)
        │
        ├─► Extração de características (src/ml/featureExtraction.js)
        │        │  vetor normalizado [63]
        │        ▼
        │   Classificador (src/ml/gestureClassifier.js)
        │        • Modelo TensorFlow.js (Fase 2)  ── ou ──  heurística (demo)
        │
        └─► Expressões faciais (src/vision/faceExpressions.js)
                 │  marcador gramatical + emoção
                 ▼
   Hook de reconhecimento (src/hooks/useGestureRecognition.js)
        │  debounce temporal → gesto confirmado
        ▼
   App ──► Síntese de voz (Web Speech API, pt-PT)
       └─► Histórico (memória + Supabase opcional)
```

## 3. Mapa de módulos

| Camada | Ficheiro | Responsabilidade |
| --- | --- | --- |
| Visão | `src/vision/landmarker.js` | Inicializa HandLandmarker e FaceLandmarker (tasks-vision) |
| Visão | `src/vision/drawing.js` | Desenha esqueleto da mão e nuvem facial no canvas |
| Visão | `src/vision/faceExpressions.js` | Blendshapes → marcadores gramaticais/emocionais |
| ML | `src/ml/labels.js` | Vocabulário de 20 gestos (Fase 0) e índices de classe |
| ML | `src/ml/featureExtraction.js` | Normalização dos marcos → vetor [63] |
| ML | `src/ml/gestureClassifier.js` | Modelo TF.js + fallback heurístico |
| Fala | `src/speech/speechSynthesis.js` | Locução pt-PT via Web Speech API |
| Dados | `src/data/supabaseClient.js` | Cliente Supabase opcional |
| Dados | `src/services/historyService.js` | Persistência do histórico de traduções |
| Estado | `src/hooks/useGestureRecognition.js` | Loop rAF, classificação, debounce, FPS |
| UI | `src/components/*` | Câmara, painel de tradução, controlos |

## 4. Estado por fase

- **Fase 0 — Dataset/Definição:** vocabulário de 20 gestos definido em
  `labels.js`. Gravação/anotação de vídeo fica a cargo do dataset.
- **Fase 1 — Fundação/Captura:** ✅ implementada — React+Vite, react-webcam,
  MediaPipe, visualização de marcos, classificador heurístico demonstrável.
- **Fase 2 — Inteligência/Tradução:** pontos de extensão prontos —
  contrato do modelo TF.js definido (`public/models/lgp-gestures/README.md`),
  expressões faciais e síntese de voz integradas.
- **Fase 3 — Persistência/Interface:** cliente Supabase e serviço de histórico
  prontos; ativar com variáveis de ambiente.

## 5. Esquema Supabase sugerido (Fase 3)

```sql
create table translation_history (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users (id),
  gesture_id  text not null,
  text        text not null,
  confidence  real,
  source      text,            -- 'model' | 'heuristic'
  created_at  timestamptz default now()
);

alter table translation_history enable row level security;

create policy "utilizadores leem o próprio histórico"
  on translation_history for select
  using (auth.uid() = user_id);

create policy "utilizadores inserem o próprio histórico"
  on translation_history for insert
  with check (auth.uid() = user_id);
```

## 6. KPIs (instrumentação)

- **FPS** e **mãos detetadas** são expostos em tempo real na barra de controlo.
- **Latência** de inferência mede-se por frame em `useGestureRecognition` (a
  exportar para telemetria local quando necessário).
- **Precisão** do modelo é avaliada offline durante o treino (Fase 2).
