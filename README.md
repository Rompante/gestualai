# GestualAI

Reconhecimento e tradução de um vocabulário base da **Língua Gestual Portuguesa
(LGP)** — totalmente no browser (Edge AI), com **privacidade total**: nenhum
vídeo sai do dispositivo.

> ⚠️ Ferramenta de apoio à comunicação **informal**. Não substitui intérpretes
> de LGP em contextos formais ou críticos.

## Stack

- **React + Vite** — interface e tooling
- **MediaPipe Tasks Vision** (`@mediapipe/tasks-vision`) — marcos de mãos e rosto
- **TensorFlow.js** — classificação do gesto (modelo treinado na Fase 2)
- **Web Speech API** — síntese de voz em pt-PT
- **Supabase** — perfis e histórico (opcional, Fase 3)
- **Tailwind CSS** — estilos

## Começar

```bash
npm install
cp .env.example .env   # opcional: configurar Supabase / caminho do modelo
npm run dev            # abre em http://localhost:5173
```

Clique em **Iniciar câmara** e autorize o acesso à webcam. A app desenha os
marcos das mãos e do rosto e tenta traduzir o gesto.

### Sem modelo treinado?

Enquanto o modelo LGP não estiver publicado em
`public/models/lgp-gestures/`, a app usa um **classificador heurístico de
demonstração** que reconhece algumas poses simples da mão (mão aberta → «Olá»,
punho → «Não», polegar para cima → «Estou bem», «V» → «Talvez», etc.). Isto
permite validar todo o fluxo de ponta a ponta desde a Fase 1.

Ver `public/models/lgp-gestures/README.md` para o contrato do modelo.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (`dist/`) |
| `npm run preview` | Pré-visualização do build |
| `npm run lint` | ESLint |

## Estrutura

```
src/
├── components/   # UI (câmara, painel de tradução, controlos)
├── hooks/        # useGestureRecognition (loop de inferência)
├── vision/       # MediaPipe: landmarker, desenho, expressões faciais
├── ml/           # labels, extração de características, classificador
├── speech/       # síntese de voz (Web Speech API)
├── data/         # cliente Supabase
└── services/     # histórico de traduções
```

Detalhes em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Privacidade

Todo o processamento de imagem ocorre **localmente**. Os modelos do MediaPipe e
o runtime WASM são carregados a partir de CDN, mas **as imagens da câmara nunca
são enviadas** para servidores. A persistência (opcional) guarda apenas o
**texto** da tradução, nunca vídeo.

## Roadmap

- **Fase 0** — Vocabulário de 20 gestos definido (`src/ml/labels.js`).
- **Fase 1** — ✅ Fundação e captura (React+Vite, câmara, MediaPipe).
- **Fase 2** — Modelo LGP treinado, expressões gramaticais, voz.
- **Fase 3** — Persistência (Supabase) e refinamento da interface.
