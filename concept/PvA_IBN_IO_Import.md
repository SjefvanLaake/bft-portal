# PvA — Visuele I/O-import voor het IBN-testprotocol (per machine)

**Datum:** 2026-06-05 · **Status:** concept ter bespreking
**Einddoel:** per machine de I/O importeren uit de SOLIDWORKS Electrical-export en als **afvinkbare lijst** in het IBN-testprotocol tonen, met het **elektrisch schema (PDF)** als cross-reference.

---

## 1. Wensen (geanalyseerd)

| # | Wens | Status haalbaarheid |
|---|---|---|
| W1 | I/O per machine importeren uit SWE-XML (BOM + wires + locations) | ✅ Bewezen — POC haalt 101 functies per LOGO-module, met digitaal/analoog-in/analoog-uit |
| W2 | Geïmporteerde I/O als **afvinkbare** protocol-items (Droog + Nat) | ✅ Past op bestaande IBN-checklist + wizard |
| W3 | Elektrisch schema (PDF) als cross-reference tijdens testen | ✅ Past op bestaande `manifest.documents` (categorie "Elektrisch Schema") |
| W4 | Per machine, herhaalbaar, meerdere machines | ✅ Past op `machines/<id>/` data-patroon |

## 2. Huidige situatie (vastgesteld in de code)

- **IBN `FASEN` is hardcoded** in `BFT_IBNTestprotocol.html`. Fase 3 *"Droog — I/O Test"* en Fase 5 *"Nat"* bevatten de machine-specifieke I/O **handmatig getypt** (`{id:'3A-I1', desc:'I1 — Start transferpomp mud', sub:'LOGO 1.0'}`).
- **State per project:** `localStorage['bft_v2_ibn_'+projectId]` = `{checks, notes, gates, machineInfo}`; `checks` is gekeyed op `itemId`.
- **Machine-data-patroon:** `machines/<id>/manifest.json` met `data:{ slangen:"data/slangen.json", … }` + `schemaVersion`. Documenten met categorieën incl. "Elektrisch Schema".
- **Wizard:** IBN gebruikt `BFTWizard.register` met droog/nat-duplicatie in fasen 3+5.

## 3. Kernuitdagingen / gap-analyse

> **UPDATE 2026-06-05:** de **LOGO!Soft CSV-export** (`Logo1-4.csv`, kolommen `Connector,name`) lost G2 én G3 op — die bevat **klemnummer + functie + richting** per controller. Daarmee wordt de CSV de **primaire I/O-bron**; de SWE-XML zakt naar enrichment/validatie.

- **G1 — Data-driven maken.** De I/O-lijst moet uit een per-machine bron (`io.json`) komen i.p.v. hardcoded. Grootste structurele wijziging in de IBN-tool. *(blijft)*
- **G2 — Klemnummering (I1/Q1).** ✅ **Opgelost** — de LOGO CSV heeft `I1," Start D motor"` etc. Geen PDF-/handwerk nodig.
- **G3 — Richting I vs Q.** ✅ **Opgelost** — CSV maakt het expliciet: `I`/`AI` = ingang, `Q`/`AQ` = uitgang.
- **G4 — Droog vs Nat.** Dezelfde I/O wordt 2× getest. Mapping is een protocol-keuze (bestaande wizard dupliceert al). *(blijft)*
- **G5 — Stabiele id's.** Afvink-state mag niet verloren gaan bij her-import → id afgeleid van `controller + klem` (bv. `L1-I3`), stabiel. *(blijft)*

## 3b. Scope-uitbreiding — generiek sjabloon + per-machinetype data (besluit 2026-06-13, met Sjef)

**Aanleiding:** het IBN-protocol stond vol BFMR2000EK-specifieke aanduidingen (F7, K16, V1–V8, M1–M4, B039…). Besluit: de **framework-fases blijven generiek** (al doorgevoerd: zekeringen, faserelais, controller, noodstop, softstarter/VFD), en de **machine-specifieke functie-inhoud komt per machinetype uit een importbron** — niet hardcoded in de tool.

**Route A (gekozen) — uitgebreide scope:** niet alleen Fase 3 (I/O), maar ook:
- **4B kleppen** (open/close via HMI) — afleidbaar uit de klep-I/O
- **4C bump-test motoren** (draairichting) — afleidbaar uit de motor-I/O
- **5B/5C pompen & kleppen nat** — idem
- **4D software-alarmen (B###)** — uit de LOGO-programmablokken (⏸️ geparkeerd: zit niet in de I/O-XML, aparte bron nodig)

**Per machinetype, niet per instance.** Net als de Bouwvolgordelijst (`library/data/bouwvolgorde/<type>.js`) krijgt de IBN een **per-machinetype databestand** met de type-specifieke secties; alle machines van dat type delen het. Bestaand patroon hergebruiken.

**Grens generiek ↔ type-specifiek:**
- *Generiek in de tool:* Fase 1, 2A/2B/2C, 4A, 4E, 6, 7.
- *Per machinetype (import):* Fase 3 I/O, 4B, 4C, 4D, 5B/5C.

**BFMR2000EK blijft intact** als werkende test tot de import-route staat (lopend project 201267).

## 4. Voorgestelde architectuur

```
LOGO CSV (Logo1-4)  ─┐
 klem+functie+richting │─►  [Import-tool]  ──►  machines/<id>/data/io.json  ──►  [IBN Fase 3/5]
SWE-XML (locatie/comp) ┘     parse + koppel       stabiel schema                  data-driven afvinklijst
PDF e-schema  ─────────────────────────────────────────────────────────────────►  cross-reference-knop
```

**Bronstrategie (na de LOGO CSV-vondst):**
- **LOGO CSV = primair** → de afvinklijst zelf (klem · functie · richting · controller).
- **SWE-XML = enrichment/validatie** → locatie (+Lx), componenten, kruischeck bedrading↔programma.
- **PDF e-schema = naslag** voor de tester.

**Import-tool** (uitbouw van de POC):
1. XML's inlezen (drag-drop) — *werkt*.
2. I/O tonen per module/locatie, read-only — *werkt*.
3. **Selectie + verrijking:** aanvinken welke I/O in het protocol komen; per item droog/nat + (optioneel) klem/richting toekennen.
4. **Exporteren** naar `io.json`.

**IBN-tool:**
5. Laadt `io.json` voor de gekozen machine → genereert Fase 3/5 items data-driven → afvinkbaar via bestaande checklist + wizard.
6. **E-schema PDF:** knop "📐 schema" per sectie/item opent de PDF uit `manifest.documents` (later evt. paginaverwijzing per I/O).

## 5. Voorstel `io.json`-schema

```json
{
  "machineId": "BFMPR750EG-201221",
  "schemaVersion": 1,
  "bron": "LOGO!Soft CSV (Logo1-4) 2026-06-05 + SWE-XML enrichment",
  "schemaPdf": "documenten/E-schema.pdf",
  "io": [
    { "id": "L1-I3", "controller": "Logo1", "klem": "I3", "richting": "in",
      "soort": "digitaal", "functie": "Start D motor", "locatie": "+L1", "test": ["droog","nat"] }
  ]
}
```
`id` = `<controller>-<klem>` (bv. `L1-I3`) → stabiel, her-import behoudt afvink-state.
Velden uit de **LOGO CSV**: controller · klem · richting (I/AI=in, Q/AQ=uit) · soort (digitaal/analoog) · functie. `locatie` uit de **SWE-XML** (optionele verrijking).

## 6. Fasering (stappenplan)

| Stap | Inhoud | Resultaat |
|---|---|---|
| **0** ✅ | POC-parser + read-only overzicht per module/locatie | klaar |
| **1** | `io.json`-schema vastleggen + POC laten **exporteren** (selectie + droog/nat) | machine levert io.json |
| **2** | IBN Fase 3/5 **data-driven** maken (laadt io.json; fallback op hardcoded) | afvinklijst uit import |
| **3** | **E-schema PDF**-cross-reference (manifest-document → viewer/deeplink) | schema naast de test |
| **4** | **Validatie-laag** (XML-marks ↔ protocol: meld ontbrekend/extra) | kwaliteitscheck |
| **5** | Go-live: io.json naar SharePoint i.p.v. lokaal (swap-punt) | multi-user/hosted |

## 7. Open beslissingen (input nodig)

1. ~~**Klemnummering (G2)**~~ ✅ **Opgelost** door de LOGO CSV (klem zit erin).
2. ~~**Richting (G3)**~~ ✅ **Opgelost** door de LOGO CSV (I/AI=in, Q/AQ=uit).
3. **Backwards-compat:** de bestaande hand-getypte protocollen (bv. BFMR2000) — migreren naar io.json, of hardcoded laten naast de geïmporteerde machines?
4. **Droog/Nat (G4):** standaard alle I/O in beide, of per item kiezen?
5. **M-flags & ongebruikte connectoren:** de CSV bevat ook systeem-flags (M8 Init, M25-31 backlight) en lege klemmen → die filteren we eruit; alleen benoemde I/AI/Q/AQ worden testitems. Akkoord?
6. **"!…!"-notatie:** alarm-/meldsignalen staan tussen uitroeptekens (`!Aardlekfout!`). Tonen we ze met of zonder de `!`-tekens?

## 8. Scope-grens (eerlijk)

De XML levert *wat er is* (functies, modules, locaties, componenten). Acceptatiecriteria, testvolgorde en veiligheids-gates blijven **engineering-werk** in het FASEN-raamwerk. **B####** (LOGO-programmablokken) zit niet in deze XML — geparkeerd.
