# BIZU Flashcards — PC/AP 2026 — Oficial Investigador

Aplicativo Next.js + Supabase da Bizu Premium.

## Versão 5

- dashboard do aluno com métricas reais;
- histórico de revisões e sequência de estudo;
- progresso real por disciplina;
- Revisão do Dia, Revisar Erros, Favoritos e Reta Final funcionando;
- favoritos diretamente no player;
- painel administrativo redesenhado com abas;
- filtros, busca e paginação de flashcards e assuntos;
- edição e pausa/reativação de flashcards;
- gestão de usuários e liberação/bloqueio de acesso;
- importação CSV em área dedicada;
- cobertura do edital por disciplina.

## Ambiente

Node.js 22+.

Variáveis obrigatórias:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ystdnlwvtzxugtgjofta.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<sua-chave-publica>
```

Nunca coloque chave `service_role` no frontend.

## Rodar

```bash
npm install
npm run dev
```

## Deploy Hostinger

Repositório GitHub: `Fabiorcg25/bizu-flashcards-pcap`

- Framework: Next.js
- Branch: main
- Node: 22.x
- Diretório raiz: `./`
- Build: padrão do Next.js
- Domínio atual: `flashcard.bizupremium.com`
