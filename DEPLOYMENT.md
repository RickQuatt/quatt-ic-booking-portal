# Deployment runbook

Cloudflare Pages hosts this portal. Functions live in `functions/`, SPA in `src/`.

**What's live:** five partner-facing booking pages under `/book/*`, an admin dashboard at `/admin` (token-gated), and 18 Pages Functions API routes. All public POST endpoints are rate-limited via KV and Origin-checked.

## First-time setup

1. **Create the CF Pages project**
   - Dashboard: Pages > Create > Direct Upload > name `quatt-booking-portal`
   - Production branch: `main`
   - No git connection on the CF side — GitHub Actions handles deploys

2. **Get a Cloudflare API token**
   - Dashboard: My Profile > API Tokens > Create Token
   - Template: "Edit Cloudflare Workers"
   - Permissions: Account > Cloudflare Pages > Edit
   - Copy token (only shown once)

3. **Local wrangler login** (one-time on this Mac)
   ```
   npx wrangler login
   ```

4. **Populate `.dev.vars`**
   ```
   cp .dev.vars.example .dev.vars
   # Fill in every value. Source: 1Password, legacy Vercel env, or generate with openssl rand -hex 32.
   ```

5. **Push secrets to CF**
   ```
   ./scripts/set-secrets.sh production
   ```

6. **Provision the rate-limit KV namespace** (once)
   ```
   npx wrangler kv namespace create RATE_LIMIT
   ```
   Then put the returned `id` into `wrangler.toml` under `[[kv_namespaces]]`.

## Deploying from local

```
npm run build
npx wrangler pages deploy dist --project-name=quatt-booking-portal --branch=main
```

First deploy gives you `quatt-booking-portal.pages.dev`. Smoke-test it before doing anything else.

## Deploying via GitHub Actions

Workflow: `.github/workflows/deploy.yml`. Triggers on `main` push and PRs.

Required repo secrets (`Settings > Secrets and variables > Actions`):
- `CLOUDFLARE_API_TOKEN` -- the token from step 2
- `CLOUDFLARE_ACCOUNT_ID` -- found in CF dashboard sidebar (or `npx wrangler whoami`)

Once those are set, every push to `main` deploys to production; every PR deploys to a preview URL and comments the URL on the PR.

## Smoke test after deploy

```
# SPA + booking pages should 200
curl -so/dev/null -w "%{http_code}\n" https://quatt-booking-portal.pages.dev/
curl -so/dev/null -w "%{http_code}\n" https://quatt-booking-portal.pages.dev/book/kennismaking
curl -so/dev/null -w "%{http_code}\n" https://quatt-booking-portal.pages.dev/book/training
curl -so/dev/null -w "%{http_code}\n" https://quatt-booking-portal.pages.dev/book/agreement

# Public APIs return JSON
curl -s https://quatt-booking-portal.pages.dev/api/sessions
curl -s 'https://quatt-booking-portal.pages.dev/api/slots?date=YYYY-MM-DD&format=showroom'

# Security headers present
curl -sI https://quatt-booking-portal.pages.dev | grep -iE "content-security|strict-transport|x-frame|permissions-policy"

# CSRF defense on cross-origin POSTs returns 403
curl -so/dev/null -w "%{http_code}\n" -X POST https://quatt-booking-portal.pages.dev/api/bookings \
  -H "Content-Type: application/json" \
  -H "Origin: https://evil.example.com" \
  -d '{"type":"training"}'

# Admin gate redirects unauthenticated users
curl -so/dev/null -w "%{http_code}\n" https://quatt-booking-portal.pages.dev/admin
```

Expected: `200 200 200 200 [json] [json] [headers present] 403 303`.

> **Do not** trigger a real booking POST as a smoke test -- it sends a Resend email, creates a Google Calendar invite, posts to Slack, and writes a HubSpot contact property. Use the bad-`type` body above to verify the endpoint without side effects.

## Security model

| Layer | Implementation |
|---|---|
| Auth (admin) | Static `ADMIN_TOKENS` (comma-separated), timing-safe compare in `functions/lib/admin-auth.ts` and `functions/api/admin/auth.ts`. Cookie HttpOnly+Secure+SameSite=Strict. |
| Auth (Google OAuth) | Google Identity Services JWT, `@quatt.io` domain restriction enforced in `functions/api/create-session.ts`. Session JWT (jose, HS256, 14d). |
| Action tokens | HMAC-SHA-256 signed reschedule/cancel links, 30-day TTL, in `functions/lib/booking-tokens.ts`. |
| Rate limits | KV sliding window (`functions/lib/rate-limit.ts`): bookings 5/10min, agreements 3/10min, admin-auth 5/5min, login 10/5min. |
| CSRF | Origin/Referer host-match check on all state-changing public POSTs. |
| Headers | CSP, HSTS preload (1y), X-Frame DENY, COOP, Permissions-Policy, Referrer-Policy, X-Content-Type-Options. Applied in `functions/lib/security-headers.ts`, wrapped over every response by the global `_middleware.ts`. |
| CORS | Same-origin only. Whitelist mechanism in `ALLOWED_API_ORIGINS` if external apps ever need access. |

## Rolling back

```
npx wrangler pages deployment list --project-name=quatt-booking-portal
npx wrangler pages deployment rollback <deployment-id> --project-name=quatt-booking-portal
```

Or CF dashboard: Pages > Deployments > ... > Rollback.

## Known open items

- HubSpot W0 email CTA still points to the legacy `quatt-installatiepartners.vercel.app` host; needs a Rick edit to swap to the CF domain (per the "only Rick edits Rick-owned emails" policy).
- The legacy Vercel project (`quatt-installatiepartners`) is still live in parallel; retire after the W0 swap is verified.
- No Cloudflare Turnstile yet on public booking forms -- KV rate limit holds the line for now.
- Repo (`RickQuatt/quatt-booking-portal`) is public; inherited Firebase web configs visible in upstream history (not real secrets but reveals project structure).
