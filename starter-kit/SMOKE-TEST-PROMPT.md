# Smoke Test — MCP Server

Kopiér prompten nedenfor ind i din MCP-klient (Claude Cowork, Inspector) for at teste at MCP-serveren virker korrekt.

**Tilpas:** Erstat eksempel-tools med dine egne read-only tools.

---

## Prompten

```
Kør en smoke test af MCP-serveren. Du skal KUN bruge read-only tools — du må IKKE oprette, opdatere eller slette noget.

Kør følgende trin og rapportér resultatet for hvert trin som ✅ eller ❌ med en kort forklaring.

### Trin 1 — Connectivity
Kald `healthcheck` tool. Bekræft at serveren svarer med status "ok".

### Trin 2 — Echo
Kald `echo` med message = "smoke test". Bekræft at svaret indeholder din besked.

### Trin 3-N — Projekt-specifikke tools

INDSÆT DINE READ-ONLY TEST-TRIN HER.

Format for hvert trin:
  Kald `tool_name` med [parametre]. Bekræft at [forventet resultat].

Eksempel:
  ### Trin 3 — Workspaces
  Kald `acme_list_workspaces`. Bekræft at mindst ét workspace returneres.

  ### Trin 4 — Søgning
  Brug workspace GID'et fra trin 3. Kald `acme_search_projects`. Bekræft at resultater returneres.

### Afslut med en opsummering

Vis en tabel med alle trin, status (✅/❌), og antal tools testet.

| # | Trin | Status | Tools testet |
|---|------|--------|-------------|
| 1 | Connectivity | ✅ | 1 |
| 2 | Echo | ✅ | 1 |
| ... | ... | ... | ... |

**Samlet: X/Y tools virkede**
```

---

## Tips til at skrive gode smoke tests

1. **Kun read-only tools** — testen må aldrig ændre data
2. **Byg på hinanden** — brug output fra tidlige trin (f.eks. workspace ID) i senere trin
3. **Test bredden** — dæk så mange tool-kategorier som muligt
4. **Specifikke forventninger** — beskriv hvad hvert trin skal returnere

## Eksempel: Asana MCP Server (22 read-only tools)

For reference, her er de 22 tools vi testede i mcp-asana projektet:

| # | Tool | Kategori |
|---|------|----------|
| 1 | `asana_list_workspaces` | Workspaces |
| 2 | `asana_get_user` | Users |
| 3 | `asana_get_teams_for_workspace` | Teams |
| 4 | `asana_typeahead` | Typeahead |
| 5 | `asana_search_projects` | Projects |
| 6 | `asana_get_project` | Projects |
| 7 | `asana_get_project_task_counts` | Projects |
| 8 | `asana_get_project_sections` | Projects |
| 9 | `asana_search_tasks` | Tasks |
| 10 | `asana_get_task` | Tasks |
| 11 | `asana_get_subtasks` | Tasks |
| 12 | `asana_get_tags_for_workspace` | Tags |
| 13 | `asana_get_tag` | Tags |
| 14 | `asana_get_custom_fields_for_workspace` | Custom Fields |
| 15 | `asana_get_custom_field` | Custom Fields |
| 16 | `asana_get_portfolios` | Portfolios |
| 17 | `asana_get_portfolio` | Portfolios |
| 18 | `asana_get_portfolio_items` | Portfolios |
| 19 | `asana_get_goals` | Goals |
| 20 | `asana_get_goal` | Goals |
| 21 | `asana_get_time_periods` | Time Tracking |
| 22 | `asana_get_time_period` | Time Tracking |

**22 read-only tools** på tværs af **10 kategorier** — dette mønster kan tilpasses til ethvert MCP-serverprojekt.
