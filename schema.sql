-- ============================================================
-- Estudei · esquema do Supabase (app pessoal, 1 usuário)
-- Cole tudo isto em: Supabase > SQL Editor > New query > Run
-- ============================================================

-- Uma linha por "chave" de estado, por usuário.
-- As chaves são as mesmas que o app já usa: disc, sess, rev, cycle, plan, sim, goals, pomo, theme.
create table if not exists public.app_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  key     text not null,
  value   jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- Segurança em nível de linha: cada usuário só enxerga o que é dele.
alter table public.app_state enable row level security;

drop policy if exists "own rows - select" on public.app_state;
drop policy if exists "own rows - insert" on public.app_state;
drop policy if exists "own rows - update" on public.app_state;
drop policy if exists "own rows - delete" on public.app_state;

create policy "own rows - select" on public.app_state
  for select using (auth.uid() = user_id);

create policy "own rows - insert" on public.app_state
  for insert with check (auth.uid() = user_id);

create policy "own rows - update" on public.app_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows - delete" on public.app_state
  for delete using (auth.uid() = user_id);
