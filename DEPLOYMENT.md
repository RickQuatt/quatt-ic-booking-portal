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

6. **Provision Cloudflare infra** (once per account)

   Run the bootstrap script, which is idempotent and can target any account you're `wrangler login`'d to:
   ```
   ./scripts/cloudflare-bootstrap.sh
   ```
   It creates:
   - KV namespace `RATE_LIMIT` (sliding-window rate limiter)
   - D1 database `quatt-booking-portal-db` (signed agreement audit trail)
   - R2 bucket `quatt-agreements` (signed PDF artifacts)

   It then applies all migrations in `migrations/d1/` to the new D1, and prints the resource IDs to paste into `wrangler.toml`.

   **R2 gotcha:** if this is a fresh Cloudflare account, R2 must be activated once via the dashboard (Dashboard → R2 Object Storage → Purchase R2). Free tier is enough at our scale (10 GB / 1M writes / 10M reads per month). Bootstrap script will prompt if R2 isn't activated.

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

## Cloudflare resources in use

Complete inventory; every account-specific ID is the only thing that changes between Cloudflare accounts. All are bound in `wrangler.toml`.

| Resource | Name / binding | What it holds |
|---|---|---|
| Pages project | `quatt-booking-portal` | The deployed SPA + Functions |
| D1 database | `quatt-booking-portal-db` (binding `DB`) | `signed_agreements` table; audit record for every partner signature |
| R2 bucket | `quatt-agreements` (binding `AGREEMENTS`) | Signed PDF artifacts per agreement |
| KV namespace | `RATE_LIMIT` (binding `RATE_LIMIT`) | Per-IP sliding-window rate limiter |

The D1 schema lives in `migrations/d1/`. The R2 bucket is API-only (no public listing). No queues, no Durable Objects, no Workers AI, no Images.

## Secrets (Pages environment variables)

All secrets are pushed via `scripts/set-secrets.sh` from `.dev.vars`. Here's where each one originates — useful when provisioning a fresh account:

| Secret | Source |
|---|---|
| `GOOGLE_CLIENT_ID` | GCP Console → APIs & Services → Credentials → OAuth 2.0 Client ID (Web) |
| `GOOGLE_CLIENT_SECRET` | Same row as above |
| `GOOGLE_REFRESH_TOKEN` | One-time OAuth consent flow; see `functions/lib/google-auth.ts` docstring |
| `SESSION_SECRET` | `openssl rand -hex 32` — any 32+ char random string |
| `BOOKING_SECRET` | `openssl rand -hex 32` — used to HMAC-sign reschedule/cancel tokens |
| `SUPABASE_URL` | Supabase dashboard → project settings (legacy training/kennismaking data) |
| `SUPABASE_KEY` | Supabase dashboard → project API keys (service role) |
| `RESEND_API_KEY` | Resend dashboard → API Keys |
| `EMAIL_FROM` | Verified sender in Resend (currently `Quatt Installatiepartners <noreply@mail.quatt.io>`) |
| `SLACK_BOT_TOKEN` | Slack app config → OAuth & Permissions → Bot User OAuth Token (xoxb-...) |
| `SLACK_CHANNEL_ID` | Slack channel ID where booking/agreement alerts post |
| `HUBSPOT_KENNISMAKING_FORM_ID` | HubSpot → Forms → "IC - Kennismaking Booked (API)" → GUID |
| `HUBSPOT_TRAINING_FORM_ID` | HubSpot → Forms → "IC - Training Registered (API)" → GUID |
| `HUBSPOT_TRAINING_ATTENDED_FORM_ID` | HubSpot → Forms → "IC - Training Attended (API)" → GUID |
| `IC_CALENDAR_ID` | Google Calendar → settings → calendar ID (kennismaking bookings) |
| `TRAINING_CALENDAR_ID` | Same, for training sessions |
| `IC_BOOKINGS_SHEET_ID` | Google Sheet ID from URL (ops read-only log) |
| `IC_AGREEMENTS_SHEET_ID` | Same, for agreements |
| `BASE_URL` | Deployed portal URL (e.g. `https://quatt-booking-portal.pages.dev`) |
| `APP_NAME` | Shown on login page; keep as `Quatt Booking Portal` |
| `ADMIN_TOKENS` | Comma-separated admin access tokens; generate with `openssl rand -hex 32` per admin |

## Migrating to a different Cloudflare account

If Quatt spins up a shared org account (ping Martijn Pannevis), migration is mechanical:

1. **Access:** get added as Admin to the target Cloudflare account.
2. **Switch wrangler:** `npx wrangler logout && npx wrangler login` → pick the target account in the browser auth flow.
3. **Confirm account:** `npx wrangler whoami` should show the target account ID.
4. **Bootstrap infra on the new account:**
   ```
   ./scripts/cloudflare-bootstrap.sh
   ```
   Copy the printed IDs into `wrangler.toml`. Commit the change.
5. **Copy secrets:** re-run `./scripts/set-secrets.sh production`. (Note: wrangler can't *read* existing secret values, so `.dev.vars` must still have them locally.)
6. **Export data from the old account:**
   ```
   # from old wrangler login
   npx wrangler d1 export quatt-booking-portal-db --remote --output=backup-d1.sql
   rclone sync :cf-r2-old:quatt-agreements ./backup-r2/   # rclone with old R2 creds
   ```
7. **Import data to the new account:**
   ```
   # after new wrangler login
   npx wrangler d1 execute quatt-booking-portal-db --remote --file=backup-d1.sql
   rclone sync ./backup-r2/ :cf-r2-new:quatt-agreements
   ```
8. **Deploy to the new account:**
   ```
   npm run build
   npx wrangler pages deploy dist --project-name=quatt-booking-portal
   ```
9. **DNS:** `quatt-booking-portal.pages.dev` follows the Pages project to whichever account owns it. If you use a custom domain, update CNAME targets in DNS settings.
10. **Cutover:** smoke-test the new deployment at `<new-account-subdomain>.pages.dev`, then delete the Pages project on the old account. Keep old D1/R2 for 30 days as fallback.

Estimated time end-to-end: **2 hours** if you already have all secrets in `.dev.vars`. Most time is waiting for DNS propagation.

## Trainingen calendar conventions (Skedulo / Calendly replacement)

Source of truth: Google Calendar "Trainingen" (id `c_224a0d...@group.calendar.google.com`). The booking portal mirrors this calendar into D1 via `POST /api/admin/sessions/sync`.

| Event shape on the calendar | What the portal does |
|---|---|
| All-day event (any title) | **Ignored.** Use these as Rick's placeholder "this day is still open for a potential training" markers. |
| Timed event whose title does NOT contain "training" | **Ignored.** Catches "Block", OOO, holds, personal events. |
| Timed event with title containing "training" | Imported as a bookable `training_sessions` row. |

### To schedule a real training
1. Delete the placeholder block (all-day event) for that date, if one exists
2. Create a new timed event on the Trainingen calendar:
   - **Start/end:** specific hours (e.g. 10:00 - 16:00, Europe/Amsterdam)
   - **Title:** any descriptive text containing the word "training" (e.g. `Installatie Training Quatt`). The portal strips the `Quatt Installatie Training — ` prefix and the Calendly-style `(N of M spots filled)` suffix automatically before storing.
   - **Location:** real address (`Schakelstraat 17, Amsterdam` for current HQ trainings)
   - **Description (optional):** add `Max: N` on its own line to override the default capacity of 8. Or let the portal infer from a Calendly-style `(0 of 11 spots filled)` in the title.
3. Run the sync once: `POST /api/admin/sessions/sync` with admin cookie.

### To cancel a training
Delete the timed event on the calendar. Next sync marks the D1 row `cancelled` and the session disappears from `/book/training`. Any existing partner bookings keep their reference to the cancelled row for audit, but the session stops being shown.

### To change capacity / location / time / title
Edit the calendar event directly, then run sync. The portal updates the D1 row while preserving `current_bookings` (accumulated partner bookings stay intact).

### Running the sync manually
```bash
TOKEN=$(security find-generic-password -s "quatt-booking-portal-admin" -a "rick@quatt.io" -w)
curl -sX POST -H "Cookie: admin_token=${TOKEN}" \
  -H "Origin: https://quatt-booking-portal.pages.dev" \
  "https://quatt-booking-portal.pages.dev/api/admin/sessions/sync" | jq
```

Returns a summary like `{inserted, updated, unchanged, cancelled, all_day_ignored, non_training_ignored, errors}`. Run after every calendar change, or schedule it (Mac Mini cron / GitHub Actions) to poll every 15 min.

## Known open items

- HubSpot W0 email CTA still points to the legacy `quatt-installatiepartners.vercel.app` host; needs a Rick edit to swap to the CF domain (per the "only Rick edits Rick-owned emails" policy).
- The legacy Vercel project (`quatt-installatiepartners`) is still live in parallel; retire after the W0 swap is verified.
- No Cloudflare Turnstile yet on public booking forms -- KV rate limit holds the line for now.
- Repo (`RickQuatt/quatt-booking-portal`) is public; inherited Firebase web configs visible in upstream history (not real secrets but reveals project structure).
- Currently deployed on Rick's personal Cloudflare account (`00b0aa2c7f65d025ff7369c70dbc505b`). Migration to a shared Quatt Cloudflare account is pending — see section above.
