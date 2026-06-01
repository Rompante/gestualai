# GestualAI — Arquitetura Técnica

> Versão de implementação alinhada com o *Plano de Desenvolvimento e Arquitetura v3.2*.

## 1. Princípios

- **Edge AI / inferência no cliente** — todo o processamento de imagem ocorre no
  browser. Nenhum vídeo ou dado biométrico sai do dispositivo.
- **Privacidade por desenho** — sem upload de imagem. A API backend persiste
  apenas **texto** (traduções) e dados de perfil.
- **Separação cliente/servidor** — o browser faz a inferência; a API (Node +
  Express) trata de auth, perfis, histórico e serve modelo/vocabulário.
- **Iterativo** — fundação funcional desde a Fase 1, com pontos de extensão
  claros para as Fases 2 e 3.

## 1.1. Topologia

```
   Browser (React)                  API (Node + Express, /server)        Supabase
 ┌────────────────────┐   HTTPS    ┌──────────────────────────┐  service ┌──────────┐
 │ câmara + inferência │  /api/* →  │ auth · perfis · histórico │   role   │ Postgres │
 │ (MediaPipe, TF.js)  │ ◄── JSON   │ vocabulary · model        │ ───────► │  + Auth  │
 │ só envia TEXTO+JWT  │            │ (nunca recebe imagem)     │          └──────────┘
 └────────────────────┘            └──────────────────────────┘
```

Auth: a API faz proxy ao Supabase Auth (`/api/auth/*`) com a chave anónima e
devolve o JWT. As rotas protegidas validam o token via service-role
(`supabaseAdmin.auth.getUser`) e isolam dados por `user_id`.

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
       └─► Histórico → apiClient → API backend (se autenticado)
```

## 3. Mapa de módulos

### Frontend

| Camada | Ficheiro | Responsabilidade |
| --- | --- | --- |
| Visão | `src/vision/landmarker.js` | Inicializa HandLandmarker e FaceLandmarker (tasks-vision) |
| Visão | `src/vision/drawing.js` | Desenha esqueleto da mão e nuvem facial no canvas |
| Visão | `src/vision/faceExpressions.js` | Blendshapes → marcadores gramaticais/emocionais |
| ML | `src/ml/labels.js` | Vocabulário de 20 gestos (Fase 0) e índices de classe |
| ML | `src/ml/featureExtraction.js` | Normalização dos marcos → vetor [63] |
| ML | `src/ml/gestureClassifier.js` | Modelo TF.js + fallback heurístico |
| Fala | `src/speech/speechSynthesis.js` | Locução pt-PT via Web Speech API |
| Dados | `src/data/apiClient.js` | Cliente HTTP da API backend (token Bearer) |
| Dados | `src/services/historyService.js` | Histórico via API |
| Sessão | `src/context/AuthContext.jsx` | Estado de auth, login/registo/logout |
| Estado | `src/hooks/useGestureRecognition.js` | Loop rAF, classificação, debounce, FPS |
| UI | `src/components/*` | Câmara, painel, controlos, AuthBar |

### Backend (`server/`)

| Módulo | Ficheiro | Responsabilidade |
| --- | --- | --- |
| App | `server/src/app.js` | Factory Express (CORS, JSON, rotas) |
| Config | `server/src/config.js`, `supabase.js` | Env + clientes Supabase (admin/anon) |
| Auth | `server/src/middleware/auth.js` | Verifica JWT → `req.user` |
| Rotas | `server/src/routes/*.js` | health, vocabulary, model, auth, profile, history |
| BD | `server/db/schema.sql` | Tabelas, RLS, trigger de perfil |

> `routes/vocabulary.js` importa `src/ml/labels.js` — **fonte única** do
> vocabulário, partilhada entre frontend e backend.

## 4. Estado por fase

- **Fase 0 — Dataset/Definição:** vocabulário de 20 gestos definido em
  `labels.js`. Gravação/anotação de vídeo fica a cargo do dataset.
- **Fase 1 — Fundação/Captura:** ✅ implementada — React+Vite, react-webcam,
  MediaPipe, visualização de marcos, classificador heurístico demonstrável.
- **Fase 2 — Inteligência/Tradução:** pontos de extensão prontos —
  contrato do modelo TF.js definido (`public/models/lgp-gestures/README.md`),
  expressões faciais e síntese de voz integradas.
- **Fase 3 — Persistência/Interface:** ✅ API backend (Node + Express + Supabase)
  com autenticação, perfis e histórico; frontend integrado via `apiClient`.

## 5. Esquema da base de dados

Ver [`server/db/schema.sql`](../server/db/schema.sql) — define `profiles` e
`translation_history`, índices, RLS (defesa em profundidade) e um trigger que
cria o perfil no registo. A API usa service-role e impõe o `user_id` em código.

## 6. KPIs (instrumentação)

- **FPS** e **mãos detetadas** são expostos em tempo real na barra de controlo.
- **Latência** de inferência mede-se por frame em `useGestureRecognition` (a
  exportar para telemetria local quando necessário).
- **Precisão** do modelo é avaliada offline durante o treino (Fase 2).
