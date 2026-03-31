# Cloudflare Workers MCP Server — Referencearkitektur

Denne fil dokumenterer de Cloudflare-specifikke mønstre, konfigurationer og erfaringer fra `amdk-wildapricot-mcp`-projektet. Formålet er at gøre det nemt at bootstrappe et nyt MCP-serverprojekt på Cloudflare Workers.

## Indholdsfortegnelse

- [Arkitekturoversigt](#arkitekturoversigt)
- [Projektscaffolding](#projektscaffolding)
- [Wrangler-konfiguration](#wrangler-konfiguration)
- [McpAgent og Durable Objects](#mcpagent-og-durable-objects)
- [Fetch handler og routing](#fetch-handler-og-routing)
- [Tool-registrering med Zod](#tool-registrering-med-zod)
- [Env-typer og secrets](#env-typer-og-secrets)
- [R2 objektlager](#r2-objektlager)
- [Cloudflare Access for SaaS (SSO)](#cloudflare-access-for-saas-sso)
- [Lokal udvikling](#lokal-udvikling)
- [Deploy og secrets management](#deploy-og-secrets-management)
- [Test med MCP Inspector](#test-med-mcp-inspector)
- [Erfaringer og gotchas](#erfaringer-og-gotchas)

---

## Arkitekturoversigt

```
MCP-klient (Claude Cowork, AI Playground, Inspector)
  │
  │  Streamable HTTP
  ▼
Cloudflare Worker (fetch handler)
  │
  ├─ /mcp → McpAgent.serve() → Durable Object (1 per session)
  │         └─ MCP tools registreres i init()
  │
  ├─ /andre-routes → Stateless request handling
  │
  └─ Bindings: secrets, R2 buckets, KV namespaces
```

Nøglebeslutning: **`McpAgent`** (stateful, Durable Object per session) vs **`createMcpHandler()`** (stateless, ingen DO). Vælg `McpAgent` når tools har brug for sessionsstate (f.eks. turn-historik, caches). Vælg `createMcpHandler()` til simple, stateless tools.

| Tilgang | Stateful? | Kræver DO? | Bedst til |
|---|---|---|---|
| `createMcpHandler()` | Nej | Nej | Stateless tools, simpel opsætning |
| `McpAgent` | Ja | Ja | Sessionsstate, elicitation |
| Raw `WebStandardStreamableHTTPServerTransport` | Nej | Nej | Fuld kontrol, ingen SDK-afhængighed |

---

## Projektscaffolding

### Fra template (hurtigste vej)

```bash
# Authless (åben adgang)
pnpm create cloudflare@latest my-mcp-server --template=cloudflare/ai/demos/remote-mcp-authless

# Med Cloudflare Access (SSO)
pnpm create cloudflare@latest my-mcp-server --template=cloudflare/ai/demos/remote-mcp-cf-access

# Med GitHub OAuth
pnpm create cloudflare@latest my-mcp-server --template=cloudflare/ai/demos/remote-mcp-github-oauth
```

### Manuel opsætning (fuld kontrol)

**package.json** — minimumsafhængigheder for en McpAgent-baseret server:

```json
{
  "name": "my-mcp-server",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "start": "wrangler dev",
    "deploy": "wrangler deploy",
    "cf-typegen": "wrangler types",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "agents": "^0.5.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20250214.0",
    "typescript": "^5.7.0",
    "wrangler": "^4.0.0"
  }
}
```

Pakken `agents` re-eksporterer `McpAgent` fra Cloudflare Agents SDK og trækker `@modelcontextprotocol/sdk` med som transient dependency.

**tsconfig.json**:

```json
{
  "compilerOptions": {
    "target": "es2021",
    "lib": ["es2021"],
    "jsx": "react-jsx",
    "module": "es2022",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "noEmit": true,
    "isolatedModules": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["worker-configuration.d.ts", "src/**/*.ts"]
}
```

**OBS:** `worker-configuration.d.ts` genereres af `wrangler types` og skal stå i `.gitignore`. `tsconfig.json` refererer til den, men filen behøver ikke eksistere for at TypeScript fungerer — `src/env.d.ts` supplerer med egne type declarations.

**.gitignore**:

```gitignore
node_modules/
.env
.env.local
.dev.vars
.wrangler/
dist/
*.tsbuildinfo
.DS_Store
worker-configuration.d.ts
```

---

## Wrangler-konfiguration

**wrangler.jsonc** — minimal McpAgent-konfiguration:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-mcp-server",
  "main": "src/index.ts",
  "compatibility_date": "2025-03-10",
  "compatibility_flags": ["nodejs_compat"],

  // Durable Objects — påkrævet for McpAgent
  "migrations": [
    {
      "new_sqlite_classes": ["MyMcpAgent"],
      "tag": "v1"
    }
  ],
  "durable_objects": {
    "bindings": [
      {
        "class_name": "MyMcpAgent",
        "name": "MCP_OBJECT"
      }
    ]
  },

  // EU-jurisdiction (valgfrit, relevant for GDPR)
  "placement": {
    "region": "aws:eu-central-1"
  },

  "observability": {
    "enabled": true
  }
}
```

### Vigtige felter

- **`compatibility_flags: ["nodejs_compat"]`** — påkrævet af `agents`-pakken for Node.js API-kompatibilitet
- **`migrations`** — `new_sqlite_classes` registrerer DO-klassen med SQLite-backing (bruges af McpAgent til intern state). Hvert nyt tag kræves ved schema-ændringer.
- **`durable_objects.bindings`** — kobler DO-klassen til et binding-navn. `class_name` skal matche den eksporterede klasse i `src/index.ts`.
- **`placement.region`** — begrænser DO-placering til en specifik region. Nyttigt for GDPR-compliance.

### Med R2 (objektlager til billeder o.l.)

Tilføj R2-binding til wrangler.jsonc:

```jsonc
{
  // ... eksisterende config ...

  "r2_buckets": [
    {
      "binding": "IMAGE_BUCKET",
      "bucket_name": "my-mcp-images"
    }
  ]
}
```

Opret bucket: `npx wrangler r2 bucket create my-mcp-images`

### Med KV (påkrævet for OAuth-flows)

Tilføj KV-binding:

```jsonc
{
  // ... eksisterende config ...

  "kv_namespaces": [
    {
      "binding": "OAUTH_KV",
      "id": "<KV_NAMESPACE_ID>"
    }
  ]
}
```

Opret namespace: `npx wrangler kv namespace create "OAUTH_KV"`

---

## McpAgent og Durable Objects

### Minimal McpAgent-klasse

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";

export class MyMcpAgent extends McpAgent {
  server = new McpServer({
    name: "My MCP Server",
    version: "0.1.0",
  });

  async init() {
    // Opret clients, registrér tools
    // this.env giver adgang til alle Cloudflare bindings og secrets
    // this.ctx giver adgang til Durable Object state (this.ctx.storage)
  }
}
```

### Hvad McpAgent giver

- **`this.env`** — alle environment bindings (secrets, R2, KV, etc.)
- **`this.ctx`** — Durable Object context med `storage` til persistent state
- **`this.server`** — McpServer-instansen til tool/resource/prompt-registrering
- **Automatisk sessionshåndtering** — én DO-instans per MCP-session
- **Streamable HTTP + SSE transport** — håndteres automatisk

### Sessionsstate i Durable Objects

McpAgent kører i en Durable Object, så instansvariable overlever mellem tool-kald i samme session:

```typescript
export class MyMcpAgent extends McpAgent {
  // Disse variabler lever så længe sessionen er aktiv
  private turnHistory: TurnEntry[] = [];
  private sessionMetadata: Record<string, unknown> = {};

  server = new McpServer({ name: "Example", version: "0.1.0" });

  async init() {
    this.server.tool("my_tool", { prompt: z.string() }, async (args) => {
      // Tilgå og opdatér instansstate
      this.turnHistory.push({ prompt: args.prompt, timestamp: Date.now() });
      // ...
    });
  }
}
```

For persistent state (overlever DO-eviction), brug `this.ctx.storage`:

```typescript
await this.ctx.storage.put("key", value);
const stored = await this.ctx.storage.get<MyType>("key");
```

---

## Fetch handler og routing

Workers fetch handler styrer routing. `/mcp` delegeres til McpAgent:

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // MCP endpoint — delegér til Durable Object
    if (url.pathname === "/mcp") {
      return MyMcpAgent.serve("/mcp").fetch(request, env, ctx);
    }

    // EU-jurisdiction (valgfrit)
    // return MyMcpAgent.serve("/mcp", { jurisdiction: "eu" }).fetch(request, env, ctx);

    // Andre routes håndteres stateless
    if (url.pathname === "/health") {
      return new Response("OK");
    }

    if (url.pathname === "/") {
      return new Response("My MCP Server", {
        headers: { "content-type": "text/plain" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};
```

**Vigtigt:** McpAgent-klassen SKAL eksporteres som named export fra entry point (Wrangler kræver det for DO-bindings).

---

## Tool-registrering med Zod

Tools registreres på `McpServer`-instansen, typisk i `init()`:

```typescript
import { z } from "zod";

this.server.tool(
  "tool_name",
  "Kort beskrivelse til LLM'en",
  {
    param1: z.string().describe("Beskrivelse af param1"),
    param2: z.number().optional().describe("Valgfri param2"),
  },
  async (args) => {
    // args er allerede valideret mod Zod-schema
    const result = await doSomething(args.param1, args.param2);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);
```

### Organisering i større projekter

Brug `registerXxxTools(server, ...deps)`-funktioner i separate filer:

```
src/
  index.ts              # McpAgent + fetch handler
  tools/
    images.ts           # registerImageTools(server, client, bucket)
    sessions.ts         # registerSessionTools(server, storage)
```

```typescript
// src/tools/images.ts
export function registerImageTools(
  server: McpServer,
  geminiClient: GeminiClient,
  bucket: R2Bucket,
) {
  server.tool("generate_image", "...", { /* schema */ }, async (args) => {
    // ...
  });
}
```

---

## Env-typer og secrets

### Type declarations

```typescript
// src/env.d.ts
declare namespace Cloudflare {
  interface Env {
    // Secrets
    GOOGLE_API_KEY: string;

    // R2 buckets
    IMAGE_BUCKET: R2Bucket;

    // KV namespaces (for OAuth)
    OAUTH_KV: KVNamespace;

    // Andre bindings...
  }
}
```

Kør `npx wrangler types` for at generere `worker-configuration.d.ts` med bindings fra wrangler.jsonc. De to filer supplerer hinanden — `env.d.ts` dækker secrets som ikke er i wrangler.jsonc.

### Secrets i dev vs production

| Kontekst | Metode | Fil/kommando |
|---|---|---|
| Lokal udvikling | `.dev.vars` fil | `GOOGLE_API_KEY=sk-...` |
| Production | Wrangler CLI | `echo "sk-..." \| npx wrangler secret put GOOGLE_API_KEY` |

`.dev.vars` skal stå i `.gitignore`. Wrangler læser den automatisk under `wrangler dev`.

---

## R2 objektlager

R2 er Cloudflare's S3-kompatible objektlager. Tilgås direkte fra Workers via bindings.

### Opsætning

1. Opret bucket: `npx wrangler r2 bucket create my-images`
2. Tilføj binding i wrangler.jsonc (se [Wrangler-konfiguration](#med-r2-objektlager-til-billeder-ol))
3. Tilgå via `env.IMAGE_BUCKET` i Worker-koden

### Grundlæggende operationer

```typescript
// Upload (put)
await env.IMAGE_BUCKET.put("sessions/abc123/output.png", imageBytes, {
  httpMetadata: { contentType: "image/png" },
  customMetadata: { sessionId: "abc123", model: "gemini-3.1-flash" },
});

// Download (get)
const object = await env.IMAGE_BUCKET.get("sessions/abc123/output.png");
if (object) {
  const bytes = await object.arrayBuffer();
  const contentType = object.httpMetadata?.contentType;
}

// Slet
await env.IMAGE_BUCKET.delete("sessions/abc123/output.png");

// List med prefix
const listed = await env.IMAGE_BUCKET.list({ prefix: "sessions/abc123/" });
for (const item of listed.objects) {
  console.log(item.key, item.size);
}
```

### Signed URLs (tidsbegrænset adgang)

R2 understøtter ikke signed URLs direkte fra Workers-binding. To strategier:

1. **Worker-proxy:** Eksponér en `/images/:key`-route der henter fra R2 og returnerer billedet med passende headers.
2. **S3-kompatibel API:** Brug R2's S3-kompatible endpoint med `@aws-sdk/client-s3` og `@aws-sdk/s3-request-presigner` til at generere presigned URLs.

### Lifecycle / oprydning

R2 har ikke indbygget TTL. Implementér oprydning via:
- Cron Triggers (Cloudflare Workers Cron)
- Custom metadata med timestamp + periodisk cleanup

---

## OAuth med ekstern provider (OAuthProvider)

For at bruge en ekstern OAuth-provider (f.eks. Asana, GitHub, Linear) som upstream auth for MCP-serveren.

### Arkitektur

```
MCP-klient (Claude Cowork)
  │  Streamable HTTP
  ▼
OAuthProvider (default export — erstatter fetch handler)
  ├─ /authorize → Consent dialog → Redirect til upstream provider
  ├─ /callback  → Token exchange → completeAuthorization()
  ├─ /token     → MCP client token endpoint (auto-håndteret)
  ├─ /register  → Dynamic client registration (auto-håndteret)
  └─ /mcp       → McpAgent.serve() (apiHandler)
```

### Nøglepakker

```json
{
  "dependencies": {
    "@cloudflare/workers-oauth-provider": "^0.3.2",
    "agents": "^0.5.0",
    "hono": "^4.12.9",
    "zod": "^3.24.0"
  }
}
```

### Default export ved OAuth

Ved OAuth er default export IKKE et `{ fetch() }` objekt, men en `OAuthProvider`-instans:

```typescript
import OAuthProvider from "@cloudflare/workers-oauth-provider";

export default new OAuthProvider({
  apiHandler: MyMcpAgent.serve("/mcp"),
  apiRoute: "/mcp",
  defaultHandler: UpstreamHandler,      // Hono app med /authorize, /callback
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",
});
```

### McpAgent med OAuth props

McpAgent modtager upstream OAuth tokens via `this.props`:

```typescript
export class MyMcpAgent extends McpAgent<Env, unknown, UpstreamOAuthProps> {
  async init() {
    const accessToken = this.props.accessToken;
    const client = new ApiClient(accessToken, () => this.refreshAccessToken());
    registerMyTools(this.server, client);
  }
}
```

### Token refresh

Gem tokens i DO storage og refresh ved behov:

```typescript
async refreshAccessToken(): Promise<string> {
  const storedTokens = await this.ctx.storage.get<StoredTokens>("tokens");
  const refreshToken = storedTokens?.refreshToken ?? this.props?.refreshToken;
  // POST til provider's token endpoint med grant_type=refresh_token
  const tokenData = await fetchNewToken(refreshToken);
  await this.ctx.storage.put("tokens", { ...tokenData });
  return tokenData.accessToken;
}
```

### OAuth handler (Hono)

OAuth-handleren er en Hono-app med tre routes:

- **GET /authorize** — Viser consent dialog, redirecter til upstream provider
- **POST /authorize** — Validerer CSRF, sætter cookies, redirecter
- **GET /callback** — Modtager auth code, exchanger til tokens, kalder `completeAuthorization()`

Se `templates/src/oauth-handler.ts` for komplet implementering.

### Email-restriktion

Begræns adgang via domæne og/eller specifikke emails:

```
ALLOWED_EMAIL_DOMAIN=example.com
ALLOWED_EMAILS=external-user@gmail.com,contractor@other.com
```

Logik: match domæne ELLER specifik email. Hvis ingen af de to er sat, tillades alle autentificerede brugere.

### Krævet KV namespace

OAuth state gemmes i KV (TTL 30 min). Opret med:

```bash
npx wrangler kv namespace create "OAUTH_KV"
```

Tilføj det returnerede ID i `kv_namespaces` i wrangler.jsonc.

### Secrets

| Secret | Beskrivelse |
|---|---|
| `UPSTREAM_CLIENT_ID` | Client ID fra upstream OAuth provider |
| `UPSTREAM_CLIENT_SECRET` | Client secret fra upstream OAuth provider |
| `COOKIE_ENCRYPTION_KEY` | `openssl rand -hex 32` |
| `ALLOWED_EMAIL_DOMAIN` | Komma-separerede tilladte domæner (valgfri) |
| `ALLOWED_EMAILS` | Komma-separerede tilladte emails (valgfri) |

### Vigtige filer ved OAuth

```
src/
  index.ts                # McpAgent + OAuthProvider (default export)
  oauth-handler.ts        # Hono app med /authorize, /callback routes
  workers-oauth-utils.ts  # CSRF, state management, consent dialog (generisk)
```

---

## Cloudflare Access for SaaS (SSO) — alternativ

For SSO via organisationens IdP (uden upstream provider), kan Cloudflare Access for SaaS bruges i stedet for `OAuthProvider`.

### Opsætning (overblik)

1. **Deploy MCP-serveren** med OAuth-support (brug `remote-mcp-cf-access` template)
2. **Opret Access for SaaS-app** i Cloudflare One dashboard:
   - Protocol: OIDC
   - Redirect URL: `https://<worker-domain>/callback`
   - Konfigurér Access policies (hvem må tilgå)
3. **Sæt secrets** på Workeren

| Secret | Kilde |
|---|---|
| `ACCESS_CLIENT_ID` | Client ID fra SaaS-app |
| `ACCESS_CLIENT_SECRET` | Client secret fra SaaS-app |
| `ACCESS_TOKEN_URL` | Token endpoint |
| `ACCESS_AUTHORIZATION_URL` | Authorization endpoint |
| `ACCESS_JWKS_URL` | Key endpoint (til JWT-validering) |
| `COOKIE_ENCRYPTION_KEY` | `openssl rand -hex 32` |

**KV namespace** (`OAUTH_KV`) påkræves til token-storage.

---

## Lokal udvikling

```bash
# Start Wrangler dev server
pnpm dev
# → http://localhost:8788

# MCP endpoint
# → http://localhost:8788/mcp
```

Wrangler dev kører lokalt med simulerede Durable Objects og R2. Secrets læses fra `.dev.vars`.

### Lokal R2

Under `wrangler dev` bruger R2 lokal filsystem-storage (`.wrangler/state/`). Sæt `"remote": true` i R2-bindingen for at bruge den rigtige bucket under udvikling.

---

## Deploy og secrets management

### Første deploy

```bash
# Deploy Worker
npx wrangler deploy

# Sæt secrets (kør for hvert secret)
echo "<value>" | npx wrangler secret put SECRET_NAME

# Verificér
curl https://<worker-name>.<account>.workers.dev/
```

### Secrets-workflow

```bash
# Liste secrets (navne, ikke værdier)
npx wrangler secret list

# Opdatér secret
echo "new-value" | npx wrangler secret put SECRET_NAME

# Slet secret
npx wrangler secret delete SECRET_NAME
```

### CI/CD

Cloudflare Workers understøtter automatisk deploy via GitHub/GitLab integration. Sæt secrets via Cloudflare dashboard under Workers → Settings → Variables and Secrets.

---

## Test med MCP Inspector

```bash
# Start MCP Inspector
npx @modelcontextprotocol/inspector@latest
# → http://localhost:5173

# Connect til lokal server: http://localhost:8788/mcp
# Connect til deployed server: https://<worker>.workers.dev/mcp
```

MCP Inspector giver interaktiv test af alle tools med parameter-input og response-visning. Til servere med OAuth, brug "OAuth Settings → Quick OAuth Flow" i Inspector.

Alternativt kan [Workers AI Playground](https://playground.ai.cloudflare.com/) bruges som remote MCP-klient.

---

## Erfaringer og gotchas

### Fra amdk-wildapricot-mcp-projektet

1. **`jurisdiction: "eu"`** — parameter til `McpAgent.serve()` sikrer at Durable Objects placeres i EU. Nyttigt for GDPR, men kan give lidt højere latency for ikke-EU-klienter.

2. **Named export er påkrævet** — DO-klassen (McpAgent-subclass) SKAL eksporteres som named export fra entry point. `export class MyAgent extends McpAgent { ... }` — ikke default export.

3. **Fetch handler er default export** — Workers fetch handler eksporteres som `export default { fetch() { ... } }`. Begge exports (named DO-klasse + default fetch) lever i samme fil.

4. **Tool-beskrivelser er kritiske** — LLM'en vælger tools baseret på deres beskrivelser. Vær præcis og kortfattet. Undgå for mange tools — det forvirrer modellen.

5. **Zod `.describe()` på hvert parameter** — LLM'en bruger parameter-beskrivelserne til at udfylde argumenter korrekt.

6. **`compatibility_flags: ["nodejs_compat"]`** — glem ikke dette flag. Uden det fejler `agents`-pakken runtime med kryptiske fejl.

7. **Migrations-tag** — hvert migrations-objekt i wrangler.jsonc kræver et unikt `tag`. Ved ændringer til DO-state, tilføj en ny migration med nyt tag.

8. **Rate limiting** — hvis din MCP-server kalder eksterne APIs med rate limits, implementér proaktiv throttling i din client-klasse. Det er bedre at throttle selv end at håndtere 429-responses.

9. **Fejlhåndtering i tools** — returner altid meningsfulde fejlbeskeder som `content: [{ type: "text", text: "..." }]`. LLM'en kan bruge dem til at prøve igen eller informere brugeren.

10. **`.dev.vars` vs secrets** — husk at opdatere BEGGE steder ved miljøskift. Det er den hyppigste fejlkilde.
