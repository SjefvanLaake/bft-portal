/**
 * bft-medewerkers.js — gedeelde medewerkerslijst (stamgegevens)
 * ────────────────────────────────────────────────────────────────────────
 * Centrale lijst van PERSONEN met ROLLEN. Eén persoon kan meerdere rollen
 * vervullen (Projectleider / Engineering / WVB) — geen aparte regel per rol.
 * Gebruikt voor keuzelijsten (PL / Engineer / WVB) in NieuwProject,
 * OverallPlanning, EngeneeringPlanning, zodat namen/rollen consistent zijn.
 *
 * Vervang later door BFTGraph.query('BFT_Medewerkers'). Eén gedeelde bron voor
 * álle tools (zie [[gedeelde-data-principe]]).
 *
 * Datamodel: { id, naam, rollen:['Projectleider','Engineering','WVB'] }
 *   - Oud formaat { id, naam, discipline:'X' } wordt automatisch gemigreerd
 *     naar { rollen:['X'] } bij het lezen (en bij opslaan).
 * ────────────────────────────────────────────────────────────────────────
 */

/* Vaste rollen-set (sluit aan op de meta-kolommen PL / EN / WVB). */
var BFT_ROLLEN = ['Projectleider', 'Engineering', 'WVB'];

/* Namen afgekort naar 2-3 letters (conventie: werknemers worden zo aangeduid). */
const BFT_MEDEWERKERS = [
  { id: 'mdw_jdv', naam: 'JdV', rollen: ['Projectleider'] },
  { id: 'mdw_pja', naam: 'PJ',  rollen: ['Projectleider'] },
  { id: 'mdw_mba', naam: 'MB',  rollen: ['Projectleider'] },
  { id: 'mdw_she', naam: 'SH',  rollen: ['Engineering'] },
  { id: 'mdw_kev', naam: 'KE',  rollen: ['Engineering'] },
  { id: 'mdw_two', naam: 'TW',  rollen: ['WVB'] },
  { id: 'mdw_rde', naam: 'RD',  rollen: ['WVB'] }
];

/* ──────────────────────────────────────────────────────────────────────
   Runtime-store (mock-fase) — identiek patroon aan bft-projects.js.
   BFT_MEDEWERKERS = seed in code; toegevoegde/bewerkte personen komen in
   localStorage 'bft_v2_medewerkers'. Alles leest via bftAlleMedewerkers()
   → seed + custom samengevoegd (custom wint op id; tombstone verwijdert).
   Bij go-live: déze functies vervangen door BFTGraph.query/.create/.delete.
   Toewijzingen elders bewaren de stabiele `id`, niet de naam.
   ────────────────────────────────────────────────────────────────────── */
const BFT_MEDEWERKERS_LS = 'bft_v2_medewerkers';

/* Normaliseer een persoon naar { id, naam, rollen[] } — migreert oud `discipline`. */
function bftNormMedewerker(m) {
  if (!m) return m;
  var rollen = Array.isArray(m.rollen) ? m.rollen.slice()
             : (m.discipline ? [m.discipline] : []);
  // ontdubbel + lege weg
  rollen = rollen.filter(function (r, i) { return r && rollen.indexOf(r) === i; });
  return { id: m.id, naam: m.naam, rollen: rollen, _deleted: m._deleted };
}

function bftCustomMedewerkers() {
  try { var r = localStorage.getItem(BFT_MEDEWERKERS_LS); return r ? JSON.parse(r) : []; }
  catch (e) { return []; }
}

/* Samengevoegde lijst: seed + custom (genormaliseerd). Custom op id wint (= bewerken);
   een custom-entry met `_deleted:true` is een tombstone (= verwijderen). */
function bftAlleMedewerkers() {
  var custom = bftCustomMedewerkers();
  var ids = custom.map(function (m) { return m.id; });
  var basis = BFT_MEDEWERKERS.filter(function (m) { return ids.indexOf(m.id) === -1; });
  var live  = custom.filter(function (m) { return !m._deleted; });
  return basis.concat(live).map(bftNormMedewerker);
}

/* Rollen van één persoon (op id). */
function bftMedewerkerRollen(id) {
  var m = bftAlleMedewerkers().filter(function (x) { return x.id === id; })[0];
  return m ? m.rollen : [];
}

/* Stabiel, uniek id voor een nieuwe persoon. */
function bftNieuwMedewerkerId() {
  return 'mdw_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

/* Upsert (toevoegen of bewerken). Accepteert {rollen:[...]} of oud {discipline:'X'}. */
function bftSlaMedewerkerOp(mdw) {
  if (!mdw || !mdw.id) return false;
  var norm = bftNormMedewerker(mdw);
  var custom = bftCustomMedewerkers().filter(function (m) { return m.id !== mdw.id; });
  custom.push({ id: norm.id, naam: norm.naam, rollen: norm.rollen });
  try { localStorage.setItem(BFT_MEDEWERKERS_LS, JSON.stringify(custom)); return true; }
  catch (e) { return false; }
}

/* Verwijderen: custom-only entry valt gewoon weg; een seed-persoon krijgt een
   tombstone zodat hij uit de merge verdwijnt. */
function bftVerwijderMedewerker(id) {
  if (!id) return false;
  var custom = bftCustomMedewerkers().filter(function (m) { return m.id !== id; });
  if (BFT_MEDEWERKERS.some(function (m) { return m.id === id; })) {
    custom.push({ id: id, _deleted: true });
  }
  try { localStorage.setItem(BFT_MEDEWERKERS_LS, JSON.stringify(custom)); return true; }
  catch (e) { return false; }
}

/* <option>-regels voor een <datalist>, optioneel gefilterd op ROL.
   Toont iedereen die die rol kan (rol in rollen). Geen rol → iedereen.
   Datalist = suggestie, niet afgedwongen → externen kunnen alsnog intypen. */
function bftMedewerkerOptions(rol) {
  return bftAlleMedewerkers()
    .filter(function (m) { return !rol || m.rollen.indexOf(rol) !== -1; })
    .map(function (m) { return '<option value="' + m.naam + '">' + m.rollen.join(' · ') + '</option>'; })
    .join('');
}

/* ──────────────────────────────────────────────────────────────────────
   Beheer-modal (gedeeld) — personen + rol-vinkjes. Oproepbaar vanuit elke
   tool: BFTMedewerkers.openBeheer({ onChange }). Schrijft naar de gedeelde
   lijst (bft_v2_medewerkers); onChange laat de tool z'n datalists verversen.
   ────────────────────────────────────────────────────────────────────── */
(function (global) {
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  var CSS_ID = 'bft-mw-css';
  function injectCss() {
    if (typeof document === 'undefined' || document.getElementById(CSS_ID)) return;
    var cols = '1fr ' + BFT_ROLLEN.map(function () { return '78px'; }).join(' ') + ' 34px';
    var css = ''
      + '.bft-mw-ov{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10001;display:flex;'
      +   'align-items:center;justify-content:center;padding:20px;box-sizing:border-box;font-family:"IBM Plex Sans",system-ui,sans-serif;}'
      + '.bft-mw-modal{background:#fff;border-radius:10px;max-width:660px;width:100%;max-height:calc(100vh - 40px);'
      +   'display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3);}'
      + '.bft-mw-top{background:#000;color:#fff;padding:15px 22px;display:flex;align-items:center;gap:12px;flex:none;}'
      + '.bft-mw-top .ic{width:30px;height:30px;border-radius:50%;background:#e8a000;color:#000;font-weight:700;'
      +   'display:flex;align-items:center;justify-content:center;font-family:"IBM Plex Mono",monospace;}'
      + '.bft-mw-ttl{font-size:13px;font-weight:600;letter-spacing:.02em;font-family:"IBM Plex Mono",monospace;text-transform:uppercase;}'
      + '.bft-mw-body{padding:18px 24px;flex:1;overflow:auto;}'
      + '.bft-mw-head,.bft-mw-row{display:grid;grid-template-columns:' + cols + ';gap:8px;align-items:center;}'
      + '.bft-mw-head{font-family:"IBM Plex Mono",monospace;font-size:11px;color:#8a909c;text-transform:uppercase;padding:0 2px 6px;}'
      + '.bft-mw-head .bft-mw-rolcol{text-align:center;}'
      + '.bft-mw-row{padding:4px 0;}'
      + '.bft-mw-naam{padding:7px 9px;border:1px solid #c8ccd4;border-radius:6px;font-size:14px;font-family:"IBM Plex Sans",sans-serif;color:#1a1f2e;}'
      + '.bft-mw-naam:focus{outline:2px solid #e8a000;outline-offset:1px;border-color:#e8a000;}'
      + '.bft-mw-rolcol{display:flex;justify-content:center;}'
      + '.bft-mw-rolcol input{width:17px;height:17px;cursor:pointer;}'
      + '.bft-mw-del{border:1px solid #c8ccd4;background:#fff;color:#8a909c;border-radius:6px;width:30px;height:30px;cursor:pointer;font-size:16px;line-height:1;}'
      + '.bft-mw-del:hover{background:#d63030;color:#fff;border-color:#d63030;}'
      + '.bft-mw-leeg{font-family:"IBM Plex Mono",monospace;font-size:12px;color:#8a909c;padding:14px 2px;}'
      + '.bft-mw-actions{display:flex;gap:10px;align-items:center;padding:14px 22px;background:#fafbfc;border-top:1px solid #e3e6ec;flex:none;}'
      + '.bft-mw-btn{padding:9px 18px;border:1px solid #c8ccd4;border-radius:6px;background:#fff;color:#1a1f2e;cursor:pointer;'
      +   'font-size:13px;font-weight:500;font-family:"IBM Plex Sans",sans-serif;}'
      + '.bft-mw-btn:hover{background:#f1f3f6;border-color:#9ca3ad;}'
      + '.bft-mw-btn.primary{background:#e8a000;color:#000;border-color:#e8a000;margin-left:auto;}'
      + '.bft-mw-btn.add{align-self:flex-start;}';
    var st = document.createElement('style'); st.id = CSS_ID; st.textContent = css;
    document.head.appendChild(st);
  }

  function openBeheer(opts) {
    if (typeof document === 'undefined') return Promise.resolve();
    opts = opts || {};
    injectCss();
    return new Promise(function (resolve) {
      var ov = document.createElement('div'); ov.className = 'bft-mw-ov';
      var gewijzigd = false;

      function rowsHtml() {
        var list = bftAlleMedewerkers();
        var head = '<div class="bft-mw-head"><span>Naam</span>'
          + BFT_ROLLEN.map(function (r) { return '<span class="bft-mw-rolcol">' + esc(r) + '</span>'; }).join('')
          + '<span></span></div>';
        if (!list.length) return head + '<p class="bft-mw-leeg">Nog geen personen. Klik “+ Persoon”.</p>';
        return head + list.map(function (m) {
          return '<div class="bft-mw-row" data-id="' + esc(m.id) + '">'
            + '<input class="bft-mw-naam" type="text" value="' + esc(m.naam) + '">'
            + BFT_ROLLEN.map(function (r) {
                return '<label class="bft-mw-rolcol"><input type="checkbox" data-rol="' + esc(r) + '"' + (m.rollen.indexOf(r) !== -1 ? ' checked' : '') + '></label>';
              }).join('')
            + '<button class="bft-mw-del" data-del="' + esc(m.id) + '" title="Verwijderen">×</button>'
            + '</div>';
        }).join('');
      }
      function bewaarRij(rowEl) {
        var id = rowEl.getAttribute('data-id');
        var naam = rowEl.querySelector('.bft-mw-naam').value.trim();
        if (!naam) return;   // lege naam niet opslaan
        var rollen = [];
        rowEl.querySelectorAll('input[type=checkbox]').forEach(function (cb) { if (cb.checked) rollen.push(cb.getAttribute('data-rol')); });
        bftSlaMedewerkerOp({ id: id, naam: naam, rollen: rollen });
        gewijzigd = true; if (typeof opts.onChange === 'function') { try { opts.onChange(); } catch (e) {} }
      }
      function bind() {
        ov.querySelectorAll('.bft-mw-row').forEach(function (row) {
          row.querySelector('.bft-mw-naam').addEventListener('change', function () { bewaarRij(row); });
          row.querySelectorAll('input[type=checkbox]').forEach(function (cb) { cb.addEventListener('change', function () { bewaarRij(row); }); });
        });
        ov.querySelectorAll('.bft-mw-del').forEach(function (b) {
          b.addEventListener('click', function () {
            var id = b.getAttribute('data-del');
            var m = bftAlleMedewerkers().filter(function (x) { return x.id === id; })[0];
            if (global.confirm && !global.confirm('“' + (m ? m.naam : 'deze persoon') + '” verwijderen uit de personeelslijst?')) return;
            bftVerwijderMedewerker(id);
            gewijzigd = true; if (typeof opts.onChange === 'function') { try { opts.onChange(); } catch (e) {} }
            paint();
          });
        });
      }
      function paint() { ov.querySelector('#bft-mw-list').innerHTML = rowsHtml(); bind(); }

      ov.innerHTML = ''
        + '<div class="bft-mw-modal" role="dialog" aria-modal="true">'
        +   '<div class="bft-mw-top"><span class="ic">👥</span><span class="bft-mw-ttl">Medewerkers beheren</span></div>'
        +   '<div class="bft-mw-body"><div id="bft-mw-list"></div></div>'
        +   '<div class="bft-mw-actions">'
        +     '<button class="bft-mw-btn add" type="button" id="bft-mw-add">+ Persoon</button>'
        +     '<button class="bft-mw-btn primary" type="button" id="bft-mw-close">Sluiten</button>'
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
      ov.querySelector('#bft-mw-close').addEventListener('click', close);
      ov.querySelector('#bft-mw-add').addEventListener('click', function () {
        var id = bftNieuwMedewerkerId();
        bftSlaMedewerkerOp({ id: id, naam: 'Nieuw', rollen: [] });
        gewijzigd = true; if (typeof opts.onChange === 'function') { try { opts.onChange(); } catch (e) {} }
        paint();
        var inp = ov.querySelector('.bft-mw-row[data-id="' + id + '"] .bft-mw-naam');
        if (inp) { inp.focus(); inp.select(); }
      });
    });
  }

  global.BFTMedewerkers = {
    ROLLEN: BFT_ROLLEN,
    alle: bftAlleMedewerkers,
    options: bftMedewerkerOptions,
    opslaan: bftSlaMedewerkerOp,
    verwijder: bftVerwijderMedewerker,
    openBeheer: openBeheer
  };
})(typeof window !== 'undefined' ? window : this);
