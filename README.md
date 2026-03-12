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
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

API:

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_API_URL`

Use `.env.example` como referencia local. Na Vercel, cadastre as mesmas chaves em `Project Settings > Environment Variables`.

## Deploy na Vercel

1. Importe o repositorio na Vercel.
2. Configure as variaveis de ambiente de `Preview` e `Production`.
3. Para Sandbox, mantenha `PAYPAL_API_URL=https://api-m.sandbox.paypal.com`.
4. Para producao, troque `PAYPAL_API_URL` para `https://api-m.paypal.com` e use credenciais Live.
5. Faça um novo deploy apos salvar as variaveis.

Configuracao esperada no projeto Vercel:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Node.js: `20.19.x` ou superior compativel

## Fluxo de pagamento

1. O carrinho envia os itens para `/api?action=create`.
2. A funcao serverless cria a order no PayPal em `BRL`.
3. A aprovacao do pagamento chama `/api?action=capture`.
4. Se o Supabase estiver configurado, o pedido concluido e gravado na tabela `orders`.

## Observacoes

- O checkout foi mantido exclusivamente em PayPal.
- Nao ha fluxo de Pix ou boleto neste projeto.
- Se `VITE_PAYPAL_CLIENT_ID` nao estiver configurado, o botao de pagamento nao e renderizado.
- Se o Supabase nao estiver configurado, o pagamento continua funcionando, mas o pedido nao sera persistido.
