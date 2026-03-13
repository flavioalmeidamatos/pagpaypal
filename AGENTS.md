# AGENTS.md

## Objetivo

Registrar decisoes operacionais deste projeto para evitar retrabalho em setup, deploy e automacao com Codex em Windows + WSL.

## Baseline de ambiente

- Configure Git globalmente antes de qualquer fluxo de commit:
  - `git config --global user.name "flavioalmeidamatos"`
  - `git config --global user.email "matos.almeida.flavio@gmail.com"`
- Em ambientes WSL, nao assuma que `pwsh` existe.
- Se `pwsh` nao existir, prefira `powershell.exe`.
- Para scripts `.ps1`, o alvo minimo de compatibilidade deve ser `powershell.exe` 5.1, nao apenas PowerShell 7+.

## Baseline de deploy PowerShell

- O `deploy.ps1` deve carregar primeiro `.env` e depois `.env.local`.
- `.env.local` sobrescreve valores duplicados de `.env`.
- O script nao deve depender cegamente de `PATH`; precisa localizar `node`, `npx` e `vercel` de forma robusta no Windows.
- Ao invocar comandos nativos em PowerShell, prefira o call operator `&` em vez de wrappers fragis com `ProcessStartInfo`.

## Baseline de Supabase

- `supabase db push` exige `SUPABASE_DB_PASSWORD`.
- Quando existir, `SUPABASE_ACCESS_TOKEN` pode ser repassado para a CLI.
- Validacoes REST com chave `publishable` ou `anon` podem ser limitadas por RLS e retornar `404` ou erro de permissao.
- Nesses casos, a validacao deve ser tratada como informativa, nao como falha conclusiva do deploy.
- Se houver `SUPABASE_SERVICE_ROLE_KEY`, ela deve ser priorizada sobre chaves publicas para validacoes administrativas.

## Baseline de novos projetos

- Ao iniciar um projeto novo com deploy PowerShell, reutilizar o template em `docs/NEW_PROJECT_BASELINE.md`.
- Se o projeto usar Windows + WSL + Vercel + Supabase, copiar estes mesmos principios antes de escrever o primeiro script de deploy.
