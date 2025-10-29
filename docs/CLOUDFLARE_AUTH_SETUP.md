# Cloudflare Pages Functions Authentication Setup

This document explains how to set up the Cloudflare Pages Functions middleware that protects ALL routes (including static assets) with Firebase authentication.

## Overview

The authentication system works as follows:

1. **Unauthenticated users** visiting the site see a simple login page (served by middleware)
2. After Google OAuth login via Firebase, the **ID token is verified** using Firebase's public keys
3. A **session JWT** is created and stored as an HttpOnly cookie
4. **All subsequent requests** (including `/assets/*`) are validated against the session JWT
5. **Authenticated users** can access the full React app and all assets

## Benefits

- ✅ **Complete protection**: Static assets (`/assets/index-*.js`) are blocked without authentication
- ✅ **Zero cost**: Cloudflare Pages Functions are included (no additional service needed)
- ✅ **Lightweight**: Uses `jose` library for JWT verification (Works in Cloudflare Workers runtime)
- ✅ **No firebase-admin**: Avoids Node.js compatibility issues
- ✅ **Schema protection**: API schema in bundled JS is only accessible to authenticated users

## Setup Instructions

### 1. Generate a Session Secret

You need a strong random secret for signing session JWTs. Generate one using:

```bash
# On macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Or online: https://generate-secret.vercel.app/32
```

Save this secret - you'll need it for environment variables.

### 2. Get Your Firebase Project ID

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ → Project Settings
4. Copy the "Project ID" value

### 3. Set Cloudflare Environment Variables

#### For Production (Cloudflare Dashboard)

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to "Workers & Pages"
3. Select your "quatt-support-dashboard" project
4. Go to "Settings" → "Environment Variables"
5. Add the following variables:

| Variable Name               | Value                                                   | Notes                                                     |
| --------------------------- | ------------------------------------------------------- | --------------------------------------------------------- |
| `SESSION_SECRET`            | Output from step 1 (base64 string)                      | Click "Encrypt" - used to sign/verify session cookies     |
| `FIREBASE_PROJECT_ID`       | Your Firebase project ID                                | Used to verify Firebase ID tokens                         |
| `VITE_FIREBASE_CONFIG_JSON` | `{"apiKey":"...","authDomain":"...","projectId":"..."}` | Your existing Firebase web config (should already be set) |

**Important Notes:**

- Click "Encrypt" for `SESSION_SECRET` (sensitive value)
- Make sure to set variables for the appropriate environment (Production, Preview, etc.)
- The `VITE_FIREBASE_CONFIG_JSON` should already exist from your original setup

#### For Local Development

If you want to test the middleware to simulate production behavior locally, create a `.env` file in the project root with:

```bash
# .env
SESSION_SECRET=your-generated-secret-from-step-1
FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_CONFIG_JSON={"apiKey":"...","authDomain":"...","projectId":"..."}
```

### 4. Test Locally

Start the local development server with Cloudflare Functions:

```bash
# Build the app first
npm run build

# Run with Wrangler (serves Functions + static assets)
npx wrangler pages dev dist
```

This will start a local server (usually at `http://localhost:8788`) with:

- Middleware authentication enabled
- Session JWT creation and verification working
- Full production-like behavior

**Test the auth flow**:

1. Visit `http://localhost:8788/`
2. You should see the login page (not the React app)
3. Click "Sign in with Google"
4. After successful login, you should be redirected to the React app
5. Try accessing `http://localhost:8788/assets/index-*.js` in a new incognito window - should be blocked (401 Unauthorized)

### 5. Deploy to Cloudflare Pages

Once environment variables are set in the Cloudflare dashboard:

```bash
npm run build
# Cloudflare Pages will automatically deploy from your git push
```

## How It Works

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  User visits https://internal-support.quatt.io/                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  No session cookie?  │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Show login page     │◄─── Served by middleware
              │  (inline HTML)       │     (NO assets loaded)
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  User clicks         │
              │  "Sign in w/ Google" │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Firebase Auth       │◄─── Firebase JS SDK
              │  (popup window)      │     (loaded from CDN)
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  POST /api/create-   │
              │  session with token  │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Verify Firebase ID  │◄─── jose library verifies
              │  token with Google   │     JWT against Firebase
              │  public keys         │     public keys (JWKS)
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Create session JWT  │◄─── Signed with
              │  (14-day expiry)     │     SESSION_SECRET
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Set HttpOnly cookie │
              │  Redirect to /       │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Middleware validates│◄─── jose verifies JWT
              │  session JWT         │     with SESSION_SECRET
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Serve React app +   │◄─── ALL assets now
              │  all assets          │     accessible
              └──────────────────────┘
```

### Files Modified/Created

1. **`functions/_middleware.ts`** - Main authentication middleware
   - Intercepts ALL requests
   - Validates session JWTs using `jose`
   - Serves login page for unauthenticated users
   - Blocks all assets without valid session

2. **`functions/api/create-session.ts`** - Session creation endpoint
   - Accepts Firebase ID token from client
   - Verifies token against Firebase's public keys using `jose`
   - Creates session JWT signed with `SESSION_SECRET`
   - Returns secure HttpOnly cookie (14-day expiry)

3. **`src/firebase.tsx`** - Client-side auth helper
   - `createSessionCookie()` calls the session creation endpoint

4. **`src/App.tsx`** - Calls session creation on auth state change

## Security Features

- ✅ **HttpOnly cookies**: Session cookies cannot be accessed by JavaScript (XSS protection)
- ✅ **Secure flag**: Cookies only sent over HTTPS
- ✅ **SameSite=Strict**: CSRF protection
- ✅ **JWT verification**: Firebase ID tokens verified against Google's public keys
- ✅ **14-day expiry**: Sessions automatically expire
- ✅ **Asset protection**: Static files blocked without authentication
- ✅ **Secret-based signing**: Session JWTs signed with your secret key

## Troubleshooting

### Local dev shows "Server configuration error"

**Problem**: `SESSION_SECRET` not set

**Solution**:

- Create `.dev.vars` in project root
- Add `SESSION_SECRET=your-secret-here`
- Restart `wrangler pages dev`

### "Invalid or expired Firebase token"

**Problem**: Firebase ID token verification failed

**Solution**:

- Check that `FIREBASE_PROJECT_ID` matches your Firebase project
- Verify `VITE_FIREBASE_CONFIG_JSON` is set correctly
- Try logging out and back in

### Assets still accessible without auth

**Problem**: Middleware not running

**Solution**:

- Make sure you're testing with `wrangler pages dev dist` (not `npm run dev`)
- Check that `/functions/_middleware.ts` exists
- Verify deployment completed successfully

### "Session verification error"

**Problem**: Session JWT validation failed

**Solution**:

- Ensure `SESSION_SECRET` is set and matches between session creation and verification
- Check that the secret hasn't changed since the session was created
- Try logging out and logging back in

### Build fails with jose errors

**Problem**: jose package not installed

**Solution**:

```bash
npm install jose
```

## Maintenance

### Rotating Session Secret

To rotate the session secret (forces all users to re-login):

1. Generate a new secret: `openssl rand -base64 32`
2. Update `SESSION_SECRET` in Cloudflare dashboard
3. Redeploy the application
4. All existing sessions will be invalidated

### Monitoring

Check Cloudflare Pages logs for authentication issues:

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your project
3. Go to "Logs" → "Real-time logs"
4. Look for messages like:
   - "Valid session for user: ..."
   - "No session cookie found for: ..."
   - "Session verification error: ..."

## Costs

- **Cloudflare Pages Functions**: Free for first 100,000 requests/day
- **Firebase Authentication**: Free for unlimited users
- **jose library**: Open source, no cost

For an internal support tool, you're very unlikely to hit the 100k requests/day limit.

## Technical Details

### Why jose Instead of firebase-admin?

- **firebase-admin** requires full Node.js runtime with `fs`, `stream`, `crypto`, etc.
- **Cloudflare Workers** uses V8 isolates, not full Node.js
- **jose** is designed for edge/serverless environments
- Much smaller bundle size (jose ~50KB vs firebase-admin ~10MB+)
- Faster cold starts

### JWT Verification Process

1. **Firebase ID Token**: Verified using Firebase's public JWKS endpoint
2. **Session JWT**: Created and signed with your `SESSION_SECRET`
3. **jose library**: Handles all JWT operations (verify, sign, decode)
4. **JWKS caching**: Public keys cached for performance

### Session vs Firebase Token

- **Firebase ID Token**: Short-lived (1 hour), proves user authenticated with Google
- **Session JWT**: Long-lived (14 days), proves user already logged in to your app
- Users don't need to re-authenticate with Google for 14 days

## Reverting to Old Behavior

If you need to temporarily disable authentication:

1. Rename `functions/_middleware.ts` to `functions/_middleware.ts.disabled`
2. Redeploy
3. The React app will work as before (client-side Firebase Auth only)

**Warning**: This will re-expose static assets publicly!
