#!/usr/bin/env bash
# View RiyadaIntel locally. Run from the repo root:   bash scripts/serve.sh
# Starts the API (NestJS) and the web app (Next.js) on free ports, backgrounded so they keep
# running after this script exits. Stop them with:   bash scripts/serve.sh stop
set -euo pipefail
cd "$(dirname "$0")/.."

API_PORT="${API_PORT:-4400}"
WEB_PORT="${WEB_PORT:-3300}"
export DATABASE_URL="${DATABASE_URL:-postgresql://riyada:riyada@localhost:5440/riyada?schema=public}"

if [[ "${1:-}" == "stop" ]]; then
  pkill -f "apps/api/dist/main.js" 2>/dev/null || true
  pkill -f "next start" 2>/dev/null || true
  echo "Stopped API + web."
  exit 0
fi

# Make sure the seeded demo Postgres is up.
docker compose up -d postgres >/dev/null 2>&1 || true

# Build if needed (no-op when already built).
[[ -f apps/api/dist/main.js ]] || corepack pnpm --filter @riyada/api build
[[ -d apps/web/.next ]]        || corepack pnpm --filter @riyada/web build

echo "Starting API on :$API_PORT ..."
PORT="$API_PORT" NODE_ENV=production nohup node apps/api/dist/main.js >/tmp/riyada-api.log 2>&1 &
disown || true

echo "Starting web on :$WEB_PORT ..."
API_URL="http://localhost:$API_PORT" nohup corepack pnpm --filter @riyada/web exec next start -p "$WEB_PORT" >/tmp/riyada-web.log 2>&1 &
disown || true

sleep 4
PG="postgresql://riyada:riyada@localhost:5440/riyada"
U=$(psql "$PG" -tAc 'select id from "User" limit 1' 2>/dev/null || echo "")
ROLE=$(psql "$PG" -tAc $'select id from "JobRole" where name=\'Cloud Security Engineer\'' 2>/dev/null || echo "")
DEPT=$(psql "$PG" -tAc 'select id from "Department" limit 1' 2>/dev/null || echo "")
T=$(psql "$PG" -tAc 'select id from "Tenant" limit 1' 2>/dev/null || echo "")
O=$(psql "$PG" -tAc 'select id from "Organization" limit 1' 2>/dev/null || echo "")

cat <<EOF

────────────────────────────────────────────────────────────────────
  RiyadaIntel is running:

  WEB  (dashboards) → http://localhost:$WEB_PORT
  API  (JSON)       → http://localhost:$API_PORT/api/v1
  API  (Swagger UI) → http://localhost:$API_PORT/api/docs

  Reaching it from your laptop (the server's high ports are firewalled),
  open an SSH tunnel, then browse http://localhost:$WEB_PORT locally:

    ssh -L $WEB_PORT:localhost:$WEB_PORT -L $API_PORT:localhost:$API_PORT <you>@5.39.51.156

  See LIVE intelligence from the seeded demo (paste in another shell):

    curl -s http://localhost:$API_PORT/api/v1/users/$U/skill-gap?roleId=$ROLE \\
      -H "X-Tenant-Id: $T" -H "X-Org-Id: $O" -H "X-User-Id: $U" -H "X-Roles: org_admin" | jq

    curl -s http://localhost:$API_PORT/api/v1/compliance/dashboard?deptId=$DEPT \\
      -H "X-Tenant-Id: $T" -H "X-Org-Id: $O" -H "X-User-Id: $U" -H "X-Roles: org_admin" | jq

  Logs: /tmp/riyada-api.log   /tmp/riyada-web.log
  Stop: bash scripts/serve.sh stop
────────────────────────────────────────────────────────────────────
EOF
