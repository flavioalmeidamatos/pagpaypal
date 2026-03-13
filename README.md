# PagPayPal

Loja em React + TypeScript com checkout PayPal e persistencia opcional de pedidos no Supabase.

## Scripts

- `npm run dev`: inicia o ambiente local com Vite.
- `npm run build`: gera o build de producao.
- `npm run lint`: executa o ESLint.
- `npm run preview`: serve o build localmente.

## Requisitos

- Node.js `20.19+`
- Conta PayPal com app Sandbox ou Live
- Projeto na Vercel

## Variaveis de ambiente

Frontend:

- `VITE_PAYPAL_CLIENT_ID`

API:

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_API_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Use `.env.example` como referencia local. Na Vercel, cadastre as mesmas chaves em `Project Settings > Environment Variables`.
As mudanças de banco ficam versionadas em `supabase/migrations`.

## Deploy na Vercel

1. Importe o repositorio na Vercel.
2. Configure as variaveis de ambiente de `Preview` e `Production`.
3. Para Sandbox, mantenha `PAYPAL_API_URL=https://api-m.sandbox.paypal.com`.
4. Para producao, troque `PAYPAL_API_URL` para `https://api-m.paypal.com` e use credenciais Live.
5. Faça um novo deploy apos salvar as variaveis.

Fluxo de banco recomendado:

- `supabase link --project-ref <seu-project-ref>`
- `supabase db push`

Configuracao esperada no projeto Vercel:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Node.js: `20.19.x` ou superior compativel

## Troubleshooting

- Se o commit falhar por identidade ausente no Git:
  - `git config --global user.name "flavioalmeidamatos"`
  - `git config --global user.email "matos.almeida.flavio@gmail.com"`
- Se `pwsh` nao existir no WSL, rode o deploy com `powershell.exe`.
- O `deploy.ps1` foi preparado para carregar `.env` e `.env.local`, nesta ordem.
- Em Windows + WSL, o script resolve `node`, `npx` e `vercel` com fallback para caminhos conhecidos.
- Se a validacao REST do Supabase usar chave `publishable` ou `anon`, respostas `404` ou bloqueios de RLS podem ser apenas limitacoes da chave, nao falha real de schema.

Referencia reutilizavel para novos projetos:

- `AGENTS.md`
- `docs/NEW_PROJECT_BASELINE.md`

## Fluxo de pagamento

1. O carrinho envia os itens para `/api?action=create`.
2. A funcao serverless cria a order no PayPal em `BRL`.
3. A aprovacao do pagamento chama `/api?action=capture`.
4. Se o Supabase estiver configurado no backend, o pedido concluido e seus itens sao gravados nas tabelas `pedidos` e `pedido_itens`.

## Observacoes

- O checkout foi mantido exclusivamente em PayPal.
- Nao ha fluxo de Pix ou boleto neste projeto.
- Se `VITE_PAYPAL_CLIENT_ID` nao estiver configurado, o botao de pagamento nao e renderizado.
- Se o Supabase nao estiver configurado no backend, o pagamento continua funcionando, mas o pedido nao sera persistido.
- A gravacao no Supabase acontece na funcao serverless, nao no navegador.
- A migration atual do banco esta em `supabase/migrations/20260312130000_criar_estrutura_checkout.sql`.
