# PvA — PowerAll bevragen: proxy + frontend-adapter

**Datum:** 2026-06-11 · **Status:** concept ter bespreking
**Doel:** vastleggen *hoe* de BFT-tools data uit PowerAll halen. **Besluit 2026-06-11:** demo-proxy draait op **Cloudflare Worker** (snelste weg, geen tenant-toegang nodig); dezelfde handler-code verhuist later naar **Azure Function + Key Vault** (eindstaat in de Bofram-tenant).
**Hangt samen met:** `PvA_MachineBOM_Materiaaldekking.md` §6b (de demo = Stuklijstvergelijker live op `WorkOrderLine`), `reference_powerall_api` (datamodel), `richting-hosted-live` (swap-punt-patroon).

---

## 1. Architectuur — drie lagen, sleutel server-side

```
PowerAll Connect  (connect.powerall.io/v1)
      ▲  API-sleutel — ALLEEN hier (nooit in de browser)
 [BFT-proxy]      read-only · pad-whitelist · CORS · cache · shared-secret
      ▲  https, géén sleutel
 [BFTPowerAll]    adapter in de browser, config-driven base-URL (swap-punt zoals BFTGraph)
      ▲
 tools  (Stuklijstvergelijker live → later materiaaldekking-tool)
```

**Waarom een proxy verplicht is:** de API-sleutel mag niet in een client-side SPA (zou publiek leesbaar zijn). De proxy houdt de sleutel vast en geeft alleen toegestane, read-only verzoeken door. Bofram host niet op eigen server → een serverless functie is de oplossing.

## 2. De proxy (enig server-side component) — ontwerpregels

- **Sleutel** als secret (Cloudflare Worker Secret nu; Key Vault op Azure later). Nooit in een response.
- **Read-only afdwingen in de proxy:** alleen `GET`; alleen een **whitelist van paden** — `/work-orders`, `/work-orders/lines`, `/purchase-orders/lines`, `/goods-receipts`, `/products`. Al het andere → `403`. Beschermt ook als de sleutel breder gescoped blijkt (risico R4).
- **CORS:** alleen onze origin(s) — `*.github.io` nu, SWA-domein later.
- **Toegang tot de proxy zelf:** een **shared-secret/bearer** die de frontend meestuurt, zodat de proxy niet open op het internet staat. Later vervangen door MSAL-validatie.
- **Caching:** korte TTL (±60s) op `products`/stock → ontziet de nog onbekende rate-limits.
- **Decimalen als string laten** doorgeven → frontend parseert exact (geen float-drift; conform `reference_powerall_api`).
- **Query-passthrough** (`include`, `filter`, paginatie) gevalideerd/begrensd doorgeven.

**Portabiliteit:** schrijf de handler als één klein, framework-arm bestand (fetch in → fetch uit). Cloudflare Worker en Azure Function verschillen alleen in de "verpakking" (request/response-binding + secret-bron); de logica is identiek → cutover zonder herschrijven.

## 3. Cloudflare-opzet (demo)

| Onderdeel | Keuze |
|---|---|
| Runtime | Cloudflare Worker (gratis tier; global) |
| Sleutel | `wrangler secret put POWERALL_KEY` |
| Proxy-toegang | `wrangler secret put PROXY_SHARED_SECRET` (frontend stuurt `Authorization: Bearer …`) |
| Config | `POWERALL_BASE = https://connect.powerall.io/v1`, toegestane origins, pad-whitelist |
| Deploy | `wrangler deploy` → vaste `*.workers.dev`-URL (of eigen subdomein) |

**Governance-kanttekening:** in de demo loopt het PowerAll-verkeer via Cloudflare (buiten de M365-tenant). Read-only + read-only-gescopete sleutel maakt dat voor een demo acceptabel; het is exact de reden dat het **eindproduct in Azure** thuishoort.

## 4. De frontend-adapter `BFTPowerAll` (swap-punt, zoals BFTGraph)

Eén module in `library/js/`. Config = alleen `POWERALL_PROXY_BASE` (+ shared-secret). Genormaliseerde methoden:

```
BFTPowerAll.getWorkOrderLines(woKey)  -> [{ artikel, omschrijving, aantal }]   // = de demo
BFTPowerAll.getPurchaseStatus(woKey)  -> [{ artikel, besteld, ontvangen }]      // PurchaseOrderLine + GoodsReceipt
BFTPowerAll.getProductStock(artikel)  -> { artikel, voorraad }                  // Product include=Stock
```

- Let op de **const/window-valstrik**: bare referentie + `typeof`-guard, niet op `window` hangen (`reference_const_window_trap`).
- Eén centrale `fetch`-helper: zet shared-secret-header, parse JSON, normaliseer, foutafhandeling (timeout, lege set, niet-200).

## 5. Eerste call (de demo)

```
GET {proxy}/work-orders/lines?filter[workOrder]=<relationCode:entryNumber>&include=Product
```
→ normaliseren naar `[{artikel, omschrijving, aantal}]` → voeden aan de bestaande compare-logica (V1-Stuklijstvergelijker, geport naar V2). Zie `PvA_MachineBOM_Materiaaldekking.md` §6b en stap **D** in de fasering.

## 6. Te bevestigen vóór bouw (PowerAll-helpdesk = de sandbox-risico's)

1. **Auth-header** — naam/format van de sleutel (bv. `Authorization: Bearer` of een custom header).
2. **R2** — zit `artikel` direct op `WorkOrderLine` of pas via `include=Product`? Is `aantal` de **behoefte** of het **restant**?
3. **R3** — **IP-allowlist** ja/nee? Een allowlist blokkeert de Cloudflare-omweg → dan toch Azure/tenant nodig. **Belangrijkste go/no-go voor deze opzet.**
4. **R4** — sleutel **read-only** gescoped?

## 7. Bouwvolgorde

| Stap | Inhoud | Resultaat |
|---|---|---|
| 1 | Worker-skelet: pad-whitelist + CORS + shared-secret + sleutel-passthrough (auth-header als enige open plek) | proxy klaar, wacht op sleutel |
| 2 | `BFTPowerAll`-adapter met `getWorkOrderLines` + fetch-helper | frontend kan de proxy bevragen |
| 3 | Sleutel + auth-header invullen (na helpdesk) → één live WO ophalen | live data binnen |
| 4 | Compare-logica V1→V2 porten; `parseFile()` → `fetchWorkOrderLines()` | **demo werkt** |
| 5 | Later: `getPurchaseStatus`/`getProductStock` → dekkings-% (materiaaldekking-tool) | echte tool |

## 8. Scope-grens

Demo = **read-only, één WO, wegwerpbaar**. Geen schrijfacties (bestellen blijft in PowerAll), geen SharePoint/MSAL, geen Azure. Worker-code wordt zo geschreven dat hij 1:1 naar een Azure Function verhuist zodra de tenant-toegang rond is.
