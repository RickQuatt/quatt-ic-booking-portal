#!/usr/bin/env bash
# Idempotent Cloudflare bootstrap for quatt-booking-portal.
#
# Creates KV + D1 + R2 on whichever Cloudflare account you're currently
# `wrangler login`'d to, applies all D1 migrations, and prints the resource
# IDs you need to paste into wrangler.toml.
#
# Safe to re-run: existing resources are detected and skipped.
#
# Usage:
#   ./scripts/cloudflare-bootstrap.sh
#
# Prerequisites:
#   - npx wrangler login  (done once)
#   - R2 activated on the account (one-time click: Dashboard -> R2 -> Purchase R2)

set -eo pipefail  # no -u: wrangler output parsing can legitimately return empty strings

PROJECT="quatt-booking-portal"
KV_NAME="RATE_LIMIT"
D1_NAME="quatt-booking-portal-db"
R2_BUCKET="quatt-agreements"

echo "=== quatt-booking-portal Cloudflare bootstrap ==="
echo

WHOAMI_OUT="$(npx wrangler whoami 2>&1 || true)"
ACCOUNT_ID="$(echo "$WHOAMI_OUT" | grep -oE '[0-9a-f]{32}' | head -1 || true)"
if [ -z "$ACCOUNT_ID" ]; then
  echo "ERROR: could not determine Cloudflare account ID. Run 'npx wrangler login' first."
  echo "wrangler whoami output:"
  echo "$WHOAMI_OUT"
  exit 1
fi
echo "Target account: $ACCOUNT_ID"
echo

###############################################################################
# KV namespace
###############################################################################
echo "--- KV namespace: $KV_NAME ---"
KV_ID="$(npx wrangler kv namespace list 2>/dev/null | python3 -c "
import json,sys
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
for ns in data:
    if ns.get('title') == '${PROJECT}-${KV_NAME}' or ns.get('title') == '${KV_NAME}':
        print(ns.get('id',''))
        break
" 2>/dev/null || true)"

if [ -n "$KV_ID" ]; then
  echo "  EXISTS: id=$KV_ID"
else
  echo "  creating..."
  CREATE_OUT="$(npx wrangler kv namespace create "$KV_NAME" 2>&1)"
  KV_ID="$(echo "$CREATE_OUT" | grep -oE 'id = "[^"]+"' | head -1 | sed 's/id = "\(.*\)"/\1/')"
  if [ -z "$KV_ID" ]; then
    echo "  ERROR creating KV:"
    echo "$CREATE_OUT"
    exit 1
  fi
  echo "  CREATED: id=$KV_ID"
fi

###############################################################################
# D1 database
###############################################################################
echo
echo "--- D1 database: $D1_NAME ---"
D1_ID="$(npx wrangler d1 list --json 2>/dev/null | python3 -c "
import json,sys
try: d=json.load(sys.stdin)
except: sys.exit(0)
for db in d:
    if db.get('name') == '$D1_NAME':
        print(db.get('uuid','')); break
" 2>/dev/null || true)"

if [ -n "$D1_ID" ]; then
  echo "  EXISTS: uuid=$D1_ID"
else
  echo "  creating..."
  CREATE_OUT="$(npx wrangler d1 create "$D1_NAME" 2>&1)"
  D1_ID="$(echo "$CREATE_OUT" | grep -oE 'database_id = "[^"]+"' | head -1 | sed 's/database_id = "\(.*\)"/\1/')"
  if [ -z "$D1_ID" ]; then
    echo "  ERROR creating D1:"
    echo "$CREATE_OUT"
    exit 1
  fi
  echo "  CREATED: uuid=$D1_ID"
fi

# Apply all migrations from migrations/d1/ in filename order.
echo "  applying migrations..."
MIGRATIONS_DIR="migrations/d1"
if [ -d "$MIGRATIONS_DIR" ]; then
  for sql in "$MIGRATIONS_DIR"/*.sql; do
    [ -f "$sql" ] || continue
    echo "    - $(basename "$sql")"
    npx wrangler d1 execute "$D1_NAME" --remote --file="$sql" > /dev/null 2>&1 || {
      echo "      (already applied or failed; continuing)"
    }
  done
else
  echo "    (no $MIGRATIONS_DIR directory; skipping)"
fi

###############################################################################
# R2 bucket
###############################################################################
echo
echo "--- R2 bucket: $R2_BUCKET ---"
R2_CHECK="$(npx wrangler r2 bucket list 2>&1 || true)"
if echo "$R2_CHECK" | grep -qE "code[^0-9]*10042|Please enable R2"; then
  echo "  ERROR: R2 is not enabled on this account."
  echo "  Activate at: https://dash.cloudflare.com/${ACCOUNT_ID}/r2"
  echo "  (Free tier: 10 GB / 1M writes / 10M reads per month. No card required at our scale.)"
  echo "  Rerun this script after activation."
  exit 2
fi

if echo "$R2_CHECK" | grep -q "name: $R2_BUCKET" || echo "$R2_CHECK" | grep -q "^$R2_BUCKET"; then
  echo "  EXISTS"
else
  echo "  creating..."
  npx wrangler r2 bucket create "$R2_BUCKET" > /dev/null
  echo "  CREATED"
fi

###############################################################################
# Summary
###############################################################################
echo
echo "=== DONE ==="
echo
echo "Paste the following into wrangler.toml (replace existing entries if any):"
echo
cat <<EOF
# Per-IP sliding-window rate limiter for public booking endpoints.
[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "$KV_ID"

# Signed partner agreements (audit + lookup).
[[d1_databases]]
binding = "DB"
database_name = "$D1_NAME"
database_id = "$D1_ID"

# Signed partnerovereenkomst PDFs (per-sign snapshot + signature + partner fields).
[[r2_buckets]]
binding = "AGREEMENTS"
bucket_name = "$R2_BUCKET"
EOF
echo
echo "Next steps:"
echo "  1. Commit wrangler.toml with the IDs above"
echo "  2. Push secrets: ./scripts/set-secrets.sh production"
echo "  3. Deploy: npm run build && npx wrangler pages deploy dist --project-name=$PROJECT"
