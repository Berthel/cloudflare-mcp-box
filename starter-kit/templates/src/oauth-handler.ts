/**
 * OAuth handler for upstream provider authentication.
 * Implements OAuth 2.0 authorization code flow.
 *
 * REPLACE: Search for all "REPLACE" comments and update with your provider's details.
 * Based on: https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-github-oauth
 */

import type { AuthRequest, OAuthHelpers } from "@cloudflare/workers-oauth-provider";
import { Hono } from "hono";
import {
  addApprovedClient,
  bindStateToSession,
  createOAuthState,
  generateCSRFProtection,
  isClientApproved,
  OAuthError,
  renderApprovalDialog,
  validateCSRFToken,
  validateOAuthState,
} from "./workers-oauth-utils.js";

// REPLACE: Set your provider's OAuth endpoints
const PROVIDER_AUTHORIZE_URL = "REPLACE-WITH-AUTHORIZE-URL";
export const PROVIDER_TOKEN_URL = "REPLACE-WITH-TOKEN-URL";

export type UpstreamOAuthProps = {
  email: string;
  name: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

const app = new Hono<{ Bindings: Env & { OAUTH_PROVIDER: OAuthHelpers } }>();

app.use("*", async (c, next) => {
  const required = ["UPSTREAM_CLIENT_ID", "UPSTREAM_CLIENT_SECRET", "COOKIE_ENCRYPTION_KEY"] as const;
  for (const key of required) {
    if (!c.env[key]) {
      return c.text(
        `Server configuration error: missing ${key}. Set it with: wrangler secret put ${key}`,
        500,
      );
    }
  }
  await next();
});

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/authorize", async (c) => {
  let oauthReqInfo: AuthRequest;
  try {
    oauthReqInfo = await c.env.OAUTH_PROVIDER.parseAuthRequest(c.req.raw);
  } catch (err) {
    return c.text(`Authorization request failed: ${err instanceof Error ? err.message : String(err)}`, 400);
  }
  const { clientId } = oauthReqInfo;
  if (!clientId) return c.text("Invalid request: missing client_id", 400);

  if (await isClientApproved(c.req.raw, clientId, c.env.COOKIE_ENCRYPTION_KEY)) {
    const { stateToken } = await createOAuthState(oauthReqInfo, c.env.OAUTH_KV);
    const { setCookie: sessionBindingCookie } = await bindStateToSession(stateToken);
    const responseHeaders = new Headers();
    responseHeaders.append("Set-Cookie", sessionBindingCookie);
    return redirectToProvider(c.req.raw, stateToken, c.env.UPSTREAM_CLIENT_ID, responseHeaders);
  }

  const { token: csrfToken, setCookie } = generateCSRFProtection();

  // REPLACE: Update server name, description, and logo
  return renderApprovalDialog(c.req.raw, {
    client: await c.env.OAUTH_PROVIDER.lookupClient(clientId),
    csrfToken,
    server: {
      name: "REPLACE-WITH-SERVER-NAME",
      description: "REPLACE-WITH-DESCRIPTION",
      logo: "REPLACE-WITH-LOGO-URL",
    },
    setCookie,
    state: { oauthReqInfo },
  });
});

app.post("/authorize", async (c) => {
  try {
    const formData = await c.req.raw.formData();
    validateCSRFToken(formData, c.req.raw);

    const encodedState = formData.get("state");
    if (!encodedState || typeof encodedState !== "string") {
      return c.text("Missing state in form data", 400);
    }

    let state: { oauthReqInfo?: AuthRequest };
    try {
      state = JSON.parse(atob(encodedState));
    } catch {
      return c.text("Invalid state data", 400);
    }

    if (!state.oauthReqInfo?.clientId) {
      return c.text("Invalid request", 400);
    }

    const approvedClientCookie = await addApprovedClient(
      c.req.raw,
      state.oauthReqInfo.clientId,
      c.env.COOKIE_ENCRYPTION_KEY,
    );

    const { stateToken } = await createOAuthState(state.oauthReqInfo, c.env.OAUTH_KV);
    const { setCookie: sessionBindingCookie } = await bindStateToSession(stateToken);

    const headers = new Headers();
    headers.append("Set-Cookie", approvedClientCookie);
    headers.append("Set-Cookie", sessionBindingCookie);

    return redirectToProvider(c.req.raw, stateToken, c.env.UPSTREAM_CLIENT_ID, headers);
  } catch (error: unknown) {
    if (error instanceof OAuthError) return error.toResponse();
    const message = error instanceof Error ? error.message : String(error);
    return c.text(`Internal server error: ${message}`, 500);
  }
});

app.get("/callback", async (c) => {
  if (c.req.query("error")) {
    const error = c.req.query("error");
    const desc = c.req.query("error_description") || "Unknown error";
    return c.text(`Provider authorization failed: ${error} \u2014 ${desc}`, 400);
  }

  let oauthReqInfo: AuthRequest;
  let clearSessionCookie: string;

  try {
    const result = await validateOAuthState(c.req.raw, c.env.OAUTH_KV);
    oauthReqInfo = result.oauthReqInfo;
    clearSessionCookie = result.clearCookie;
  } catch (error: unknown) {
    if (error instanceof OAuthError) return error.toResponse();
    return c.text("Internal server error during state validation", 500);
  }

  if (!oauthReqInfo.clientId) {
    return c.text("Invalid OAuth request data: missing clientId", 400);
  }

  const code = c.req.query("code");
  if (!code) return c.text("Missing authorization code", 400);

  const callbackUri = new URL("/callback", c.req.url).href;

  const tokenResponse = await fetch(PROVIDER_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: c.env.UPSTREAM_CLIENT_ID,
      client_secret: c.env.UPSTREAM_CLIENT_SECRET,
      redirect_uri: callbackUri,
      code,
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    return c.text(`Failed to exchange authorization code: ${errorText}`, 500);
  }

  // REPLACE: Adapt to your provider's token response shape.
  // Most providers return { access_token, refresh_token, expires_in }.
  // Some (like Asana) include user data in the token response.
  // Others require a separate /userinfo call — see the user info fetch below.
  const tokenData = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };

  const { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn } = tokenData;
  const expiresAt = Date.now() + expiresIn * 1000;

  // REPLACE: Fetch user info from your provider.
  // Some providers include user data in the token response (e.g. Asana).
  // Others require a separate API call (e.g. GitHub /user, Google /userinfo).
  const userResponse = await fetch("REPLACE-WITH-USERINFO-URL", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userResponse.ok) {
    return c.text("Failed to fetch user info from provider", 500);
  }

  // REPLACE: Adapt to your provider's user info response
  const userData = (await userResponse.json()) as {
    id: string;
    email: string;
    name: string;
  };

  if (!isEmailAllowed(userData.email, c.env)) {
    return renderAccessDenied(userData.email);
  }

  try {
    const { redirectTo } = await c.env.OAUTH_PROVIDER.completeAuthorization({
      request: oauthReqInfo,
      userId: userData.id,
      metadata: { label: `${userData.name} (${userData.email})` },
      scope: oauthReqInfo.scope,
      props: {
        accessToken,
        refreshToken,
        expiresAt,
        email: userData.email,
        name: userData.name,
        userId: userData.id,
      } as UpstreamOAuthProps,
    });

    const headers = new Headers({ Location: redirectTo });
    if (clearSessionCookie) {
      headers.set("Set-Cookie", clearSessionCookie);
    }

    return new Response(null, { status: 302, headers });
  } catch (error) {
    return c.text(`Failed to complete authorization: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
});

function isEmailAllowed(email: string, env: Env): boolean {
  const normalized = email.toLowerCase();

  if (env.ALLOWED_EMAIL_DOMAIN) {
    const domains = env.ALLOWED_EMAIL_DOMAIN.split(",").map(d => d.trim().toLowerCase());
    const emailDomain = normalized.split("@")[1];
    if (emailDomain && domains.includes(emailDomain)) return true;
  }

  if (env.ALLOWED_EMAILS) {
    const emails = env.ALLOWED_EMAILS.split(",").map(e => e.trim().toLowerCase());
    if (emails.includes(normalized)) return true;
  }

  if (!env.ALLOWED_EMAIL_DOMAIN && !env.ALLOWED_EMAILS) return true;

  return false;
}

function renderAccessDenied(email: string): Response {
  const safeEmail = email.replace(/[<>&"']/g, "");
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>Access Denied</title>
    <style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f9fafb;color:#333}
    .card{background:#fff;border-radius:12px;box-shadow:0 8px 36px rgba(0,0,0,.1);padding:2rem;max-width:440px;text-align:center}
    h1{font-size:1.3rem;margin-bottom:.5rem;color:#d93025}p{color:#666;line-height:1.6}
    .email{font-weight:600;color:#333}
    a{display:inline-block;margin-top:1rem;padding:.75rem 1.5rem;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:500}</style></head>
    <body><div class="card">
    <h1>Access Denied</h1>
    <p>You are signed in as <span class="email">${safeEmail}</span>, but your account does not have access to this MCP server.</p>
    <p>Contact your administrator to request access.</p>
    <a href="/">Try again</a>
    </div></body></html>`,
    { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

function redirectToProvider(
  request: Request,
  stateToken: string,
  clientId: string,
  extraHeaders?: Headers,
): Response {
  const authorizeUrl = new URL(PROVIDER_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", new URL("/callback", request.url).href);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("state", stateToken);
  // REPLACE: Add scope if your provider requires it
  // authorizeUrl.searchParams.set("scope", "read write");

  const responseHeaders = new Headers(extraHeaders);
  responseHeaders.set("Location", authorizeUrl.href);

  return new Response(null, { status: 302, headers: responseHeaders });
}

export { app as UpstreamHandler };
