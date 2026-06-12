/**
 * bft-powerall.js — BFTPowerAll v0.1 (skelet)
 * ─────────────────────────────────────────────────────────────────
 * Read-only adapter voor de PowerAll Connect API, via de BFT-proxy.
 * Swap-punt-patroon zoals BFTGraph: de tools praten met dit object,
 * nooit rechtstreeks met PowerAll. De API-sleutel zit in de proxy,
 * NOOIT in de browser.
 *
 * VEREIST: een draaiende proxy (Cloudflare Worker — zie /proxy).
 *
 * ── Configuratie ──────────────────────────────────────────────────
 * Vul PROXY_BASE in zodra de Worker is gedeployd. SHARED_SECRET is
 * optioneel (houdt de proxy weg van willekeurig internetverkeer);
 * let op: alles in client-JS is leesbaar — dit is geen echte geheim-
 * houding, alleen een drempel. Echte afscherming komt later via MSAL.
 *
 * ── Gebruik ───────────────────────────────────────────────────────
 *   const regels = await BFTPowerAll.getWorkOrderLines('1234:56');
 *   // → [{ artikel, omschrijving, aantal }]
 * ─────────────────────────────────────────────────────────────────
 */
const BFTPowerAll = (function () {
  'use strict';

  /* ── Pas aan zodra de proxy draait ── */
  const PROXY_BASE    = 'PLACEHOLDER_PROXY_BASE';   // bv. 'https://bft-powerall.<naam>.workers.dev'
  const SHARED_SECRET = 'PLACEHOLDER_SHARED_SECRET'; // moet matchen met de Worker-secret; leeg laten = geen header

  /* ── Controleer of de placeholder nog niet is ingevuld ── */
  function isConfigured() {
    return PROXY_BASE !== 'PLACEHOLDER_PROXY_BASE';
  }

  /* ── Basis fetch-wrapper: praat met de proxy, retry bij throttling ──
     pad    — pad zoals PowerAll het kent, bv. '/work-orders/lines'
     params — object → querystring
  ── */
  async function _call(pad, params = {}, attempt = 0) {
    if (!isConfigured()) {
      console.warn('[BFTPowerAll] PROXY_BASE nog niet ingevuld — mock-modus actief.');
      return null;
    }

    const qs  = new URLSearchParams(params).toString();
    const url = `${PROXY_BASE}${pad}${qs ? '?' + qs : ''}`;

    const headers = { Accept: 'application/json' };
    if (SHARED_SECRET && SHARED_SECRET !== 'PLACEHOLDER_SHARED_SECRET') {
      headers.Authorization = `Bearer ${SHARED_SECRET}`;
    }

    const res = await fetch(url, { method: 'GET', headers });

    /* Throttle: wacht en probeer opnieuw (max 3x) */
    if (res.status === 429 && attempt < 3) {
      const wacht = parseInt(res.headers.get('Retry-After') || '5', 10) * 1000;
      await new Promise(r => setTimeout(r, wacht));
      return _call(pad, params, attempt + 1);
    }

    if (!res.ok) {
      const fout = await res.text().catch(() => res.statusText);
      throw new Error(`[BFTPowerAll] GET ${pad} → ${res.status}: ${fout}`);
    }

    return res.json();
  }

  /* ── Decimalen komen uit PowerAll als STRING (exact, geen float-drift).
     We bewaren de ruwe string én een numerieke variant voor rekenwerk. ── */
  function _num(v) {
    if (v === null || v === undefined || v === '') return null;
    const n = parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  /* ── Eén WorkOrderLine → genormaliseerde compare-rij ───────────────
     ⚠️ R2 (te bevestigen bij de PowerAll-helpdesk): exacte veldnamen +
     of 'artikel' direct op de regel zit of pas via include=Product,
     en of 'aantal' de behoefte of het restant is. De paden hieronder
     zijn de meest waarschijnlijke kandidaten — pas aan na de sandbox. */
  function _mapLine(line) {
    const product = line.product || line.Product || {};
    return {
      artikel:      line.productCode || line.articleCode || product.code || product.itemCode || null,
      omschrijving: line.description || product.description || product.name || '',
      aantal:       _num(line.quantity ?? line.requiredQuantity ?? line.amount),
      _raw:         line   // tijdens de demo handig om de echte vorm te inspecteren
    };
  }

  /* ── DEMO: materiaalbehoefte van één werkorder ─────────────────────
     woKey = PowerAll-werkordersleutel (relationCode:entryNumber).
     Retourneert [{artikel, omschrijving, aantal}] voor de compare. ── */
  async function getWorkOrderLines(woKey) {
    const data = await _call('/work-orders/lines', {
      'filter[workOrder]': woKey,
      include: 'Product'
    });
    if (!data) return [];                       // mock-modus
    const lines = data.data || data.value || data || [];
    return lines.map(_mapLine).filter(r => r.artikel);
  }

  /* ── Later (materiaaldekking): besteld/ontvangen per regel ──────────
     Stub — uitwerken zodra de demo staat (PurchaseOrderLine + GoodsReceipt). */
  async function getPurchaseStatus(/* woKey */) {
    console.warn('[BFTPowerAll] getPurchaseStatus nog niet geïmplementeerd.');
    return [];
  }

  /* ── Later: voorraad van één artikel (Product include=Stock) ──────── */
  async function getProductStock(/* artikel */) {
    console.warn('[BFTPowerAll] getProductStock nog niet geïmplementeerd.');
    return null;
  }

  return {
    isConfigured,
    getWorkOrderLines,
    getPurchaseStatus,
    getProductStock
  };
})();
