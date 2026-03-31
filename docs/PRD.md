# cloudflare-box-mcp — PRD

> Product Requirements Document for Box MCP-serveren på Cloudflare Workers.
> Sidst opdateret: 2026-03-31

---

## 1. Executive Summary

**Problem Statement:** Utilcos interne team mangler en direkte integration mellem Claude Cowork desktop-appen og Box. Brugerne skal manuelt kopiere indhold frem og tilbage, hvilket er langsomt, fejlbehæftet og bryder konteksten i AI-arbejdsgange.

**Proposed Solution:** En remote MCP-server (`cloudflare-box-mcp`) hostet på Cloudflare Workers, der via OAuth 2.0 forbinder Claude Cowork til Box. Serveren eksponerer 115 MCP-tools fordelt på 14 domæneområder (filer, mapper, søgning, AI, docgen, metadata, brugere, grupper, samarbejde, delte links, web links, opgaver). Arkitekturen bruger stateful Durable Objects (EU-jurisdiktion) og en letvægtsklient (`BoxClient`) med automatisk token-refresh.

**Success Criteria:**

- [ ] Alle 115 tools implementeret og kaldbare fra Claude Cowork (0 stubs)
- [ ] OAuth 2.0 authorization code flow fungerer end-to-end (authorize → callback → token refresh)
- [ ] Gennemsnitlig tool-responstid under 2 sekunder for simple CRUD-operationer
- [ ] Email-domænerestriktion fungerer korrekt (kun `@utilco.dk` / godkendte adresser)
- [ ] Deployeret på Cloudflare Workers med EU-jurisdiktion og GDPR-kompatibel datahåndtering

---

## 2. User Experience og Funktionalitet

### User Personas

| Persona | Beskrivelse | Primære behov |
|---------|-------------|---------------|
| Intern videnarbejder (primær) | Medarbejder hos Utilco der bruger Claude Cowork dagligt | Søge, læse, oprette og redigere filer i Box direkte fra AI-chatten |
| Intern administrator | Styrer adgang og organisation i Box | Administrere grupper, samarbejdspartnere og rettigheder via Claude Cowork |

### User Stories

**Fil-operationer:**

- Som videnarbejder vil jeg søge i Box fra Claude Cowork, så jeg kan finde dokumenter uden at forlade chatten.
  - **AC:** `box_search` returnerer relevante resultater med fil-ID, navn, type og sti. Pagination metadata inkluderet.
- Som videnarbejder vil jeg læse filindhold, så Claude kan analysere og opsummere dokumenter for mig.
  - **AC:** `box_file_download` returnerer tekstindhold (op til 25.000 tegn). Binære filer returnerer fejlbesked med handlingsanvisning.
- Som videnarbejder vil jeg uploade filer til Box, så jeg kan gemme output fra Claude-sessioner.
  - **AC:** `box_file_upload` opretter fil i angiven mappe og returnerer fil-metadata.

**AI-operationer:**

- Som videnarbejder vil jeg stille spørgsmål til Box AI om et dokument, så jeg får svar baseret på filindholdet.
  - **AC:** `box_ai_ask_single_file` returnerer AI-svar med kildeangivelse.
- Som videnarbejder vil jeg ekstrahere struktureret data fra dokumenter via Box AI.
  - **AC:** `box_ai_extract_structured_fields` returnerer data i det angivne skema.

**Administration:**

- Som administrator vil jeg administrere samarbejdspartnere på mapper, så jeg kan styre adgang via Claude Cowork.
  - **AC:** `box_collaboration_add_*` tools opretter samarbejde med korrekt rolle og returnerer bekræftelse.

### Non-Goals

- Ingen reel filhåndtering af binære filer (billeder, video) i MCP-laget — kun metadata og tekstekstraktion
- Ingen webhook/event-lytning fra Box (kun request/response)
- Ingen caching-lag — alle kald går direkte til Box API
- Ingen multi-tenant arkitektur — serveren er til Utilcos eget Box-miljø
- Ingen brugerflade udover OAuth consent-dialogen — al interaktion sker via MCP-protokollen

---

## 3. AI System Requirements

### Tool Requirements

**14 tool-grupper, 115 tools totalt:**

| Gruppe | Antal | Tools |
|--------|-------|-------|
| meta | 2 | `box_who_am_i`, `box_server_info` |
| search | 2 | `box_search`, `box_search_folder_by_name` |
| ai | 11 | Box AI Ask (single/multi/hub), Extract (freeform/structured/enhanced), Agent info/list/search |
| docgen | 12 | Template CRUD, tags, jobs, batch-generering |
| files | 17 | CRUD, copy, thumbnail, tags, lock, versioner, permissions |
| file-transfer | 3 | Download, upload, text extract |
| folders | 16 | CRUD, items, copy, tags, collections, sync state, upload email |
| metadata | 8 | Template CRUD, instanser på filer (CRUD) |
| users | 4 | List, søg på navn/email |
| groups | 3 | Søg, medlemmer, brugergrupper |
| collaborations | 10 | List/opret/opdater/slet på fil/mappe/bruger/gruppe |
| shared-links | 12 | Opret/hent/slet delte links på filer/mapper/web links, find via URL |
| web-links | 4 | CRUD |
| tasks | 12 | Opret/læs/opdater/slet tasks og assignments |

### Evaluation Strategy

- **Smoke test:** Hvert tool kaldes mindst én gang med gyldige parametre og returnerer forventet Box API-data (ikke "Not implemented yet")
- **Fejlhåndtering:** Hvert tool testes med ugyldige input og returnerer en actionable fejlbesked (ikke stack trace)
- **Token refresh:** Simulér udløbet token og verificér automatisk refresh + retry

---

## 4. Technical Specifications

### Architecture Overview

```mermaid
sequenceDiagram
    participant CC as Claude Cowork
    participant CFW as Cloudflare Worker
    participant OAuth as OAuthProvider
    participant DO as BoxMcpAgent DO
    participant Box as Box API

    CC->>CFW: POST /mcp (MCP request)
    CFW->>OAuth: Route request
    OAuth->>DO: Forward to Durable Object
    DO->>Box: REST API call (with access_token)
    Box-->>DO: JSON response
    DO-->>CC: MCP tool result

    Note over CC,Box: Token refresh flow
    DO->>Box: API call (401 Unauthorized)
    Box-->>DO: 401
    DO->>Box: POST /oauth2/token (refresh_token)
    Box-->>DO: New access_token + refresh_token
    DO->>Box: Retry original API call
    Box-->>DO: JSON response
```

### Nøglekomponenter

| Fil | Ansvar |
|-----|--------|
| `src/index.ts` | `BoxMcpAgent` (Durable Object) + `OAuthProvider` (default export) |
| `src/oauth-handler.ts` | Hono-app med `/authorize`, `/callback` mod Box OAuth |
| `src/workers-oauth-utils.ts` | CSRF, KV state, consent dialog (generisk) |
| `src/lib/box-client.ts` | `BoxClient` med auto 401-retry og token refresh |
| `src/lib/types.ts` | `BOX_API_BASE`, `BOX_UPLOAD_BASE`, `CHARACTER_LIMIT`, delte typer |

### Integration Points

| System | Type | Formål |
|--------|------|--------|
| Box REST API v2 | REST (`https://api.box.com/2.0`) | Alle 115 tools kalder dette |
| Box Upload API | REST (`https://upload.box.com/api/2.0`) | Fil-upload via multipart |
| Box OAuth 2.0 | Auth | Authorization code flow med `account.box.com` og `api.box.com` |
| Cloudflare KV | Storage (`OAUTH_KV`) | OAuth state management med TTL |
| Cloudflare Durable Objects | Runtime | Session state og token persistence via `ctx.storage` |

### Security og Privacy

- **EU-jurisdiktion:** Durable Object placeret med `{ jurisdiction: "eu" }` (GDPR)
- **OAuth tokens:** Opbevares udelukkende i DO storage — aldrig i KV, cookies eller logs
- **Secrets:** `BOX_CLIENT_ID`, `BOX_CLIENT_SECRET`, `COOKIE_ENCRYPTION_KEY` kun i `.dev.vars` (lokalt) og `wrangler secret` (prod)
- **Adgangskontrol:** Email-domæne/adresse-restriktion via `ALLOWED_EMAIL_DOMAIN` og `ALLOWED_EMAILS`
- **CSRF-beskyttelse:** `__Host-CSRF_TOKEN` cookie + HMAC-signerede consent-cookies
- **Ingen data-persistering:** Serveren gemmer ingen Box-data — alt er pass-through

---

## 5. Risks og Roadmap

### Phased Rollout

| Fase | Omfang | Tidsramme |
|------|--------|-----------|
| Fase 1 — Implementering | Implementér alle 115 tool-handlere med reelle Box API-kald via `BoxClient`. Prioritér: meta → search → files → file-transfer → folders → ai → docgen → metadata → users → groups → collaborations → shared-links → web-links → tasks. | Uge 1 |
| Fase 2 — Test og hardening | Smoke-test alle tools mod live Box-miljø. Fix fejlhåndtering, pagination og edge cases. Validér OAuth-flow end-to-end inkl. token refresh. | Uge 2 |
| Fase 3 — Produktion | Deploy til Cloudflare Workers med secrets. Verificér EU-jurisdiktion. Distribuer MCP endpoint-URL til teamet. | Uge 2 (slut) |

### Technical Risks

| Risiko | Impact | Mitigation |
|--------|--------|------------|
| Box API rate limits (~1000 kald/min pr. bruger) | High | Returnér actionable fejlbesked med retry-after header |
| Token refresh race condition | Medium | `BoxClient` låser refresh via enkelt Promise i DO |
| Store filer overskrider Workers-memory (128 MB) | Medium | `CHARACTER_LIMIT` (25.000 tegn) for tekstekstraktion; binære filer returnerer kun metadata |
| Box API-ændringer / deprecations | Low | Pin API-version, monitorér Box changelog |
| Durable Object cold starts (~50-200ms) | Low | Acceptabel for internt brug; dokumentér forventet latens |
