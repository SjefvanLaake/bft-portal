# PvA — BFT_EngineeringPlanning (directief "Planning engineering TOTAAL")

Status: architectuur-briefing (Opus), vastgesteld 2026-06-05. Uitrol stap-voor-stap, één stap per sessie, groen licht afwachten tussen stappen. **Repo: BFT-V2** (de nieuwe toolset). Het bron-Excel staat in `Bofram Tools Portaal/Concept bestanden/` — alleen omdat dat een conceptmap was; de tool hoort in BFT-V2.

Aanleiding: directie heeft `Planning engineering TOTAAL.xlsx` aangewezen als hét bestand waar alle engineers hun planning in brengen. Dat bestand is **persoon-gericht** (per engineer een lane), niet project-gericht zoals `BFT_OverallPlanning`. Daarom een **aparte tool** naast OverallPlanning.

## Vastgestelde keuzes (2026-06-05)

| Punt | Keuze |
|---|---|
| Tool-aanpak | **Nieuwe tool** `BFT_EngineeringPlanning` naast OverallPlanning |
| Multi-user (nu) | Per-engineer JSON export/merge als interim-deelweg |
| Multi-user (go-live) | Store-laag → `BFTGraph` / SharePoint-list `BFT_Planning` (één swap-punt, huisstijl) |
| Render-engine | Eigen HTML-grid (lijn van `bft-overallgrid.js`) |
| Bewerkwijze | Week-schilderen: discipline (kleur) + optioneel fase-tekst per cel |
| Horizon | Rollend, instelbaar. Directief = week 23–52 (2026); niet vast jan–dec |
| Opslag (nu) | localStorage achter Store-laag (prefix `bft_engplanning_`) — swappable naar Graph |

## Hergebruik in BFT-V2 (verplicht, geen duplicatie)

- `bft-medewerkers.js` — engineer-picker via `bftMedewerkerOptions('Engineering')` (datalist; stabiele id's).
- `bft-projects.js` — projectrijen (E2): wo/serv/pl/eng/wvb/klant uit bestaande projecten i.p.v. vrije tekst.
- `bft-klanten.js` — klant-suggesties.
- `bft-overall-excelio.js` — ExcelJS-importer die **celkleuren** leest → basis voor directief-import (E8). Vereist `library/vendor/exceljs/exceljs.min.js`.
- `bft-dialog.js` — confirm/alert. `bft-pdf.js` (`BFTPdf`) — PDF-header/footer (E9).
- `BFTToolShell.esc` — alle dynamische data ge-escaped op HTML-sinks (les uit [[evaluatie-besluiten]] P1/P3).

## Bron-analyse (Planning engineering TOTAAL.xlsx)

- Eén sheet "Blad1", A1:AK144. Bron-pad `M:\01 Algemeen\13 Planning\2026\Planning Engineering\`.
- A–G = metadata: Klant · Omschrijving · WO nr · Serv nr · PL · Eng · WVB.
- H–AK = 30 weken: **week 23 t/m week 52**.
- Disciplines via **celkleur (fill)**: engineering geel `FFFF00` · WVB groen `92D050` · randtaken oranje `FFC000` · begeleiding opbouw blauw `00B0F0` · vrij/vakantie rood `FF0000` (+ halve week).
- Per engineer een blok (`Koen:`, `Sjoerd:`, `Dennis:`, `Sjef:` …) met eigen koprij + projectrijen.
- Onderaan (R83+) een **overall master-lijst** van alle projecten (o.a. JOBO 15×-batch).
- **Vakantie = engineer-niveau**: rode weken lopen door álle projectrijen van die persoon.
- Weekcellen dragen **kleur + optioneel fase-tekst** (`Mech.`, `Elektr.`, `Testen`, `WVDE`, `???`).

## Datamodel — lane-document (per engineer)

```
laneDoc = {
  schemaVersie: 1,
  engineer: { naam, initialen, mdwId },          // mdwId = stabiele bft-medewerkers id
  horizon: { jaar: 2026, startWeek: 23, eindWeek: 52 },
  vakantie: [ { week, half } ],                    // engineer-band (rood)
  projecten: [{
    id, projectId,                                 // projectId = stabiele bft-projects id (indien gekoppeld)
    klant, omschrijving, wo, servnr, pl, eng, wvb,
    weken: [ { week, discipline, fase } ]
  }]
}
```
- TOTAAL = merge van N lane-docs → gestapelde engineer-blokken + overall master.

## Stappenlijst (elk los testbaar)

- **E1** — Tool-shell + lane-skelet (engineer-datalist + horizon) + week-koprij + Store-laag persist. Geen projecten/schilderen.
- **E2** — Project toevoegen (rij) via formulier; vullen uit `bft-projects.js` (datalist) of vrij.
- **E3** — Week-schilderen: discipline (kleur) + optioneel fase-tekst; sleep = reeks.
- **E4** — Vakantieband op engineer-niveau (rood + halve week) over alle projectrijen.
- **E5** — JSON export/import per lane (interim-deelweg).
- **E6** — TOTAAL-merge-view: meerdere lane-JSONs → gestapelde blokken + overall master.
- **E7** — Excel-export (eenrichting): fills per discipline + fase-tekst. Bron niet overschrijven.
- **E8** — Excel-import directief via `bft-overall-excelio.js`-patroon: kleur→discipline, tekst→fase, rode band→vakantie, blok→lane.
- **E9** — PDF A3-landscape via `BFTPdf`.
- **E10** — Portaaltegel (`index.html`) + Store-laag→Graph-swap voorbereiden + eindverificatie (subagent).

## Conventie-checks (verplicht per stap)
- Geen inline-CSS behalve tool-specifiek. Relatieve paden. Geen `fetch()` voor data. Geen `confirm()`/`alert()` → `BFTDialog`. Dynamische data via `BFTToolShell.esc`. Oude versies `.YYYY-MM-DD.bak`.

## Open punten
- "halve week vrij/vakantie" weergave (diagonale/halve fill) — detail voor E4.
- Verhouding tot `bft-overallgrid.js`: waar mogelijk schilder-/discipline-logica hergebruiken i.p.v. herschrijven (beoordelen bij E3).
