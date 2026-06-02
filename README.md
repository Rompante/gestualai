# GestualAI

Reconhecimento e tradução de um vocabulário base da **Língua Gestual Portuguesa
(LGP)** — totalmente no browser (Edge AI), com **privacidade total**: nenhum
vídeo sai do dispositivo.

**Funcionalidades:**
- Reconhecimento de **50+ gestos LGP** + expressões faciais
- Modo **alfabeto** (A-Z) para soletrar palavras
- **Construtor de frases**: clique em palavras/letras e ouve em voz alta
- Histórico de traduções confirmadas
- 100% local — nenhum dado sai do dispositivo

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
marcos das mãos e do rosto e tenta traduzir o gesto. Use o **construtor de
frases** (painel lateral) para clicar em palavras e letras, ou **mude para modo
alfabeto** para soletrar.

### Treinar com seus dados LGP

Tem vídeos anotados de LGP? Siga o **[Guia de Treino](TRAINING.md)**:

1. Prepare seus vídeos por gesto/letra
2. Treine no [Teachable Machine](https://teachablemachine.withgoogle.com/) ou [MediaPipe Studio](https://mediapipe-studio.webapps.google.com)
3. Exporte para TensorFlow.js
4. Copie os ficheiros para `public/models/lgp-gestures/` ou `public/models/sign-alphabet/`
5. A app reconhecerá seus dados de treino automaticamente

Ver [TRAINING.md](TRAINING.md) para instruções detalhadas.

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

- **Fase 0** — ✅ Vocabulário expandido (50+ gestos) e suporte a alfabeto A-Z.
- **Fase 1** — ✅ Fundação e captura (React+Vite, câmara, MediaPipe, construtor de frases).
- **Fase 2** — Modelo LGP treinado com dados reais, expressões gramaticais avançadas.
- **Fase 3** — Persistência (Supabase), refinamento da interface, análise de histórico.
