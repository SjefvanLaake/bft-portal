/**
 * bft-engplanning.js — BFTEngPlanning v0.29 (vakantie → gedeelde bron bft_v2_vakantie, per persoon+jaar)
 * ────────────────────────────────────────────────────────────────────────
 * Personeelsplanning: planning PER PERSOON op de gedeelde bron. De gekozen
 * persoon = filter op project.verantwoordelijke (de beheerder/planner, los van
 * rol-tags pl/eng/wvb). Eén persoon = één lane: metadata links, weken rechts.
 * Elk project heeft één SUBRIJ per werk-discipline (engineering/wvb/randtaken/
 * begeleiding) zodat disciplines in dezelfde week kunnen OVERLAPPEN — net als
 * de huidige OverallPlanning. Eigen HTML-render. Werkt onder file://.
 *
 * Datamodel (schemaVersie 1):
 *   laneDoc = {
 *     schemaVersie, engineer:{naam,initialen,mdwId},
 *     horizon:{ jaar, startWeek, eindWeek },
 *     vakantie:[ {week, half} ],
 *     projecten:[{ id, projectId, klant, omschrijving, wo, servnr, pl, eng, wvb,
 *                  weken:{ <disciplineKey>: [ {week, fase} ] } }]   // 1 subrij per discipline
 *   }
 *
 * Storage: PLANNING uit de GEDEELDE bron 'bft_overallplanning_' (config/index/proj),
 *          dezelfde store als OverallPlanning — engineer = filter (eng===engineer).
 *          Read+write (S2): schilderen/fase/projecten schrijven proj_<id> (reeksen).
 *          Prefs (engineer/horizon/vakantie/ui) in 'bft_engplanning_'. EN → bft_v2_projecten.
 *          Bij go-live: gedeelde bron → BFTGraph (SharePoint-list 'BFT_Planning').
 *
 * Hergebruik: bft-medewerkers.js (engineer- + PL/Eng/WVB-datalists),
 *   bft-projects.js (project-select → metadata auto-vullen), bft-klanten.js
 *   (klant-datalist), bft-dialog.js (confirm bij verwijderen),
 *   BFTToolShell.esc (escaping; lokale fallback indien afwezig).
 *
 * Scope t/m hier: E1 lane-skelet, E2 projecten, E3 schilderen, E4 vakantie-band,
 *           E5 JSON export/import. Model: discipline-SUBRIJEN per project (overlap).
 *           Projecten in-/uitklappen (caret; ingeklapt = week-samenvatting met
 *           gestapelde balkjes). Disciplines bewerkbaar via ⚙. TOTAAL-merge (E6)
 *           en Excel-import (E8) later.
 *
 * Public API:
 *   BFTEngPlanning.register(opts) → instance | null
 *   BFTEngPlanning.version
 *   BFTEngPlanning.DISCIPLINES        (default-disciplines, referentie)
 *
 * Instance API:
 *   .getState()         → live laneDoc
 *   .setEngineer(d)     → {naam,initialen,mdwId} bijwerken + persist + render
 *   .setHorizon(d)      → {jaar,startWeek,eindWeek} bijwerken + persist + render
 *   .setDisciplines(ls) → disciplines vervangen + weken afstemmen + render
 *   .addProject(data)   → projectrij toevoegen (data optioneel) + persist + render
 *   .promptAddProject() → formulier-modal (alleen projecten van deze engineer) → Promise<project|null>
 *   .syncProjecten()    → projecten van deze engineer in de gedeelde planning-bron zetten
 *   .removeProject(id)  → project uit de gedeelde bron verwijderen + herladen + render
 *   .render()          → her-render
 *   .exportJSON()      → JSON-string
 *   .importJSON(obj)   → vervang + render
 * ────────────────────────────────────────────────────────────────────────
 */
(function (global) {
  'use strict';

  var VERSION = '0.29';
  var SCHEMA_VERSIE = 1;

  // Vaste legenda — kleuren 1-op-1 uit het directief-Excel.
  var DISCIPLINES = [
    { key: 'engineering', label: 'Engineering',        color: '#FFFF00' },
    { key: 'wvb',         label: 'WVB',                color: '#92D050' },
    { key: 'randtaken',   label: 'Randtaken',          color: '#FFC000' },
    { key: 'begeleiding', label: 'Begeleiding opbouw', color: '#00B0F0' },
    { key: 'vrij',        label: 'Vrij/vakantie',      color: '#FF0000' }
  ];

  // Default werk-disciplines = de subrijen per project (excl. 'vrij'). Bewerkbaar:
  // de actuele lijst staat in laneDoc.disciplines (via de discipline-manager ⚙).
  var DEFAULT_DISCIPLINES = DISCIPLINES.filter(function (d) { return d.key !== 'vrij'; })
    .map(function (d) { return { key: d.key, label: d.label, color: d.color }; });

  // 'vrij' = vaste speciale discipline (engineer-vakantieband, niet bewerkbaar).
  var VRIJ = DISCIPLINES.filter(function (d) { return d.key === 'vrij'; })[0];

  // Sleutel-generator voor nieuwe disciplines (uniek t.o.v. bestaande).
  function slugKey(label, bestaande) {
    var base = String(label || 'discipline').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'discipline';
    var key = base, i = 2;
    while (bestaande.indexOf(key) !== -1) { key = base + '-' + i; i++; }
    return key;
  }

  // Metadata-kolommen (volgorde = weergave-volgorde). label = kop, veld = datasleutel.
  var META_KOLOMMEN = [
    { veld: 'klant',        label: 'Klant' },
    { veld: 'omschrijving', label: 'Omschrijving' },
    { veld: 'wo',           label: 'WO nr' },
    { veld: 'servnr',       label: 'Serv nr' },
    { veld: 'pl',           label: 'PL' },
    { veld: 'eng',          label: 'Eng' },
    { veld: 'wvb',          label: 'WVB' }
  ];

  var DEFAULT_OPTS = {
    container  : null,
    storePrefix: 'bft_engplanning_',
    storeKey   : 'lane',
    uiKey      : 'ui',
    jaar       : (new Date()).getFullYear(),   // huidig jaar, gelijk aan OverallPlanning (niet hardgecodeerd)
    startWeek  : 23,
    eindWeek   : 52,
    onChange   : null
  };

  // ── utils ──────────────────────────────────────────────────────────────
  // Escaping via gedeelde BFTToolShell.esc; lokale fallback indien afwezig.
  function esc(s) {
    if (global.BFTToolShell && typeof global.BFTToolShell.esc === 'function') {
      return global.BFTToolShell.esc(s);
    }
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function resolveElement(t) {
    if (!t) return null;
    if (typeof t === 'string') return document.querySelector(t);
    if (t.nodeType === 1) return t;
    return null;
  }

  function mergeOpts(d, u) {
    var o = {}; Object.keys(d).forEach(function (k) { o[k] = d[k]; });
    Object.keys(u || {}).forEach(function (k) { o[k] = u[k]; });
    return o;
  }

  function clampWeek(n, fallback) {
    n = parseInt(n, 10);
    if (isNaN(n) || n < 1 || n > 53) return fallback;
    return n;
  }

  // Weken in horizon (inclusief). Geen jaar-overgang in E1; week-nummering 1..53.
  function weekReeks(horizon) {
    var out = [];
    var a = clampWeek(horizon.startWeek, 23);
    var b = clampWeek(horizon.eindWeek, 52);
    if (b < a) b = a;
    for (var w = a; w <= b; w++) out.push(w);
    return out;
  }

  function uuid() { return Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7); }

  // Huidige ISO-week + jaar (voor de "deze week"-markering).
  function isoWeekNu() {
    var d = new Date();
    var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    var ys = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return { week: Math.ceil((((t - ys) / 86400000) + 1) / 7), jaar: t.getUTCFullYear() };
  }

  // Weken-array voor een discipline binnen een project (altijd een array).
  function wekenVan(p, disc) {
    if (!p.weken || typeof p.weken !== 'object') p.weken = {};
    if (!Array.isArray(p.weken[disc])) p.weken[disc] = [];
    return p.weken[disc];
  }
  // Geschilderde cel voor (project, discipline, week) — of null.
  function celEntry(p, disc, week) {
    week = Number(week);
    var arr = wekenVan(p, disc);
    for (var i = 0; i < arr.length; i++) { if (Number(arr[i].week) === week) return arr[i]; }
    return null;
  }
  // Stabiele persoon-id van de huidige lane (voor de gedeelde vakantie-bron).
  // Prefereer de bewaarde mdwId; val terug op naam→id.
  function huidigePersoonId(doc) {
    var e = doc && doc.engineer;
    if (e && e.mdwId) return e.mdwId;
    if (typeof bftMedewerkerIdVoorNaam === 'function') return bftMedewerkerIdVoorNaam(e && e.naam) || '';
    return '';
  }
  // Vakantie-entry voor een week (persoon-niveau) uit de GEDEELDE bron
  // (bft_v2_vakantie), gesleuteld op persoon-id + horizon-jaar — of null.
  function vakEntry(doc, week) {
    if (typeof bftVakantieEntry !== 'function') return null;
    var id = huidigePersoonId(doc);
    if (!id) return null;
    return bftVakantieEntry(id, doc.horizon.jaar, week);
  }
  // Style een vakantie-cel (in de band-rij) volgens entry.
  function styleVakDom(td, entry) {
    td.classList.remove('vakfull', 'vakhalf');
    if (entry) { td.classList.add(entry.half ? 'vakhalf' : 'vakfull'); td.title = entry.half ? 'Halve week vrij/vakantie' : 'Vrij/vakantie'; }
    else { td.removeAttribute('title'); }
  }

  // Style een week-<td> in een discipline-rij volgens model-entry (of leeg).
  // disc = discipline-object {key,label,color}.
  function styleCelDom(td, entry, disc) {
    if (entry && disc) {
      td.style.background = disc.color;
      td.classList.add('painted');
      td.textContent = entry.fase || '';
      td.title = disc.label + (entry.fase ? ' — ' + entry.fase : '');
    } else {
      td.style.background = '';
      td.classList.remove('painted');
      td.textContent = '';
      td.removeAttribute('title');
    }
  }

  // Medewerker-datalist voor PL/Eng/WVB (optioneel gefilterd op discipline).
  function medewerkerOptions(discipline) {
    if (typeof global.bftMedewerkerOptions === 'function') {
      try { return global.bftMedewerkerOptions(discipline); } catch (e) {}
    }
    return '';
  }

  // Klant-datalist uit bft-klanten; leeg indien module afwezig.
  function klantOptions() {
    if (typeof global.bftKlantOptions === 'function') {
      try { return global.bftKlantOptions(); } catch (e) {}
    }
    return '';
  }

  // Persoon-codes (naam + initialen, lowercased) voor matching op project.verantwoordelijke.
  function engineerCodes(doc) {
    return [doc.engineer.naam, doc.engineer.initialen]
      .map(function (s) { return (s || '').trim().toLowerCase(); })
      .filter(Boolean);
  }
  // Verantwoordelijke (eigenaar) van een project: bron-of-truth = BFT_PROJECTEN
  // (verantwoordelijke, default eng). Fallback op het planning-record.
  function projectVerantwoordelijke(bftId, recFallback) {
    if (bftId && typeof global.bftAlleProjecten === 'function') {
      try {
        var bp = global.bftAlleProjecten().filter(function (x) { return x.id === bftId; })[0];
        if (bp) return (bp.verantwoordelijke || bp.eng || '').trim().toLowerCase();
      } catch (e) {}
    }
    return ((recFallback && (recFallback.verantwoordelijke || recFallback.eng)) || '').trim().toLowerCase();
  }
  // <option>s voor de verantwoordelijke-select (alle medewerkers; huidige geselecteerd).
  function verantwSelectHtml(huidigeCode) {
    var h = (huidigeCode || '').trim().toLowerCase();
    var list = (typeof global.bftAlleMedewerkers === 'function') ? global.bftAlleMedewerkers() : [];
    var inLijst = list.some(function (m) { return (m.naam || '').trim().toLowerCase() === h; });
    var opts = list.map(function (m) {
      var sel = (m.naam || '').trim().toLowerCase() === h ? ' selected' : '';
      return '<option value="' + esc(m.naam) + '"' + sel + '>' + esc(m.naam) + '</option>';
    }).join('');
    // huidige waarde die (nog) niet in de lijst staat toch tonen
    if (h && !inLijst) opts = '<option value="' + esc(huidigeCode) + '" selected>' + esc(huidigeCode) + '</option>' + opts;
    return '<option value=""' + (h ? '' : ' selected') + '>—</option>' + opts;
  }
  // Actieve projecten waarvoor DEZE persoon verantwoordelijke is. Eén verantwoordelijke per project.
  function mijnProjecten(codes) {
    if (!codes.length || typeof global.bftAlleProjecten !== 'function') return [];
    try {
      return global.bftAlleProjecten().filter(function (p) {
        var actief = !p.status || p.status === 'actief';
        return actief && codes.indexOf((p.verantwoordelijke || p.eng || '').trim().toLowerCase()) !== -1;
      });
    } catch (e) { return []; }
  }
  // Project-<select>-opties — alleen de projecten van deze persoon.
  function projectOptionsVoor(codes, gekozenId) {
    var lijst = mijnProjecten(codes);
    if (!codes.length) return '<option value="">— vul eerst de persoon in —</option>';
    if (!lijst.length) return '<option value="">— geen projecten voor deze persoon —</option>';
    return '<option value="">— Kies project —</option>' + lijst.map(function (p) {
      return '<option value="' + esc(p.id) + '"' + (p.id === gekozenId ? ' selected' : '') + '>'
        + esc((p.projectnr || '') + ' · ' + (p.naam || '')) + '</option>';
    }).join('');
  }

  // Project (uit bft-projects) → lane-metadata. Stabiele projectId behouden.
  function projectNaarMeta(id) {
    if (!id || typeof global.bftAlleProjecten !== 'function') return null;
    try {
      var p = global.bftAlleProjecten().filter(function (x) { return x.id === id; })[0];
      if (!p) return null;
      return {
        projectId: p.id,
        klant: p.klant || '',
        omschrijving: p.naam || p.machineType || '',
        wo: p.projectnr || '',
        servnr: p.servicenr || '',
        pl: p.pl || '',
        eng: p.eng || '',
        wvb: p.wvb || ''
      };
    } catch (e) { return null; }
  }

  // ── Roll-up naar OverallPlanning (gedeelde opslag bft_overallplanning_) ───
  var OG_PREFIX = 'bft_overallplanning_';
  function ogGet(k) { try { var r = localStorage.getItem(OG_PREFIX + k); return r === null ? null : JSON.parse(r); } catch (e) { return null; } }
  function ogSet(k, v) { try { localStorage.setItem(OG_PREFIX + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function ogDel(k) { try { localStorage.removeItem(OG_PREFIX + k); } catch (e) {} }

  // Losse weken [{week,fase}] → OverallPlanning-reeksen [{startWeek,eindWeek,jaar,notitie}].
  // Fase-bewust: een reeks breekt af bij een week-gat ÉN bij een fase-wisseling, zodat
  // de fase-tekst per week 1-op-1 in OverallPlanning terugkomt (notitie = die fase).
  function wekenNaarRanges(weekArr, jaar) {
    var ws = (weekArr || []).map(function (e) { return { week: Number(e.week), fase: e.fase || '' }; })
      .filter(function (e) { return !isNaN(e.week); })
      .sort(function (a, b) { return a.week - b.week; });
    var out = [], i = 0;
    while (i < ws.length) {
      var s = ws[i].week, e = s, fase = ws[i].fase;
      while (i + 1 < ws.length && ws[i + 1].week === e + 1 && (ws[i + 1].fase || '') === fase) { e = ws[i + 1].week; i++; }
      out.push({ startWeek: s, eindWeek: e, jaar: jaar, notitie: fase });
      i++;
    }
    return out;
  }

  // Lees de OverallPlanning-doc (config/index/proj-records; anders legacy 'document'; anders leeg).
  function ogLaadDoc(fallbackJaar) {
    var config = ogGet('config'), index = ogGet('index');
    if (config || Array.isArray(index)) {
      var ids = Array.isArray(index) ? index : [];
      var projecten = [];
      ids.forEach(function (id) { var p = ogGet('proj_' + id); if (p) projecten.push(p); });
      return { jaar: (config && config.jaar) || fallbackJaar, disciplines: (config && config.disciplines) || [], projecten: projecten, legacy: false };
    }
    var legacy = ogGet('document');
    if (legacy && typeof legacy === 'object') {
      return { jaar: legacy.jaar || fallbackJaar, disciplines: legacy.disciplines || [], projecten: Array.isArray(legacy.projecten) ? legacy.projecten : [], legacy: true };
    }
    return { jaar: fallbackJaar, disciplines: [], projecten: [], legacy: false };
  }
  // Gedeelde disciplines: OverallPlanning's config (of legacy document) is de bron.
  function ogDisciplines() {
    var cfg = ogGet('config');
    if (cfg && Array.isArray(cfg.disciplines) && cfg.disciplines.length) return cfg.disciplines;
    var legacy = ogGet('document');
    if (legacy && Array.isArray(legacy.disciplines) && legacy.disciplines.length) return legacy.disciplines;
    return null;
  }
  function ogSetDisciplines(list) {
    var copy = list.map(function (d) { return { key: d.key, label: d.label, color: d.color }; });
    var cfg = ogGet('config');
    if (cfg) { cfg.disciplines = copy; ogSet('config', cfg); return; }
    var legacy = ogGet('document');
    if (legacy && typeof legacy === 'object') { legacy.disciplines = copy; ogSet('document', legacy); return; }
    ogSet('config', { versie: 1, jaar: (new Date()).getFullYear(), disciplines: copy });
  }

  // Disciplinesleutels die ergens in de gedeelde bron geplande weken hebben (alle projecten).
  function ogDisciplinesMetData() {
    var keys = {};
    (ogGet('index') || []).forEach(function (id) {
      var p = ogGet('proj_' + id);
      if (p && p.weken) Object.keys(p.weken).forEach(function (k) { if ((p.weken[k] || []).length) keys[k] = true; });
    });
    return Object.keys(keys);
  }


  // Plan-snapshot (vroegste start + laatste eind over alle disciplines/jaren) — identiek
  // aan BFTOverallGrid.planSnapshot zodat Projectoverzicht/deadlines dezelfde data zien.
  function planSnapshot(rec, fallbackJaar) {
    var alle = Object.keys(rec && rec.weken || {}).reduce(function (acc, k) { return acc.concat(rec.weken[k] || []); }, []);
    if (!alle.length) return null;
    function _jr(w) { return typeof w.jaar === 'number' ? w.jaar : fallbackJaar; }
    var vroeg = alle.reduce(function (a, w) { return (_jr(w) * 100 + (w.startWeek || 99)) < (_jr(a) * 100 + (a.startWeek || 99)) ? w : a; });
    var laat = alle.reduce(function (a, w) { return (_jr(w) * 100 + (w.eindWeek || 0)) > (_jr(a) * 100 + (a.eindWeek || 0)) ? w : a; });
    return { startWeek: vroeg.startWeek || null, startJaar: _jr(vroeg), eindWeek: laat.eindWeek || null, eindJaar: _jr(laat), jaar: _jr(vroeg), updated: new Date().toISOString() };
  }
  function snapBftId(rec) { return rec.bftId || rec.servnr || rec.wo || ''; }

  // OverallPlanning-reeksen → losse weken voor de lane-weergave (alleen het lane-jaar).
  function rangesToWeken(ogWeken, jaar) {
    var out = {};
    Object.keys(ogWeken || {}).forEach(function (k) {
      var arr = [];
      (ogWeken[k] || []).forEach(function (r) {
        if (r.jaar !== jaar) return;
        for (var w = r.startWeek; w <= r.eindWeek; w++) arr.push({ week: w, fase: r.notitie || '' });
      });
      if (arr.length) out[k] = arr;
    });
    return out;
  }
  // Projecten waarvoor DEZE persoon verantwoordelijke is, uit de gedeelde planning-bron.
  // Eigenaarschap volgt de bron (BFT_PROJECTEN.verantwoordelijke); record is fallback.
  // Mapt elk record → lane-project (id = record-id, projectId = bftId, weken = reeksen→per-week).
  function ogProjectenVoorEngineer(codes, jaar) {
    if (!codes.length) return [];
    var ogdoc = ogLaadDoc(jaar);
    return ogdoc.projecten.filter(function (op) {
      return codes.indexOf(projectVerantwoordelijke(op.bftId, op)) !== -1;
    }).map(function (op) {
      var p = { id: op.id, projectId: op.bftId || '', weken: rangesToWeken(op.weken, jaar) };
      META_KOLOMMEN.forEach(function (k) { p[k.veld] = op[k.veld] != null ? String(op[k.veld]) : ''; });
      return p;
    });
  }

  // ── Store-laag (swappable: localStorage nu, BFTGraph bij go-live) ─────────
  function makeStore(prefix) {
    return {
      get: function (key) {
        try { var raw = localStorage.getItem(prefix + key); return raw === null ? null : JSON.parse(raw); }
        catch (e) { console.warn('[BFTEngPlanning Store] get error', key, e); return null; }
      },
      set: function (key, val) {
        try { localStorage.setItem(prefix + key, JSON.stringify(val)); return true; }
        catch (e) { console.error('[BFTEngPlanning Store] set error', key, e); return false; }
      },
      del: function (key) { try { localStorage.removeItem(prefix + key); } catch (e) {} }
    };
  }

  // ── datamodel ────────────────────────────────────────────────────────────
  function emptyLane(opts) {
    return {
      schemaVersie: SCHEMA_VERSIE,
      engineer: { naam: '', initialen: '', mdwId: '' },
      horizon: { jaar: opts.jaar, startWeek: opts.startWeek, eindWeek: opts.eindWeek },
      disciplines: DEFAULT_DISCIPLINES.map(function (d) { return { key: d.key, label: d.label, color: d.color }; }),
      vakantie: [],
      projecten: []
    };
  }

  // Normaliseer weken naar object { disciplineKey: [ {week, fase} ] }.
  // Accepteert ook het oude array-formaat [ {week, discipline, fase} ] (E3/E4) en migreert.
  function normaliseerWeken(w) {
    var out = {};
    function push(k, e) {
      if (!k) return;
      if (!out[k]) out[k] = [];
      out[k].push({ week: Number(e.week), fase: e.fase != null ? String(e.fase) : '' });
    }
    if (Array.isArray(w)) {                          // oud formaat → groepeer op discipline
      w.forEach(function (e) { push(e.discipline, e); });
    } else if (w && typeof w === 'object') {         // nieuw formaat: behoud alle disciplinegerichte arrays
      Object.keys(w).forEach(function (k) { if (Array.isArray(w[k])) w[k].forEach(function (e) { push(k, e); }); });
    }
    return out;
  }

  // Stem een project-weken af op de actieve disciplines: behoud bestaande, voeg lege toe, drop verwijderde.
  function reconcileWeken(p, disciplines) {
    var nw = {};
    disciplines.forEach(function (d) { nw[d.key] = Array.isArray(p.weken && p.weken[d.key]) ? p.weken[d.key] : []; });
    p.weken = nw;
  }

  function nieuwProject(data) {
    data = data || {};
    var p = {
      id: data.id || ('pr_' + uuid()),
      projectId: data.projectId != null ? String(data.projectId) : '',
      weken: normaliseerWeken(data.weken)
    };
    META_KOLOMMEN.forEach(function (k) { p[k.veld] = data[k.veld] != null ? String(data[k.veld]) : ''; });
    return p;
  }

  function migreer(doc, opts) {
    if (!doc || typeof doc !== 'object') return emptyLane(opts);
    var base = emptyLane(opts);
    if (!doc.engineer || typeof doc.engineer !== 'object') doc.engineer = base.engineer;
    if (doc.engineer.naam == null) doc.engineer.naam = '';
    if (doc.engineer.initialen == null) doc.engineer.initialen = '';
    if (doc.engineer.mdwId == null) doc.engineer.mdwId = '';
    if (!doc.horizon || typeof doc.horizon !== 'object') doc.horizon = base.horizon;
    if (typeof doc.horizon.jaar !== 'number') doc.horizon.jaar = base.horizon.jaar;
    doc.horizon.startWeek = clampWeek(doc.horizon.startWeek, base.horizon.startWeek);
    doc.horizon.eindWeek  = clampWeek(doc.horizon.eindWeek, base.horizon.eindWeek);
    if (!Array.isArray(doc.disciplines) || !doc.disciplines.length) doc.disciplines = base.disciplines;
    doc.disciplines = doc.disciplines.map(function (d) {
      return { key: d.key || slugKey(d.label, []), label: d.label != null ? String(d.label) : d.key, color: d.color || '#cccccc' };
    });
    if (!Array.isArray(doc.vakantie))  doc.vakantie = [];
    doc.projecten = Array.isArray(doc.projecten) ? doc.projecten.map(nieuwProject) : [];
    doc.projecten.forEach(function (p) { reconcileWeken(p, doc.disciplines); });   // weken afstemmen op disciplines
    doc.schemaVersie = SCHEMA_VERSIE;
    return doc;
  }

  // ── formulier-modal (tool-eigen; injecteert eigen CSS, scope bft-ep-) ─────
  var MODAL_CSS_ID = 'bft-ep-modal-css';
  function injectModalCss() {
    if (typeof document === 'undefined' || document.getElementById(MODAL_CSS_ID)) return;
    var css = ''
      + '.bft-ep-ov{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10000;display:none;'
      +   'align-items:center;justify-content:center;padding:20px;box-sizing:border-box;'
      +   'font-family:"IBM Plex Sans",system-ui,sans-serif;}'
      + '.bft-ep-ov.open{display:flex;}'
      + '.bft-ep-modal{background:#fff;border-radius:10px;max-width:760px;width:100%;'
      +   'max-height:calc(100vh - 40px);display:flex;flex-direction:column;overflow:hidden;'
      +   'box-shadow:0 20px 60px rgba(0,0,0,.3);}'
      + '.bft-ep-top{background:#000;color:#fff;padding:15px 22px;display:flex;align-items:center;gap:12px;flex:none;}'
      + '.bft-ep-top .ic{width:30px;height:30px;border-radius:50%;background:#e8a000;color:#000;font-weight:700;'
      +   'display:flex;align-items:center;justify-content:center;font-family:"IBM Plex Mono",monospace;font-size:15px;}'
      + '.bft-ep-ttl{font-size:13px;font-weight:600;letter-spacing:.02em;font-family:"IBM Plex Mono",monospace;text-transform:uppercase;}'
      + '.bft-ep-mbody{padding:24px 30px;flex:1;overflow:auto;display:grid;grid-template-columns:1fr 1fr;gap:14px 22px;align-content:start;}'
      + '.bft-ep-field{display:flex;flex-direction:column;gap:5px;}'
      + '.bft-ep-field.full{grid-column:1 / -1;}'
      + '.bft-ep-field label{font-size:11px;font-weight:600;color:#3d4558;font-family:"IBM Plex Mono",monospace;text-transform:uppercase;}'
      + '.bft-ep-field input,.bft-ep-field select{padding:9px 11px;border:1px solid #c8ccd4;border-radius:6px;font-size:14px;'
      +   'font-family:"IBM Plex Sans",sans-serif;color:#1a1f2e;background:#fff;}'
      + '.bft-ep-field input:focus,.bft-ep-field select:focus{outline:2px solid #e8a000;outline-offset:1px;border-color:#e8a000;}'
      + '.bft-ep-actions{display:flex;gap:10px;justify-content:flex-end;padding:14px 22px;background:#fafbfc;'
      +   'border-top:1px solid #e3e6ec;flex:none;}'
      + '.bft-ep-btn{padding:10px 22px;border:1px solid #c8ccd4;border-radius:6px;background:#fff;color:#1a1f2e;'
      +   'cursor:pointer;font-size:13px;font-weight:500;font-family:"IBM Plex Sans",sans-serif;min-width:100px;}'
      + '.bft-ep-btn:hover{background:#f1f3f6;border-color:#9ca3ad;}'
      + '.bft-ep-btn.primary{background:#e8a000;color:#000;border-color:#e8a000;}'
      + '.bft-ep-btn.primary:hover{background:#d49000;border-color:#d49000;}'
      // discipline-manager
      + '.bft-ep-dm-body{padding:24px 30px;flex:1;overflow:auto;display:flex;flex-direction:column;gap:12px;}'
      + '.bft-ep-dm-list{display:flex;flex-direction:column;gap:8px;}'
      + '.bft-ep-dm-row{display:flex;align-items:center;gap:10px;}'
      + '.bft-ep-dm-color{width:42px;height:34px;padding:2px;border:1px solid #c8ccd4;border-radius:6px;cursor:pointer;background:#fff;}'
      + '.bft-ep-dm-label{flex:1;padding:9px 11px;border:1px solid #c8ccd4;border-radius:6px;font-size:14px;font-family:"IBM Plex Sans",sans-serif;color:#1a1f2e;}'
      + '.bft-ep-dm-label:focus{outline:2px solid #e8a000;outline-offset:1px;border-color:#e8a000;}'
      + '.bft-ep-dm-key{font-family:"IBM Plex Mono",monospace;font-size:11px;color:#8a909c;min-width:110px;}'
      + '.bft-ep-dm-del{min-width:auto;padding:8px 13px;font-size:15px;line-height:1;}'
      + '.bft-ep-dm-del:hover{background:#d63030;color:#fff;border-color:#d63030;}'
      + '.bft-ep-dm-add{align-self:flex-start;min-width:auto;}';
    var st = document.createElement('style'); st.id = MODAL_CSS_ID; st.textContent = css;
    document.head.appendChild(st);
  }

  // Opent formulier-modal voor een nieuw project. Resolve(data) of resolve(null).
  // codes = engineer-codes; de project-keuzelijst toont alleen projecten van deze engineer.
  function openProjectForm(codes) {
    injectModalCss();
    codes = codes || [];
    return new Promise(function (resolve) {
      var ov = document.createElement('div');
      ov.className = 'bft-ep-ov';
      var metaInputs = META_KOLOMMEN.map(function (k) {
        var list = '';
        if (k.veld === 'klant') list = ' list="bft-ep-dl-klant"';
        else if (k.veld === 'pl') list = ' list="bft-ep-dl-pl"';
        else if (k.veld === 'eng') list = ' list="bft-ep-dl-eng"';
        else if (k.veld === 'wvb') list = ' list="bft-ep-dl-wvb"';
        var full = (k.veld === 'omschrijving') ? ' full' : '';
        return '<div class="bft-ep-field' + full + '">'
          + '<label>' + esc(k.label) + '</label>'
          + '<input type="text" data-veld="' + k.veld + '"' + list + '>'
          + '</div>';
      }).join('');
      ov.innerHTML = ''
        + '<div class="bft-ep-modal" role="dialog" aria-modal="true">'
        +   '<div class="bft-ep-top"><span class="ic">+</span><span class="bft-ep-ttl">Project toevoegen</span></div>'
        +   '<div class="bft-ep-mbody">'
        +     '<div class="bft-ep-field full"><label>Project van deze persoon (vult de velden)</label>'
        +       '<select data-veld="__pick">' + projectOptionsVoor(codes, '') + '</select></div>'
        +     metaInputs
        +   '</div>'
        +   '<div class="bft-ep-actions">'
        +     '<button class="bft-ep-btn" data-act="annuleer">Annuleren</button>'
        +     '<button class="bft-ep-btn primary" data-act="ok">Toevoegen</button>'
        +   '</div>'
        +   '<datalist id="bft-ep-dl-klant">' + klantOptions() + '</datalist>'
        +   '<datalist id="bft-ep-dl-pl">' + medewerkerOptions('Projectleider') + '</datalist>'
        +   '<datalist id="bft-ep-dl-eng">' + medewerkerOptions('Engineering') + '</datalist>'
        +   '<datalist id="bft-ep-dl-wvb">' + medewerkerOptions('WVB') + '</datalist>'
        + '</div>';
      document.body.appendChild(ov);
      requestAnimationFrame(function () { ov.classList.add('open'); });

      var projectId = '';
      function veldInput(v) { return ov.querySelector('input[data-veld="' + v + '"]'); }
      function close(val) {
        ov.classList.remove('open');
        setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 150);
        document.removeEventListener('keydown', onKey);
        resolve(val);
      }
      function onKey(e) { if (e.key === 'Escape') close(null); }
      document.addEventListener('keydown', onKey);

      ov.querySelector('select[data-veld="__pick"]').addEventListener('change', function (e) {
        var meta = projectNaarMeta(e.target.value);
        projectId = meta ? meta.projectId : '';
        if (meta) META_KOLOMMEN.forEach(function (k) { var inp = veldInput(k.veld); if (inp) inp.value = meta[k.veld] || ''; });
      });
      ov.addEventListener('click', function (e) { if (e.target === ov) close(null); });
      ov.querySelector('[data-act="annuleer"]').addEventListener('click', function () { close(null); });
      ov.querySelector('[data-act="ok"]').addEventListener('click', function () {
        var data = { projectId: projectId };
        META_KOLOMMEN.forEach(function (k) { var inp = veldInput(k.veld); data[k.veld] = inp ? inp.value.trim() : ''; });
        close(data);
      });
      setTimeout(function () { var f = veldInput('klant'); if (f) f.focus(); }, 60);
    });
  }

  // Opent de discipline-manager. Resolve(nieuweLijst) of resolve(null).
  function openDisciplineManager(disciplines) {
    injectModalCss();
    var work = disciplines.map(function (d) { return { key: d.key, label: d.label, color: d.color }; });
    return new Promise(function (resolve) {
      var ov = document.createElement('div');
      ov.className = 'bft-ep-ov open';

      function rowsHtml() {
        return work.map(function (d, i) {
          return '<div class="bft-ep-dm-row" data-i="' + i + '">'
            + '<input class="bft-ep-dm-color" type="color" value="' + esc(d.color) + '" title="Kleur">'
            + '<input class="bft-ep-dm-label" type="text" value="' + esc(d.label) + '" placeholder="Naam discipline">'
            + '<code class="bft-ep-dm-key">' + esc(d.key) + '</code>'
            + '<button class="bft-ep-btn bft-ep-dm-del" type="button" data-i="' + i + '" title="Verwijderen">×</button>'
            + '</div>';
        }).join('');
      }
      function syncFromInputs() {
        ov.querySelectorAll('.bft-ep-dm-row').forEach(function (r) {
          var i = parseInt(r.getAttribute('data-i'), 10);
          if (isNaN(i) || !work[i]) return;
          work[i].label = r.querySelector('.bft-ep-dm-label').value.trim() || work[i].label;
          work[i].color = r.querySelector('.bft-ep-dm-color').value;
        });
      }
      function paint() {
        ov.querySelector('#bft-ep-dm-list').innerHTML = rowsHtml();
        ov.querySelectorAll('.bft-ep-dm-del').forEach(function (b) {
          b.addEventListener('click', function () { syncFromInputs(); work.splice(parseInt(b.getAttribute('data-i'), 10), 1); paint(); });
        });
      }

      ov.innerHTML = ''
        + '<div class="bft-ep-modal" role="dialog" aria-modal="true">'
        +   '<div class="bft-ep-top"><span class="ic">⚙</span><span class="bft-ep-ttl">Disciplines beheren</span></div>'
        +   '<div class="bft-ep-dm-body">'
        +     '<div id="bft-ep-dm-list" class="bft-ep-dm-list"></div>'
        +     '<button class="bft-ep-btn bft-ep-dm-add" type="button" data-act="add">+ Discipline</button>'
        +   '</div>'
        +   '<div class="bft-ep-actions">'
        +     '<button class="bft-ep-btn" data-act="annuleer">Annuleren</button>'
        +     '<button class="bft-ep-btn primary" data-act="ok">Opslaan</button>'
        +   '</div>'
        + '</div>';
      document.body.appendChild(ov);
      paint();

      function close(val) {
        if (ov.parentNode) ov.parentNode.removeChild(ov);
        document.removeEventListener('keydown', onKey);
        resolve(val);
      }
      function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); close(null); } }
      document.addEventListener('keydown', onKey);

      ov.querySelector('[data-act="add"]').addEventListener('click', function () {
        syncFromInputs();
        work.push({ key: slugKey('discipline', work.map(function (d) { return d.key; })), label: 'Nieuwe discipline', color: '#cccccc' });
        paint();
      });
      ov.addEventListener('click', function (e) { if (e.target === ov) close(null); });
      ov.querySelector('[data-act="annuleer"]').addEventListener('click', function () { close(null); });
      ov.querySelector('[data-act="ok"]').addEventListener('click', function () { syncFromInputs(); close(work); });
    });
  }

  // ── render ────────────────────────────────────────────────────────────────
  function renderLegenda(doc) {
    var items = doc.disciplines.map(function (d) {
      return '<span class="bft-ep-leg-item">'
        + '<span class="bft-ep-leg-swatch" style="background:' + d.color + '"></span>'
        + esc(d.label) + '</span>';
    }).join('');
    items += '<span class="bft-ep-leg-item">'
      + '<span class="bft-ep-leg-swatch" style="background:' + VRIJ.color + '"></span>' + esc(VRIJ.label) + '</span>';
    items += '<span class="bft-ep-leg-item">'
      + '<span class="bft-ep-leg-swatch bft-ep-leg-half"></span>halve week vrij/vakantie</span>';
    return '<div class="bft-ep-legenda">' + items + '</div>';
  }

  function renderToolbar(doc) {
    var e = doc.engineer, h = doc.horizon;
    return ''
      + '<div class="bft-ep-bar">'
      +   '<div class="bft-ep-bar-grp">'
      +     '<label>Persoon</label>'
      +     '<select id="bft-ep-naam">' + verantwSelectHtml(e.naam) + '</select>'
      +   '</div>'
      +   '<div class="bft-ep-bar-grp">'
      +     '<label>Jaar</label>'
      +     '<input type="number" id="bft-ep-jaar" value="' + esc(h.jaar) + '" style="width:80px">'
      +     '<label>Week</label>'
      +     '<input type="number" id="bft-ep-wa" min="1" max="53" value="' + esc(h.startWeek) + '" style="width:64px">'
      +     '<span class="bft-ep-dash">–</span>'
      +     '<input type="number" id="bft-ep-wb" min="1" max="53" value="' + esc(h.eindWeek) + '" style="width:64px">'
      +   '</div>'
      + '</div>';
  }

  function renderActions() {
    return '<div class="bft-ep-acties">'
      + '<button type="button" class="bf-btn bf-btn-primary" id="bft-ep-add">+ Project</button>'
      + '<button type="button" class="bf-btn bf-btn-sec" id="bft-ep-sync" title="Projecten van deze engineer in de planning zetten">⟳ Sync projecten</button>'
      + '<button type="button" class="bf-btn bf-btn-ghost" id="bft-ep-disc">⚙ Disciplines</button>'
      + '<button type="button" class="bf-btn bf-btn-ghost" id="bft-ep-mdw">👥 Medewerkers</button>'
      + '<button type="button" class="bf-btn bf-btn-ghost" id="bft-ep-export" title="Lane als JSON downloaden">⤓ JSON</button>'
      + '<button type="button" class="bf-btn bf-btn-ghost" id="bft-ep-import" title="Lane uit JSON laden (vervangt)">⤒ JSON</button>'
      + '<span class="bft-ep-hint">Klik project = uit-/inklappen · schilder per discipline-rij (klik/sleep) · dubbelklik = fase · vakantie-rij: shift+klik = halve week</span>'
      + '</div>';
  }

  function renderGrid(doc, ui) {
    var weken = weekReeks(doc.horizon);
    var nMeta = META_KOLOMMEN.length;
    var totKol = 1 + nMeta + weken.length;          // actie + meta + weken
    var nu = isoWeekNu();
    var huidigW = (doc.horizon.jaar === nu.jaar) ? nu.week : -1;   // huidige week markeren (alleen in huidig jaar)
    function hk(w) { return (w === huidigW) ? ' huidig' : ''; }

    var head = '<tr><th class="bft-ep-act"></th>';
    META_KOLOMMEN.forEach(function (k) { head += '<th class="bft-ep-meta">' + esc(k.label) + '</th>'; });
    weken.forEach(function (w) { head += '<th class="bft-ep-wk' + hk(w) + '">week ' + w + '</th>'; });
    head += '</tr>';

    // Vakantie-band-rij (engineer-niveau) — altijd bovenaan, ook zonder projecten.
    var vakRow = '<tr class="bft-ep-vakrow" data-vak="1">'
      + '<td class="bft-ep-vaklabel" colspan="' + (1 + nMeta) + '">Vrij/vakantie</td>';
    weken.forEach(function (w) {
      var ve = vakEntry(doc, w);
      var vc = 'bft-ep-vakcel' + hk(w) + (ve ? (ve.half ? ' vakhalf' : ' vakfull') : '');
      var vt = ve ? (' title="' + (ve.half ? 'Halve week vrij/vakantie' : 'Vrij/vakantie') + '"') : '';
      vakRow += '<td class="' + vc + '" data-week="' + w + '"' + vt + '></td>';
    });
    vakRow += '</tr>';

    var rows;
    if (!doc.projecten.length) {
      rows = '<tr class="bft-ep-empty"><td colspan="' + totKol + '">'
        + 'Nog geen projecten. Klik op “+ Project”.'
        + '</td></tr>';
    } else {
      rows = doc.projecten.map(function (p) {
        var open = !!(ui && ui.expanded && ui.expanded[p.id]);

        // Projectrij (altijd zichtbaar): caret + metadata + week-samenvatting (gestapelde balkjes).
        var pr = '<tr class="bft-ep-prow' + (open ? ' bft-ep-open' : '') + '" data-id="' + esc(p.id) + '">'
          + '<td class="bft-ep-act">'
          +   '<button type="button" class="bft-ep-caret" data-caret="' + esc(p.id) + '" title="Uit-/inklappen">' + (open ? '▼' : '▶') + '</button>'
          +   '<button type="button" class="bft-ep-del" data-del="' + esc(p.id) + '" title="Verwijderen">✕</button>'
          +   '<select class="bft-ep-resp" data-pid="' + esc(p.projectId) + '" title="Verantwoordelijke — wie beheert/plant dit project">' + verantwSelectHtml(projectVerantwoordelijke(p.projectId, null)) + '</select>'
          + '</td>';
        META_KOLOMMEN.forEach(function (k) { pr += '<td class="bft-ep-meta">' + esc(p[k.veld]) + '</td>'; });
        weken.forEach(function (w) {
          var actief = doc.disciplines.filter(function (d) { return !!celEntry(p, d.key, w); });
          var vk = (vakEntry(doc, w) ? ' vak' : '') + hk(w);
          if (!actief.length) { pr += '<td class="bft-ep-sum' + vk + '"></td>'; }
          else {
            // Cel verdeeld in N gelijke kleurvlakken (verdeling), zoals OverallPlanning.
            var segs = actief.map(function (d) { return '<div class="bft-ep-seg" style="background:' + d.color + '"></div>'; }).join('');
            var titel = actief.map(function (d) { return d.label; }).join(', ');
            pr += '<td class="bft-ep-sum' + vk + '" title="' + esc(titel) + '"><div class="bft-ep-segs">' + segs + '</div></td>';
          }
        });
        pr += '</tr>';
        if (!open) return pr;

        // Uitgeklapt: één subrij per discipline (overlap mogelijk).
        var subs = doc.disciplines.map(function (d) {
          var r = '<tr class="bft-ep-drow" data-id="' + esc(p.id) + '" data-disc="' + esc(d.key) + '">'
            + '<td class="bft-ep-act"></td>';
          META_KOLOMMEN.forEach(function (k, i) {
            if (i === 0) {
              r += '<td class="bft-ep-meta bft-ep-disclabel"><span class="bft-ep-disc-sw" style="background:' + d.color + '"></span>' + esc(d.label) + '</td>';
            } else { r += '<td class="bft-ep-meta"></td>'; }
          });
          weken.forEach(function (w) {
            var entry = celEntry(p, d.key, w);
            var sty = '', cls = 'bft-ep-cel', txt = '', ttl = '';
            if (entry) {
              sty = ' style="background:' + d.color + '"';
              cls += ' painted';
              txt = esc(entry.fase || '');
              ttl = ' title="' + esc(d.label + (entry.fase ? ' — ' + entry.fase : '')) + '"';
            }
            if (vakEntry(doc, w)) cls += ' vak';
            cls += hk(w);
            r += '<td class="' + cls + '" data-id="' + esc(p.id) + '" data-disc="' + esc(d.key) + '" data-week="' + w + '"' + sty + ttl + '>' + txt + '</td>';
          });
          return r + '</tr>';
        }).join('');
        return pr + subs;
      }).join('');
    }

    return '<div class="bft-ep-scroll"><table class="bft-ep-table">'
      + '<thead>' + head + '</thead><tbody>' + vakRow + rows + '</tbody></table></div>';
  }

  // Naam → stabiel medewerker-id (mdwId), zodat de koppeling een hernoeming overleeft.
  function mdwIdVoorNaam(naam) {
    if (!naam || typeof global.bftAlleMedewerkers !== 'function') return '';
    try {
      var m = global.bftAlleMedewerkers().filter(function (x) { return x.naam === naam; })[0];
      return m ? m.id : '';
    } catch (e) { return ''; }
  }

  // ── instance ──────────────────────────────────────────────────────────────
  function create(opts) {
    opts = mergeOpts(DEFAULT_OPTS, opts);
    var el = resolveElement(opts.container);
    if (!el) { console.error('[BFTEngPlanning] container niet gevonden'); return null; }

    var store = makeStore(opts.storePrefix);
    var doc = migreer(store.get(opts.storeKey), opts);

    // Gedeelde disciplines met OverallPlanning (één bron). Bestaat de gedeelde lijst,
    // dan die overnemen (sleutels gelijk → roll-up landt correct). Anders publiceren
    // we de huidige lijst zodat Overall dezelfde gaat gebruiken.
    (function () {
      var gedeeld = ogDisciplines();
      if (gedeeld && gedeeld.length) {
        // Gedeelde lijst als basis (volgorde/kleur/label), aangevuld met lane-eigen
        // disciplines (geen geschilderde data verliezen). Beide eindigen met dezelfde lijst.
        var merged = gedeeld.map(function (d) { return { key: d.key, label: d.label, color: d.color }; });
        var keys = merged.map(function (d) { return d.key; });
        doc.disciplines.forEach(function (d) { if (keys.indexOf(d.key) === -1) merged.push({ key: d.key, label: d.label, color: d.color }); });
        var groeide = merged.length !== gedeeld.length;
        doc.disciplines = merged;
        doc.projecten.forEach(function (p) { reconcileWeken(p, doc.disciplines); });
        store.set(opts.storeKey, doc);
        if (groeide) ogSetDisciplines(merged);   // Overall ook de volledige (zelfde) lijst geven
      } else {
        ogSetDisciplines(doc.disciplines);
      }
    })();

    // UI-state (uitgeklapt project) — los van het document, niet geëxporteerd.
    var ui = store.get(opts.uiKey) || {};
    if (!ui.expanded || typeof ui.expanded !== 'object') ui.expanded = {};
    // Accordion: bij laden hooguit één open (oude 'meerdere open'-status saneren).
    var _open = Object.keys(ui.expanded).filter(function (k) { return ui.expanded[k]; });
    if (_open.length > 1) { ui.expanded = {}; ui.expanded[_open[0]] = true; }

    var drag = null;                   // actieve schilder-sessie (per discipline-rij)

    // S4: altijd het HUIDIGE jaar openen (gelijk aan OverallPlanning, dat ook setJaar(huidig)
    // doet) — voorkomt dat de view op een oud jaar blijft staan en planning "onzichtbaar" lijkt.
    // De startWeek/eindWeek-prefs blijven; alleen het jaar wordt gelijkgetrokken.
    doc.horizon.jaar = (new Date()).getFullYear();

    // Eenmalige, additieve migratie: oude lane-vakantie (jaarloos, per-browser) →
    // gedeelde bron bft_v2_vakantie onder de huidige persoon + huidig jaar. De
    // lane-array blijft intact (rollback-veilig); markeer met _vakGemigreerd.
    (function () {
      if (doc._vakGemigreerd) return;
      var oud = Array.isArray(doc.vakantie) ? doc.vakantie : [];
      var id = huidigePersoonId(doc);
      if (oud.length && id && typeof bftVakantieZet === 'function'
          && typeof bftVakantieVoor === 'function' && !bftVakantieVoor(id, doc.horizon.jaar).length) {
        oud.forEach(function (e) { bftVakantieZet(id, doc.horizon.jaar, e.week, !!e.half); });
      }
      doc._vakGemigreerd = true;
      store.set(opts.storeKey, doc);
    })();

    // Projecten komen uit de gedeelde bron (OverallPlanning-store), gefilterd op de
    // engineer en het horizon-jaar (reeksen→per-week). Read+write via de bron (S2).
    function herlaadProjecten() {
      doc.projecten = ogProjectenVoorEngineer(engineerCodes(doc), doc.horizon.jaar);
      doc.projecten.forEach(function (p) { reconcileWeken(p, doc.disciplines); });
    }
    herlaadProjecten();

    function persist() { store.set(opts.storeKey, doc); }   // prefs: engineer/horizon/vakantie (lane-store)
    function saveUi()  { store.set(opts.uiKey, ui); }

    // Huidige persoon (lane-eigenaar) als code voor matching/verantwoordelijke.
    function persoonCode() { return (doc.engineer.naam || doc.engineer.initialen || '').trim(); }

    // VERANTWOORDELIJKE terugschrijven naar de gedeelde projectenlijst: deze persoon
    // beheert dit project (claim). Losgekoppeld van de rol-tags pl/eng/wvb.
    function pushVerantwoordelijke(projectId) {
      var v = persoonCode();
      if (!v || !projectId || typeof global.bftAlleProjecten !== 'function' || typeof global.bftSlaProjectOp !== 'function') return;
      try {
        var bp = global.bftAlleProjecten().filter(function (x) { return x.id === projectId; })[0];
        if (bp && (bp.verantwoordelijke || '').trim() !== v) {
          var upd = {}; Object.keys(bp).forEach(function (k) { upd[k] = bp[k]; }); upd.verantwoordelijke = v;
          global.bftSlaProjectOp(upd);
        }
      } catch (e) {}
    }

    // Schrijf één lane-project naar de gedeelde planning-bron (bft_overallplanning_).
    // weken (per-week) → reeksen (fase-bewust); behoud bezetting, andere jaren en
    // (bestaande) metadata. Eigenaar (verantwoordelijke) → projectenlijst. Config/index indien nodig.
    function persistProjectNaarBron(lp) {
      if (!lp) return;
      var jaar = doc.horizon.jaar;
      var bestond = ogGet('proj_' + lp.id);
      var rec = bestond || { id: lp.id, bftId: lp.projectId || '', weken: {}, bezetting: {} };
      if (!rec.weken || typeof rec.weken !== 'object') rec.weken = {};
      // Metadata: bij een NIEUW record uit de tool overnemen; bestaande records volgen de
      // projectenlijst (herstelMetadataUitBron) — dus ongemoeid laten.
      if (!bestond) { META_KOLOMMEN.forEach(function (k) { rec[k.veld] = lp[k.veld] != null ? String(lp[k.veld]) : ''; }); }
      rec.verantwoordelijke = persoonCode();   // record-eigenaar (cosmetisch; bron is leidend)
      // Per discipline: reeksen van DIT jaar vervangen, andere jaren behouden.
      doc.disciplines.forEach(function (d) {
        var anders = (rec.weken[d.key] || []).filter(function (r) { return r.jaar !== jaar; });
        var nieuw = wekenNaarRanges(lp.weken[d.key] || [], jaar);
        var samen = anders.concat(nieuw);
        if (samen.length) rec.weken[d.key] = samen; else delete rec.weken[d.key];
      });
      ogSet('proj_' + lp.id, rec);
      var idx = ogGet('index') || [];
      if (idx.indexOf(lp.id) === -1) { idx.push(lp.id); ogSet('index', idx); }
      if (!ogGet('config')) ogSet('config', { versie: 1, jaar: jaar, disciplines: doc.disciplines });
      pushVerantwoordelijke(lp.projectId);   // claim: deze persoon beheert dit project
      schrijfSnapPlan(rec);                 // cross-tool plan-snapshot bijwerken (Projectoverzicht/deadlines)
    }
    // Plan-snapshot voor een record schrijven/verwijderen (bft_v2_snap_plan_<bftId>).
    function schrijfSnapPlan(rec) {
      var bftId = snapBftId(rec); if (!bftId) return;
      var snap = planSnapshot(rec, doc.horizon.jaar);
      try {
        if (snap) localStorage.setItem('bft_v2_snap_plan_' + bftId, JSON.stringify(snap));
        else localStorage.removeItem('bft_v2_snap_plan_' + bftId);
      } catch (e) {}
    }
    function removeProjectUitBron(id) {
      var rec = ogGet('proj_' + id);
      ogDel('proj_' + id);
      var idx = (ogGet('index') || []).filter(function (x) { return x !== id; });
      ogSet('index', idx);
      if (rec) { var bftId = snapBftId(rec); if (bftId) { try { localStorage.removeItem('bft_v2_snap_plan_' + bftId); } catch (e) {} } }
    }
    function fireChange() { if (typeof opts.onChange === 'function') { try { opts.onChange(doc); } catch (e) {} } }
    function discByKey(k) { return doc.disciplines.filter(function (d) { return d.key === k; })[0] || null; }
    function feedback(msg, danger) {
      if (global.BFTDialog && typeof global.BFTDialog.alert === 'function') {
        global.BFTDialog.alert(msg, danger ? { danger: true } : undefined);
      } else { console.log('[BFTEngPlanning]', msg); }
    }
    // Accordion: maar één project tegelijk open — openen sluit alle andere.
    function toggleExpand(id) {
      var wasOpen = !!ui.expanded[id];
      ui.expanded = {};
      if (!wasOpen) ui.expanded[id] = true;
      saveUi(); api.render();
    }

    function bindBar() {
      var naam = el.querySelector('#bft-ep-naam');
      var jaar = el.querySelector('#bft-ep-jaar');
      var wa   = el.querySelector('#bft-ep-wa');
      var wb   = el.querySelector('#bft-ep-wb');

      if (naam) naam.addEventListener('change', function () {
        doc.engineer.naam = naam.value.trim();
        doc.engineer.mdwId = mdwIdVoorNaam(doc.engineer.naam);
        persist(); herlaadProjecten(); fireChange(); api.render();   // andere persoon → andere projecten
      });

      function applyHorizon() {
        var j = parseInt(jaar.value, 10);
        doc.horizon.jaar = isNaN(j) ? doc.horizon.jaar : j;
        doc.horizon.startWeek = clampWeek(wa.value, doc.horizon.startWeek);
        doc.horizon.eindWeek  = clampWeek(wb.value, doc.horizon.eindWeek);
        if (doc.horizon.eindWeek < doc.horizon.startWeek) doc.horizon.eindWeek = doc.horizon.startWeek;
        persist(); herlaadProjecten(); fireChange(); api.render();   // ander jaar → andere reeksen
      }
      [jaar, wa, wb].forEach(function (inp) {
        if (inp) inp.addEventListener('change', applyHorizon);
      });
    }

    // ── schilder-helpers (model) — discipline volgt uit de rij (data-disc) ────
    function projectById(id) {
      return doc.projecten.filter(function (x) { return x.id === id; })[0] || null;
    }
    function zetCel(p, disc, week, fase) {
      week = Number(week);
      var e = celEntry(p, disc, week);
      if (e) { if (fase != null) e.fase = fase; }
      else { wekenVan(p, disc).push({ week: week, fase: fase != null ? fase : '' }); }
    }
    function wisCel(p, disc, week) {
      week = Number(week);
      p.weken[disc] = wekenVan(p, disc).filter(function (x) { return Number(x.week) !== week; });
    }
    // Eén cel schilderen volgens de drag-sessie (binnen dezelfde project- én discipline-rij).
    function schilderCel(td) {
      if (!drag) return;
      var id = td.getAttribute('data-id'), disc = td.getAttribute('data-disc');
      if (id !== drag.pid || disc !== drag.disc) return;
      var p = projectById(id); if (!p) return;
      var week = Number(td.getAttribute('data-week'));
      if (drag.on) { zetCel(p, disc, week); } else { wisCel(p, disc, week); }
      styleCelDom(td, celEntry(p, disc, week), discByKey(disc));
    }
    function startDrag(td) {
      var id = td.getAttribute('data-id'), disc = td.getAttribute('data-disc');
      var p = projectById(id); if (!p) return;
      var week = Number(td.getAttribute('data-week'));
      var e = celEntry(p, disc, week);
      drag = { pid: id, disc: disc, on: !e };        // toggle: geschilderd → wissen, anders aanzetten
      schilderCel(td);
    }
    function endDrag() {
      if (!drag) return;
      var wasVak = drag.vak, pid = drag.pid;
      drag = null;
      if (wasVak) { fireChange(); api.render(); }                // vakantie → gedeelde bron (al weggeschreven)
      else { persistProjectNaarBron(projectById(pid)); fireChange(); }   // schilderwerk → gedeelde bron
    }

    // ── vrij/vakantie-band (persoon-niveau, GEDEELDE bron bft_v2_vakantie) ────
    function zetVak(week, half) {
      var id = huidigePersoonId(doc); if (!id || typeof bftVakantieZet !== 'function') return;
      bftVakantieZet(id, doc.horizon.jaar, week, !!half);
    }
    function wisVak(week) {
      var id = huidigePersoonId(doc); if (!id || typeof bftVakantieWis !== 'function') return;
      bftVakantieWis(id, doc.horizon.jaar, week);
    }
    function schilderVakCel(td) {
      if (!drag || !drag.vak) return;
      var week = Number(td.getAttribute('data-week'));
      if (drag.on) { zetVak(week, false); } else { wisVak(week); }
      styleVakDom(td, vakEntry(doc, week));
    }
    function startDragVak(td, shift) {
      var week = Number(td.getAttribute('data-week'));
      var e = vakEntry(doc, week);
      if (shift) {                                  // shift = halve week toggelen (geen reeks)
        if (e && e.half) { wisVak(week); } else { zetVak(week, true); }
        styleVakDom(td, vakEntry(doc, week));
        persist(); fireChange(); api.render();
        return;
      }
      drag = { vak: true, on: !(e && !e.half) };     // hele week aan/uit (half → promoveer naar heel)
      schilderVakCel(td);
    }

    // ── fase-tekst inline bewerken (dubbelklik) ──────────────────────────────
    function bewerkFase(td) {
      var id = td.getAttribute('data-id'), disc = td.getAttribute('data-disc');
      var p = projectById(id); if (!p) return;
      var week = Number(td.getAttribute('data-week'));
      var e = celEntry(p, disc, week);
      if (!e) { zetCel(p, disc, week); e = celEntry(p, disc, week); }   // lege cel: eerst schilderen
      var huidige = e.fase || '';
      td.innerHTML = '';
      var inp = document.createElement('input');
      inp.type = 'text'; inp.className = 'bft-ep-fase-in'; inp.value = huidige;
      td.appendChild(inp); inp.focus(); inp.select();
      var klaar = false;
      function bewaar(commit) {
        if (klaar) return; klaar = true;
        if (commit) { e.fase = inp.value.trim(); persistProjectNaarBron(p); fireChange(); }   // fase → gedeelde bron
        styleCelDom(td, celEntry(p, disc, week), discByKey(disc));
      }
      inp.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); bewaar(true); }
        else if (ev.key === 'Escape') { ev.preventDefault(); bewaar(false); }
      });
      inp.addEventListener('blur', function () { bewaar(true); });
    }

    // ── JSON export/import (lane) ────────────────────────────────────────────
    function slug(s) { return String(s || '').trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'lane'; }
    function exporteerJSON() {
      var naam = doc.engineer.initialen || doc.engineer.naam || 'lane';
      var datum = new Date().toISOString().slice(0, 10);
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([api.exportJSON()], { type: 'application/json' }));
      a.download = 'EngineeringPlanning_' + slug(naam) + '_' + datum + '.json';
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); if (a.parentNode) a.parentNode.removeChild(a); }, 0);
    }
    function importeerJSON() {
      var inp = document.createElement('input');
      inp.type = 'file'; inp.accept = '.json,application/json'; inp.style.display = 'none';
      inp.addEventListener('change', function (e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (ev) {
          var ok = api.importJSON(ev.target.result);
          if (!ok && global.BFTDialog && typeof global.BFTDialog.alert === 'function') {
            global.BFTDialog.alert('Ongeldig of onleesbaar JSON-bestand.', { danger: true });
          }
          if (inp.parentNode) inp.parentNode.removeChild(inp);
        };
        reader.readAsText(file);
      });
      document.body.appendChild(inp); inp.click();
    }

    function bindActions() {
      var add = el.querySelector('#bft-ep-add');
      if (add) add.addEventListener('click', function () { api.promptAddProject(); });
      var bsync = el.querySelector('#bft-ep-sync');
      if (bsync) bsync.addEventListener('click', function () { api.syncProjecten(); });
      var bex = el.querySelector('#bft-ep-export');
      if (bex) bex.addEventListener('click', exporteerJSON);
      var bim = el.querySelector('#bft-ep-import');
      if (bim) bim.addEventListener('click', importeerJSON);
      var bdc = el.querySelector('#bft-ep-disc');
      if (bdc) bdc.addEventListener('click', function () {
        openDisciplineManager(doc.disciplines).then(function (list) {
          if (!list) return;
          // H4: verwijderde discipline(s) met geplande data → eerst bevestigen.
          var nieuweKeys = list.map(function (d) { return d.key; });
          var metData = ogDisciplinesMetData();
          var verwijderdMetData = doc.disciplines.filter(function (d) {
            return nieuweKeys.indexOf(d.key) === -1 && metData.indexOf(d.key) !== -1;
          });
          if (!verwijderdMetData.length) { api.setDisciplines(list); return; }
          var labels = verwijderdMetData.map(function (d) { return d.label; }).join(', ');
          var bevestig = (global.BFTDialog && typeof global.BFTDialog.confirm === 'function')
            ? global.BFTDialog.confirm('Discipline(s) “' + labels + '” bevatten geplande weken. Verwijderen wist die planning definitief (ook in OverallPlanning). Doorgaan?', { danger: true })
            : Promise.resolve(true);
          bevestig.then(function (ok) { if (ok) api.setDisciplines(list); });
        });
      });
      var bmw = el.querySelector('#bft-ep-mdw');
      if (bmw) bmw.addEventListener('click', function () {
        if (global.BFTMedewerkers && typeof global.BFTMedewerkers.openBeheer === 'function') {
          global.BFTMedewerkers.openBeheer({ onChange: function () { api.render(); } }).then(function () { api.render(); });
        } else { feedback('Medewerker-beheer niet beschikbaar (bft-medewerkers.js niet geladen).', true); }
      });

      // Uit-/inklappen: caret-knop én klik op de projectrij (behalve op knoppen)
      Array.prototype.forEach.call(el.querySelectorAll('.bft-ep-caret'), function (btn) {
        btn.addEventListener('click', function (e) { e.stopPropagation(); toggleExpand(btn.getAttribute('data-caret')); });
      });
      Array.prototype.forEach.call(el.querySelectorAll('tr.bft-ep-prow'), function (tr) {
        tr.addEventListener('click', function (e) {
          if (e.target.closest('button, select')) return;   // knoppen + verantwoordelijke-select niet als uit-/inklap
          toggleExpand(tr.getAttribute('data-id'));
        });
      });
      // Verantwoordelijke (her)toewijzen — schrijft naar de gedeelde projectenlijst.
      Array.prototype.forEach.call(el.querySelectorAll('.bft-ep-resp'), function (sel) {
        sel.addEventListener('click', function (e) { e.stopPropagation(); });
        sel.addEventListener('change', function (e) {
          e.stopPropagation();
          api.setVerantwoordelijke(sel.getAttribute('data-pid'), sel.value);
        });
      });

      // Verwijderen
      Array.prototype.forEach.call(el.querySelectorAll('.bft-ep-del'), function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var id = btn.getAttribute('data-del');
          var p = doc.projecten.filter(function (x) { return x.id === id; })[0];
          var naam = p ? (p.omschrijving || p.klant || 'dit project') : 'dit project';
          var doConfirm = (global.BFTDialog && typeof global.BFTDialog.confirm === 'function')
            ? global.BFTDialog.confirm('Project “' + naam + '” verwijderen?', { danger: true })
            : Promise.resolve(true);
          doConfirm.then(function (ok) { if (ok) api.removeProject(id); });
        });
      });

      // Schilderen (klik = toggle, sleep = reeks) + fase-tekst (dubbelklik)
      Array.prototype.forEach.call(el.querySelectorAll('.bft-ep-cel'), function (td) {
        td.addEventListener('mousedown', function (e) { e.preventDefault(); startDrag(td); });
        td.addEventListener('mouseenter', function () { if (drag && !drag.vak) schilderCel(td); });
        td.addEventListener('dblclick', function (e) { e.preventDefault(); bewerkFase(td); });
      });

      // Vrij/vakantie-band: klik/sleep = hele week, shift+klik = halve week
      Array.prototype.forEach.call(el.querySelectorAll('.bft-ep-vakcel'), function (td) {
        td.addEventListener('mousedown', function (e) { e.preventDefault(); startDragVak(td, e.shiftKey); });
        td.addEventListener('mouseenter', function () { if (drag && drag.vak) schilderVakCel(td); });
      });
    }

    var api = {
      version: VERSION,
      getState: function () { return doc; },
      // Project toevoegen aan de planning = direct in de gedeelde bron schrijven.
      // De persoon wordt verantwoordelijke (claim) via persistProjectNaarBron; rol-tags
      // (pl/eng/wvb) komen uit de projectenlijst, niet geforceerd.
      addProject: function (data) {
        data = data || {};
        var p = nieuwProject(data);
        persistProjectNaarBron(p);
        herlaadProjecten(); fireChange(); api.render();
        return p;
      },
      promptAddProject: function () {
        return openProjectForm(engineerCodes(doc)).then(function (data) {
          if (!data) return null;
          return api.addProject(data);
        });
      },
      // ⟳ Sync: zorg dat álle actieve projecten van DEZE engineer in de gedeelde
      // planning-bron staan (lege records aanmaken indien afwezig; bestaande ongemoeid).
      syncProjecten: function () {
        var codes = engineerCodes(doc);
        if (!codes.length) { feedback('Kies eerst een persoon.', true); return { toegevoegd: 0 }; }
        var lijst = mijnProjecten(codes);
        var bestaandeBft = (ogGet('index') || []).map(function (id) { var r = ogGet('proj_' + id); return r && r.bftId; }).filter(Boolean);
        var toeg = 0;
        lijst.forEach(function (bp) {
          if (bestaandeBft.indexOf(bp.id) !== -1) return;          // al in de planning
          var meta = projectNaarMeta(bp.id); if (!meta) return;
          persistProjectNaarBron(nieuwProject(meta)); toeg++;       // leeg record in de bron
        });
        herlaadProjecten(); fireChange(); api.render();
        feedback('Sync klaar: ' + toeg + ' project(en) toegevoegd aan de planning' + (lijst.length ? '' : ' (geen projecten voor deze persoon)') + '.');
        return { toegevoegd: toeg };
      },
      // Verantwoordelijke (her)toewijzen → schrijft naar de gedeelde projectenlijst (bron).
      // Daarna verlaat het project de huidige lane als de persoon wijzigt.
      setVerantwoordelijke: function (projectId, naam) {
        if (!projectId) return;
        var v = (naam || '').trim();
        if (typeof global.bftAlleProjecten === 'function' && typeof global.bftSlaProjectOp === 'function') {
          try {
            var bp = global.bftAlleProjecten().filter(function (x) { return x.id === projectId; })[0];
            if (bp) { var upd = {}; Object.keys(bp).forEach(function (k) { upd[k] = bp[k]; }); upd.verantwoordelijke = v; global.bftSlaProjectOp(upd); }
          } catch (e) {}
        }
        herlaadProjecten(); fireChange(); api.render();
        feedback(v ? ('Verantwoordelijke gewijzigd naar ' + v + '.') : 'Verantwoordelijke leeggemaakt (valt terug op de Engineer).');
      },
      removeProject: function (id) {
        removeProjectUitBron(id);
        if (ui.expanded[id]) { delete ui.expanded[id]; saveUi(); }
        herlaadProjecten(); fireChange(); api.render();
      },
      setDisciplines: function (list) {
        if (!Array.isArray(list) || !list.length) return doc.disciplines;
        var oudeKeys = doc.disciplines.map(function (d) { return d.key; });
        var keys = [];
        doc.disciplines = list.map(function (d) {
          var key = d.key || slugKey(d.label, keys);
          keys.push(key);
          return { key: key, label: d.label != null ? String(d.label) : key, color: d.color || '#cccccc' };
        });
        var nieuweKeys = doc.disciplines.map(function (d) { return d.key; });
        var verwijderd = oudeKeys.filter(function (k) { return nieuweKeys.indexOf(k) === -1; });
        // Data van verwijderde disciplines uit ÁLLE bron-records halen + plan-snapshot herzien.
        if (verwijderd.length) {
          (ogGet('index') || []).forEach(function (id) {
            var rec = ogGet('proj_' + id); if (!rec || !rec.weken) return;
            var changed = false;
            verwijderd.forEach(function (k) { if (rec.weken[k]) { delete rec.weken[k]; changed = true; } });
            if (changed) { ogSet('proj_' + id, rec); schrijfSnapPlan(rec); }
          });
        }
        doc.projecten.forEach(function (p) { reconcileWeken(p, doc.disciplines); });
        ogSetDisciplines(doc.disciplines);   // delen met OverallPlanning (gedeelde bron)
        persist(); fireChange(); api.render(); return doc.disciplines;
      },
      setEngineer: function (d) {
        d = d || {};
        if (d.naam != null) { doc.engineer.naam = String(d.naam); doc.engineer.mdwId = mdwIdVoorNaam(doc.engineer.naam); }
        if (d.initialen != null) doc.engineer.initialen = String(d.initialen);
        if (d.mdwId != null) doc.engineer.mdwId = String(d.mdwId);
        persist(); herlaadProjecten(); fireChange(); api.render(); return doc.engineer;
      },
      setHorizon: function (d) {
        d = d || {};
        if (d.jaar != null) doc.horizon.jaar = parseInt(d.jaar, 10) || doc.horizon.jaar;
        if (d.startWeek != null) doc.horizon.startWeek = clampWeek(d.startWeek, doc.horizon.startWeek);
        if (d.eindWeek != null) doc.horizon.eindWeek = clampWeek(d.eindWeek, doc.horizon.eindWeek);
        if (doc.horizon.eindWeek < doc.horizon.startWeek) doc.horizon.eindWeek = doc.horizon.startWeek;
        persist(); herlaadProjecten(); fireChange(); api.render(); return doc.horizon;
      },
      render: function () {
        el.innerHTML = renderLegenda(doc) + renderToolbar(doc) + renderActions() + renderGrid(doc, ui);
        bindBar();
        bindActions();
      },
      exportJSON: function () { return JSON.stringify(doc, null, 2); },
      importJSON: function (obj) {
        if (typeof obj === 'string') { try { obj = JSON.parse(obj); } catch (e) { return false; } }
        doc = migreer(obj, opts); persist(); fireChange(); api.render(); return true;
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('mouseup', endDrag);   // drag eindigt ook buiten een cel
    }

    api.render();
    return api;
  }

  global.BFTEngPlanning = {
    version: VERSION,
    DISCIPLINES: DISCIPLINES,
    register: create
  };

})(typeof window !== 'undefined' ? window : this);
