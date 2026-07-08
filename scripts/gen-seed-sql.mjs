// Gera supabase/seed.sql a partir dos módulos de dados (fonte única).
// Uso: node scripts/gen-seed-sql.mjs
// Depois: cole o conteúdo de supabase/seed.sql no SQL Editor do Supabase.
import { writeFileSync, mkdirSync } from "node:fs";
import { EDITAIS } from "../src/data/editais.js";
import { PROVAS } from "../src/data/provas.js";

// aspas simples escapadas para literais SQL
const q = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
// jsonb via literal string com cast; escapa aspas simples do JSON
const j = (v) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
const n = (v) => (v === null || v === undefined || v === "" ? "null" : Number(v));

const CONCURSOS = Object.keys(EDITAIS);

let sql = `-- ============================================================
-- Study Now — seed de conteúdo global (edital + provas)
-- Gerado por scripts/gen-seed-sql.mjs — NÃO editar à mão.
-- Cole tudo no SQL Editor do Supabase e rode uma vez.
-- Idempotente: pode rodar de novo (upsert por id / on conflict).
-- ============================================================

-- ---------- Tabelas ----------
create table if not exists public.editais (
  concurso_id  text primary key,        -- 'bb-at' | 'dataprev-arq'
  disciplinas  jsonb not null default '[]'::jsonb,
  updated_at   timestamptz default now()
);

create table if not exists public.provas (
  id                text primary key,
  concurso_id       text not null,
  titulo            text not null,
  banca             text,
  ano               int,
  data              text,
  total_questoes    int,
  fonte             text,
  disciplinas       jsonb not null default '{}'::jsonb,
  especificos_discs jsonb not null default '[]'::jsonb,
  questoes          jsonb not null default '[]'::jsonb,
  created_at        timestamptz default now()
);

create index if not exists provas_concurso_idx on public.provas (concurso_id);

-- ---------- RLS: conteúdo global, somente leitura pública ----------
alter table public.editais enable row level security;
alter table public.provas  enable row level security;

drop policy if exists editais_leitura_publica on public.editais;
create policy editais_leitura_publica on public.editais for select using (true);

drop policy if exists provas_leitura_publica on public.provas;
create policy provas_leitura_publica on public.provas for select using (true);

-- ---------- Edital ----------
`;

for (const cid of CONCURSOS) {
  const disciplinas = EDITAIS[cid] || [];
  sql += `insert into public.editais (concurso_id, disciplinas, updated_at) values (${q(cid)}, ${j(disciplinas)}, now())
  on conflict (concurso_id) do update set disciplinas = excluded.disciplinas, updated_at = now();\n\n`;
}

sql += `-- ---------- Provas ----------\n`;
let totalProvas = 0;
for (const cid of CONCURSOS) {
  const provas = PROVAS[cid] || [];
  for (const p of provas) {
    totalProvas++;
    sql += `insert into public.provas (id, concurso_id, titulo, banca, ano, data, total_questoes, fonte, disciplinas, especificos_discs, questoes) values (
  ${q(p.id)}, ${q(cid)}, ${q(p.titulo)}, ${q(p.banca)}, ${n(p.ano)}, ${q(p.data)}, ${n(p.totalQuestoes)}, ${q(p.fonte)},
  ${j(p.disciplinas || {})}, ${j(p.especificosDiscs || [])}, ${j(p.questoes || [])}
) on conflict (id) do update set
  concurso_id = excluded.concurso_id, titulo = excluded.titulo, banca = excluded.banca, ano = excluded.ano,
  data = excluded.data, total_questoes = excluded.total_questoes, fonte = excluded.fonte,
  disciplinas = excluded.disciplinas, especificos_discs = excluded.especificos_discs, questoes = excluded.questoes;\n\n`;
  }
}

mkdirSync("supabase", { recursive: true });
writeFileSync("supabase/seed.sql", sql);
console.log(`OK: supabase/seed.sql gerado.`);
console.log(`Concursos: ${CONCURSOS.join(", ")}`);
console.log(`Provas: ${totalProvas}`);
