#!/usr/bin/env bash

set -u

STEP_FAILURES=0

log() {
  printf '%s\n' "$1"
}

ok() {
  printf '[OK] %s\n' "$1"
}

warn() {
  printf '[FALHA] %s\n' "$1"
}

run_step() {
  local name="$1"
  shift

  log ""
  log "==> $name"

  if "$@"; then
    ok "$name"
    return 0
  fi

  warn "$name"
  STEP_FAILURES=$((STEP_FAILURES + 1))
  return 1
}

require_env() {
  local var_name="$1"
  if [[ -z "${!var_name:-}" ]]; then
    log "Variavel obrigatoria ausente: $var_name"
    return 1
  fi
}

validate_node() {
  local version raw major minor

  raw="$(node -v 2>/dev/null)" || {
    log "Node.js nao encontrado."
    return 1
  }

  version="${raw#v}"
  major="${version%%.*}"
  minor="$(printf '%s' "$version" | cut -d. -f2)"

  if (( major < 20 )) || { (( major == 20 )) && (( minor < 19 )); }; then
    log "Versao do Node incompatível: $raw. Requer >= v20.19.0."
    return 1
  fi

  log "Node detectado: $raw"
}

validate_supabase_cli() {
  npx supabase --version
}

validate_vercel_cli() {
  vercel --version
}

run_db_push() {
  npx supabase db push
}

check_single_table() {
  local table_name="$1"
  local response

  response="$(curl -sS "${VITE_SUPABASE_URL%/}/rest/v1/${table_name}?select=*&limit=1" \
    -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}")" || return 1

  if [[ "$response" == *'"code":"PGRST205"'* ]]; then
    log "Tabela ausente no schema cache: $table_name"
    return 1
  fi

  log "Tabela acessivel: $table_name"
}

check_tables() {
  require_env "VITE_SUPABASE_URL" || return 1
  require_env "VITE_SUPABASE_ANON_KEY" || return 1

  check_single_table "produtos" &&
    check_single_table "pedidos" &&
    check_single_table "pedido_itens"
}

run_vercel_prod() {
  vercel --prod
}

main() {
  log "Fluxo final de deploy"
  log "Diretorio: $(pwd)"

  run_step "Validar Node.js" validate_node
  run_step "Validar Supabase CLI" validate_supabase_cli
  run_step "Validar Vercel CLI" validate_vercel_cli
  run_step "Aplicar migrations com supabase db push" run_db_push
  run_step "Validar tabelas produtos, pedidos e pedido_itens" check_tables
  run_step "Executar deploy em producao na Vercel" run_vercel_prod

  log ""
  if (( STEP_FAILURES > 0 )); then
    warn "Fluxo finalizado com ${STEP_FAILURES} etapa(s) com falha."
    exit 1
  fi

  ok "Fluxo finalizado com sucesso."
}

main "$@"
