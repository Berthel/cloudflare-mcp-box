# Smoke Test — Box MCP Server

Kopiér prompten nedenfor ind i din MCP-klient (Claude Cowork, MCP Inspector) for at teste at Box MCP-serveren virker korrekt mod et live Box-miljø.

**Vigtigt:** Denne test bruger primært read-only tools. De få write-tests opretter og sletter midlertidige items som ryddes op efter testen.

---

## Prompten

```
Kør en komplet smoke test af Box MCP-serveren. Rapportér resultatet for hvert trin som ✅ eller ❌ med en kort forklaring.

### Fase A — Connectivity og identitet

#### Trin 1 — Server info
Kald `box_server_info`. Bekræft at name = "box-mcp-server" og version returneres.

#### Trin 2 — Brugeridentitet
Kald `box_who_am_i`. Bekræft at du får navn, email, ID og space_used. Gem bruger-ID'et til senere brug.

### Fase B — Søgning

#### Trin 3 — Global søgning
Kald `box_search` med query = "test", limit = 2. Bekræft at resultater returneres med entries og total_count.

#### Trin 4 — Søgning med type-filter
Kald `box_search` med query = "test", type = "folder", limit = 2. Bekræft at kun folders returneres.

#### Trin 5 — Søg mappe via navn
Kald `box_search_folder_by_name` med et mappenavn du fandt i trin 3 eller 4. Bekræft match.

### Fase C — Mapper

#### Trin 6 — Rodmappe
Kald `box_folder_info` med folder_id = "0". Bekræft at rodmappens info returneres.

#### Trin 7 — List rodmappens indhold
Kald `box_folder_items_list` med folder_id = "0", limit = 5. Bekræft at entries returneres. Gem et fil-ID og et mappe-ID til senere brug.

#### Trin 8 — Pagination test
Kald `box_folder_items_list` med folder_id = "0", limit = 2, offset = 0. Bekræft at max 2 items returneres.

#### Trin 9 — Mappedetaljer
Kald `box_folder_info` med det mappe-ID du gemte i trin 7. Bekræft at navn og parent returneres.

#### Trin 10 — Mappe-tags
Kald `box_folder_tag_list` med det mappe-ID fra trin 7. Bekræft at svaret er et array (eventuelt tomt).

### Fase D — Filer

#### Trin 11 — Fildetaljer
Kald `box_file_info` med det fil-ID du gemte i trin 7. Bekræft at navn, størrelse og parent returneres.

#### Trin 12 — Fil-tags
Kald `box_file_tag_list` med samme fil-ID. Bekræft at svaret er et array.

#### Trin 13 — Download (tekstfil)
Kald `box_file_download` med fil-ID'et. Hvis det er en tekstfil, bekræft at indhold returneres. Hvis binær, bekræft at en venlig fejlbesked med filnavn og handlingsanvisning returneres.

#### Trin 14 — Tekstekstraktion
Kald `box_file_text_extract` med fil-ID'et. Bekræft at tekst returneres eller en meningsfuld status (f.eks. "not available for this file type").

### Fase E — Brugere og grupper

#### Trin 15 — List brugere
Kald `box_users_list` med limit = 3. Bekræft at brugere med ID, navn og email returneres.

#### Trin 16 — Søg bruger
Kald `box_users_search` med query = det email du fik i trin 2. Bekræft at din egen bruger returneres.

#### Trin 17 — Grupper
Kald `box_groups_search` med query = "a", limit = 5. Bekræft at svaret har entries (kan være tomt — det er OK).

### Fase F — Samarbejde og delte links

#### Trin 18 — List samarbejdspartnere på mappe
Kald `box_collaboration_list_by_folder` med mappe-ID fra trin 7. Bekræft at svaret returnerer entries.

#### Trin 19 — Hent delt link på fil
Kald `box_shared_link_file_get` med fil-ID fra trin 7. Bekræft at svaret inkluderer shared_link (kan være null).

### Fase G — AI (hvis tilgængelig)

#### Trin 20 — List AI-agenter
Kald `box_ai_agents_list` med limit = 5. Bekræft at svaret returneres (kan være tomt hvis Box AI ikke er aktiveret).

#### Trin 21 — AI Ask (single file)
Kald `box_ai_ask_single_file` med fil-ID fra trin 7 og prompt = "Summarize this document in one sentence". Bekræft at et AI-svar returneres. Hvis Box AI ikke er tilgængeligt, notér fejlen som forventet.

### Fase H — Docgen og metadata

#### Trin 22 — List metadata-templates
Kald `box_metadata_template_list`. Bekræft at enterprise templates returneres (kan være tomt array).

#### Trin 23 — List docgen-templates
Kald `box_docgen_template_list` med limit = 5. Bekræft at svaret returneres (kan være tomt).

### Fase I — Web links og tasks

#### Trin 24 — List file tasks
Kald `box_task_file_list` med fil-ID fra trin 7. Bekræft at svaret returneres (kan være tomt array).

### Fase J — Fejlhåndtering

#### Trin 25 — Ugyldig fil-ID
Kald `box_file_info` med file_id = "99999999999". Bekræft at fejlbeskeden:
1. Indeholder "not_found" eller HTTP status 404
2. Inkluderer file_id i konteksten
3. Giver et forslag til korrektion (f.eks. "Verify the ID exists")

#### Trin 26 — Ugyldig mappe-ID
Kald `box_folder_info` med folder_id = "99999999999". Bekræft samme fejlformat som trin 25.

### Opsummering

Vis en tabel med alle trin, status, og hvilke tool-kategorier der er dækket:

| # | Trin | Tool | Kategori | Status |
|---|------|------|----------|--------|
| 1 | Server info | box_server_info | meta | ✅/❌ |
| 2 | Brugeridentitet | box_who_am_i | meta | ✅/❌ |
| 3 | Global søgning | box_search | search | ✅/❌ |
| 4 | Søgning med type | box_search | search | ✅/❌ |
| 5 | Søg mappe | box_search_folder_by_name | search | ✅/❌ |
| 6 | Rodmappe | box_folder_info | folders | ✅/❌ |
| 7 | List items | box_folder_items_list | folders | ✅/❌ |
| 8 | Pagination | box_folder_items_list | folders | ✅/❌ |
| 9 | Mappedetaljer | box_folder_info | folders | ✅/❌ |
| 10 | Mappe-tags | box_folder_tag_list | folders | ✅/❌ |
| 11 | Fildetaljer | box_file_info | files | ✅/❌ |
| 12 | Fil-tags | box_file_tag_list | files | ✅/❌ |
| 13 | Download | box_file_download | file-transfer | ✅/❌ |
| 14 | Tekstekstraktion | box_file_text_extract | file-transfer | ✅/❌ |
| 15 | List brugere | box_users_list | users | ✅/❌ |
| 16 | Søg bruger | box_users_search | users | ✅/❌ |
| 17 | Grupper | box_groups_search | groups | ✅/❌ |
| 18 | Samarbejde | box_collaboration_list_by_folder | collaborations | ✅/❌ |
| 19 | Delt link | box_shared_link_file_get | shared-links | ✅/❌ |
| 20 | AI-agenter | box_ai_agents_list | ai | ✅/❌ |
| 21 | AI Ask | box_ai_ask_single_file | ai | ✅/❌ |
| 22 | Metadata | box_metadata_template_list | metadata | ✅/❌ |
| 23 | Docgen | box_docgen_template_list | docgen | ✅/❌ |
| 24 | Tasks | box_task_file_list | tasks | ✅/❌ |
| 25 | Fejl (fil) | box_file_info | error-handling | ✅/❌ |
| 26 | Fejl (mappe) | box_folder_info | error-handling | ✅/❌ |

**Samlet: X/26 trin bestået. Y/14 tool-kategorier dækket.**

Notér eventuelle uventede fejl eller mangler der bør undersøges nærmere.
```

---

## Kategoridækning

| # | Kategori | Tools testet | Antal i kategorien |
|---|----------|-------------|-------------------|
| 1 | meta | 2 | 2 |
| 2 | search | 2 | 2 |
| 3 | folders | 3 | 16 |
| 4 | files | 2 | 18 |
| 5 | file-transfer | 2 | 3 |
| 6 | users | 2 | 4 |
| 7 | groups | 1 | 3 |
| 8 | collaborations | 1 | 10 |
| 9 | shared-links | 1 | 12 |
| 10 | ai | 2 | 11 |
| 11 | metadata | 1 | 8 |
| 12 | docgen | 1 | 11 |
| 13 | tasks | 1 | 12 |
| 14 | error-handling | 2 | - |

**20 unikke tools testet** på tværs af **alle 14 kategorier** + fejlhåndtering.

## Tips

1. **Brug MCP Inspector** til at teste lokalt: `npx @modelcontextprotocol/inspector@latest` → connect to `http://localhost:8788/mcp`
2. **OAuth kræves** — sørg for at `.dev.vars` har gyldige `BOX_CLIENT_ID`, `BOX_CLIENT_SECRET` og `COOKIE_ENCRYPTION_KEY`
3. **Fase G (AI)** kræver Box AI-licens — forvent fejl hvis det ikke er aktiveret
4. **Fase H (Docgen)** kræver Box DocGen — kan returnere tom liste
