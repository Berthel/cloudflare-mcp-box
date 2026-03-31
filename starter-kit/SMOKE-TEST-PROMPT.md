# Smoke Test — Box MCP Server

Kopiér prompten nedenfor direkte ind i Claude Cowork for at teste at Box MCP-serveren virker korrekt.

Testen dækker **14 tool-kategorier** med kun read-only tools — der oprettes, ændres eller slettes intet.

---

## Prompten

```
Kør en smoke test af Box MCP-serveren. Du skal KUN bruge read-only tools — du må IKKE oprette, opdatere eller slette noget.

Kør følgende faser i rækkefølge. Brug output fra tidlige trin som input til senere trin. Rapportér hvert trin som ✅ eller ❌ med en kort forklaring.

---

### Fase 1 — Identity & Connectivity (meta)

**Trin 1:** Kald `box_who_am_i`. Bekræft at du får brugerens navn, email og ID tilbage.

**Trin 2:** Kald `box_server_info`. Bekræft at serverversion og tool-antal returneres.

---

### Fase 2 — Navigation (folders + search)

**Trin 3:** Kald `box_folder_items_list` med folder_id = "0" (root-mappen). Bekræft at mindst ét item returneres. Notér ID'et på en fil og en mappe fra resultatet.

**Trin 4:** Kald `box_search` med query = "test". Bekræft at resultater returneres med fil-ID, navn og type.

**Trin 5:** Brug mappenavnet fra trin 3. Kald `box_search_folder_by_name` med det navn. Bekræft at den korrekte mappe findes.

---

### Fase 3 — Fil-information (files)

Brug fil-ID'et fra trin 3 eller 4 i de næste trin.

**Trin 6:** Kald `box_file_info`. Bekræft at filnavn, størrelse, parent folder og timestamps returneres.

**Trin 7:** Kald `box_file_tag_list` på samme fil. Bekræft at svaret returneres (tomt array er OK).

**Trin 8:** Kald `box_file_thumbnail_url` på samme fil. Bekræft at en URL returneres (eller en forventet fejl for filtyper uden thumbnail).

---

### Fase 4 — Filindhold (file-transfer)

**Trin 9:** Kald `box_file_download` på en tekstbaseret fil (ikke binær) fra tidligere trin. Bekræft at tekstindhold returneres.

**Trin 10:** Kald `box_file_text_extract` på samme fil. Bekræft at tekst ekstraheres.

---

### Fase 5 — Brugere (users)

**Trin 11:** Kald `box_users_list`. Bekræft at mindst én bruger returneres med ID, navn og email.

**Trin 12:** Brug navnet fra trin 1. Kald `box_users_locate_by_name`. Bekræft at den autentificerede bruger findes.

**Trin 13:** Brug email fra trin 1. Kald `box_users_locate_by_email`. Bekræft match.

**Trin 14:** Kald `box_users_search` med en del af brugerens navn. Bekræft at resultater returneres.

---

### Fase 6 — Grupper (groups)

**Trin 15:** Kald `box_groups_search` med name = "". Bekræft at grupper returneres (eller tomt hvis ingen findes).

**Trin 16:** Hvis en gruppe blev fundet i trin 15, kald `box_groups_list_members` med den gruppes ID. Bekræft at medlemmer returneres.

**Trin 17:** Brug bruger-ID fra trin 1. Kald `box_groups_list_by_user`. Bekræft at brugerens grupper returneres.

---

### Fase 7 — Samarbejde (collaborations)

**Trin 18:** Brug mappe-ID fra trin 3. Kald `box_collaboration_list_by_folder`. Bekræft at samarbejdspartnere og roller returneres.

**Trin 19:** Brug fil-ID fra trin 6. Kald `box_collaboration_list_by_file`. Bekræft svar (tomt er OK — ikke alle filer har direkte collaborations).

---

### Fase 8 — Metadata (metadata)

**Trin 20:** Kald `box_metadata_template_list`. Bekræft at templates returneres (eller tomt hvis ingen er defineret).

**Trin 21:** Hvis en template blev fundet i trin 20, kald `box_metadata_template_get_by_key` med dens template_key. Bekræft at felter og detaljer returneres.

**Trin 22:** Brug fil-ID fra trin 6. Kald `box_metadata_get_instance_on_file` med scope = "global" og template_key = "properties". Bekræft svar (404 er OK — det betyder bare at filen ikke har den metadata-template).

---

### Fase 9 — Delte links (shared-links)

**Trin 23:** Brug fil-ID fra trin 6. Kald `box_shared_link_file_get`. Bekræft svar (null/tomt er OK — ikke alle filer har delte links).

**Trin 24:** Brug mappe-ID fra trin 3. Kald `box_shared_link_folder_get`. Bekræft svar.

---

### Fase 10 — Opgaver (tasks)

**Trin 25:** Brug fil-ID fra trin 6. Kald `box_task_file_list`. Bekræft svar (tomt er OK).

**Trin 26:** Hvis en task blev fundet i trin 25, kald `box_task_details` med task-ID'et. Bekræft at status, besked og due date returneres.

---

### Fase 11 — DocGen (docgen)

**Trin 27:** Kald `box_docgen_template_list`. Bekræft svar (tomt er OK).

**Trin 28:** Hvis en template blev fundet i trin 27, kald `box_docgen_template_list_tags` med template-ID'et. Bekræft at tags returneres.

**Trin 29:** Kald `box_docgen_list_jobs`. Bekræft svar.

---

### Fase 12 — Box AI (ai) — kan være langsomt

**Trin 30:** Kald `box_ai_agents_list`. Bekræft at AI-agenter returneres (eller fejlbesked hvis Box AI ikke er aktiveret).

**Trin 31:** Brug en tekstfil-ID fra tidligere trin. Kald `box_ai_ask_single_file` med prompt = "Opsummér indholdet af denne fil i 2-3 sætninger." Bekræft at et AI-svar returneres.

---

### Fase 13 — Web Links (web-links)

**Trin 32:** Hvis du fandt et web link i søgeresultaterne (trin 4), kald `box_web_link_get` med dets ID. Bekræft at URL, navn og parent folder returneres. Hvis ingen web links blev fundet, notér at dette trin springes over.

---

### Opsummering

Vis en samlet tabel med alle trin:

| # | Fase | Trin | Status | Tool |
|---|------|------|--------|------|
| 1 | Identity | box_who_am_i | ✅/❌ | box_who_am_i |
| 2 | Identity | box_server_info | ✅/❌ | box_server_info |
| ... | ... | ... | ... | ... |

Inkludér til sidst:

- **Samlet: X/Y trin bestået**
- **Antal unikke tools testet: N**
- **Kategorier dækket: N/14**
- **Eventuelle fejl eller observationer** (f.eks. manglende data, langsomme svar, uventede fejl)
```

---

## Hvad testen dækker

| # | Kategori | Read-only tools testet | Totalt i kategori |
|---|----------|----------------------|-------------------|
| 1 | meta | `box_who_am_i`, `box_server_info` | 2/2 |
| 2 | search | `box_search`, `box_search_folder_by_name` | 2/2 |
| 3 | files | `box_file_info`, `box_file_tag_list`, `box_file_thumbnail_url` | 3/4 |
| 4 | file-transfer | `box_file_download`, `box_file_text_extract` | 2/2 |
| 5 | folders | `box_folder_items_list` | 1/3 |
| 6 | users | `box_users_list`, `box_users_locate_by_name`, `box_users_locate_by_email`, `box_users_search` | 4/4 |
| 7 | groups | `box_groups_search`, `box_groups_list_members`, `box_groups_list_by_user` | 3/3 |
| 8 | collaborations | `box_collaboration_list_by_folder`, `box_collaboration_list_by_file` | 2/2 |
| 9 | metadata | `box_metadata_template_list`, `box_metadata_template_get_by_key`, `box_metadata_get_instance_on_file` | 3/4 |
| 10 | shared-links | `box_shared_link_file_get`, `box_shared_link_folder_get` | 2/6 |
| 11 | tasks | `box_task_file_list`, `box_task_details` | 2/4 |
| 12 | docgen | `box_docgen_template_list`, `box_docgen_template_list_tags`, `box_docgen_list_jobs` | 3/8 |
| 13 | ai | `box_ai_agents_list`, `box_ai_ask_single_file` | 2/11 |
| 14 | web-links | `box_web_link_get` | 1/1 |

**32 trin** på tværs af **14 kategorier** — tester **30 unikke read-only tools** af 70 totalt.

## Tips

- **Testen tager 2-5 minutter** afhængigt af Box AI-responstider
- **Betingede trin** (f.eks. "hvis en gruppe blev fundet") springes automatisk over og markeres som ⏭️
- **Fejl er informative** — en ❌ i trin 22 (metadata instance) med 404 er forventet og ikke en fejl i serveren
- Vil du teste flere tools? Tilføj trin fra oversigten ovenfor — alle `_list`, `_get`, `_info`, `_search` tools er read-only
