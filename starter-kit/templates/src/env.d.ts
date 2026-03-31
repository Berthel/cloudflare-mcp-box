declare namespace Cloudflare {
  interface Env {
    // Durable Object binding (required for McpAgent)
    MCP_OBJECT: DurableObjectNamespace;

    // Secrets — add your API keys and tokens here
    // API_KEY: string;

    // OAuth secrets (required if using OAuth — remove if auth-less)
    // UPSTREAM_CLIENT_ID: string;
    // UPSTREAM_CLIENT_SECRET: string;
    // COOKIE_ENCRYPTION_KEY: string;

    // Email restrictions (optional, for OAuth)
    // ALLOWED_EMAIL_DOMAIN?: string;
    // ALLOWED_EMAILS?: string;

    // R2 buckets (uncomment if using R2)
    // STORAGE_BUCKET: R2Bucket;

    // KV namespaces (required for OAuth, optional otherwise)
    // OAUTH_KV: KVNamespace;
  }
}
