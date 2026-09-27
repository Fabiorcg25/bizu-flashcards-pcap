# BIZU Flashcards — PC/AP 2026 — Oficial Investigador

Aplicativo web instalável (PWA) em Next.js 16 + React 19 + Supabase, com identidade Bizu Premium.

## Estrutura do edital já cadastrada

- 13 disciplinas;
- 80 questões objetivas distribuídas conforme o edital;
- 274 tópicos de estudo;
- painel administrativo em `/admin`;
- importação em massa por CSV;
- login individual por e-mail e senha;
- controle de acesso ao produto `pcap_oficial_investigador_2026`;
- revisão **ERREI / DIFÍCIL / SEI**;
- fila de revisão;
- RLS no Supabase;
- favoritos preparados;
- PWA/manifest para instalação no celular.

## Banco de produção

O projeto Supabase de produção já foi criado. Para uma instalação nova, use `supabase/schema.sql` e depois `supabase/seed_exam_structure.sql`.

## Variáveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://ystdnlwvtzxugtgjofta.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxx
```

Nunca coloque chave secreta/service role no navegador.

## Rodar localmente

1. Node.js 22 ou superior.
2. `npm install`
3. Configure `.env.local`.
4. `npm run dev`
5. Abra `http://localhost:3000`.

## Publicar na Hostinger

A Hostinger Web App/Node.js aceita Next.js e permite implantação por ZIP. Envie o ZIP do projeto, selecione Node.js 22, configure `npm install`, `npm run build` e `npm start`, adicione as duas variáveis de ambiente e depois conecte `flashcards.bizupremium.com`.

## Administrador

O painel `/admin` exige `app_metadata.role = admin`. O aluno comum não recebe permissões administrativas.

## Importação de flashcards

Cabeçalhos do CSV:

```csv
disciplina,assunto,frente,verso,referencia,dificuldade
```

Dificuldade: 1 = fácil, 2 = média, 3 = difícil.
