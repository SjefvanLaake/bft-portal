# Prep — PowerAll-ideeën: endpoints + sandbox-validatie

**Datum:** 2026-06-14 · **Status:** prep, klaar voor de eerste sandbox-sessie
**Doel:** alle kansrijke ERP-ideeën (roadmap-sectie "Samenwerking met het ERP") in één matrix: welk endpoint, welke velden te bevestigen, welke BFT-koppeling. Zo confirmeert de **eerste sandbox-sessie alles tegelijk** i.p.v. per feature opnieuw.

> **Geblokkeerd tot:** API-sleutel + auth-methode + sandbox (PowerAll-helpdesk) en de Cloudflare-proxy. Tot dan is dit de voorbereiding; geen speculatieve adapter-code.

## Dé cross-cutting onbekende (alles hangt eraan)
**Welk veld koppelt een PowerAll-werkorder aan ons BFT-projectnummer?** (project/referentie op `WorkOrder`?) Zonder die join werkt geen enkele per-project-koppeling. **Eerst bevestigen.**

## Matrix

| # | Idee | PowerAll-endpoint(s) (read) | Te bevestigen in sandbox | BFT-koppeling | Prio |
|---|---|---|---|---|---|
| 1 | Materiaaldekking | `/work-orders/lines` · `/purchase-orders/lines` · `/goods-receipts/expected` · `/products?include=Stock` | WorkOrderLine: artikel + aantal (behoefte vs restant)? · PO-regel: status + **leverdatum** · GoodsReceipt: qty/datum · Product: voorraad | Stuklijstvergelijker → materiaaldekking-tool; tegel in Projectoverzicht | **1** |
| 2 | Leverdata → planningsrisico | `/purchase-orders/lines` | leverdatum-veld op PO-regel; WO↔project-join | OverallPlanning / deadline | **1** |
| 3 | Goederenontvangst → bouwstap-gereed | `/goods-receipts/expected` | ontvangst-datum + koppeling aan WO-regel/artikel | Bouwvolgordelijst | 2 |
| 4 | Installed base / machinepaspoort | `/service-objects` (entiteit) | serienr · klant · locatie · machinetype · koppeling WO/SalesOrder | nieuwe module; Projectoverzicht | 2 |
| 5 | Onderhoudscontracten → planner | `/contracts` · `/contracts/lines` | ServiceObject-koppeling · interval/volgende-datum · relatie | onderhoudsplanner (nieuw) | 3 |
| 6 | Servicemeldingen ↔ Storingslog | `/service-messages` | status · datum · serviceobject · omschrijving | Storingslog | 3 |
| 7 | Master-data klanten | `/relations` · `/contact-persons` · `/relations/{id}/delivery-addresses` | code/id · naam · adres · contactpersoon | bft-klanten (master-swap) | 2 |
| 8 | Master-data personeel | `/employees` | id · naam · rol/functie | bft-medewerkers / Personeelsplanning | 3 |
| 9 | Nacalculatie / projectmarge | `/invoices` · `/purchase-invoices` (+ uren?) | bedragen · WO/project-koppeling · **urenbron** (ERP of niet) | nieuw marge-dashboard | 3 |
| 10 | Oplever-/verzendgegevens | `/deliveries` · `/parcels` | WO-koppeling · status · transportdoc/parcel | MBC Fase 10 / opleverdossier | 3 |
| 11 | Deliverables → PowerAll | `POST /files` | **schrijf-scope** · koppeling aan WO/relatie | IBN-rapport, handleiding, opleverdossier (schrijf — apart afwegen) | laag |

## Wat we nu wél doen (zonder sleutel)
- **Deze matrix** = de complete sandbox-checklist (1 sessie, alles bevestigd).
- **Proxy-whitelist blijft strak**: per feature het endpoint toevoegen, niet vooraf alles openzetten (least-access; conform de governance-lijn).
- **Adapter (`BFTPowerAll`)**: methoden worden **per feature** toegevoegd volgens het bestaande `getWorkOrderLines`-patroon — niet vooruit speculatief stubben.
- **BFT-master-data-kant is al klaar** voor de swap: `bft-klanten`/`bft-medewerkers` werken al op stabiele id's (F4) → alleen de bron wisselen zodra Relations/Employees bevestigd zijn.

## Volgorde zodra de sleutel er is
1. WO↔project-join bevestigen + idee 1/2 (materiaaldekking + leverdata→planning) — grootste directe waarde.
2. Master-data klanten (7) — quick win, stopt dubbel onderhoud.
3. Installed base (4) + contracten (5) + servicemeldingen (6) — de service-/onderhoudstak.
4. Nacalculatie (9), oplever/verzend (10), files (11) — later.
