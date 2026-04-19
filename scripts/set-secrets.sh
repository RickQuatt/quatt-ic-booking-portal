#!/usr/bin/env bash
# Pushes every secret in .dev.vars to Cloudflare Pages as a production secret.
#
# Usage:
#   ./scripts/set-secrets.sh production
#   ./scripts/set-secrets.sh preview
#
# Requires: `wrangler login` run first. Needs .dev.vars populated with real values.

set -euo pipefail

ENV_NAME="${1:-production}"
VARS_FILE=".dev.vars"
PROJECT="quatt-booking-portal"

if [ ! -f "$VARS_FILE" ]; then
  echo "ERROR: $VARS_FILE not found. Copy .dev.vars.example and fill in values first."
  exit 1
fi

# Keys that don't belong as secrets -- skip them.
# (Booking portal currently has no [vars]-tier keys; list reserved for future use.)
SKIP_KEYS=()

is_skipped() {
  local key="$1"
  for skip in "${SKIP_KEYS[@]:-}"; do
    [ "$key" = "$skip" ] && return 0
  done
  return 1
}

echo "Pushing secrets to CF Pages environment: $ENV_NAME (project: $PROJECT)"
echo ""

while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ "$key" =~ ^[[:space:]]*# ]] && continue
  [[ -z "$key" ]] && continue

  # Trim whitespace
  key="$(echo "$key" | xargs)"
  value="$(echo "$value" | xargs)"

  # Skip non-secrets
  if is_skipped "$key"; then
    echo "  SKIP  $key (set via wrangler.toml)"
    continue
  fi

  # Skip empty values
  if [ -z "$value" ]; then
    echo "  SKIP  $key (empty value)"
    continue
  fi

  echo "  PUSH  $key"
  echo -n "$value" | npx wrangler pages secret put "$key" \
    --project-name "$PROJECT" \
    ${ENV_NAME:+--env "$ENV_NAME"} \
    > /dev/null
done < "$VARS_FILE"

echo ""
echo "Done. Verify in CF dashboard: Pages > $PROJECT > Settings > Environment variables."
