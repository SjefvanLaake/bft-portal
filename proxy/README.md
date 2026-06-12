# BFT PowerAll-proxy (Cloudflare Worker)

Read-only doorgeefluik tussen de BFT-tools (browser) en de PowerAll Connect API.
De API-sleutel zit in een Worker-secret en verlaat de server nooit. Zie het
ontwerp in `concept/PvA_PowerAll_Proxy_Adapter.md`.

## Wat het doet
- Alleen `GET`, alleen een **whitelist van paden** (`/work-orders`, `/work-orders/lines`,
  `/purchase-orders/lines`, `/goods-receipts`, `/products`) → al het andere `403`.
- **CORS** alleen voor de origins in `ALLOWED_ORIGINS`.
- Optionele **shared-secret** drempel (`PROXY_SHARED_SECRET`).
- 60s **cache** op upstream-responses (ontziet rate-limits).

## Eenmalig opzetten
```bash
npm install -g wrangler        # of: npx wrangler ...
wrangler login                 # interactief in een eigen terminal
```

## Deployen
```bash
cd proxy
wrangler secret put POWERALL_KEY          # plak de read-only PowerAll-sleutel
wrangler secret put PROXY_SHARED_SECRET   # verzin een lange willekeurige string
wrangler deploy                            # → https://bft-powerall.<naam>.workers.dev
```
Daarna in `library/js/bft-powerall.js`:
- `PROXY_BASE`    = de workers.dev-URL
- `SHARED_SECRET` = dezelfde string als `PROXY_SHARED_SECRET`

## Nog te bevestigen vóór de demo werkt (PowerAll-helpdesk)
1. **Auth-header** — `buildAuthHeaders()` in `powerall-proxy.js` is de enige
   open plek. Nu `Authorization: Bearer <sleutel>`; pas aan zodra het exacte
   schema bekend is. (R-auth)
2. **IP-allowlist** op de Connect-API? Zo ja, dan blokkeert PowerAll de
   Cloudflare-IP's en moet de proxy in de tenant (Azure) draaien. (R3 — go/no-go)
3. Veldnamen op `WorkOrderLine` (artikel direct vs via include; aantal =
   behoefte vs restant) — `_mapLine()` in de adapter. (R2)
4. Sleutel **read-only** gescoped. (R4)

## Later naar Azure
`powerall-proxy.js` is framework-arm (fetch in → fetch uit). De logica verhuist
1:1 naar een Azure Function; alleen de request/response-binding en de secret-bron
(Key Vault i.p.v. Worker-secret) verschillen.
