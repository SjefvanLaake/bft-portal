/**
 * bft-klanten.js — gedeelde klantenlijst (stamgegevens) + beheer
 * ────────────────────────────────────────────────────────────────────────
 * Centrale lijst van klanten, bron-of-truth voor de klant-keuze bij het
 * aanmaken van projecten. Net als bft-medewerkers.js: seed in code + custom
 * in localStorage ('bft_v2_klanten'), samengevoegd via bftAlleKlanten()
 * (custom wint op id; tombstone `_deleted` verwijdert — ook seed-entries).
 *
 * Vervang later door BFTGraph.query('BFT_Klanten') / PowerAll-relaties; het
 * relatienummer is daarbij de koppelsleutel. Eén gedeelde bron voor álle
 * tools (zie [[gedeelde-data-principe]]).
 *
 * Datamodel: { id, naam, plaats, relatienr }
 *   - relatienr = PowerAll-relatienummer (koppelsleutel go-live), nu vrij.
 * ────────────────────────────────────────────────────────────────────────
 */
const BFT_KLANTEN = [
  { id: 'kl_demo',    naam: 'Demo Klant BV',    plaats: '', relatienr: '' },
  { id: 'kl_ander',   naam: 'Ander Bedrijf NV', plaats: '', relatienr: '' },
  { id: 'kl_holding', naam: 'Klant C Holding',  plaats: '', relatienr: '' }
];

const BFT_KLANTEN_LS = 'bft_v2_klanten';

function bftCustomKlanten() {
  try { var r = localStorage.getItem(BFT_KLANTEN_LS); return r ? JSON.parse(r) : []; }
  catch (e) { return []; }
}

/* Normaliseer een klant → { id, naam, plaats, relatienr } (+ _deleted passthrough). */
function bftNormKlant(k) {
  if (!k) return k;
  return {
    id: k.id, naam: k.naam || '',
    plaats: k.plaats || '', relatienr: k.relatienr || '',
    _deleted: k._deleted
  };
}

/* Samengevoegde lijst: seed + custom (custom op id wint; tombstone verwijdert). */
function bftAlleKlanten() {
  var custom = bftCustomKlanten();
  var ids = custom.map(function (k) { return k.id; });
  var basis = BFT_KLANTEN.filter(function (k) { return ids.indexOf(k.id) === -1; });
  var live  = custom.filter(function (k) { return !k._deleted; });
  return basis.concat(live).map(bftNormKlant);
}

/* Upsert (toevoegen of bewerken). */
function bftSlaKlantOp(klant) {
  if (!klant || !klant.id) return false;
  var norm = bftNormKlant(klant);
  var custom = bftCustomKlanten().filter(function (k) { return k.id !== norm.id; });
  custom.push({ id: norm.id, naam: norm.naam, plaats: norm.plaats, relatienr: norm.relatienr });
  try { localStorage.setItem(BFT_KLANTEN_LS, JSON.stringify(custom)); return true; }
  catch (e) { return false; }
}

/* Verwijder (tombstone — werkt ook voor seed-entries). */
function bftVerwijderKlant(id) {
  if (!id) return false;
  var custom = bftCustomKlanten().filter(function (k) { return k.id !== id; });
  custom.push({ id: id, _deleted: true });
  try { localStorage.setItem(BFT_KLANTEN_LS, JSON.stringify(custom)); return true; }
  catch (e) { return false; }
}

/* Stabiel, uniek id voor een nieuwe klant. */
function bftNieuwKlantId() {
  return 'kl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

/* <option>-regels voor een <datalist>/<select> (uit de samengevoegde lijst).
   value = klantnaam (back-compat: projecten bewaren nu nog de naam). */
function bftKlantOptions() {
  return bftAlleKlanten()
    .map(function (k) { return '<option value="' + k.naam + '">' + (k.plaats || '') + '</option>'; })
    .join('');
}

/* ──────────────────────────────────────────────────────────────────────
   Beheer-modal (gedeeld) — klanten. Oproepbaar vanuit elke tool:
   BFTKlanten.openBeheer({ onChange }). Schrijft naar de gedeelde lijst
   (bft_v2_klanten); onChange laat de tool z'n keuzelijsten verversen.
   Gespiegeld op bft-medewerkers.js (bft-mw-* → bft-kl-*).
   ────────────────────────────────────────────────────────────────────── */
(function (global) {
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  var CSS_ID = 'bft-kl-css';
  function injectCss() {
    if (typeof document === 'undefined' || document.getElementById(CSS_ID)) return;
    var css = ''
      + '.bft-kl-ov{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10001;display:flex;'
      +   'align-items:center;justify-content:center;padding:20px;box-sizing:border-box;font-family:"IBM Plex Sans",system-ui,sans-serif;}'
      + '.bft-kl-modal{background:#fff;border-radius:10px;max-width:680px;width:100%;max-height:calc(100vh - 40px);'
      +   'display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3);}'
      + '.bft-kl-top{background:#000;color:#fff;padding:15px 22px;display:flex;align-items:center;gap:12px;flex:none;}'
      + '.bft-kl-top .ic{width:30px;height:30px;border-radius:50%;background:#e8a000;color:#000;font-weight:700;'
      +   'display:flex;align-items:center;justify-content:center;font-family:"IBM Plex Mono",monospace;}'
      + '.bft-kl-ttl{font-size:13px;font-weight:600;letter-spacing:.02em;font-family:"IBM Plex Mono",monospace;text-transform:uppercase;}'
      + '.bft-kl-body{padding:18px 24px;flex:1;overflow:auto;}'
      + '.bft-kl-head,.bft-kl-row{display:grid;grid-template-columns:1fr 130px 110px 34px;gap:8px;align-items:center;}'
      + '.bft-kl-head{font-family:"IBM Plex Mono",monospace;font-size:11px;color:#8a909c;text-transform:uppercase;padding:0 2px 6px;}'
      + '.bft-kl-row{padding:4px 0;}'
      + '.bft-kl-inp{padding:7px 9px;border:1px solid #c8ccd4;border-radius:6px;font-size:14px;font-family:"IBM Plex Sans",sans-serif;color:#1a1f2e;width:100%;box-sizing:border-box;}'
      + '.bft-kl-inp:focus{outline:2px solid #e8a000;outline-offset:1px;border-color:#e8a000;}'
      + '.bft-kl-del{border:1px solid #c8ccd4;background:#fff;color:#8a909c;border-radius:6px;width:30px;height:30px;cursor:pointer;font-size:16px;line-height:1;}'
      + '.bft-kl-del:hover{background:#d63030;color:#fff;border-color:#d63030;}'
      + '.bft-kl-leeg{font-family:"IBM Plex Mono",monospace;font-size:12px;color:#8a909c;padding:14px 2px;}'
      + '.bft-kl-actions{display:flex;gap:10px;align-items:center;padding:14px 22px;background:#fafbfc;border-top:1px solid #e3e6ec;flex:none;}'
      + '.bft-kl-btn{padding:9px 18px;border:1px solid #c8ccd4;border-radius:6px;background:#fff;color:#1a1f2e;cursor:pointer;'
      +   'font-size:13px;font-weight:500;font-family:"IBM Plex Sans",sans-serif;}'
      + '.bft-kl-btn:hover{background:#f1f3f6;border-color:#9ca3ad;}'
      + '.bft-kl-btn.primary{background:#e8a000;color:#000;border-color:#e8a000;margin-left:auto;}'
      + '.bft-kl-btn.add{align-self:flex-start;}';
    var st = document.createElement('style'); st.id = CSS_ID; st.textContent = css;
    document.head.appendChild(st);
  }

  function openBeheer(opts) {
    if (typeof document === 'undefined') return Promise.resolve();
    opts = opts || {};
    injectCss();
    return new Promise(function (resolve) {
      var ov = document.createElement('div'); ov.className = 'bft-kl-ov';
      var gewijzigd = false;

      function rowsHtml() {
        var list = bftAlleKlanten();
        var head = '<div class="bft-kl-head"><span>Naam</span><span>Plaats</span><span>Relatienr.</span><span></span></div>';
        if (!list.length) return head + '<p class="bft-kl-leeg">Nog geen klanten. Klik “+ Klant”.</p>';
        return head + list.map(function (k) {
          return '<div class="bft-kl-row" data-id="' + esc(k.id) + '">'
            + '<input class="bft-kl-inp" data-f="naam" type="text" value="' + esc(k.naam) + '" placeholder="Bedrijfsnaam">'
            + '<input class="bft-kl-inp" data-f="plaats" type="text" value="' + esc(k.plaats) + '" placeholder="Plaats">'
            + '<input class="bft-kl-inp" data-f="relatienr" type="text" value="' + esc(k.relatienr) + '" placeholder="PowerAll">'
            + '<button class="bft-kl-del" data-del="' + esc(k.id) + '" title="Verwijderen">×</button>'
            + '</div>';
        }).join('');
      }
      function bewaarRij(rowEl) {
        var id = rowEl.getAttribute('data-id');
        var naam = rowEl.querySelector('[data-f="naam"]').value.trim();
        if (!naam) return;   // lege naam niet opslaan
        bftSlaKlantOp({
          id: id, naam: naam,
          plaats: rowEl.querySelector('[data-f="plaats"]').value.trim(),
          relatienr: rowEl.querySelector('[data-f="relatienr"]').value.trim()
        });
        gewijzigd = true; if (typeof opts.onChange === 'function') { try { opts.onChange(); } catch (e) {} }
      }
      function bind() {
        ov.querySelectorAll('.bft-kl-row').forEach(function (row) {
          row.querySelectorAll('.bft-kl-inp').forEach(function (inp) {
            inp.addEventListener('change', function () { bewaarRij(row); });
          });
        });
        ov.querySelectorAll('.bft-kl-del').forEach(function (b) {
          b.addEventListener('click', function () {
            var id = b.getAttribute('data-del');
            var k = bftAlleKlanten().filter(function (x) { return x.id === id; })[0];
            if (global.confirm && !global.confirm('“' + (k ? k.naam : 'deze klant') + '” verwijderen uit de klantenlijst?')) return;
            bftVerwijderKlant(id);
            gewijzigd = true; if (typeof opts.onChange === 'function') { try { opts.onChange(); } catch (e) {} }
            paint();
          });
        });
      }
      function paint() { ov.querySelector('#bft-kl-list').innerHTML = rowsHtml(); bind(); }

      ov.innerHTML = ''
        + '<div class="bft-kl-modal" role="dialog" aria-modal="true">'
        +   '<div class="bft-kl-top"><span class="ic">🏢</span><span class="bft-kl-ttl">Klanten beheren</span></div>'
        +   '<div class="bft-kl-body"><div id="bft-kl-list"></div></div>'
        +   '<div class="bft-kl-actions">'
        +     '<button class="bft-kl-btn add" type="button" id="bft-kl-add">+ Klant</button>'
        +     '<button class="bft-kl-btn primary" type="button" id="bft-kl-close">Sluiten</button>'
        +   '</div>'
        + '</div>';
      document.body.appendChild(ov);
      paint();

      function close() {
        if (ov.parentNode) ov.parentNode.removeChild(ov);
        document.removeEventListener('keydown', onKey);
        resolve(gewijzigd);
      }
      function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }
      document.addEventListener('keydown', onKey);
      ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
      ov.querySelector('#bft-kl-close').addEventListener('click', close);
      ov.querySelector('#bft-kl-add').addEventListener('click', function () {
        var id = bftNieuwKlantId();
        bftSlaKlantOp({ id: id, naam: 'Nieuwe klant', plaats: '', relatienr: '' });
        gewijzigd = true; if (typeof opts.onChange === 'function') { try { opts.onChange(); } catch (e) {} }
        paint();
        var inp = ov.querySelector('.bft-kl-row[data-id="' + id + '"] [data-f="naam"]');
        if (inp) { inp.focus(); inp.select(); }
      });
    });
  }

  global.BFTKlanten = {
    alle: bftAlleKlanten,
    options: bftKlantOptions,
    opslaan: bftSlaKlantOp,
    verwijder: bftVerwijderKlant,
    nieuwId: bftNieuwKlantId,
    openBeheer: openBeheer
  };
})(typeof window !== 'undefined' ? window : this);
