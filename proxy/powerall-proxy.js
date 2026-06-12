/**
 * powerall-proxy.js — BFT PowerAll-proxy (Cloudflare Worker, skelet)
 * ─────────────────────────────────────────────────────────────────
 * Read-only doorgeefluik naar de PowerAll Connect API.
 * De API-sleutel zit in een Worker-secret en verlaat de server NOOIT.
 *
 * De browser (BFTPowerAll-adapter) praat met deze Worker; de Worker
 * praat met PowerAll. Alleen GET en alleen toegestane paden komen door.
 *
 * Bewust framework-arm geschreven (fetch in → fetch uit) zodat dezelfde
 * logica later 1:1 naar een Azure Function kan verhuizen.
 *
 * ── Secrets/vars (zie wrangler.toml + README) ─────────────────────
 *   POWERALL_KEY          (secret)  de read-only API-sleutel
 *   PROXY_SHARED_SECRET   (secret)  drempel tegen willekeurig verkeer (optioneel)
 *   POWERALL_BASE         (var)     https://connect.powerall.io/v1
 *   ALLOWED_ORIGINS       (var)     kommalijst, bv. "https://<naam>.github.io"
 * ─────────────────────────────────────────────────────────────────
 */

/* Alleen deze pad-prefixen mogen doorgezet worden (read-only ontsluiting). */
const PAD_WHITELIST = [
  '/work-orders',
  '/work-orders/lines',
  '/purchase-orders/lines',
  '/goods-receipts',
  '/products'
];

const CACHE_TTL_SECONDEN = 60; // korte cache → ontziet onbekende rate-limits

export default {
  async fetch(request, env) {
    const url    = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors   = corsHeaders(origin, env);

    /* CORS preflight */
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    /* Origin-allowlist */
    if (!origin || !isOriginToegestaan(origin, env)) {
      return json({ error: 'Origin niet toegestaan' }, 403, cors);
    }

    /* Alleen GET (read-only afdwingen) */
    if (request.method !== 'GET') {
      return json({ error: 'Alleen GET toegestaan' }, 405, cors);
    }

    /* Shared-secret drempel (optioneel) */
    if (env.PROXY_SHARED_SECRET) {
      const auth = request.headers.get('Authorization') || '';
      if (auth !== `Bearer ${env.PROXY_SHARED_SECRET}`) {
        return json({ error: 'Niet geautoriseerd' }, 401, cors);
      }
    }

    /* Pad-whitelist */
    if (!padToegestaan(url.pathname)) {
      return json({ error: `Pad niet toegestaan: ${url.pathname}` }, 403, cors);
    }

    /* Doel-URL bij PowerAll opbouwen (pad + querystring 1:1 doorgeven) */
    const base   = (env.POWERALL_BASE || 'https://connect.powerall.io/v1').replace(/\/$/, '');
    const doel    = `${base}${url.pathname}${url.search}`;

    /* Cache (Cache API) — alleen GET, korte TTL */
    const cache    = caches.default;
    const cacheKey = new Request(doel, { method: 'GET' });
    const gecached  = await cache.match(cacheKey);
    if (gecached) {
      return withCors(gecached, cors);
    }

    /* Naar PowerAll */
    let upstream;
    try {
      upstream = await fetch(doel, {
        method: 'GET',
        headers: buildAuthHeaders(env)
      });
    } catch (err) {
      return json({ error: 'Upstream onbereikbaar', detail: String(err) }, 502, cors);
    }

    /* Body doorgeven met CORS + cache-control */
    const body = await upstream.text();
    const resp = new Response(body, {
      status: upstream.status,
      headers: {
        ...cors,
        'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
        'Cache-Control': `max-age=${CACHE_TTL_SECONDEN}`
      }
    });

    if (upstream.ok) {
      await cache.put(cacheKey, resp.clone());
    }
    return resp;
  }
};

/* ── PowerAll-authenticatie ────────────────────────────────────────
   ⚠️ ENIGE OPEN PLEK: het exacte auth-schema moet bij de PowerAll-
   helpdesk bevestigd worden (R-auth). Onderstaande Bearer-variant is
   de meest waarschijnlijke; pas de header-naam/format hier aan zodra
   bekend. Dit is de enige regel die nog moet wijzigen voor de demo. */
function buildAuthHeaders(env) {
  return {
    Authorization: `Bearer ${env.POWERALL_KEY}`,
    Accept: 'application/json'
  };
}

/* ── Helpers ── */
function padToegestaan(pathname) {
  return PAD_WHITELIST.some(p => pathname === p || pathname.startsWith(p + '/'));
}

function isOriginToegestaan(origin, env) {
  const lijst = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return lijst.includes(origin);
}

function corsHeaders(origin, env) {
  const toegestaan = isOriginToegestaan(origin, env) ? origin : '';
  return {
    'Access-Control-Allow-Origin': toegestaan,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function withCors(response, cors) {
  const r = new Response(response.body, response);
  for (const [k, v] of Object.entries(cors)) r.headers.set(k, v);
  return r;
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
}
