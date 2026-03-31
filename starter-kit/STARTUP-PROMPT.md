# Startup-prompt til nyt Cloudflare MCP-projekt

Kopiér prompten nedenfor ind i en ny Cursor-session (Agent mode) i en tom mappe.

Erstat `INDSÆT`/`REPLACE` med dine egne værdier.

---

## Prompten

```
Jeg vil bygge en ny remote MCP-server på Cloudflare Workers.

## Projekt

- **Navn**: cloudflare-box-mcp
- **Formål**: Bruges i Claude Cowork desktop app til at forbinde til Box
- **Tools jeg har brug for**: Denne her skal omskrives så den kan køre i cloudflare: https://github.com/Utilco/mcp-server-box.git

## Tekniske valg

- **Stateful eller stateless?**:
  - Stateful (McpAgent med Durable Object) — vælg dette hvis tools har brug for sessionsstate mellem kald
  - Stateless (createMcpHandler) — vælg dette til simple, uafhængige tool-kald

- **Auth**: [Vælg ét]
  - Ingen — åben adgang, brug `templates/src/index.ts` som udgangspunkt
  - OAuth med ekstern IdP — brug `templates/src/index-oauth.ts`, `templates/src/oauth-handler.ts` og `templates/src/workers-oauth-utils.ts` som udgangspunkt. OAuthProvider wrapper McpAgent og håndterer hele auth-flowet. Kræver KV namespace og `hono`.
  - API-key — simpel header-validering i fetch handler

- **Storage**: [Ingen / R2 til filer / KV til key-value / D1 til SQL]
- **Region**: EU (GDPR) / Global

## Hvad jeg vil have dig til at gøre

1. Scaffolde hele projektet med denne mappestruktur:
   ```
   src/
     index.ts               # McpAgent klasse + fetch handler (eller OAuthProvider wrapper)
     env.d.ts               # TypeScript env declarations
     tools/                 # Én fil per tool-gruppe
     lib/                   # API-klient, hjælpefunktioner, typer
     # Kun ved OAuth:
     oauth-handler.ts       # Hono-baseret OAuth handler med authorize/callback
     workers-oauth-utils.ts # CSRF, state management, approval dialog (kopiér fra template)
   ```

2. Sæt disse filer op:
   - `wrangler.jsonc` med DO-bindings, migrations, og relevante storage-bindings (KV er PÅKRÆVET ved OAuth)
   - `package.json` med dependencies: `agents`, `zod` — og ved OAuth: `@cloudflare/workers-oauth-provider`, `hono`
   - `tsconfig.json` konfigureret til Cloudflare Workers
   - `.gitignore` (inkl. .dev.vars, .wrangler/, worker-configuration.d.ts)
   - `.dev.vars.example` med alle nødvendige secrets som placeholders

3. Implementér MCP-tools med:
   - Zod-schemas med `.describe()` på alle parametre
   - Meningsfulde fejlbeskeder der hjælper LLM'en med at prøve igen
   - Tool-registrering via `registerXxxTools(server, ...deps)` pattern

4. Ved OAuth — implementér:
   - OAuth handler med authorization code flow mod upstream provider
   - Token refresh i McpAgent (gem tokens i DO storage via `this.ctx.storage`)
   - Email-restriktion via `ALLOWED_EMAIL_DOMAIN` (domæner) og/eller `ALLOWED_EMAILS` (specifikke adresser)
   - Consent dialog med CSRF-beskyttelse og session binding via KV
   - `workers-oauth-utils.ts` kan kopieres direkte fra template — den er generisk

5. Opret Cursor-rules i `.cursor/rules/`:
   - En `project.mdc` (alwaysApply: true) med projektbeskrivelse og arkitektur
   - En `cloudflare-mcp.mdc` med Cloudflare Workers + McpAgent patterns

## Reference-dokumentation og templates

Jeg har lagt reference-dokumentation i `docs/`-mappen:
- `docs/cloudflare-mcp-reference.md` — Komplet referencearkitektur for CF Workers MCP inkl. OAuth
- `docs/mcp-best-practices.md` — MCP tool design best practices
- `docs/typescript-mcp-guide.md` — TypeScript MCP patterns og eksempler

Og templates i `templates/`-mappen:
- `templates/src/index.ts` — Auth-less McpAgent template
- `templates/src/index-oauth.ts` — OAuth-wrapped McpAgent template med token refresh
- `templates/src/oauth-handler.ts` — Generic OAuth handler template (Hono)
- `templates/src/workers-oauth-utils.ts` — OAuth utilities: CSRF, state, approval dialog (generisk, kan kopieres direkte)
- `templates/src/tools/example.ts` — Eksempel-tool med Zod schemas

Læs disse filer FØR du begynder at kode — de indeholder alle patterns og gotchas.

## Vigtige regler

- Named export for DO-klassen, default export for fetch handler (eller OAuthProvider ved OAuth) — begge i `src/index.ts`
- `compatibility_flags: ["nodejs_compat"]` er PÅKRÆVET i wrangler.jsonc
- Secrets kun i `.dev.vars` (lokalt) og `wrangler secret put` (prod) — aldrig hardcoded
- Brug `McpAgent.serve("/mcp")` (eller med `{ jurisdiction: "eu" }`)
- Hvert Zod-parameter SKAL have `.describe()` — LLM'en bruger dem til at udfylde argumenter
- Ved OAuth: Default export er `new OAuthProvider({...})`, IKKE et `{ fetch() }` objekt
```

---

## Tip til brug

1. Kopiér `docs/`-mappen, `templates/`-mappen og `.cursor/rules/`-mappen ind i din tomme projektmappe FØR du starter Cursor-sessionen
2. Tilpas prompten ovenfor med dit projekts detaljer
3. Pasta prompten i Cursor Agent mode
4. AI'en læser reference-dokumentationen og templates, og scaffolder hele projektet

## Skills der er nyttige

Hvis du har disse Cursor-skills installeret, vil de automatisk blive brugt:

- **mcp-builder** — Guide til at bygge MCP-servere med best practices
- **create-rule** — Opretter Cursor rules for projektet
