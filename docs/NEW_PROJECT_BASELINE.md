# New Project Baseline

Use este arquivo como checklist inicial para projetos novos.

## Git

- Definir identidade global:
  - `git config --global user.name "flavioalmeidamatos"`
  - `git config --global user.email "matos.almeida.flavio@gmail.com"`
- Validar:
  - `git config --global --get user.name`
  - `git config --global --get user.email`

## Windows + WSL

- Verificar se `pwsh` existe:
  - `which pwsh`
- Se nao existir, verificar `powershell.exe`:
  - `which powershell.exe`
- Se houver scripts `.ps1`, assumir compatibilidade com `powershell.exe` 5.1.

## Deploy Script

- Carregar `.env` antes de `.env.local`.
- Deixar `.env.local` com precedencia.
- Nao depender apenas de `PATH` para `node`, `npx` e `vercel`.
- Resolver binarios com caminhos conhecidos do Windows quando necessario.
- Prefira invocacao nativa com `&` no PowerShell.

## Supabase

- Garantir:
  - `SUPABASE_DB_PASSWORD`
  - `SUPABASE_ACCESS_TOKEN` quando usar CLI autenticada
- Em validacoes REST:
  - priorizar `SUPABASE_SERVICE_ROLE_KEY` se existir
  - aceitar que `publishable` ou `anon` podem sofrer limitacoes por RLS

## Vercel

- Garantir que `vercel` esteja instalado no perfil Windows.
- Se o script rodar no WSL, validar a execucao via `powershell.exe`.

## Antes do primeiro deploy

1. Validar `node`.
2. Validar `npx supabase --version`.
3. Validar `vercel --version`.
4. Confirmar carga de `.env` e `.env.local`.
5. Validar se o projeto Supabase remoto ja esta linkado.
