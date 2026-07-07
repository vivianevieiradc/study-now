# Estudei · BB Agente de Tecnologia

App pessoal de estudos (React + Vite) com login por e-mail/senha e dados no Supabase.
Deploy previsto: **Supabase (Free)** + **Vercel (Hobby)** — tudo grátis.

---

## 1. Supabase (banco + login)

1. Crie um projeto em https://supabase.com (plano Free).
2. Vá em **SQL Editor → New query**, cole o conteúdo de `schema.sql` e clique em **Run**.
   Isso cria a tabela `app_state` com RLS (cada usuário só acessa os próprios dados).
3. (Opcional, recomendado p/ uso pessoal) Em **Authentication → Providers → Email**,
   desligue "Confirm email" para entrar sem precisar confirmar o e-mail.
4. Em **Project Settings → API**, copie:
   - **Project URL**  → vira `VITE_SUPABASE_URL`
   - **anon public key** → vira `VITE_SUPABASE_ANON_KEY`
   (A `anon key` é feita para ficar no front-end; quem protege os dados é o RLS + seu login.)

## 2. Rodar localmente

```bash
cp .env.example .env      # e preencha as 2 chaves
npm install
npm run dev               # abre em http://localhost:5173
```

Na primeira vez, clique em **"Criar agora"**, cadastre seu e-mail/senha e entre.

## 3. Subir na Vercel

```bash
git init && git add . && git commit -m "Estudei"
git branch -M main
git remote add origin git@github.com:SEU_USUARIO/estudei.git
git push -u origin main
```

Depois, em https://vercel.com:
1. **Add New → Project** e importe o repositório.
2. Framework detectado: **Vite** (build `npm run build`, output `dist`).
3. Em **Environment Variables**, adicione as MESMAS duas:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Deploy**. Pronto — a cada `git push` a Vercel republica sozinha.

> Importante: o `.env` NÃO vai pro Git (está no `.gitignore`). As chaves de produção
> ficam nas Environment Variables da Vercel.

---

## Notas

- **Estrutura de dados:** o app guarda cada área (disciplinas, sessões, revisões, ciclo,
  plano, simulados, metas, pomodoro, tema) como uma linha em `app_state`, na coluna `value` (JSONB).
  Simples de manter; dá pra migrar pra tabelas separadas depois, se quiser relatórios em SQL.
- **Só você:** login por e-mail/senha + RLS garante que apenas a sua conta lê/escreve seus dados.
- **Pausa do Supabase Free:** projetos gratuitos pausam após ~7 dias sem uso; basta reativar
  no painel — nenhum dado é perdido. Usando com frequência, não pausa.
- **Edital/incidência:** os pesos são do Edital 2022 (Agente de Tecnologia, Cesgranrio) e a
  incidência por tópico foi estimada a partir das provas 2021 (DF-TI) e 2022 (Micro 158-TI).
  É guia de prioridade — a próxima prova pode variar.

---

## Como deixar o acesso SÓ SEU (todas as opções)

Do essencial ao "cinto + suspensório". Aplique quantas quiser — a 1 já resolve a maioria.

### 1. Desligar novos cadastros (essencial)
Depois de criar a sua conta no app:
- Supabase → **Authentication → Sign In / Providers** (ou **Settings**) → desative
  **"Allow new users to sign up"**.
- A partir daí, ninguém mais consegue nem criar conta. Como só existe a sua conta e o
  RLS já isola os dados por usuário, o app fica efetivamente pessoal.

### 2. Senha forte + segundo fator (MFA)
- Use uma senha longa e única (não reaproveitada de outro site).
- Opcional: ative **MFA** em Authentication — assim, mesmo que alguém descubra a senha,
  não entra sem o código do seu celular.

### 3. Travar o banco na sua conta (nível máximo)
- Garantia técnica de que só o SEU usuário lê/grava, mesmo que outra conta exista.
- Passo a passo:
  1. Faça login uma vez no app (cria sua conta).
  2. Supabase → **Authentication → Users** → copie o seu **User UID**.
  3. Abra `lock_only_me.sql`, troque `SEU-USER-ID-AQUI` pelo seu UID (4 lugares) e rode
     no **SQL Editor**.
- Isso substitui as políticas "cada um vê o que é seu" por "só aceita este id".

### 4. Esconder até a tela de login (Vercel)
- Se quiser que estranhos nem vejam a tela de login, a Vercel oferece
  **Deployment Protection → Password Protection / Vercel Authentication**
  (Project → Settings → Deployment Protection). O site inteiro fica atrás de uma barreira
  antes de carregar. Disponibilidade/limites variam por plano — confira na hora.

> Observação honesta: por ser um app que roda no navegador, o código do front e a
> `anon key` são sempre visíveis a quem abrir o link — isso vale para qualquer app web.
> Mas "ver o código" ≠ "acessar dados": sem login válido e com RLS ligado, esse código
> não lê nada seu. Quem protege os dados é o **login + RLS** (itens 1 e 3), não o sigilo do link.
