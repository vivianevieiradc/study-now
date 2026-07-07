-- ============================================================
-- OPCIONAL — Nível máximo: travar o app em UMA única conta (você)
-- Rode SÓ DEPOIS de criar sua conta e descobrir seu user_id:
--   Supabase > Authentication > Users > (clique no seu usuário) > copie o "User UID"
-- Troque as 4 ocorrências de SEU-USER-ID-AQUI pelo seu UID e rode em SQL Editor.
-- Efeito: mesmo que outra conta exista, o banco recusa tudo que não for sua.
-- ============================================================

drop policy if exists "own rows - select" on public.app_state;
drop policy if exists "own rows - insert" on public.app_state;
drop policy if exists "own rows - update" on public.app_state;
drop policy if exists "own rows - delete" on public.app_state;

create policy "only me - select" on public.app_state
  for select using (auth.uid() = 'SEU-USER-ID-AQUI');

create policy "only me - insert" on public.app_state
  for insert with check (auth.uid() = 'SEU-USER-ID-AQUI');

create policy "only me - update" on public.app_state
  for update using (auth.uid() = 'SEU-USER-ID-AQUI')
             with check (auth.uid() = 'SEU-USER-ID-AQUI');

create policy "only me - delete" on public.app_state
  for delete using (auth.uid() = 'SEU-USER-ID-AQUI');
