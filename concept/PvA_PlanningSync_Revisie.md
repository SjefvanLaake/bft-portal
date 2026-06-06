# PvA — Revisie planning-sync (Eng ↔ Overall, één gedeelde bron)

Status: vastgesteld 2026-06-06 na strenge audit. Koers (besluit Sjef): **één gedeelde planning-bron** waar EngPlanning en OverallPlanning views op zijn; **volledige mock-sync** (planning + projecten + snapshots). Stapsgewijs, groen licht afwachten per stap, elke stap geverifieerd met headless screenshot.

## Doel
- Geen aparte EngPlanning-store + handmatige ⟱-rollup meer. Eén bron → Overall toont automatisch wat de engineer in Eng aangeeft.
- Data synct met alle tools: projecten/engineer via `bft_v2_projecten`, planning via de gedeelde store, status via `snap_plan`.

## Canonieke bron
`bft_overallplanning_` (config + index + proj_<id>) = de enige planning-store.
- `config` = { versie, jaar, disciplines } (gedeeld; al deels gedaan).
- `proj_<id>` = { id, bftId, klant/omschrijving/wo/servnr/pl/eng/wvb, weken:{ discKey:[{startWeek,eindWeek,jaar,notitie}] }, bezetting:{} }.
- Model: reeksen + `notitie` = fase-tekst. Bezetting = personen.

## EngPlanning wordt een per-engineer VIEW
- **Engineer = filter**, geen apart document. Alle planning leeft in de gedeelde store; Eng toont de projecten met `eng === gekozen engineer`. → lost **K1** op (geen één-lane-per-browser meer; alle engineers in één store).
- Vakantie + horizon/engineer-UI = kleine prefs-store (`bft_engplanning_prefs`, per engineer-code), niet de planning-bron.

## Stappen (elk los testbaar)

### S1 — EngPlanning LEEST uit de gedeelde store (read-only view)
- Store-laag van Eng wijst naar `bft_overallplanning_`. Lees config (disciplines) + alle proj-records; filter op engineer; map reeksen→per-week voor de lane-render.
- Verificatie: open Eng → toont exact de projecten/balken/fase die in Overall staan (zelfde data). Nog niet schrijven.

### S2 — EngPlanning SCHRIJFT naar de gedeelde store
- Schilderen/fase/project → converteer per-week→reeksen (fase-bewust) → schrijf `proj_<id>.weken` (behoud bezetting, metadata, andere jaren). EN → `bft_v2_projecten` (leidend). Index bij nieuw project.
- ⟱-rollup-knop vervalt (of wordt overbodig). Oude `bft_engplanning_lane` eenmalig migreren/negeren.
- Verificatie: edit in Eng → verschijnt live in Overall (storage-listener), en omgekeerd zichtbaar.

### S3 — snap_plan robuust (cross-tool)
- Verplaats `snap_plan`-schrijven naar het opslag-pad van de gedeelde engine (of een gedeelde helper `BFTPlanningStore.save`), zodat élke wijziging (Eng of Overall) de snapshot ververst. → lost **K4** op (Projectoverzicht/deadlines actueel).
- Verificatie: edit in Eng → `snap_plan_<bftId>` bijgewerkt; Projectoverzicht toont het.

### S4 — Jaar/horizon gelijktrekken
- Reeksen dragen `jaar`. Zorg dat Eng plant in een jaar dat Overall toont, of dat Overall het jaar van de planning toont. Voorkom onzichtbare data. → lost **K3** op.
- Verificatie: plan in 2026 én 2027 → beide zichtbaar in het juiste jaar in Overall.

### S5 — Disciplines + dataverlies
- Disciplines gedeeld (gedaan). Bij discipline-verwijderen: waarschuwen i.p.v. stil wissen (**H4**).
- Verificatie: discipline verwijderen vraagt bevestiging; data blijft tenzij bevestigd.

### S6 — Correspondentie-gaten (afstemmen wat wél/niet) — UITGESTELD (2026-06-06)
- H1 maand-tekst, H2 bezetting in Eng?, H3 vakantie in Overall?
- **Besluit Sjef: later bespreken NA uitvoerig testen van de tool; mogelijk nog kleine aanpassingen.**
  De planning-inhoud (disciplines/weken/fase/EN/jaar/snapshot) komt al volledig overeen; dit zijn bewuste ontwerpverschillen, geen blokkers. Niet nu bouwen.

### S7 — Strenge eind-audit
- Headless screenshots van Eng + Overall op identieke data; M1 (servnr-match), M2 (autoriteit NieuwProject), M3 (snapshots) nalopen.

## Niet in deze ronde
- Echte Graph-sync (S-stappen blijven achter de Store-laag; go-live = swap naar `BFT_Planning`).

## Risico's
- EngPlanning-opslag-herschrijving raakt de kern van een werkende tool → strikt stap-voor-stap, oude store migreren, elke stap screenshot-geverifieerd.
- Gedeelde engine (`bft-overallgrid`) wordt door OverallPlanning én Projectoverzicht gebruikt → engine-wijzigingen (snap_plan, fase-tekst) op beide checken.
