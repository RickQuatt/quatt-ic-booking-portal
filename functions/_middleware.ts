import { jwtVerify } from "jose";

interface Env {
  SESSION_SECRET: string;
  VITE_FIREBASE_CONFIG_JSON: string;
}

/**
 * Generate login page HTML with Firebase config injected
 */
function getLoginPageHTML(firebaseConfig: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quatt Support Dashboard - Login</title>
  <link rel="icon" type="image/png" href="/favicon.png" />
  <link rel="apple-touch-icon" href="/favicon.png" />
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .login-container {
      background: white;
      padding: 48px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 400px;
    }
    h1 {
      margin: 0 0 24px 0;
      font-size: 24px;
      color: #333;
    }
    button {
      background: #d9ff5c;
      color: #071413;
      border: 2px solid #071413;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 20px;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
    }
    button:hover {
      background: #c4e852;
      transform: translateY(-1px);
    }
    button:disabled {
      background: #ccc;
      color: #666;
      cursor: not-allowed;
      transform: none;
    }
    .error {
      color: #d93025;
      margin-top: 16px;
      font-size: 14px;
    }
  </style>
  <script type="module">
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
    import { getAuth, signInWithPopup, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

    // Initialize Firebase (config injected from environment)
    let auth;
    try {
      const firebaseConfig = JSON.parse('${firebaseConfig}');
      const app = initializeApp(firebaseConfig);
      auth = getAuth(app);
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      const errorDiv = document.getElementById('error');
      if (errorDiv) {
        errorDiv.textContent = 'Firebase configuration error. Please check server logs.';
      }
      throw error;
    }

    // Validate return URL to prevent open redirect vulnerabilities
    // Note: This is a browser-side duplicate of the server-side validation
    function isValidReturnUrl(url) {
      if (!url) return false;

      // Must start with / but not // (prevents protocol-relative URLs)
      if (!url.startsWith('/') || url.startsWith('//')) {
        return false;
      }

      // Prevent path traversal
      if (url.includes('..')) {
        return false;
      }

      // Validate URL structure and ensure it's relative to current origin
      try {
        const parsed = new URL(url, window.location.origin);
        // Ensure the parsed URL is still on the same origin
        return parsed.origin === window.location.origin;
      } catch {
        return false;
      }
    }

    async function signInWithGoogle() {
      const button = document.getElementById('loginButton');
      const errorDiv = document.getElementById('error');

      try {
        button.disabled = true;
        button.textContent = 'Signing in...';
        errorDiv.textContent = '';

        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const idToken = await result.user.getIdToken();

        // Create session cookie
        const response = await fetch('/api/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to create session');
        }

        // Redirect to the original URL if provided and valid, otherwise go to root
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrl = urlParams.get('returnUrl');
        const safeReturnUrl = returnUrl && isValidReturnUrl(returnUrl) ? returnUrl : '/';
        window.location.href = safeReturnUrl;
      } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Login failed. Please try again.';
        button.disabled = false;
        button.textContent = 'Sign in with Google';
      }
    }

    window.signInWithGoogle = signInWithGoogle;
  </script>
</head>
<body>
  <div class="login-container">
    <h1>Quatt Support Dashboard</h1>
    <p>Please sign in to continue</p>
    <button id="loginButton" onclick="signInWithGoogle()">Sign in with Google</button>
    <div id="error" class="error"></div>
  </div>
</body>
</html>
`;
}

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/favicon.ico",
  "/favicon.png",
  "/manifest.json",
  "/robots.txt",
];

/**
 * Validate return URL to prevent open redirect vulnerabilities
 * Only allows safe relative URLs within the application
 *
 * Security checks:
 * - Must be relative path starting with /
 * - Must not be protocol-relative (//)
 * - Must not contain path traversal (..)
 * - Must parse as valid URL structure
 *
 * Note: This validation is duplicated in browser-side code (login page HTML)
 * for defense-in-depth, as both contexts need independent validation.
 */
function isValidReturnUrl(url: string): boolean {
  if (!url) return false;

  // Must start with / but not // (prevents protocol-relative URLs)
  if (!url.startsWith("/") || url.startsWith("//")) {
    return false;
  }

  // Prevent path traversal attacks
  if (url.includes("..")) {
    return false;
  }

  // Additional validation: ensure reasonable path length
  if (url.length > 2048) {
    return false;
  }

  // Validate URL structure by parsing with a dummy base
  try {
    const parsed = new URL(url, "https://dummy.example.com");

    // Ensure the URL is still on the dummy origin (not redirected externally)
    if (parsed.origin !== "https://dummy.example.com") {
      return false;
    }

    // Ensure path hasn't been manipulated by URL parsing
    // (e.g., encoded characters that could bypass validation)
    const pathWithQuery = url.split("#")[0]; // Remove fragment
    if (parsed.pathname !== pathWithQuery.split("?")[0]) {
      // Path was normalized differently than expected
      return false;
    }

    return true;
  } catch {
    // Invalid URL structure
    return false;
  }
}

/**
 * Create login redirect URL with return path
 */
function createLoginRedirectUrl(
  request: Request,
  currentPath: string,
  search: string,
): URL {
  const loginUrl = new URL("/", request.url);
  const returnUrl = currentPath + search;
  // Only set returnUrl if it's valid
  if (isValidReturnUrl(returnUrl)) {
    loginUrl.searchParams.set("returnUrl", returnUrl);
  }
  return loginUrl;
}

/**
 * Verify session JWT token
 */
async function verifySessionToken(sessionToken: string, sessionSecret: string) {
  try {
    const secret = new TextEncoder().encode(sessionSecret);

    const { payload } = await jwtVerify(sessionToken, secret, {
      issuer: "quatt-support-dashboard",
      audience: "quatt-support-dashboard",
    });

    return payload;
  } catch (error) {
    console.error("Session verification error:", error);
    return null;
  }
}

/**
 * Extract session cookie from request
 */
function getSessionCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const sessionCookie = cookies.find((c) => c.startsWith("session="));

  if (!sessionCookie) return null;

  return sessionCookie.split("=")[1];
}

export const onRequest = async (context: {
  request: Request;
  next: () => Promise<Response>;
  env: Env;
}) => {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // Allow public paths
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }

  // Allow the session creation endpoint
  if (url.pathname === "/api/create-session") {
    return next();
  }

  // Get Firebase config from environment
  const firebaseConfigJson = env.VITE_FIREBASE_CONFIG_JSON as
    | string
    | undefined;

  if (!firebaseConfigJson) {
    console.error("VITE_FIREBASE_CONFIG_JSON not configured");
    console.error("Available env keys:", Object.keys(env));
    return new Response(
      "Server configuration error: Firebase config not set. Please add VITE_FIREBASE_CONFIG_JSON to Cloudflare environment variables.",
      {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      },
    );
  }

  // Validate it's valid JSON
  try {
    JSON.parse(firebaseConfigJson);
  } catch (e) {
    console.error("Invalid VITE_FIREBASE_CONFIG_JSON:", e);
    return new Response(
      "Server configuration error: Invalid Firebase config JSON",
      {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      },
    );
  }

  // Get session cookie
  const sessionCookie = getSessionCookie(request);

  // No session cookie - show login page for root, block everything else
  if (!sessionCookie) {
    console.log("No session cookie found for:", url.pathname);

    // For root path, show our simple login page
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(getLoginPageHTML(firebaseConfigJson), {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Block ALL other paths including /assets/* - redirect to login with return URL
    const loginUrl = createLoginRedirectUrl(request, url.pathname, url.search);
    return Response.redirect(loginUrl, 303);
  }

  // Get session secret from environment
  const sessionSecret = env.SESSION_SECRET as string | undefined;

  if (!sessionSecret) {
    console.error("SESSION_SECRET not configured");
    return new Response("Server configuration error", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Verify session cookie
  const payload = await verifySessionToken(
    sessionCookie,
    sessionSecret as string,
  );

  if (!payload) {
    console.log("Invalid session cookie for:", url.pathname);

    // Clear invalid cookie
    const headers = new Headers();
    headers.set(
      "Set-Cookie",
      "session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict",
    );

    // Show login page again
    if (url.pathname === "/" || url.pathname === "/index.html") {
      headers.set("Content-Type", "text/html");
      return new Response(getLoginPageHTML(firebaseConfigJson), {
        status: 200,
        headers,
      });
    }

    // Block other paths - redirect to login with return URL
    const loginUrl = createLoginRedirectUrl(request, url.pathname, url.search);
    headers.set("Location", loginUrl.toString());
    return new Response(null, {
      status: 303,
      headers,
    });
  }

  console.log(
    "Valid session for user:",
    payload.uid,
    "accessing:",
    url.pathname,
  );

  // Valid session, allow the request to proceed to the actual app
  return next();
};
