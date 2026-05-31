/**
 * bft-overallgrid.js — BFTOverallGrid v0.1 (Stap G1)
 * ────────────────────────────────────────────────────────────────────────
 * Grid-tabel voor de OverAll Projecten-planning. Eigen HTML-render (geen
 * vis-timeline). Vaste metadata-kolommen links, maandkolommen rechts,
 * rijen later inklapbaar (G2) en op weekniveau te schilderen (G3).
 *
 * Werkt onder file://. Optioneel: bft-dialog.js (confirm voor verwijderen).
 *
 * Datamodel (schemaVersie 1):
 *   document = {
 *     versie, jaar,
 *     disciplines: [{key,label,color}, …],
 *     projecten: [{ id, klant, omschrijving, wo, servnr, pl, eng, wvb,
 *                   weken: { <disciplineKey>: [ {startWeek,eindWeek,jaar,notitie} ] } }]
 *   }
 *
 * Storage: localStorage achter Store-laag — prefix 'bft_overallplanning_',
 *          key 'document'. Tool-code praat NIET rechtstreeks met localStorage.
 *
 * G1-scope: grid renderen + project toevoegen/verwijderen + persist.
 *           Disciplines/schilderen/import komen in G2+.
 *
 * Public API:
 *   BFTOverallGrid.register(opts) → instance | null
 *   BFTOverallGrid.version
 *   BFTOverallGrid.DEFAULT_DISCIPLINES
 *
 * Instance API:
 *   .getState()        → live document
 *   .addProject(data)  → voeg project toe (data optioneel; zonder = lege)
 *   .promptAddProject()→ open formulier-modal, Promise<project|null>
 *   .removeProject(id) → verwijder project
 *   .render()          → her-render
 *   .exportJSON()      → JSON-string
 *   .importJSON(obj)   → vervang + render
 * ────────────────────────────────────────────────────────────────────────
 */
(function (global) {
  'use strict';

  var VERSION = '0.1';
  var SCHEMA_VERSIE = 1;

  var DEFAULT_DISCIPLINES = [
    { key: 'engineering', label: 'Engineering',        color: '#FFFF00' },
    { key: 'wvb',         label: 'WVB',                color: '#92D050' },
    { key: 'randtaken',   label: 'Randtaken',          color: '#FFC000' },
    { key: 'begeleiding', label: 'Begeleiding opbouw', color: '#00B0F0' }
  ];

  var MAANDEN = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];

  // Metadata-kolommen (volgorde = weergave-volgorde). label = kop, veld = datasleutel.
  var META_KOLOMMEN = [
    { veld: 'klant',        label: 'Klant' },
    { veld: 'omschrijving', label: 'Omschrijving' },
    { veld: 'wo',           label: 'WO-nr' },
    { veld: 'servnr',       label: 'Service-nr' },
    { veld: 'pl',           label: 'PL' },
    { veld: 'eng',          label: 'EN' },
    { veld: 'wvb',          label: 'WVB' }
  ];

  var DEFAULT_OPTS = {
    container  : null,
    storePrefix: 'bft_overallplanning_',
    storeKey   : 'document',
    uiKey      : 'ui',
    jaar       : new Date().getFullYear(),
    accordion  : false,
    onChange   : null
  };

  // ── utils ──────────────────────────────────────────────────────────────
  function uuid() { return Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7); }

  function esc(s) {
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

  // ── ISO-week helpers (week = bouwsteen) ──────────────────────────────────
  function isoWeekMonday(year, week) {
    var jan4 = new Date(Date.UTC(year, 0, 4));
    var day = jan4.getUTCDay() || 7;
    var mon = new Date(jan4);
    mon.setUTCDate(jan4.getUTCDate() - day + 1);
    mon.setUTCDate(mon.getUTCDate() + (week - 1) * 7);
    return mon;
  }
  function isoWeeksInYear(year) {
    var d = new Date(Date.UTC(year, 11, 28));
    var day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    var ys = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - ys) / 86400000) + 1) / 7);
  }
  // maand (0-11) waar een ISO-week toe hoort — bepaald via de donderdag
  function maandVanWeek(year, week) {
    var thu = isoWeekMonday(year, week);
    thu.setUTCDate(thu.getUTCDate() + 3);
    return thu.getUTCMonth();
  }

  // ── Store-laag (swappable: localStorage nu, interne server later) ────────
  function makeStore(prefix) {
    return {
      get: function (key) {
        try { var raw = localStorage.getItem(prefix + key); return raw === null ? null : JSON.parse(raw); }
        catch (e) { console.warn('[BFTOverallGrid Store] get error', key, e); return null; }
      },
      set: function (key, val) {
        try { localStorage.setItem(prefix + key, JSON.stringify(val)); return true; }
        catch (e) { console.error('[BFTOverallGrid Store] set error', key, e); return false; }
      },
      del: function (key) { try { localStorage.removeItem(prefix + key); } catch (e) {} }
    };
  }

  // ── sticky kolom-configuratie ────────────────────────────────────────────
  var STICKY_ACT  = 52;
  var STICKY_META = [110, 160, 72, 80, 44, 44, 44]; // breedte per meta-kolom
  var STICKY_LEFT = [STICKY_ACT];                     // cumulatieve left-offset per meta-kolom
  STICKY_META.forEach(function (w, i) { STICKY_LEFT.push(STICKY_LEFT[i] + STICKY_META[i]); });
  var BG_HEAD  = 'var(--accent-dk,#00509e)';
  var BG_ROW   = '#fff';
  var BG_DISC  = 'var(--surface,#fbfcfe)';

  // ── datamodel ────────────────────────────────────────────────────────────
  function emptyDoc(jaar) {
    return {
      versie: SCHEMA_VERSIE,
      jaar: jaar,
      disciplines: DEFAULT_DISCIPLINES.map(function (d) { return Object.assign({}, d); }),
      projecten: []
    };
  }

  function nieuwProject(data) {
    data = data || {};
    var p = { id: data.id || ('pr_' + uuid()), weken: data.weken || {} };
    META_KOLOMMEN.forEach(function (k) { p[k.veld] = data[k.veld] != null ? String(data[k.veld]) : ''; });
    return p;
  }

  function migreer(doc, jaar) {
    if (!doc || typeof doc !== 'object') return emptyDoc(jaar);
    if (!Array.isArray(doc.disciplines) || !doc.disciplines.length) doc.disciplines = emptyDoc(jaar).disciplines;
    if (!Array.isArray(doc.projecten)) doc.projecten = [];
    doc.projecten = doc.projecten.map(function (p) { return nieuwProject(p); });
    if (typeof doc.jaar !== 'number') doc.jaar = jaar;
    doc.versie = SCHEMA_VERSIE;
    return doc;
  }

  // ── formulier-modal (tool-eigen; 1100×520; geen native dialog) ───────────
  var FORM_CSS_ID = 'bft-og-form-styles';
  function injectFormCss() {
    if (typeof document === 'undefined' || document.getElementById(FORM_CSS_ID)) return;
    var css = ''
      + '.bft-og-ov{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:10000;display:none;'
      +   'align-items:center;justify-content:center;padding:20px;box-sizing:border-box;'
      +   'font-family:"IBM Plex Sans",system-ui,sans-serif;}'
      + '.bft-og-ov.open{display:flex;}'
      + '.bft-og-modal{background:#fff;border-radius:10px;max-width:1100px;width:100%;min-height:520px;'
      +   'max-height:calc(100vh - 40px);display:flex;flex-direction:column;overflow:hidden;'
      +   'box-shadow:0 20px 60px rgba(0,0,0,.3);}'
      + '.bft-og-top{background:#000;color:#fff;padding:16px 22px;display:flex;align-items:center;gap:12px;flex:none;}'
      + '.bft-og-top .ic{width:30px;height:30px;border-radius:50%;background:#e8a000;color:#000;font-weight:700;'
      +   'display:flex;align-items:center;justify-content:center;font-family:"IBM Plex Mono",monospace;font-size:15px;}'
      + '.bft-og-ttl{font-size:14px;font-weight:600;letter-spacing:.02em;font-family:"IBM Plex Mono",monospace;text-transform:uppercase;}'
      + '.bft-og-body{padding:28px 36px;flex:1;overflow:auto;display:grid;grid-template-columns:1fr 1fr;gap:16px 24px;align-content:start;}'
      + '.bft-og-field{display:flex;flex-direction:column;gap:5px;}'
      + '.bft-og-field.full{grid-column:1 / -1;}'
      + '.bft-og-field label{font-size:12px;font-weight:600;color:#3d4558;font-family:"IBM Plex Mono",monospace;}'
      + '.bft-og-field input{padding:9px 11px;border:1px solid #c8ccd4;border-radius:6px;font-size:14px;'
      +   'font-family:"IBM Plex Sans",sans-serif;color:#1a1f2e;}'
      + '.bft-og-field input:focus{outline:2px solid #e8a000;outline-offset:1px;border-color:#e8a000;}'
      + '.bft-og-actions{display:flex;gap:10px;justify-content:flex-end;padding:14px 22px;background:#fafbfc;'
      +   'border-top:1px solid #e3e6ec;flex:none;}'
      + '.bft-og-btn{padding:10px 22px;border:1px solid #c8ccd4;border-radius:6px;background:#fff;color:#1a1f2e;'
      +   'cursor:pointer;font-size:13px;font-weight:500;font-family:"IBM Plex Sans",sans-serif;min-width:100px;}'
      + '.bft-og-btn:hover{background:#f1f3f6;border-color:#9ca3ad;}'
      + '.bft-og-btn.primary{background:#e8a000;color:#000;border-color:#e8a000;}'
      + '.bft-og-btn.primary:hover{background:#d49000;border-color:#d49000;}'
      // discipline-manager
      + '.og-dm-body{display:flex;flex-direction:column;gap:14px;}'
      + '.og-dm-list{display:flex;flex-direction:column;gap:8px;}'
      + '.bft-og-disc-row{display:flex;align-items:center;gap:10px;}'
      + '.og-dm-color{width:42px;height:34px;padding:2px;border:1px solid #c8ccd4;border-radius:6px;cursor:pointer;background:#fff;}'
      + '.og-dm-label{flex:1;padding:9px 11px;border:1px solid #c8ccd4;border-radius:6px;font-size:14px;'
      +   'font-family:"IBM Plex Sans",sans-serif;color:#1a1f2e;}'
      + '.og-dm-label:focus{outline:2px solid #e8a000;outline-offset:1px;border-color:#e8a000;}'
      + '.og-dm-key{font-family:"IBM Plex Mono",monospace;font-size:11px;color:#8a909c;min-width:120px;}'
      + '.og-dm-del{min-width:auto;padding:8px 14px;font-size:15px;line-height:1;}'
      + '.og-dm-del:hover{background:#d63030;color:#fff;border-color:#d63030;}'
      + '.og-dm-add{align-self:flex-start;min-width:auto;}';
    var st = document.createElement('style'); st.id = FORM_CSS_ID; st.textContent = css;
    document.head.appendChild(st);
  }

  function openProjectForm(initial) {
    injectFormCss();
    initial = initial || {};
    return new Promise(function (resolve) {
      var ov = document.createElement('div');
      ov.className = 'bft-og-ov open';
      var fieldsHtml = META_KOLOMMEN.map(function (k) {
        var full = (k.veld === 'omschrijving') ? ' full' : '';
        return '<div class="bft-og-field' + full + '">'
          + '<label for="bft-og-' + k.veld + '">' + esc(k.label) + '</label>'
          + '<input id="bft-og-' + k.veld + '" type="text" value="' + esc(initial[k.veld] || '') + '">'
          + '</div>';
      }).join('');
      ov.innerHTML = ''
        + '<div class="bft-og-modal" role="dialog" aria-modal="true">'
        +   '<div class="bft-og-top"><div class="ic">+</div><div class="bft-og-ttl">Project toevoegen</div></div>'
        +   '<div class="bft-og-body">' + fieldsHtml + '</div>'
        +   '<div class="bft-og-actions">'
        +     '<button class="bft-og-btn" data-act="cancel">Annuleer</button>'
        +     '<button class="bft-og-btn primary" data-act="ok">Toevoegen</button>'
        +   '</div>'
        + '</div>';
      document.body.appendChild(ov);

      function close(val) {
        if (ov.parentNode) ov.parentNode.removeChild(ov);
        document.removeEventListener('keydown', onKey);
        resolve(val);
      }
      function collect() {
        var out = {};
        META_KOLOMMEN.forEach(function (k) {
          var el = ov.querySelector('#bft-og-' + k.veld);
          out[k.veld] = el ? el.value.trim() : '';
        });
        return out;
      }
      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); close(null); }
        else if (e.key === 'Enter') { e.preventDefault(); close(collect()); }
      }
      ov.addEventListener('click', function (e) { if (e.target === ov) close(null); });
      ov.querySelectorAll('.bft-og-btn').forEach(function (b) {
        b.addEventListener('click', function () {
          close(b.getAttribute('data-act') === 'ok' ? collect() : null);
        });
      });
      document.addEventListener('keydown', onKey);
      setTimeout(function () { var f = ov.querySelector('input'); if (f) f.focus(); }, 0);
    });
  }

  // ── discipline-manager modal (tool-eigen; 1100×520) ──────────────────────
  function slugKey(label, bestaande) {
    var base = String(label || 'discipline').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'discipline';
    var key = base, i = 2;
    while (bestaande.indexOf(key) !== -1) { key = base + '-' + i; i++; }
    return key;
  }

  function openDisciplineManager(disciplines) {
    injectFormCss();
    // werk op een diepe kopie; bevestigen geeft de nieuwe lijst terug, anders null
    var work = disciplines.map(function (d) { return { key: d.key, label: d.label, color: d.color }; });
    return new Promise(function (resolve) {
      var ov = document.createElement('div');
      ov.className = 'bft-og-ov open';

      function rowsHtml() {
        return work.map(function (d, i) {
          return '<div class="bft-og-disc-row" data-i="' + i + '">'
            + '<input class="og-dm-color" type="color" value="' + esc(d.color) + '" title="Kleur">'
            + '<input class="og-dm-label" type="text" value="' + esc(d.label) + '" placeholder="Naam discipline">'
            + '<code class="og-dm-key">' + esc(d.key) + '</code>'
            + '<button class="bft-og-btn og-dm-del" data-i="' + i + '" title="Verwijder">×</button>'
            + '</div>';
        }).join('');
      }
      function paint() {
        ov.querySelector('#og-dm-list').innerHTML = rowsHtml();
        wireRows();
      }
      function syncFromInputs() {
        ov.querySelectorAll('.bft-og-disc-row').forEach(function (r) {
          var i = parseInt(r.getAttribute('data-i'), 10);
          if (isNaN(i) || !work[i]) return;
          work[i].label = r.querySelector('.og-dm-label').value.trim() || work[i].label;
          work[i].color = r.querySelector('.og-dm-color').value;
        });
      }
      function wireRows() {
        ov.querySelectorAll('.og-dm-del').forEach(function (b) {
          b.addEventListener('click', function () {
            syncFromInputs();
            work.splice(parseInt(b.getAttribute('data-i'), 10), 1);
            paint();
          });
        });
      }

      ov.innerHTML = ''
        + '<div class="bft-og-modal" role="dialog" aria-modal="true">'
        +   '<div class="bft-og-top"><div class="ic">⚙</div><div class="bft-og-ttl">Disciplines beheren</div></div>'
        +   '<div class="bft-og-body og-dm-body">'
        +     '<div id="og-dm-list" class="og-dm-list"></div>'
        +     '<button class="bft-og-btn og-dm-add" type="button">+ Discipline</button>'
        +   '</div>'
        +   '<div class="bft-og-actions">'
        +     '<button class="bft-og-btn" data-act="cancel">Annuleer</button>'
        +     '<button class="bft-og-btn primary" data-act="ok">Opslaan</button>'
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

      ov.querySelector('.og-dm-add').addEventListener('click', function () {
        syncFromInputs();
        var keys = work.map(function (d) { return d.key; });
        work.push({ key: slugKey('discipline', keys), label: 'Nieuwe discipline', color: '#cccccc' });
        paint();
      });
      ov.addEventListener('click', function (e) { if (e.target === ov) close(null); });
      ov.querySelectorAll('.bft-og-actions .bft-og-btn').forEach(function (b) {
        b.addEventListener('click', function () {
          if (b.getAttribute('data-act') === 'ok') { syncFromInputs(); close(work); }
          else close(null);
        });
      });
      document.addEventListener('keydown', onKey);
    });
  }

  // ── confirm helper (BFTDialog of fallback) ───────────────────────────────
  function confirmDlg(msg, opts) {
    if (global.BFTDialog && typeof global.BFTDialog.confirm === 'function') {
      return global.BFTDialog.confirm(msg, opts);
    }
    return Promise.resolve(global.confirm ? global.confirm(msg) : true);
  }

  // ── instance ─────────────────────────────────────────────────────────────
  function createInstance(opts) {
    var el = resolveElement(opts.container);
    if (!el) { console.error('[BFTOverallGrid] container niet gevonden:', opts.container); return null; }
    var store = makeStore(opts.storePrefix);

    var doc = migreer(store.get(opts.storeKey), opts.jaar);

    // UI-state (uitgeklapte rijen + resolutie) — los van het document
    var ui = store.get(opts.uiKey) || {};
    if (!ui.expanded || typeof ui.expanded !== 'object') ui.expanded = {};
    if (ui.resolutie !== 'week' && ui.resolutie !== 'maand') ui.resolutie = 'maand';
    var drag = null; // actieve schilder-sessie

    function save() {
      store.set(opts.storeKey, doc);
      if (typeof opts.onChange === 'function') { try { opts.onChange(getState()); } catch (e) {} }
    }
    function saveUi() { store.set(opts.uiKey, ui); }
    function getState() { return doc; }

    // ── tijd-as kolommen (maand of week, afhankelijk van resolutie) ─────────
    function tijdKoppen() {
      if (ui.resolutie === 'week') {
        var n = isoWeeksInYear(doc.jaar), arr = [];
        for (var w = 1; w <= n; w++) arr.push({ type: 'week', week: w, label: 'w' + w });
        return arr;
      }
      return MAANDEN.map(function (m, idx) { return { type: 'maand', maand: idx, label: m + ' ' + String(doc.jaar).slice(2) }; });
    }

    // ── schilder-data helpers (week-ranges <-> set) ─────────────────────────
    function discByKey(k) { return doc.disciplines.filter(function (d) { return d.key === k; })[0]; }
    function weekSetFor(p, key) {
      var s = {};
      (p.weken[key] || []).forEach(function (r) {
        if (r.jaar === doc.jaar) for (var w = r.startWeek; w <= r.eindWeek; w++) s[w] = 1;
      });
      return s;
    }
    function commitSet(p, key, setObj) {
      var weken = Object.keys(setObj).map(Number).filter(function (n) { return setObj[n]; })
        .sort(function (a, b) { return a - b; });
      var oud = p.weken[key] || [];
      var notitieByStart = {};
      oud.forEach(function (r) { if (r.jaar === doc.jaar) notitieByStart[r.startWeek] = r.notitie || ''; });
      var anders = oud.filter(function (r) { return r.jaar !== doc.jaar; });
      var nieuw = [], i = 0;
      while (i < weken.length) {
        var s = weken[i], e = s;
        while (i + 1 < weken.length && weken[i + 1] === e + 1) { e = weken[i + 1]; i++; }
        nieuw.push({ startWeek: s, eindWeek: e, jaar: doc.jaar, notitie: notitieByStart[s] || '' });
        i++;
      }
      var samen = anders.concat(nieuw);
      if (samen.length) p.weken[key] = samen; else delete p.weken[key];
    }

    function isoWeekNummer(d) {
      var jan4 = new Date(Date.UTC(d.getFullYear(), 0, 4));
      var day  = jan4.getUTCDay() || 7;
      var mon  = new Date(jan4); mon.setUTCDate(jan4.getUTCDate() - day + 1);
      return Math.ceil(((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - mon) / 86400000 + 1) / 7);
    }

    function render() {
      var kol = tijdKoppen();
      var totColspanMeta = META_KOLOMMEN.length;
      var huidigWeek = isoWeekNummer(new Date());
      var huidigMaand = new Date().getMonth();

      function stickyTh(cls, left, minW, bg, label) {
        return '<th class="' + cls + '" style="position:sticky;left:' + left + 'px;min-width:' + minW + 'px;z-index:3;background:' + bg + '">' + (label || '') + '</th>';
      }
      function stickyTd(cls, left, minW, bg, content, extra) {
        return '<td class="' + cls + '" style="position:sticky;left:' + left + 'px;min-width:' + minW + 'px;z-index:2;background:' + bg + '"' + (extra || '') + '>' + (content || '') + '</td>';
      }

      var html = '<table class="og-tbl og-res-' + ui.resolutie + '"><thead><tr>';
      html += stickyTh('og-th-act', 0, STICKY_ACT, BG_HEAD, '');
      META_KOLOMMEN.forEach(function (k, i) { html += stickyTh('og-th-meta', STICKY_LEFT[i], STICKY_META[i], BG_HEAD, esc(k.label)); });
      kol.forEach(function (c) {
        var isHuidig = (c.type === 'week' && c.week === huidigWeek) || (c.type === 'maand' && c.maand === huidigMaand);
        html += '<th class="og-th-tijd og-th-' + c.type + (isHuidig ? ' og-th-huidig' : '') + '">' + esc(c.label) + '</th>';
      });
      html += '</tr></thead><tbody>';

      if (!doc.projecten.length) {
        var span = 1 + META_KOLOMMEN.length + kol.length;
        html += '<tr><td class="og-empty" colspan="' + span + '">'
          + 'Nog geen projecten. Klik op “+ Project” om er een toe te voegen.</td></tr>';
      } else {
        doc.projecten.forEach(function (p) {
          var open = !!ui.expanded[p.id];
          html += '<tr class="og-row-project' + (open ? ' open' : '') + '" data-id="' + esc(p.id) + '" data-pid="' + esc(p.id) + '">';
          html += stickyTd('og-td-act', 0, STICKY_ACT, BG_ROW,
            '<button class="og-caret" data-id="' + esc(p.id) + '" title="Uit-/inklappen">' + (open ? '▼' : '▶') + '</button>'
            + '<button class="og-del" data-id="' + esc(p.id) + '" title="Verwijder project">×</button>');
          META_KOLOMMEN.forEach(function (k, i) { html += stickyTd('og-td-meta', STICKY_LEFT[i], STICKY_META[i], BG_ROW, esc(p[k.veld])); });
          kol.forEach(function (c) {
            var isHuidig = (c.type === 'week' && c.week === huidigWeek) || (c.type === 'maand' && c.maand === huidigMaand);
            var hCls = isHuidig ? ' og-td-huidig' : '';

            /* Verzamel disciplines met data in deze kolom */
            var actief = doc.disciplines.filter(function (d) {
              var set = weekSetFor(p, d.key);
              if (c.type === 'week') return !!set[c.week];
              for (var w in set) {
                if (set[w] && maandVanWeek(doc.jaar, Number(w)) === c.maand) return true;
              }
              return false;
            });

            if (actief.length === 0) {
              html += '<td class="og-td-tijd' + hCls + '"></td>';
            } else {
              /* Gestapelde gekleurde balkjes per discipline */
              var h = Math.floor(100 / actief.length);
              var bars = actief.map(function (d) {
                return '<div style="flex:1;background:' + esc(d.color) + ';opacity:0.85"></div>';
              }).join('');
              html += '<td class="og-td-tijd' + hCls + '" style="padding:0;vertical-align:top">'
                + '<div style="height:100%;min-height:22px;display:flex;flex-direction:column">' + bars + '</div></td>';
            }
          });
          html += '</tr>';

          if (open) {
            doc.disciplines.forEach(function (d) {
              var set = weekSetFor(p, d.key);
              html += '<tr class="og-row-disc" data-id="' + esc(p.id) + '" data-disc="' + esc(d.key) + '">';
              html += stickyTd('og-td-act', 0, STICKY_ACT, BG_DISC, '');
              html += '<td class="og-td-disc" colspan="' + totColspanMeta + '" style="background:' + BG_DISC + '">'
                + '<span class="og-disc-sw" style="background:' + esc(d.color) + '"></span>'
                + '<span class="og-disc-label">' + esc(d.label) + '</span>'
                + '</td>';
              kol.forEach(function (c) {
                var isHuidig = (c.type === 'week' && c.week === huidigWeek) || (c.type === 'maand' && c.maand === huidigMaand);
                var hCls = isHuidig ? ' og-td-huidig' : '';
                if (c.type === 'week') {
                  var on = !!set[c.week];
                  html += '<td class="og-td-tijd og-paint-cell' + (on ? ' painted' : '') + hCls + '" data-week="' + c.week + '"'
                    + (on ? ' style="background:' + esc(d.color) + '"' : '') + '></td>';
                } else {
                  var any = false;
                  for (var w in set) { if (set[w] && maandVanWeek(doc.jaar, Number(w)) === c.maand) { any = true; break; } }
                  html += '<td class="og-td-tijd og-maand-sum' + (any ? ' filled' : '') + hCls + '"'
                    + (any ? ' style="background:' + esc(d.color) + '"' : '') + '></td>';
                }
              });
              html += '</tr>';
            });
          }
        });
      }
      html += '</tbody></table>';
      el.innerHTML = html;

      el.querySelectorAll('.og-caret').forEach(function (b) {
        b.addEventListener('click', function (e) { e.stopPropagation(); toggleExpand(b.getAttribute('data-id')); });
      });
      el.querySelectorAll('tr.og-row-project').forEach(function (tr) {
        tr.addEventListener('click', function (e) {
          if (e.target.closest('button')) return;
          toggleExpand(tr.getAttribute('data-id'));
        });
      });
      el.querySelectorAll('.og-del').forEach(function (b) {
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          var id = b.getAttribute('data-id');
          var p = doc.projecten.filter(function (x) { return x.id === id; })[0];
          var naam = p ? (p.wo || p.klant || p.omschrijving || 'dit project') : 'dit project';
          confirmDlg('Project “' + naam + '” verwijderen?', { title: 'Verwijderen', okLabel: 'Verwijderen', danger: true })
            .then(function (ok) { if (ok) removeProject(id); });
        });
      });

      if (ui.resolutie === 'week') wirePainting();
    }

    // ── schilderen (klik = toggle, sleep = reeks) ───────────────────────────
    function wirePainting() {
      el.querySelectorAll('tr.og-row-disc').forEach(function (tr) {
        var pid = tr.getAttribute('data-id'), key = tr.getAttribute('data-disc');
        var p = doc.projecten.filter(function (x) { return x.id === pid; })[0];
        if (!p) return;
        tr.querySelectorAll('.og-paint-cell').forEach(function (cell) {
          cell.addEventListener('mousedown', function (e) { e.preventDefault(); startDrag(p, key, cell); });
          cell.addEventListener('mouseenter', function () { if (drag) paintCell(cell); });
        });
      });
    }
    function startDrag(p, key, cell) {
      var set = weekSetFor(p, key);
      var wk = Number(cell.getAttribute('data-week'));
      drag = { p: p, key: key, set: set, on: !set[wk] };
      paintCell(cell);
    }
    function paintCell(cell) {
      if (!drag) return;
      var wk = Number(cell.getAttribute('data-week'));
      var disc = discByKey(drag.key);
      if (drag.on) { drag.set[wk] = 1; cell.classList.add('painted'); cell.style.background = disc ? disc.color : ''; }
      else { delete drag.set[wk]; cell.classList.remove('painted'); cell.style.background = ''; }
    }
    function endDrag() {
      if (!drag) return;
      commitSet(drag.p, drag.key, drag.set);
      drag = null;
      save();
    }

    function setResolutie(r) { ui.resolutie = (r === 'week' ? 'week' : 'maand'); saveUi(); render(); }
    function getResolutie() { return ui.resolutie; }
    function toggleResolutie() { setResolutie(ui.resolutie === 'week' ? 'maand' : 'week'); }

    function toggleExpand(id) {
      if (opts.accordion) {
        /* Sluit alle andere projecten — één render */
        var wasOpen = !!ui.expanded[id];
        ui.expanded = {};
        if (!wasOpen) ui.expanded[id] = true;
      } else {
        if (ui.expanded[id]) delete ui.expanded[id];
        else ui.expanded[id] = true;
      }
      saveUi(); render();
    }

    function addProject(data) {
      var p = nieuwProject(data);
      doc.projecten.push(p);
      save(); render();
      return p;
    }
    function promptAddProject() {
      return openProjectForm({}).then(function (data) {
        if (!data) return null;
        return addProject(data);
      });
    }
    function removeProject(id) {
      var before = doc.projecten.length;
      doc.projecten = doc.projecten.filter(function (p) { return p.id !== id; });
      if (doc.projecten.length !== before) { save(); render(); }
    }
    function exportJSON() { return JSON.stringify(doc, null, 2); }
    function importJSON(obj) { doc = migreer(obj, opts.jaar); save(); render(); }

    function openDisciplineMgr() {
      return openDisciplineManager(doc.disciplines).then(function (nieuwe) {
        if (!nieuwe) return null;
        // verwijderde disciplines → bijbehorende weken uit projecten halen
        var behoudKeys = nieuwe.map(function (d) { return d.key; });
        doc.projecten.forEach(function (p) {
          Object.keys(p.weken || {}).forEach(function (k) {
            if (behoudKeys.indexOf(k) === -1) delete p.weken[k];
          });
        });
        doc.disciplines = nieuwe;
        save(); render();
        return nieuwe;
      });
    }

    if (typeof document !== 'undefined') document.addEventListener('mouseup', endDrag);

    render();

    return {
      getState: getState,
      addProject: addProject,
      promptAddProject: promptAddProject,
      removeProject: removeProject,
      toggleExpand: toggleExpand,
      openDisciplineManager: openDisciplineMgr,
      setResolutie: setResolutie,
      getResolutie: getResolutie,
      toggleResolutie: toggleResolutie,
      render: render,
      exportJSON: exportJSON,
      importJSON: importJSON,
      _opts: opts
    };
  }

  var API = {
    version: VERSION,
    schemaVersie: SCHEMA_VERSIE,
    DEFAULT_DISCIPLINES: DEFAULT_DISCIPLINES,
    META_KOLOMMEN: META_KOLOMMEN,
    register: function (userOpts) {
      var opts = mergeOpts(DEFAULT_OPTS, userOpts || {});
      return createInstance(opts);
    },
    _internal: { emptyDoc: emptyDoc, migreer: migreer, nieuwProject: nieuwProject }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  global.BFTOverallGrid = API;

})(typeof self !== 'undefined' ? self : this);
