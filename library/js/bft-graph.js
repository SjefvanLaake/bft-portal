/**
 * bft-graph.js — BFTGraph v1.0
 * ─────────────────────────────────────────────────────────────────
 * Microsoft Graph API wrapper voor BFT-tools.
 * Leest en schrijft naar SharePoint Lists + Document Libraries.
 *
 * VEREIST: bft-auth.js geladen en geïnitialiseerd.
 *
 * ── Gebruik ───────────────────────────────────────────────────────
 *   await BFTGraph.init();
 *   const projecten = await BFTGraph.query('BFT_Projecten', { filter: "fields/Status eq 'actief'" });
 *   const snapshot  = await BFTGraph.getProjectSnapshot('201267_BFMR2000EK');
 * ─────────────────────────────────────────────────────────────────
 */
const BFTGraph = (function () {
  'use strict';

  const GRAPH_BASE  = 'https://graph.microsoft.com/v1.0';
  const SP_HOSTNAME = 'bofram.sharepoint.com';

  /* SharePoint List-namen — overeenkomen met wat in SharePoint is aangemaakt */
  const LISTS = {
    projecten:    'BFT_Projecten',
    checklists:   'BFT_Checklists',
    ibn:          'BFT_IBN',
    storingen:    'BFT_Storingen',
    planning:     'BFT_Planning',
    evaluaties:   'BFT_Evaluaties',
    resource:     'BFT_ResourcePlanning'
  };

  /* Document Library bestaat al op de root-site onder deze naam (zie geheugen
     project_bft_v2_architectuur: BFTPortal, gebruikt voor PDF-opslag). */
  const LIBRARY_DOCS = 'BFTPortal';

  /* ── Interne state ── */
  let _siteId = null;

  /* ── Init: haal SharePoint site-ID op ── */
  async function init() {
    if (_siteId) return true;
    if (!BFTAuth.isConfigured()) {
      console.warn('[BFTGraph] Auth niet geconfigureerd — mock-modus actief.');
      return false;
    }
    try {
      /* Stille init: geen popup als er (nog) geen consent/sessie is → mock. */
      const data = await _call('GET', `/sites/${SP_HOSTNAME}`, null, 0, false);
      _siteId = data.id;
      return true;
    } catch (err) {
      console.error('[BFTGraph] Site-ID ophalen mislukt:', err);
      return false;
    }
  }

  /* ── Basis fetch-wrapper met retry bij throttling (429) ── */
  async function _call(method, path, body = null, attempt = 0, interactive = true) {
    const token = await BFTAuth.getToken(interactive);
    if (!token) throw new Error('[BFTGraph] Geen access token — log eerst in.');

    const opts = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    };
    if (body) opts.body = JSON.stringify(body);

    const url = path.startsWith('http') ? path : GRAPH_BASE + path;
    const res  = await fetch(url, opts);

    /* Throttle: wacht en probeer opnieuw (max 3x) */
    if (res.status === 429 && attempt < 3) {
      const wacht = parseInt(res.headers.get('Retry-After') || '5', 10) * 1000;
      await new Promise(r => setTimeout(r, wacht));
      return _call(method, path, body, attempt + 1, interactive);
    }

    if (res.status === 204) return null; /* No content (DELETE) */
    if (!res.ok) {
      const fout = await res.json().catch(() => ({ error: { message: res.statusText } }));
      throw new Error(`[BFTGraph] ${method} ${path} → ${res.status}: ${fout.error?.message}`);
    }

    return res.json();
  }

  /* ── Site-pad voor list-calls ── */
  function _sitePath() {
    if (!_siteId) throw new Error('[BFTGraph] init() eerst aanroepen.');
    return `/sites/${_siteId}`;
  }

  /* ── List-items ophalen ──────────────────────────────────────────
     Opties:
       filter  — OData $filter, bv. "fields/ProjectNr eq '201267'"
       select  — kommalijst van velden, bv. "id,fields/ProjectNr,fields/Naam"
       top     — max aantal resultaten (standaard 100)
  ── */
  async function query(listNaam, opties = {}) {
    const params = new URLSearchParams();
    params.set('expand', 'fields');
    if (opties.filter) params.set('$filter', opties.filter);
    if (opties.select) params.set('$select', opties.select);
    params.set('$top', String(opties.top || 100));

    const pad  = `${_sitePath()}/lists/${listNaam}/items?${params}`;
    const data = await _call('GET', pad);

    /* Geef alleen de fields-objecten terug, met id er al in */
    return (data.value || []).map(item => ({ _id: item.id, ...item.fields }));
  }

  /* ── Nieuw item aanmaken ── */
  async function create(listNaam, velden) {
    const pad = `${_sitePath()}/lists/${listNaam}/items`;
    return _call('POST', pad, { fields: velden });
  }

  /* ── Item bijwerken ── */
  async function update(listNaam, itemId, velden) {
    const pad = `${_sitePath()}/lists/${listNaam}/items/${itemId}/fields`;
    return _call('PATCH', pad, velden);
  }

  /* ── Item verwijderen (zacht: zet Status op 'gearchiveerd') ──
     Harde delete alleen als expliciet gewenst.
  ── */
  async function archiveer(listNaam, itemId) {
    return update(listNaam, itemId, { Status: 'gearchiveerd' });
  }

  /* ── Bestand uploaden naar Document Library ──────────────────────
     pad   — relatief pad incl. bestandsnaam, bv. "201267_BFMR2000EK/storingslog/STR-2026-001.pdf"
     blob  — Blob of ArrayBuffer
  ── */
  async function upload(pad, blob) {
    const token = await BFTAuth.getToken();
    if (!token) throw new Error('[BFTGraph] Geen access token.');

    /* Graph ondersteunt max 4MB direct upload; daarboven chunked */
    const MAX_DIRECT = 4 * 1024 * 1024;
    const uploadUrl = `${GRAPH_BASE}${_sitePath()}/drives/${await _getDriveId()}/root:/${LIBRARY_DOCS}/${pad}:/content`;

    if (blob.size <= MAX_DIRECT) {
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': blob.type || 'application/octet-stream' },
        body: blob
      });
      if (!res.ok) throw new Error(`[BFTGraph] Upload mislukt: ${res.status}`);
      return res.json();
    }

    /* Chunked upload voor bestanden > 4 MB */
    return _chunkedUpload(uploadUrl, blob, token);
  }

  /* Drive-ID ophalen (eenmalig gecacht) */
  let _driveId = null;
  async function _getDriveId() {
    if (_driveId) return _driveId;
    const data = await _call('GET', `${_sitePath()}/drive`);
    _driveId = data.id;
    return _driveId;
  }

  async function _chunkedUpload(uploadUrl, blob, token) {
    /* Maak upload-sessie aan */
    const sessie = await fetch(uploadUrl.replace('/content', '/createUploadSession'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: { '@microsoft.graph.conflictBehavior': 'replace' } })
    }).then(r => r.json());

    const chunkSize = 5 * 1024 * 1024; /* 5 MB chunks */
    let offset = 0;

    while (offset < blob.size) {
      const chunk = blob.slice(offset, Math.min(offset + chunkSize, blob.size));
      const res   = await fetch(sessie.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Length': String(chunk.size),
          'Content-Range': `bytes ${offset}-${offset + chunk.size - 1}/${blob.size}`
        },
        body: chunk
      });
      if (!res.ok && res.status !== 202) throw new Error(`[BFTGraph] Chunk upload mislukt: ${res.status}`);
      offset += chunkSize;
    }
  }

  /* ── Project snapshot: aggregeert alle lists voor één project ────
     Geeft één object terug met data per tool.
     Vervanger van MOCK_DATA.tools in BFT_Projectoverzicht.
  ── */
  async function getProjectSnapshot(projectNr) {
    const filter = `fields/ProjectNr eq '${projectNr}'`;

    /* Alle lists parallel bevragen */
    const [mbclItems, ibnItems, storItems, bvlItems, planItems, resItems, evalItems] =
      await Promise.allSettled([
        query(LISTS.checklists,  { filter }),
        query(LISTS.ibn,         { filter }),
        query(LISTS.storingen,   { filter }),
        query('BFT_Bouwvolgorde',{ filter }),
        query(LISTS.planning,    { filter }),
        query(LISTS.resource,    { filter }),
        query(LISTS.evaluaties,  { filter })
      ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : []));

    /* ── MachinebouwChecklist ── */
    const mbclTotaal = mbclItems.length;
    const mbclKlaar  = mbclItems.filter(i => i.Status === 'Gedaan' || i.Status === 'NVT').length;
    const mbclPct    = mbclTotaal > 0 ? Math.round(mbclKlaar / mbclTotaal * 100) : 0;
    const mbclOpen   = mbclItems.filter(i => i.Status === 'Open').length;
    const mbclOpl    = mbclItems.find(i => i.Oplevering)?.Oplevering || null;

    /* ── IBN Testprotocol ── */
    const droogItems  = ibnItems.filter(i => i.TypeTest === 'Droog');
    const natItems    = ibnItems.filter(i => i.TypeTest === 'Nat');
    const droogKlaar  = droogItems.filter(i => i.Status === 'Gedaan' || i.Status === 'NVT').length;
    const natKlaar    = natItems.filter(i => i.Status === 'Gedaan' || i.Status === 'NVT').length;
    const droogPct    = droogItems.length > 0 ? Math.round(droogKlaar / droogItems.length * 100) : 0;
    const natPct      = natItems.length   > 0 ? Math.round(natKlaar   / natItems.length   * 100) : 0;
    const ibnPct      = ibnItems.length   > 0 ? Math.round((droogKlaar + natKlaar) / ibnItems.length * 100) : 0;

    /* ── Storingslog ── */
    const openStor    = storItems.filter(i => i.Status === 'Open' || i.Status === 'InBehandeling');
    const lastStor    = storItems.sort((a,b) => (b.Datum||'').localeCompare(a.Datum||''))[0]?.Datum || null;

    /* ── Bouwvolgordelijst ── */
    const bvlTotaal   = bvlItems.length;
    const bvlKlaar    = bvlItems.filter(i => i.Status === 'Gedaan').length;
    const bvlPct      = bvlTotaal > 0 ? Math.round(bvlKlaar / bvlTotaal * 100) : 0;
    const bvlFase     = bvlItems.find(i => i.Status === 'Bezig')?.Fase || null;

    /* ── Planning ── */
    const eersteWeek  = planItems.sort((a,b) => (a.StartWeek||99) - (b.StartWeek||99))[0] || null;
    const laatsteWeek = planItems.sort((a,b) => (b.EindWeek||0) - (a.EindWeek||0))[0] || null;

    /* ── Resource Planning ── */
    const totUren     = resItems.reduce((s, i) => s + (i.Uren || 0), 0);
    const disciplines = [...new Set(resItems.map(i => i.Discipline).filter(Boolean))];

    /* ── Projectevaluatie ── */
    const scores      = evalItems.map(i => i.Score).filter(v => v !== null && v !== undefined);
    const evalScore   = scores.length > 0 ? Math.round(scores.reduce((a,b) => a+b, 0) / scores.length * 10) / 10 : null;
    const evalStatus  = evalScore !== null ? 'klaar' : evalItems.length > 0 ? 'bezig' : 'open';

    return {
      mbcl: {
        pct: mbclPct,
        status: mbclPct >= 100 ? 'klaar' : mbclPct > 0 ? 'bezig' : 'open',
        openItems: mbclOpen,
        oplevering: mbclOpl
      },
      ibn: {
        pct: ibnPct,
        status: ibnPct >= 100 ? 'klaar' : ibnPct > 0 ? 'bezig' : 'open',
        droog: droogPct,
        nat: natPct
      },
      storingslog: {
        count: storItems.length,
        openCount: openStor.length,
        lastDate: lastStor
      },
      bouwvolgorde: {
        pct: bvlPct,
        status: bvlPct >= 100 ? 'klaar' : bvlPct > 0 ? 'bezig' : 'open',
        fase: bvlFase || (bvlPct >= 100 ? 'Afgerond' : 'Voorbereiding')
      },
      planning: {
        startWeek: eersteWeek?.StartWeek || null,
        eindWeek:  laatsteWeek?.EindWeek || null,
        jaar:      eersteWeek?.Jaar || new Date().getFullYear()
      },
      resource: {
        uren: totUren,
        disciplines
      },
      evaluatie: {
        score: evalScore,
        status: evalStatus
      }
    };
  }

  /* ── Bestanden in een map van de Document Library lijsten ────────
     folderPad — relatief pad onder de library, bv. "201267_BFMR2000EK/tekeningen"
     Geeft een array {naam, ext, grootte, webUrl, downloadUrl, categorie} terug.
  ── */
  async function listFiles(folderPad) {
    const pad = `${_sitePath()}/drives/${await _getDriveId()}/root:/${LIBRARY_DOCS}/${folderPad}:/children`;
    const data = await _call('GET', pad);
    return (data.value || [])
      .filter(x => x.file)
      .map(x => ({
        naam: x.name,
        ext: (x.name.split('.').pop() || '').toLowerCase(),
        grootte: x.size || 0,
        webUrl: x.webUrl || null,
        downloadUrl: x['@microsoft.graph.downloadUrl'] || null,
        categorie: folderPad.split('/').pop() || ''
      }));
  }

  /* ── Status ── */
  function isReady() { return !!_siteId; }

  return {
    init,
    query,
    create,
    update,
    archiveer,
    upload,
    listFiles,
    getProjectSnapshot,
    isReady,
    LISTS
  };
})();
