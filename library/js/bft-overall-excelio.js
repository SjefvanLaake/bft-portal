/**
 * bft-overall-excelio.js — BFTOverallExcelIO (Stap 1: IMPORT-only)
 * ────────────────────────────────────────────────────────────────────────
 * Leest de "OverAll Projecten planning" .xlsx en levert een genormaliseerd
 * planning-object op DATUM-basis (klaar voor vis-timeline). Schrijft niets,
 * heeft geen UI. Export (eenrichting) komt in een latere stap.
 *
 * Vereist ExcelJS (rgb + theme fills). Standaard SheetJS-build leest GEEN
 * celkleuren — daarom expliciet ExcelJS.
 *   Browser: library/vendor/exceljs/exceljs.min.js (CDN-fallback)
 *   Node   : require('exceljs')  (voor unit-test)
 *
 * ── INSTELBAAR (geen hardcoding) ─────────────────────────────────────────
 * De tijd-as is volledig config-gestuurd. De tool toont deze waarden bij
 * import in een bevestigingsdialoog met preview; de gebruiker stelt bij tot
 * de balken kloppen.
 *
 *   cfg = {
 *     sheetName : 'Projecten planning',
 *     baseYear  : 2026,            // jaar van de eerste 'Jan' in de maandgrid (kolom 40)
 *     gridStart : 40,              // eerste maandkolom
 *     gridEnd   : 176,
 *     weekZone  : {                // OPTIONEEL — pre-grid weekhistorie links
 *       enabled  : false,          // default UIT (historie van beperkte waarde)
 *       startCol : 11,
 *       endCol   : 37,             // laatste 'wk'-kolom, direct vóór de maandgrid
 *       endWeek  : 52,             // ISO-week van endCol  ← instelbaar anker
 *       endYear  : 2025,           // jaar van endCol      ← instelbaar anker
 *       colsPerWeek : 1
 *     }
 *   }
 *
 * Mapping-contract: zie Concept bestanden/PLAN_BFT_OverallPlanning.md (Stap 0).
 *
 * Public API:
 *   BFTOverallExcelIO.importBuffer(arrayBuffer, cfg) -> Promise<result>
 *   BFTOverallExcelIO.importWorkbook(wb, cfg)        -> result   (sync)
 *   BFTOverallExcelIO.DEFAULT_CFG
 *   BFTOverallExcelIO.version
 *
 * result = {
 *   meta       : { sheet, cfg, jaren:[..], kolommen:{maand, week} },
 *   disciplines: [ { key, label, color } ],
 *   projecten  : [ {
 *       wo, klant, omschrijving, servnr, pl, eng, wvb, uren, opleverdatum, rij,
 *       balken:[ { disciplineKey, color, start:'YYYY-MM-DD', eind:'YYYY-MM-DD', unit, notitie } ]
 *   } ],
 *   onbekend   : [ { color } ]    // kleuren zonder vaste discipline-key
 * }
 * ────────────────────────────────────────────────────────────────────────
 */
(function (global) {
  'use strict';

  var VERSION = '0.2-import-config';

  var META_COLS = {
    klant: 2, omschrijving: 3, wo: 4, servnr: 5,
    pl: 6, eng: 7, wvb: 8, uren: 9, opleverdatum: 10
  };

  var DEFAULT_CFG = {
    sheetName: 'Projecten planning',
    baseYear: 2026,
    gridStart: 40,
    gridEnd: 176,
    weekZone: {
      enabled: false,
      startCol: 11,
      endCol: 37,
      endWeek: 52,
      endYear: 2025,
      colsPerWeek: 1
    }
  };

  // Standaard Office-themapalet (0-based slot-index → rgb), voor theme-fills.
  var THEME_PALETTE = [
    '000000', 'FFFFFF', '44546A', 'E7E6E6', '4472C4', 'ED7D31',
    'A5A5A5', 'FFC000', '5B9BD5', '70AD47', '0563C1', '954F72'
  ];

  // rgb (uppercase) → { key, label }. Bekende disciplines + varianten (hernoembaar via ⚙).
  var COLOR_MAP = {
    'FFFF00': { key: 'engineering',  label: 'Engineering' },
    '92D050': { key: 'wvb',          label: 'WVB' },
    'FFC000': { key: 'randtaken',    label: 'Randtaken' },
    '00B0F0': { key: 'begeleiding',  label: 'Begeleiding opbouw' },
    '70AD47': { key: 'discipline-5', label: 'Groen-variant (hernoem)' },
    '00B050': { key: 'discipline-6', label: 'Donkergroen (hernoem)' },
    'A3DBFF': { key: 'discipline-7', label: 'Lichtblauw (hernoem)' },
    '7030A0': { key: 'discipline-8', label: 'Paars (hernoem)' }
  };

  // Neutrale fills = randen/scheidingen/markers → géén discipline.
  var NEUTRAL = { '000000': 1, 'FFFFFF': 1 };

  var MONTH_LOOKUP = (function () {
    var m = {};
    function set(num, names) { names.forEach(function (n) { m[n] = num; }); }
    set(1,  ['jan', 'januari']);   set(2,  ['feb', 'februari']);
    set(3,  ['mrt', 'maart', 'mar']); set(4, ['apr', 'april']);
    set(5,  ['mei']);              set(6,  ['jun', 'juni']);
    set(7,  ['jul', 'juli']);      set(8,  ['aug', 'augustus']);
    set(9,  ['sep', 'sept', 'september']); set(10, ['okt', 'oktober']);
    set(11, ['nov', 'november']);  set(12, ['dec', 'december']);
    return m;
  })();

  // ── Helpers ──────────────────────────────────────────────────────────────
  function normHex(s) {
    if (!s) return null;
    s = String(s).toUpperCase().replace(/[^0-9A-F]/g, '');
    if (s.length === 8) s = s.slice(2);
    return s.length === 6 ? s : null;
  }
  function monthFromLabel(label) {
    if (label == null) return null;
    return MONTH_LOOKUP[String(label).trim().toLowerCase()] || null;
  }
  function applyTint(hex, tint) {
    if (!tint) return hex;
    var n = parseInt(hex, 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function t(c) { return tint < 0 ? Math.round(c * (1 + tint)) : Math.round(c * (1 - tint) + 255 * tint); }
    function h(c) { return ('0' + c.toString(16)).slice(-2).toUpperCase(); }
    return h(t(r)) + h(t(g)) + h(t(b));
  }
  function fillToHex(fill) {
    if (!fill || fill.type !== 'pattern' || fill.pattern !== 'solid') return null;
    var fg = fill.fgColor;
    if (!fg) return null;
    var hex = null;
    if (fg.argb) hex = normHex(fg.argb);
    else if (typeof fg.theme === 'number') {
      var base = THEME_PALETTE[fg.theme];
      if (base) hex = applyTint(base, fg.tint || 0);
    }
    if (!hex || NEUTRAL[hex]) return null;   // neutrale fills negeren
    return hex;
  }
  function cellText(cell) {
    if (cell == null || cell.value == null) return '';
    var v = cell.value;
    if (typeof v === 'object') {
      if (v.richText) return v.richText.map(function (p) { return p.text; }).join('').trim();
      if (v.text != null) return String(v.text).trim();
      if (v.result != null) return String(v.result).trim();
      if (v instanceof Date) return v.toISOString().slice(0, 10);
      return '';
    }
    return String(v).trim();
  }

  // Datums
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
  function monthStart(year, m) { return new Date(Date.UTC(year, m - 1, 1)); }
  function monthEnd(year, m) { return new Date(Date.UTC(year, m, 0)); }
  function isoWeekMonday(year, week) {
    var jan4 = new Date(Date.UTC(year, 0, 4));
    var day = jan4.getUTCDay() || 7;
    var w1 = new Date(jan4); w1.setUTCDate(jan4.getUTCDate() - day + 1);
    var mon = new Date(w1); mon.setUTCDate(w1.getUTCDate() + (week - 1) * 7);
    return mon;
  }
  function addDays(d, n) { var x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; }

  // ── Kolom→datum-map: weekzone (optioneel) + maandgrid ─────────────────────
  function buildColumnDateMap(ws, cfg) {
    var map = {};   // col -> { start:Date, end:Date, unit:'week'|'month', label }
    var jarenSet = {};

    // Weekzone: endCol = (endYear,endWeek); 1 col = colsPerWeek week terug naar links
    var wz = cfg.weekZone;
    if (wz && wz.enabled) {
      var endMon = isoWeekMonday(wz.endYear, wz.endWeek);
      for (var c = wz.startCol; c <= wz.endCol; c++) {
        var weeksBack = (wz.endCol - c) * (wz.colsPerWeek || 1);
        var mon = addDays(endMon, -weeksBack * 7);
        var sun = addDays(mon, 6);
        map[c] = { start: mon, end: sun, unit: 'week', label: 'wk' };
        jarenSet[mon.getUTCFullYear()] = 1;
      }
    }

    // Maandgrid: walk rij 2 labels, hoog jaar op bij elke 'jan'-reset
    var labeled = [];
    for (var cc = cfg.gridStart; cc <= cfg.gridEnd; cc++) {
      var mm = monthFromLabel(cellText(ws.getCell(2, cc)));
      // Opeenvolgende identieke maandlabels (dubbel in de 2→1-kolom-overgangszone)
      // samenvoegen — anders telt een tweede 'jan' als extra jaar.
      if (mm && !(labeled.length && labeled[labeled.length - 1].maand === mm)) {
        labeled.push({ col: cc, maand: mm });
      }
    }
    var jaar = cfg.baseYear, prev = null;
    labeled.forEach(function (e) {
      if (e.maand === 1 && prev !== null) jaar++;
      e.jaar = jaar; prev = e.maand; jarenSet[jaar] = 1;
    });
    for (var i = 0; i < labeled.length; i++) {
      var sCol = labeled[i].col;
      var eCol = (i + 1 < labeled.length) ? labeled[i + 1].col - 1 : cfg.gridEnd;
      for (var k = sCol; k <= eCol; k++) {
        map[k] = {
          start: monthStart(labeled[i].jaar, labeled[i].maand),
          end:   monthEnd(labeled[i].jaar, labeled[i].maand),
          unit: 'month', label: labeled[i].jaar + '-' + pad(labeled[i].maand)
        };
      }
    }
    return {
      map: map,
      jaren: Object.keys(jarenSet).map(Number).sort(function (a, b) { return a - b; }),
      maandKolommen: labeled.length
    };
  }

  // ── Balken bouwen uit één projectrij ───────────────────────────────────────
  function balkenVoorRij(ws, rij, colMap, disciplinesSeen, onbekendSet) {
    var cols = Object.keys(colMap).map(Number).sort(function (a, b) { return a - b; });
    var entries = [];
    cols.forEach(function (c) {
      var cell = ws.getCell(rij, c);
      var hex = fillToHex(cell.fill);
      var txt = cellText(cell);
      if (!hex && !txt) return;
      entries.push({ col: c, info: colMap[c], color: hex, notitie: txt });
    });
    entries.sort(function (a, b) { return a.info.start - b.info.start; });

    var balken = [], cur = null;
    entries.forEach(function (e) {
      var key = null;
      if (e.color) {
        var known = COLOR_MAP[e.color];
        key = known ? known.key : 'overig-' + e.color;
        if (!disciplinesSeen[key]) {
          disciplinesSeen[key] = {
            key: key,
            label: known ? known.label : 'Overig (' + e.color + ')',
            color: '#' + e.color
          };
        }
        if (!known) onbekendSet[e.color] = 1;
      }
      // Merge: zelfde discipline én aansluitend in tijd (start <= huidige eind + 1 dag)
      if (cur && key && cur.disciplineKey === key &&
          e.info.start.getTime() <= addDays(cur._end, 1).getTime()) {
        if (e.info.end > cur._end) { cur._end = e.info.end; cur.eind = iso(e.info.end); }
        if (e.notitie) cur.notitie = cur.notitie ? cur.notitie + ' · ' + e.notitie : e.notitie;
      } else {
        if (cur) balken.push(finalize(cur));
        cur = {
          disciplineKey: key,
          color: e.color ? '#' + e.color : null,
          start: iso(e.info.start), eind: iso(e.info.end),
          _end: e.info.end, unit: e.info.unit, notitie: e.notitie || ''
        };
      }
    });
    if (cur) balken.push(finalize(cur));
    return balken;
  }
  function finalize(b) { delete b._end; return b; }

  // ── Hoofd-import ───────────────────────────────────────────────────────────
  function mergeCfg(user) {
    var c = JSON.parse(JSON.stringify(DEFAULT_CFG));
    user = user || {};
    Object.keys(user).forEach(function (k) {
      if (k === 'weekZone' && user.weekZone) {
        Object.keys(user.weekZone).forEach(function (wk) { c.weekZone[wk] = user.weekZone[wk]; });
      } else { c[k] = user[k]; }
    });
    return c;
  }

  function importWorkbook(wb, userCfg) {
    var cfg = mergeCfg(userCfg);
    var ws = wb.getWorksheet(cfg.sheetName) || wb.worksheets[0];
    if (!ws) throw new Error('Sheet niet gevonden: ' + cfg.sheetName);

    var cm = buildColumnDateMap(ws, cfg);
    var disciplinesSeen = {}, onbekendSet = {}, projecten = [];
    var maxRow = ws.rowCount || ws.actualRowCount || 474;

    for (var r = 3; r <= maxRow; r++) {
      var wo = cellText(ws.getCell(r, META_COLS.wo));
      if (!wo) continue;
      projecten.push({
        wo: wo,
        klant:        cellText(ws.getCell(r, META_COLS.klant)),
        omschrijving: cellText(ws.getCell(r, META_COLS.omschrijving)),
        servnr:       cellText(ws.getCell(r, META_COLS.servnr)),
        pl:           cellText(ws.getCell(r, META_COLS.pl)),
        eng:          cellText(ws.getCell(r, META_COLS.eng)),
        wvb:          cellText(ws.getCell(r, META_COLS.wvb)),
        uren:         cellText(ws.getCell(r, META_COLS.uren)),
        opleverdatum: cellText(ws.getCell(r, META_COLS.opleverdatum)),
        rij: r,
        balken: balkenVoorRij(ws, r, cm.map, disciplinesSeen, onbekendSet)
      });
    }

    var order = Object.keys(COLOR_MAP).map(function (h) { return COLOR_MAP[h].key; });
    var disciplines = Object.keys(disciplinesSeen).map(function (k) { return disciplinesSeen[k]; })
      .sort(function (a, b) {
        var ia = order.indexOf(a.key), ib = order.indexOf(b.key);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      });

    return {
      meta: {
        sheet: cfg.sheetName, cfg: cfg, jaren: cm.jaren,
        kolommen: {
          maand: cm.maandKolommen,
          week: (cfg.weekZone.enabled ? (cfg.weekZone.endCol - cfg.weekZone.startCol + 1) : 0)
        }
      },
      disciplines: disciplines,
      projecten: projecten,
      onbekend: Object.keys(onbekendSet).map(function (h) { return { color: '#' + h }; })
    };
  }

  function importBuffer(buffer, cfg) {
    var ExcelJS = global.ExcelJS || (typeof require === 'function' ? require('exceljs') : null);
    if (!ExcelJS) return Promise.reject(new Error('ExcelJS niet geladen'));
    var wb = new ExcelJS.Workbook();
    return wb.xlsx.load(buffer).then(function () { return importWorkbook(wb, cfg); });
  }

  var API = {
    version: VERSION,
    DEFAULT_CFG: DEFAULT_CFG,
    importBuffer: importBuffer,
    importWorkbook: importWorkbook,
    _internal: { buildColumnDateMap: buildColumnDateMap, fillToHex: fillToHex, COLOR_MAP: COLOR_MAP }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  global.BFTOverallExcelIO = API;

})(typeof self !== 'undefined' ? self : this);
