-- GestualAI — esquema da base de dados (Supabase / Postgres)
-- Execute no SQL Editor do projeto Supabase.

-- Perfis de utilizador (1:1 com auth.users).
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

-- Histórico de traduções (apenas texto — nunca imagem/vídeo).
create table if not exists public.translation_history (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  gesture_id  text not null,
  text        text not null,
  confidence  real,
  source      text,            -- 'model' | 'heuristic'
  created_at  timestamptz not null default now()
);

create index if not exists idx_history_user_created
  on public.translation_history (user_id, created_at desc);

-- Cria automaticamente um perfil quando um utilizador se regista.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS — defesa em profundidade. A API usa service-role (que ignora RLS) e impõe
-- o user_id em código; estas políticas protegem qualquer acesso direto com a
-- chave anónima/autenticada.
alter table public.profiles enable row level security;
alter table public.translation_history enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "history_select_own" on public.translation_history;
create policy "history_select_own" on public.translation_history
  for select using (auth.uid() = user_id);

drop policy if exists "history_insert_own" on public.translation_history;
create policy "history_insert_own" on public.translation_history
  for insert with check (auth.uid() = user_id);

drop policy if exists "history_delete_own" on public.translation_history;
create policy "history_delete_own" on public.translation_history
  for delete using (auth.uid() = user_id);
