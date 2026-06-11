# PvA — Machine-BOM & materiaaldekking (read-only overzicht per machine)

**Datum:** 2026-06-11 · **Status:** concept ter bespreking
**Aanleiding (Sjef):** een complete machine in één keer bestellen (staal, RVS, PE-leidingen, appendages) is nu lastig door het **versplinterde SolidWorks-archief** (bestanden worden gekopieerd; bij wijzigingen is de juiste versie niet terug te vinden). Idee: een "virtuele machine" die toont wat je besteld hebt, met benaming, visualisatie, ERP-koppeling, auto-bijwerkende BOM en afvinklijst — **alles met elkaar verbonden**.

> **Kernconclusie vooraf (eerlijk):** dit is **geen visualisatieprobleem maar een koppelsleutel-probleem**. De waarde zit in *betrouwbare, actuele BOM ↔ bestelstatus*, niet in 3D. De 3D-viewer is het duurste deel met de laagste ROI en gaat **uit scope** (geparkeerd). ~80% van het idee valt samen met de al geplande **PowerAll-materiaaldekking-tool**; dit PvA scherpt die aan met de SolidWorks-BOM-invalshoek.

---

## 1. Wensen (geanalyseerd)

| # | Wens (Sjef) | Status haalbaarheid |
|---|---|---|
| W1 | Goede benaming van onderdelen/artikelen | ⚠️ **Geen software-feature maar de fundering** — vereist één canonieke sleutel (artikelnummer). Ontbreekt vandaag (zie K1). |
| W2 | Machine visueel in de browser tonen (3D) | ❌ **Uit scope** — duur, onderhoudsintensief, lage ROI; geen part-ID-mapping mogelijk zonder K1. Vervangen door gegroepeerde BOM-boom met statuskleuren. |
| W3 | Koppeling met ERP (PowerAll) | ✅ Haalbaar **read-only** via de geplande backend-proxy (`PurchaseOrderLine`, `GoodsReceipt`, `WorkOrderLine`, `Product.Stock`). |
| W4 | Overzicht/BOM die na bestellen automatisch bijwerkt | ✅ = de materiaaldekking-tool (live dekkings-% per machine). |
| W5 | Afvinklijst per onderdeel | ✅ Past op het bestaande checklist-/append-only-patroon (zoals IBN). |
| W6 | Alles met elkaar verbonden | ✅ Mits **één join-key** (gedeelde-data-principe). Dit is K1. |

## 2. Huidige situatie (vastgesteld)

- **Grond-truth BOM = SolidWorks** (niet PowerAll Product Structure). Mogelijk komt er een **PDM-systeem** — nog niet zeker.
- **Geen koppelnummer vandaag** tussen SolidWorks-part en PowerAll-artikel. ⚠️ Dit is de keystone (K1).
- **Omvang:** ~200–300 parts per machine → prima voor een boom/tabel-UI; bevestigt dat 3D niet nodig is.
- **Scope = tonen**, geen write-back: de tool maakt géén inkooporder in PowerAll. "Bestellen in één keer" = *de boodschappenlijst zichtbaar maken*, bestellen blijft in PowerAll.
- **Bestaande roadmap-context (ERP-sectie):**
  - *Materiaaldekking-/tekortentool* — "live per machine tonen wat nog besteld/ontvangen moet worden". Vervangt de handmatige `Stuklijstvergelijker`.
  - *Koppeling op de werkorderregel* — bewuste keuze: koppelen op **WO-regel-ID**, "geen broos artikelnummer-matchen". `WorkOrderLine` = materiaalbehoefte per machine.
  - *Interactieve BOM-lijst voor klant* — de externe broer van deze interne tool.

## 3. Kernuitdagingen / gap-analyse

- **K1 — De koppelsleutel (keystone).** Zonder gedeelde sleutel kan de tool "ontworpen" (SolidWorks) niet matchen aan "besteld/ontvangen" (PowerAll). Hier valt of staat alles. Zie §4.
- **K2 — Twee soorten materiaal koppelen verschillend.**
  - *Appendages/fittings* = catalogusartikelen → schoon **1:1** op een PowerAll artikel-ID.
  - *Staal / RVS / PE-leidingen* = **voorraadmateriaal** (plaat/buis/profiel per maat+kwaliteit), geen uniek part-artikel → nodig: een **materiaal→voorraadartikel-regel** (bv. "RVS304 plaat 3 mm" → artikel X, hoeveelheid via oppervlak/lengte). Moet vanaf dag één in het datamodel.
- **K3 — Mismatch-detectie hangt aan K1.** "Toon wat in PowerAll besteld is" kan *zonder* SolidWorks (puur WO-/PO-regel). Maar de **killer-feature** — "ontworpen maar niet besteld" — vereist de SolidWorks↔PowerAll-join, dus K1. Eerlijk: de waardevolste functie is óók de moeilijkste.
- **K4 — Versie-/archiefchaos is bron-zijdig.** De tool consumeert de SolidWorks-BOM-export; is die uit een ongecontroleerd archief, dan toont de tool keurig de verkeerde versie (garbage-in). PDM is de echte oplossing voor de bron; de tool kan dat niet repareren, alleen er baat bij hebben (zie §4, aanpak A).
- **K5 — 3D.** Geen mesh→artikel-mapping mogelijk zonder K1; 200–300 parts × honderden MB × continu her-export = hoge terugkerende last. **Geparkeerd.**

## 4. De koppelsleutel-beslissing (K1)

| | Aanpak | Voor | Tegen |
|---|---|---|---|
| **A** (doel) | PowerAll-artikelnummer als **custom property** op elk SolidWorks-part (afdwingbaar via **PDM-datakaart**) | Schoon, canoniek, toekomstvast | Vergt engineering-discipline + proces; pas echt afdwingbaar mét PDM |
| **B** (bootstrap) | **Mappingtabel in de tool**: SolidWorks part-nr/omschrijving → PowerAll artikel-ID; elk nieuw part één keer koppelen, daarna hergebruik | Levert nú waarde, raakt het SolidWorks-proces niet | Handwerk; kan verouderen |
| **C** | Fuzzy-match op omschrijving/maat | "gratis" | Onbetrouwbaar bij staal/RVS/PE met veel lijkende items — **afgewezen als hoofdroute** |

**Advies: B nu → A als einddoel.** Start met de mappingtabel (waarde meteen, geen procesomslag). Zodra PDM landt, zet het PowerAll-artikel-ID op de PDM-datakaart → convergeert vanzelf naar A. PDM is dus de **hefboom** die de koppeling permanent maakt, niet "leuk extra".

**Verhouding tot "koppelen op WO-regel-ID" (bestaande roadmap):** complementair, niet strijdig.
- *Bestelstatus tonen* (besteld/ontvangen/voorraad) → via **WO-/PO-regel**, ID-gebaseerd, geen artikelnummer-match nodig.
- *Mismatch tonen* (ontworpen ↔ besteld) → vereist de SolidWorks↔PowerAll-join → **K1/aanpak B**.

## 5. Voorgestelde architectuur

```
SolidWorks BOM-export ─┐                                  ┌─► dekkings-% per machine
 (Excel/CSV, per machine)│                                │
                         ├─► [Mapping B] ─► machine-bom ──┼─► mismatch-flags
PowerAll (read-only proxy)│   part→artikel    (één bron)   │   (ontworpen↔besteld)
 WO-/PO-regel · ontvangst │                                └─► afvinklijst per onderdeel
 voorraad ────────────────┘
(3D — geparkeerd, zou later op dezelfde machine-bom haken via artikel-ID)
```

Geen apart "virtuele machine"-eiland: dit is een **machine-/projectgerichte BOM-view** met de materiaaldekking-tool als motor (gedeelde-data-principe).

## 6. Voorstel datamodel

```json
// machines/<id>/data/machine-bom.json
{
  "machineId": "BFMR2000EK-201267",
  "schemaVersion": 1,
  "bron": "SolidWorks BOM-export 2026-06-11",
  "regels": [
    { "id": "sw-00123", "swPart": "12345-A", "omschrijving": "Aftapklep RVS DN50",
      "soort": "appendage", "aantal": 2,
      "artikel": "PA-66012", "assemblyPad": "Frame/Leidingwerk" },
    { "id": "sw-00124", "swPart": "RVS304-PL3", "omschrijving": "RVS304 plaat 3 mm",
      "soort": "bulk", "materiaal": "RVS304", "vorm": "plaat", "maat": "3mm",
      "hoeveelheid": { "waarde": 2.4, "eenheid": "m2" },
      "artikelRegel": "RVS304-PLAAT-3" }
  ]
}
```
```json
// library/data/artikel-mapping.json  (aanpak B — groeit per gekoppeld part)
{ "12345-A": "PA-66012", "RVS304-PL3": "RVS304-PLAAT-3" }
```
- `soort`: `appendage` (1:1 artikel) vs `bulk` (materiaal→voorraadartikel-regel) — dekt K2.
- `id` stabiel afgeleid van het SolidWorks-part → afvink-state blijft behouden bij her-import (vgl. IBN-aanpak).

## 7. Fasering (oplopende ROI; 3D bewust laatst/uit)

| Stap | Inhoud | Resultaat |
|---|---|---|
| **0** | K1-beslissing + bulk/catalogus-onderscheid vastleggen; sandbox-check PowerAll WO-/PO-regel | fundering staat |
| **1** | **Mappingtabel** (aanpak B): SolidWorks-part ↔ PowerAll-artikel, hergebruikbaar | de join bestaat |
| **2** | **SolidWorks-BOM-import** per machine → `machine-bom.json` (uitbouw `Stuklijstvergelijker`) | één actuele BOM per machine |
| **3** | **PowerAll-statusoverlay** (read-only proxy): besteld/ontvangen/voorraad + **dekkings-%** | kernwens: live wat nog besteld moet |
| **4** | **Mismatch-flags**: ontworpen↔besteld ("12 parts niet besteld") | voorkomt halve-machine-leveringen |
| **5** | **Afvinklijst** per onderdeel (ontvangen/gecontroleerd/gemonteerd), append-only | werkvloer-bruikbaar |
| **6** | "Visueel" = gegroepeerde **BOM-boom** met statuskleuren (+ evt. thumbnails) | overzicht zonder 3D |
| **—** | ~~3D-viewer~~ | geparkeerd; haakt later op dezelfde `machine-bom` via artikel-ID |

## 8. Open beslissingen (input nodig)

1. **K1:** akkoord op **B-nu-A-later** (mappingtabel → later PDM-datakaart)?
2. **Bulkmateriaal-regels (K2):** waar leggen we de "materiaal+maat → voorraadartikel + hoeveelheidsformule" vast — handmatig per project, of een herbruikbare materiaal-tabel?
3. **BOM-bron:** levert SolidWorks een bruikbare gestructureerde **BOM-export** (Excel/CSV met part-nr, omschrijving, aantal)? Welk formaat exact?
4. **Status-granulariteit:** koppelen op **WO-regel** (per machine, conform roadmap) of op PO-regel — wat is in PowerAll het betrouwbaarste anker per machine?
5. **Afhankelijkheid backend:** dit vereist de **read-only proxy** (Azure Function) uit de ERP-sectie — bouwen we die hier of wachten op Fase 3 van de hosting-roadmap?

## 9. Scope-grens (eerlijk)

- **3D-visualisatie, write-back naar PowerAll, en het oplossen van de archief-/versiechaos zelf** vallen **buiten** dit PvA. Het laatste is een **PDM-traject** (organisatie + licenties), niet iets dat een browsertool kan repareren.
- De tool is zo goed als zijn bronnen: een betrouwbare SolidWorks-BOM-export + een onderhouden mapping. Zonder die twee is elk overzicht schijnzekerheid.
