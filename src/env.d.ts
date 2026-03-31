declare namespace Cloudflare {
  interface Env {
    // Durable Object binding (required for McpAgent)
    MCP_OBJECT: DurableObjectNamespace;

    // KV namespace (required for OAuth state management)
    OAUTH_KV: KVNamespace;

    // Box OAuth credentials
    BOX_CLIENT_ID: string;
    BOX_CLIENT_SECRET: string;

    // Cookie encryption for OAuth consent flow
    COOKIE_ENCRYPTION_KEY: string;

    // Email restrictions (optional)
    ALLOWED_EMAIL_DOMAIN?: string;
    ALLOWED_EMAILS?: string;
  }
}
