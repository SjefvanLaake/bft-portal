# PvA — Databronnen & beheer: project · klant · personeel als één referentieel geheel

Status: **F1–F5 GEBOUWD** op branch `feature/databronnen-beheer` (2026-06-07), klaar voor lokale test → merge naar main/pages na akkoord. Streng, toekomstgericht. Géén mockup-data; alle referenties komen uit beheerde bronnen en sluiten op elkaar aan.

**Uitvoering samengevat:** F1 klantbeheer (modal+tombstone+relatienr) · F2 projecten-tombstone (verwijderbaar) · F3 NieuwProject datalists→selects gebonden aan bronnen · F4 referenties op stabiele id (rename-safe, naam afgeleid) · F5 mockup-seeds geleegd (projecten+klanten = []; **medewerkers behouden = echte staf**), go-live bron-swap (PowerAll/Graph) in de seed-comments gedocumenteerd. Leftover test-data in localStorage verwijder je via de beheer-modals.

## 1. Probleemstelling (Sjef)

Een project hoort aangemaakt te worden door te **selecteren** uit beheerde bronnen:
1. **Project aanmaken** → 2. **Klant selecteren** (Klantbeheer) → 3. **PL selecteren** → 4. **EN selecteren** → 5. **WVB selecteren** (Personeelsbeheer).

Voorwaarde: de matrix klopt alleen als élke verwijzing naar een bestaande bron-entry wijst. Vrije tekst / mockup mag niet, dat maakt het onduidelijk.

## 2. Analyse huidige staat (streng)

### 2.1 De drie domeinen — ongelijk ontwikkeld

| Domein | Bestand | Beheer-UI | Verwijderen (tombstone) | Stabiele id | Referentie vanuit project |
|--------|---------|-----------|--------------------------|-------------|----------------------------|
| **Personeel** | `bft-medewerkers.js` | ✅ `BFTMedewerkers.openBeheer` | ✅ `_deleted` | ✅ `id` (`mdw_*`) | ❌ via **naam** (`pl:'JdV'`) |
| **Klant** | `bft-klanten.js` | ❌ geen | ❌ geen | ⚠️ `id` bestaat maar wordt nergens gebruikt | ❌ via **naam** (`klant:'Krafteam'`) |
| **Project** | `bft-projects.js` | deels (alleen aanmaken via NieuwProject) | ❌ geen | ✅ `id` (`<nr>_<type>`) | n.v.t. |

### 2.2 De kernfout: referentiële integriteit op vrije tekst

- `BFT_NieuwProject.html` gebruikt voor klant én PL/EN/WVB/verantwoordelijke **`<input list=…>` (datalist)** = suggestie, géén dwang. Je kunt elke willekeurige waarde typen.
- Projecten bewaren die waarden als **naam-string** (`klant:'Krafteam'`, `pl:'JdV'`), niet als bron-id.
- **Bewijs van de schade:** seed-project *Michels* heeft `pl/eng/wvb = 'SL'`, maar **SL staat niet in personeelsbeheer**. De verwijzing valt nergens mee samen — exact het probleem dat Sjef benoemt.
- Inconsistentie binnen het systeem: de nieuwe **vakantie-bron sleutelt al op medewerker-`id`**, terwijl projecten naar personen via naam wijzen. Twee koppelmodellen naast elkaar = bron van toekomstige bugs.

### 2.3 Mockup-data die blijft plakken

- `bft-klanten.js`: 3 fictieve klanten (Demo Klant BV, Ander Bedrijf NV, Klant C Holding).
- `bft-projects.js`: 5 hardcoded seed-projecten (3 op die demo-klanten + Krafteam/Michels).
- Projecten en klanten hebben **geen tombstone** → seed-entries zijn niet écht te verwijderen, blijven altijd selecteerbaar/toewijsbaar. Dat vervuilt de echte planning.

### 2.4 Toekomst (go-live)

Bij go-live komen project/klant uit **PowerAll ERP** en personen uit **M365/Graph**. De lokale stores zijn stand-ins die nú al de juiste vórm moeten hebben: per domein één bron-of-truth, **gerefereerd op stabiele id**, geselecteerd via UI die aan die bron hangt. Dan is de overstap een bron-swap, geen herbouw.

## 3. Doel-architectuur (principe)

```
  Klantbeheer            Personeelsbeheer
  (bft_v2_klanten)       (bft_v2_medewerkers)
      │  id                    │  id
      ▼                        ▼
  ┌──────────────────────────────────────┐
  │  Project (bft_v2_projecten)           │
  │   klantId · plId · engId · wvbId      │   ← referenties op ID
  │   verantwoordelijkeId                 │
  └──────────────────────────────────────┘
      │  projectId / bftId
      ▼
  Planning (bft_overallplanning_)  +  Vakantie (bft_v2_vakantie, persoon-id)
```

Vier principes:
1. **Eén bron per domein**, beheerbaar (toevoegen/bewerken/verwijderen) met tombstone.
2. **Referentie op stabiele id**, niet op naam. Naam = afgeleide weergave via lookup.
3. **Selectie i.p.v. vrije tekst** bij aanmaken — je kunt alleen kiezen wat bestaat.
4. **Geen mockup**: seeds leeg of duidelijk vervangbaar; bij go-live bron-import.

## 4. PvA — fasen (streng, elk testbaar, met rollback)

> Werkwijze zoals afgesproken: bouwen op feature-branch, per fase verifiëren, pas mergen naar main/pages na akkoord.

### Fase 1 — Klantbeheer volwaardig maken  *(laagste risico, grootste gat)*
Spiegel `bft-medewerkers.js`:
- `bft-klanten.js`: runtime-store `bft_v2_klanten` (seed + custom), `bftAlleKlanten()`, `bftSlaKlantOp()`, tombstone `_deleted`, `bftNormKlant()`.
- Namespace `BFTKlanten.openBeheer({onChange})` — modal met naam (+ optioneel plaats/relatienr), toevoegen/bewerken/verwijderen.
- "👥 Klanten"-knop in NieuwProject (en later waar nodig).
- **Verificatie:** klant toevoegen/verwijderen, verschijnt/verdwijnt in de keuzelijst; node-test op store + tombstone.

### Fase 2 — Projecten verwijderbaar (tombstone + beheer)
- `bft-projects.js`: tombstone `_deleted` in `bftAlleProjecten()` (zoals medewerkers), zodat ook seed-projecten weg kunnen.
- Verwijder-actie in Projectoverzicht (of NieuwProject-beheerlijst).
- **Verificatie:** demo-project verwijderen → weg uit alle tools; node-test.

### Fase 3 — Aanmaken = selecteren uit bronnen  *(dwingt integriteit af)*
- `BFT_NieuwProject.html`: datalists → **echte `<select>`**:
  - Klant ← `bftAlleKlanten()`
  - PL ← personeel met rol Projectleider; EN ← Engineering; WVB ← WVB; Verantwoordelijke ← alle personen.
- Verplichte keuze (geen vrije tekst). "+ nieuwe klant/persoon" opent het betreffende beheer-modal (geen typen-in-het-wild).
- **Verificatie:** je kunt geen niet-bestaande klant/persoon meer kiezen; flow Project→klant→PL→EN→WVB werkt end-to-end (screenshot).

### Fase 4 — Referenties op id i.p.v. naam  *(diepste future-proofing, hoogste risico)*
- Project bewaart `klantId, plId, engId, wvbId, verantwoordelijkeId`; naam-velden worden afgeleid (lookup) voor weergave.
- **Migratie (additief, omkeerbaar):** bestaande naam-referenties → id via match op naam; naam als fallback behouden tot alles om is.
- Consumenten aanpassen om id→naam te resolven: OverallPlanning (meta-kolommen + `herstelMetadataUitBron`), Personeelsplanning (verantwoordelijke-filter), vakantie (al op id).
- **Verificatie:** rename van een klant/persoon in beheer → overal correct bijgewerkt (omdat op id gekoppeld); regressietest op beide planning-tools.

### Fase 5 — Mockup eruit + go-live-klaar
- Seeds leegmaken of vervangen door echte stamdata; "demo wissen"-actie.
- Eén bron-swap-punt richting PowerAll (project/klant) en Graph (personeel) documenteren.
- **Verificatie:** schone start zonder mockup; alle keuzelijsten gevuld uit de bronnen.

## 5. Migratie & rollback (rode draad)
- Alles op **feature-branch**; main/pages stabiel tot akkoord.
- Migraties **additief**: oude velden (naam) blijven staan als fallback; geen destructieve overschrijving.
- Per fase een node-test + headless screenshot vóór merge.

## 6. Besluiten (Sjef, 2026-06-07)
1. **Volgorde/scope:** F1→F5 volledig, in volgorde. Per fase verifiëren, pas mergen na akkoord.
2. **Klant-velden:** naam + plaats + **relatienummer** (PowerAll-koppelsleutel).
3. **Verplichting:** PL/EN/WVB **mogen leeg** bij aanmaken (later toe te wijzen). Verplicht: klant + projectnr + naam/type.
4. **Krafteam/Michels:** **demo** → mee opruimen in F5.
```
