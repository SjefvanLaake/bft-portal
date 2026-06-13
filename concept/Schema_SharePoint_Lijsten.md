# SharePoint-lijsten — kolomschema (datalaag BFT-V2)

**Datum:** 2026-06-13 · **Status:** concept ter bespreking
**Doel:** exacte kolommen voor de SharePoint-lijsten waar `BFTGraph` op draait, zodat lijst-aanmaken (na admin-consent) snel én verifieerbaar is.
**Site:** root `https://bofram.sharepoint.com` (geen `/sites/`-prefix — `BFTGraph` wijst hierop). Document Library `BFTPortal` bestaat al (PDF-opslag).

> **Aanpak:** eerst alleen **`BFT_Projecten`** bouwen en end-to-end bewijzen; pas daarna de overige lijsten. Niet alle lijsten blind aanmaken.

---

## Conventies (gelden voor alle lijsten)

1. **Interne kolomnamen = PascalCase** (`ProjectNr`, `Status`, …). `BFTGraph.query()` leest `fields/<Naam>`; de huidige `getProjectSnapshot()` gebruikt al exact deze namen.
2. **`ProjectNr` is verplicht geïndexeerd** in elke lijst (filter-sleutel; SharePoint eist een index bij grote lijsten).
3. **Afgeleide naam-velden NIET opslaan.** Een project verwijst naar klant/personen via stabiele **id's** (`KlantId`, `PlId`, …); de weergavenaam wordt runtime afgeleid via de resolvers in `bft-projects.js` (rename-safe, F4-principe). Alleen de `*Id`-velden komen in SharePoint.
4. **Stabiele bedrijfssleutel** van een record gaat in de ingebouwde **`Title`**-kolom (bv. projectsleutel `201270_BFMR2000EK`). De SharePoint-item-id (`_id`) blijft puur technisch.
5. **Datums** als kolomtype *Datum* (ISO `YYYY-MM-DD` in de code).
6. **Status-velden** als *Keuze* (vaste set) waar de waardenset bekend is.

---

## `BFT_Projecten`  (referentie-lijst — eerst bouwen)

Bron-datamodel: `bft-projects.js` (F4-vorm). Alleen stabiele velden:

| Kolom (intern) | Type | Verplicht | Index | JS-veld | Toelichting |
|---|---|---|---|---|---|
| `Title` | Tekst (1 regel) | ✅ | — | `id` | Projectsleutel `<projectnr>_<TYPE>`, bv. `201270_BFMR2000EK` |
| `ProjectNr` | Tekst | ✅ | ✅ | `projectnr` | bv. `201270` — filter-sleutel in álle lijsten |
| `ServiceNr` | Tekst | — | — | `servicenr` | bv. `201224` |
| `Naam` | Tekst | ✅ | — | `naam` | machine-/projectnaam, bv. `BFMR2000EK` |
| `KlantId` | Tekst | — | — | `klantId` | ref → klantenbron (naam afgeleid) |
| `PlId` | Tekst | — | — | `plId` | projectleider-ref |
| `EngId` | Tekst | — | — | `engId` | engineer-ref |
| `WvbId` | Tekst | — | — | `wvbId` | werkvoorbereider-ref |
| `VerantwoordelijkeId` | Tekst | — | — | `verantwoordelijkeId` | default = engineer indien leeg |
| `MachineType` | Tekst | — | — | `machineType` | bv. `BFMR2000EK` |
| `Oplevering` | Datum | — | — | `oplevering` | geplande opleverdatum |
| `Aangemaakt` | Datum | — | — | `aangemaakt` | aanmaakdatum project |
| `Status` | Keuze | ✅ | — | `status` | `actief` · `afgerond` · `gearchiveerd` |
| `PlannerUrl` | Tekst (meerdere regels) | — | — | `plannerUrl` | deep-link Planner; leeg = geen knop |

**Niet opslaan** (afgeleid via resolvers): `klant`, `pl`, `eng`, `wvb`, `verantwoordelijke`.

**Code-koppeling:** bij go-live vervangen `BFT_PROJECTEN` / `bftAlleProjecten()` door een `BFTGraph`-query op deze lijst, met een mapper PascalCase→camelCase die daarna `bftNormProject()` draait (id's leidend, namen herafgeleid).

---

## Overige lijsten (sleutelvelden — detail volgt ná bewijs van lijst #1)

Afgeleid uit `BFTGraph.getProjectSnapshot()`. Elke lijst heeft `ProjectNr` (✅ index) + `Title`.

| Lijst | Model | Sleutelkolommen (PascalCase) |
|---|---|---|
| `BFT_Checklists` | rij per checklist-item | `ProjectNr`, `ItemId`, `Status` (`Gedaan`·`NVT`·`Open`), `Note`, `Monteur`, `Tijdstip`, `Oplevering` |
| `BFT_IBN` | rij per I/O-/testitem | `ProjectNr`, `ItemId`, `TypeTest` (`Droog`·`Nat`), `Status`, `Note`, `Monteur`, `Tijdstip` |
| `BFT_Storingen` | rij per storing | `ProjectNr`, `Status` (`Open`·`InBehandeling`·`Afgehandeld`), `Datum`, `Omschrijving`, `Melder` |
| `BFT_Planning` | rij per project/discipline | `ProjectNr`, `Jaar`, `StartWeek`, `EindWeek`, `Discipline` |
| `BFT_Evaluaties` | rij per evaluatie(-item) | `ProjectNr`, `Score`, `Categorie`, `Note` |
| `BFT_ResourcePlanning` | rij per inzet | `ProjectNr`, `Discipline`, `Uren` |
| `BFT_Bouwvolgorde` | rij per bouwstap | `ProjectNr`, `ItemId`, `Fase`, `Status`, `Monteur`, `Tijdstip` |

> ⚠️ **Aandachtspunt OverallPlanning** (zie geheugen `project_bft_v2_architectuur`): die bewaart nu álle projecten in één blob → mapt niet 1-op-1 op een rij-per-project-lijst. Vóór die tool naar SharePoint gaat, eerst splitsen naar per-project records. Niet in scope voor lijst #1.

---

## Document Library

- **`BFTPortal`** (bestaat al, root-site) — PDF-opslag. `bft-graph.js` `LIBRARY_DOCS` is hierop gezet. HTML-hosting werkt hier níét (download i.p.v. render) → hosting blijft GitHub Pages.

## Volgorde

1. **Na admin-consent:** `BFT_Projecten` aanmaken (kolommen hierboven) + index op `ProjectNr`.
2. `BFTGraph`-projectquery + mapper toevoegen; één project end-to-end lezen/schrijven → **bewijs**.
3. Pas dán de overige lijsten + de bijbehorende store-swaps per tool.
