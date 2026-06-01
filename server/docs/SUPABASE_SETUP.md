# Configuração do Supabase — GestualAI API

Guia passo-a-passo para ativar a persistência (auth, perfis, histórico).
Tempo estimado: ~10 minutos.

## 1. Criar o projeto Supabase

1. Aceda a <https://supabase.com> → **New project**.
2. Escolha um nome (ex.: `gestualai`) e uma **região próxima** (ex.: *West EU
   (London)* ou *Central EU (Frankfurt)* para latência baixa em Portugal).
3. Defina e **guarde** a password da base de dados.
4. Aguarde o provisionamento (~2 min).

## 2. Obter as chaves

Em **Project Settings → API**, copie:

| Campo | Variável em `server/.env` |
| --- | --- |
| Project URL | `SUPABASE_URL` |
| `anon` `public` | `SUPABASE_ANON_KEY` |
| `service_role` `secret` | `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ A chave **service_role** é secreta e dá acesso total à BD. Use-a **apenas
> no servidor** — nunca a coloque no frontend nem a faça commit.

## 3. Criar as tabelas

1. No painel, abra **SQL Editor → New query**.
2. Cole o conteúdo de [`server/db/schema.sql`](../db/schema.sql) e execute (**Run**).
3. Confirme em **Table Editor** que existem `profiles` e `translation_history`.

Isto cria também a RLS e o *trigger* que gera o perfil automaticamente no registo.

## 4. Configurar a autenticação por email

Em **Authentication → Sign In / Providers → Email**:

- **Para desenvolvimento:** desative **"Confirm email"**. Assim o
  `register` → `login` automático funciona de imediato.
- **Para produção:** mantenha a confirmação de email ativa. Nesse caso, o
  utilizador tem de confirmar antes do primeiro login (o `register` devolve
  `access_token: null` — comportamento esperado).

## 5. Preencher o `.env` do servidor

```bash
cd server
cp .env.example .env
```

Edite `server/.env`:

```ini
PORT=8787
CORS_ORIGIN=http://localhost:5173
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 6. Arrancar e validar

```bash
# Terminal 1 — API
cd server && npm run dev

# Terminal 2 — script de validação ponta-a-ponta
cd server && npm run smoke
```

O `smoke` cria um utilizador de teste, faz login, lê/atualiza o perfil, insere
e lê o histórico e remove a entrada — reportando ✓/✗ em cada passo. Se vir
tudo ✓, a API está operacional.

Para apontar a outra instância:

```bash
API_URL=https://a-minha-api.exemplo npm run smoke
```

## 7. Ligar o frontend

Em desenvolvimento não é preciso configurar nada: o Vite faz proxy de `/api`
para `http://localhost:8787`. Arranque o frontend (`npm run dev` na raiz),
clique em **Entrar**, registe-se, e as traduções confirmadas passam a persistir
e a reaparecer após refresh.

## Resolução de problemas

| Sintoma | Causa provável |
| --- | --- |
| `health` mostra `auth:false, db:false` | `.env` não preenchido / servidor não reiniciado |
| `register` ok mas `login` falha | "Confirm email" ativo (ver passo 4) |
| `401` nas rotas protegidas | token expirado (~1h) — faça login novamente |
| `permission denied for table` | `schema.sql` não foi executado |
