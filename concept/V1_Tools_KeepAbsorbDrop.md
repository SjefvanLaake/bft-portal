# V1-tools — keep / absorb / drop (migratie-afsluiting)

**Datum:** 2026-06-14 · **Status:** besluitvoorstel ter bevestiging
**Doel:** het openstaande gat uit de eindkeuring dichten — een **expliciet besluit per V1-tool**, zodat niets stil sneuvelt. V1 = `Bofram Tools Portaal/Bofram-Tools/tools/`.

**Legenda:**
- **KEEP** = blijft (al gemigreerd naar V2, óf bewust op de roadmap voor latere bouw)
- **ABSORB** = functionaliteit hoort in een bestaande V2-tool, niet als losse tool
- **DROP** = vervangen/obsoleet; bewust niet meenemen
- ⚠️ = jouw bevestiging nodig (jij weet wat de tool feitelijk deed)

## Overzicht

| V1-tool | Wat het deed | V2-status | Besluit | Actie |
|---|---|---|---|---|
| Projectevaluatie | projectevaluatie | ✅ in V2 | **KEEP** | gemigreerd |
| Storingslog | storingen loggen | ✅ in V2 | **KEEP** | gemigreerd |
| Projectoverzicht | dashboard per project | ✅ in V2 | **KEEP** | gemigreerd |
| MachinebouwChecklist | bouw-checklist | ✅ in V2 | **KEEP** | gemigreerd |
| IBNTestprotocol | commissioning-test | ✅ in V2 | **KEEP** | gemigreerd (+ opgeschoond) |
| OverallPlanning | jaarplanning | ✅ in V2 | **KEEP** | gemigreerd (blob-blokker opgelost) |
| Bouwvolgordelijst_MixRecycler | bouwvolgorde (1 type) | ✅ in V2 (generiek) | **KEEP** | generiek gemaakt + `bfmr2000ek.js` |
| Configurator | machine samenstellen | 📋 roadmap | **KEEP** | roadmap "Machine-configurator" |
| Stuklijstvergelijker | BOM vs werkorder vergelijken | 📋 roadmap | **ABSORB** | gaat op in materiaaldekking-tool |
| HandleidingGenerator | handleiding maken | ⏸️ roadmap | **KEEP-PARKED** | geparkeerd (deel B) |
| HandleidingImporter | .bft-handleiding inlezen | ⏸️ roadmap | **KEEP-PARKED** | geparkeerd (.bft-contract) |
| **StoringsAnalyse** | **AI-storingsdiagnose** | ❌ niet in V2 | **KEEP (roadmap)** ⭐ | op roadmap: probable causes uit PowerAll ServiceMessage |
| ExcelExport | storingen → Excel | ❌ niet in V2 | **DROP** | was lokale-werk-omweg; met live data overbodig (besloten 2026-06-14) |
| ResourcePlanning | resource-/personeelsplanning | ✅ geïntegreerd in V2 | **DROP (absorbed)** | functionaliteit zit in Personeelsplanning + OverallPlanning |
| QuestionsImporter | vragensets importeren | ❌ niet in V2 | **DROP** | vervangen door per-machinetype import (route A) |
| DataConverter | dataformaat converteren | ❌ niet in V2 | **DROP** | dev-/migratie-utility, geen eindgebruiker-tool |

## ⭐ De belangrijkste: StoringsAnalyse (AI-diagnose)
Dit is de enige **echt onderscheidende capaciteit** die stil dreigde te verdwijnen. V2 heeft wél het Storingslog (vastleggen), maar **geen analyse/diagnose**. Aanbeveling: **migreren naar V2** — en het sluit naadloos aan op twee dingen die we al hebben staan:
- de **Servicemeldingen ↔ Storingslog**-koppeling (PowerAll ServiceMessage),
- een diagnose-laag over de **installed base** (terugkerende storingen per machinetype).
Dit zou een sterk roadmap-punt zijn: "Storingsanalyse / AI-diagnose over Storingslog + ServiceMessage".

## Besloten (2026-06-14, met Sjef)
1. **ExcelExport → DROP** — was een omweg om de tools lokaal te laten werken; met live data niet meer nodig.
2. **ResourcePlanning → DROP** — al geïntegreerd in de V2-tools (Personeelsplanning + OverallPlanning).
3. **QuestionsImporter → DROP** — vervangen door de per-machinetype-import (route A).
4. **DataConverter → DROP** — dev-/migratie-utility, niet voor eindgebruikers.
5. **StoringsAnalyse → roadmap** — AI-diagnose die "probable causes" genereert uit PowerAll-servicehistorie.

## Resultaat
De V1→V2-migratie is **expliciet afgesloten**: elke oude tool heeft een besluit, niets zweeft meer. De enige waardevolle wees (StoringsAnalyse) is geborgd op de roadmap i.p.v. vergeten.
