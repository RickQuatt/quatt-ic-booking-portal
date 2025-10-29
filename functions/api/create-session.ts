import { jwtVerify, SignJWT } from "jose";

// Firebase's public keys endpoint for JWT verification
const FIREBASE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

interface SessionRequest {
  idToken: string;
}

interface Env {
  FIREBASE_PROJECT_ID: string;
  SESSION_SECRET: string;
}

/**
 * Fetch and parse JWKS from Firebase manually
 */
async function getFirebasePublicKeys(): Promise<any> {
  const response = await fetch(FIREBASE_JWKS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch JWKS: ${response.status}`);
  }
  const jwks = await response.json();
  return jwks;
}

/**
 * Verify a Firebase ID token using Google's public keys
 */
async function verifyFirebaseIdToken(
  idToken: string,
  projectId: string,
): Promise<{ payload?: any; error?: any }> {
  try {
    console.log("Starting Firebase ID token verification");

    // Decode the token header to get the key ID (kid)
    const tokenParts = idToken.split(".");
    if (tokenParts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    const header = JSON.parse(atob(tokenParts[0]));

    const kid = header.kid;

    if (!kid) {
      throw new Error("Token header missing kid");
    }

    // Fetch JWKS and find the matching key
    const jwks = await getFirebasePublicKeys();

    const key = jwks.keys.find((k: any) => k.kid === kid);

    if (!key) {
      throw new Error(`No matching key found for kid: ${kid}`);
    }

    // Verify the JWT with the JWK directly (don't import as CryptoKey)
    const { payload } = await jwtVerify(idToken, key, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    return { payload };
  } catch (error) {
    console.error("Token verification failed:", error);
    return {
      error: {
        type: error instanceof Error ? error.constructor.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        code:
          error instanceof Error && "code" in error
            ? (error as any).code
            : undefined,
        projectId,
        expectedIssuer: `https://securetoken.google.com/${projectId}`,
        expectedAudience: projectId,
      },
    };
  }
}

/**
 * Create a session JWT token
 */
async function createSessionToken(
  uid: string,
  email: string | undefined,
  sessionSecret: string,
) {
  const secret = new TextEncoder().encode(sessionSecret);

  const jwt = await new SignJWT({
    uid,
    email,
    type: "session",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("quatt-support-dashboard")
    .setAudience("quatt-support-dashboard")
    .setExpirationTime("14d") // 14 days
    .sign(secret);

  return jwt;
}

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}) => {
  const { request, env } = context;

  try {
    // Parse request body
    const body = (await request.json()) as SessionRequest;
    const { idToken } = body;

    if (!idToken) {
      return new Response(JSON.stringify({ error: "Missing idToken" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get required environment variables
    const projectId = env.FIREBASE_PROJECT_ID as string | undefined;
    const sessionSecret = env.SESSION_SECRET as string | undefined;

    if (!projectId || !sessionSecret) {
      console.error("Missing required environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Verify the Firebase ID token
    const result = await verifyFirebaseIdToken(idToken, projectId as string);

    if (result.error) {
      return new Response(
        JSON.stringify({
          error: "Invalid or expired Firebase token",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const payload = result.payload;
    if (!payload || !payload.sub) {
      return new Response(
        JSON.stringify({ error: "Invalid token payload - missing sub claim" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Create our own session JWT
    const sessionToken = await createSessionToken(
      payload.sub,
      payload.email as string | undefined,
      sessionSecret as string,
    );

    // Set cookie with secure flags
    // Only use Secure flag in production (HTTPS) - local dev uses HTTP
    const isProduction = request.url.startsWith("https://");
    const expiresIn = 60 * 60 * 24 * 14; // 14 days in seconds
    const cookieOptions = [
      `session=${sessionToken}`,
      "Path=/",
      `Max-Age=${expiresIn}`,
      ...(isProduction ? ["HttpOnly", "Secure"] : []),
      "SameSite=Strict",
    ].join("; ");

    return new Response(
      JSON.stringify({
        success: true,
        uid: payload.sub,
        email: payload.email,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookieOptions,
        },
      },
    );
  } catch (error) {
    console.error("Error creating session cookie:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create session cookie" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
