# GestualAI

Reconhecimento e tradução de um vocabulário base da **Língua Gestual Portuguesa
(LGP)** — totalmente no browser (Edge AI), com **privacidade total**: nenhum
vídeo sai do dispositivo.

> ⚠️ Ferramenta de apoio à comunicação **informal**. Não substitui intérpretes
> de LGP em contextos formais ou críticos.

## Stack

**Frontend (browser):**
- **React + Vite** — interface e tooling
- **MediaPipe Tasks Vision** (`@mediapipe/tasks-vision`) — marcos de mãos e rosto
- **TensorFlow.js** — classificação do gesto (modelo treinado na Fase 2)
- **Web Speech API** — síntese de voz em pt-PT
- **Tailwind CSS** — estilos

**Backend (`server/`):**
- **Node + Express** — API REST (auth, perfis, histórico, modelo/vocabulário)
- **Supabase/Postgres** (service-role) — base de dados e autenticação

> A inferência (mãos, rosto, gestos) ocorre **sempre no browser**. A API trata
> apenas de texto, perfis e configuração — **nunca recebe imagem/vídeo**.

## Começar

**1. Frontend:**

```bash
npm install
cp .env.example .env   # opcional em dev (o Vite faz proxy de /api → :8787)
npm run dev            # abre em http://localhost:5173
```

**2. API backend** (noutro terminal):

```bash
cd server
npm install
cp .env.example .env   # preencher SUPABASE_URL + chaves para ativar auth/histórico
npm run dev            # API em http://localhost:8787
```

Sem credenciais Supabase, a API arranca na mesma e serve `vocabulary`,
`model/manifest` e `health`; os endpoints de auth/histórico respondem 503.

Para ativar a persistência siga o guia
[`server/docs/SUPABASE_SETUP.md`](server/docs/SUPABASE_SETUP.md) (criar projeto,
correr `server/db/schema.sql`, preencher `server/.env`) e valide com
`cd server && npm run smoke`.

Clique em **Iniciar câmara** e autorize o acesso à webcam. A app desenha os
marcos das mãos e do rosto e tenta traduzir o gesto.

### Treinar o seu próprio modelo (modo "Treinar")

Sem modelo treinado, a app usa um **classificador heurístico de demonstração**
que só reconhece poses simples da mão (mão aberta → «Olá», polegar → «Estou
bem», etc.) — **não é LGP real**, é apenas um marcador de lugar.

Para reconhecer os 20 gestos a sério, use o separador **Treinar** (tudo no
browser, sem ferramentas externas):

1. Inicie a câmara e escolha um gesto no seletor.
2. Faça o gesto e clique **Gravar amostras** (recomendado: 50–100 por gesto,
   com variações de ângulo/posição). Repita para cada gesto.
3. Clique **Treinar com o dataset** — treina um modelo TensorFlow.js e guarda-o
   no browser (IndexedDB).
4. Volte a **Traduzir**: o badge passa a **«Modelo LGP»** e a classificação usa
   o seu modelo.

O dataset pode ser exportado/importado (JSON) e o modelo treinado pode ser
exportado como ficheiros (`model.json` + pesos) para colocar em
`public/models/lgp-gestures/` e distribuir a outros dispositivos — ver
`public/models/lgp-gestures/README.md` para o contrato (entrada `[1,63]`,
saída `[1,20]`).

> **Nota:** o classificador usa um descritor **espácio-temporal** (janela de
> ~16 frames: pose média + variação + deslocamento), por isso capta gestos com
> **movimento**, não apenas poses estáticas. Continua limitado a **uma mão**;
> sinais com duas mãos ou que dependam de **expressão facial** requerem
> extensão futura.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento (frontend) |
| `npm run build` | Build de produção (`dist/`) |
| `npm run preview` | Pré-visualização do build |
| `npm run lint` | ESLint (frontend + servidor) |
| `cd server && npm run dev` | API backend (com reload) |
| `cd server && npm test` | Testes da API (`node --test`) |
| `cd server && npm run smoke` | Validação ponta-a-ponta da API (auth/perfil/histórico) |

## API (resumo)

| Método | Rota | Auth | Função |
| --- | --- | --- | --- |
| GET | `/api/health` | — | Estado do servidor |
| GET | `/api/vocabulary` | — | 20 gestos LGP + categorias |
| GET | `/api/model/manifest` | — | Modelos TF.js disponíveis |
| POST | `/api/auth/register`, `/api/auth/login` | — | Registo / login (Supabase Auth) |
| GET/PUT | `/api/profile` | ✅ | Perfil do utilizador |
| GET/POST/DELETE | `/api/history` | ✅ | Histórico de traduções (só texto) |

## Estrutura

```
src/                  # FRONTEND
├── components/   # UI (câmara, painel, controlos, AuthBar)
├── context/      # AuthContext (sessão/JWT)
├── hooks/        # useGestureRecognition (loop de inferência)
├── vision/       # MediaPipe: landmarker, desenho, expressões faciais
├── ml/           # labels, extração de características, classificador
├── speech/       # síntese de voz (Web Speech API)
├── data/         # apiClient (cliente da API backend)
└── services/     # histórico de traduções (via API)

server/               # API BACKEND (Node + Express)
├── src/routes/   # health, vocabulary, model, auth, profile, history
├── src/middleware/ # requireAuth, errorHandler
├── db/schema.sql # esquema Supabase/Postgres
└── test/         # testes da API
```

Detalhes em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Privacidade

Todo o processamento de imagem ocorre **localmente** no browser. Os modelos do
MediaPipe e o runtime WASM são carregados a partir de CDN, mas **as imagens da
câmara nunca são enviadas** para servidores. A API backend recebe apenas o
**texto** das traduções e dados de perfil — nunca vídeo (o `express.json` está
limitado a 256 kB propositadamente).

## Roadmap

- **Fase 0** — Vocabulário de 20 gestos definido (`src/ml/labels.js`).
- **Fase 1** — ✅ Fundação e captura (React+Vite, câmara, MediaPipe).
- **Fase 2** — Modelo LGP treinado, expressões gramaticais, voz.
- **Fase 3** — ✅ Persistência via API (Node + Express + Supabase) e auth; refinamento contínuo da interface.
