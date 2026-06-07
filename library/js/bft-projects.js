/**
 * bft-projects.js — gedeelde projectenlijst voor alle BFT-tools
 * Vervang later door BFTGraph.query('BFT_Projecten')
 *
 * plannerUrl (optioneel): volledige deep-link naar het Planner-bord van dit
 *   project. PLAK de URL uit Planner's eigen "Koppeling naar plan kopiëren" —
 *   construeer hem NIET zelf (Microsoft migreert Planner-URL's). Leeg = de
 *   "Taken in Planner"-knop verschijnt niet.
 */
/* GEEN mockup-data. Projecten komen bij go-live uit PowerAll ERP — bron-swap:
   vervang BFT_PROJECTEN / bftAlleProjecten() door BFTGraph/PowerAll.query().
   Tot dan worden projecten via "Nieuw project" toegevoegd (runtime-store
   bft_v2_projecten). F4-vorm (referenties op stabiele id; naam afgeleid):
     { id:'<nr>_<TYPE>', projectnr:'201270', servicenr:'201224', naam:'BFMR2000EK',
       klantId:'kl_xxx', klant:'(afgeleid)',
       plId:'mdw_xxx', pl:'', engId:'mdw_xxx', eng:'', wvbId:'', wvb:'',
       verantwoordelijkeId:'mdw_xxx', verantwoordelijke:'',
       machineType:'BFMR2000EK', oplevering:'2026-08-15', aangemaakt:'2026-01-10',
       status:'actief', plannerUrl:'' } */
const BFT_PROJECTEN = [];

/* ──────────────────────────────────────────────────────────────────────
   Runtime-store (mock-fase): BFT_PROJECTEN = seed in code; nieuw aangemaakte
   projecten komen in localStorage 'bft_v2_projecten'. Alle tools lezen via
   bftAlleProjecten() → seed + custom samengevoegd (custom overschrijft op id).
   Eén create-pad dat vandaag werkt zonder backend. Bij go-live: deze twee
   functies vervangen door BFTGraph.query / .create.
   ────────────────────────────────────────────────────────────────────── */
const BFT_PROJECTEN_LS = 'bft_v2_projecten';

function bftCustomProjecten() {
  try { const r = localStorage.getItem(BFT_PROJECTEN_LS); return r ? JSON.parse(r) : []; }
  catch (e) { return []; }
}

/* ── Referentie-resolvers (id ↔ naam) ──────────────────────────────────
   F4: project verwijst naar klant/personen via STABIELE id; de naam is
   afgeleid (weergave). Hierdoor werkt hernoemen in beheer automatisch door.
   Defensief + guarded (bronnen kunnen later geladen zijn). */
function _bftKlantNaam(id) {
  if (!id || typeof bftAlleKlanten !== 'function') return '';
  try { var k = bftAlleKlanten().filter(function (x) { return x.id === id; })[0]; return k ? k.naam : ''; }
  catch (e) { return ''; }
}
function _bftKlantId(naam) {
  if (!naam || typeof bftAlleKlanten !== 'function') return '';
  try { var h = String(naam).trim().toLowerCase();
    var k = bftAlleKlanten().filter(function (x) { return (x.naam || '').trim().toLowerCase() === h; })[0];
    return k ? k.id : ''; } catch (e) { return ''; }
}
function _bftMdwNaam(id) {
  if (!id || typeof bftAlleMedewerkers !== 'function') return '';
  try { var m = bftAlleMedewerkers().filter(function (x) { return x.id === id; })[0]; return m ? m.naam : ''; }
  catch (e) { return ''; }
}
function _bftMdwId(naam) {
  if (!naam || typeof bftAlleMedewerkers !== 'function') return '';
  try { var h = String(naam).trim().toLowerCase();
    var m = bftAlleMedewerkers().filter(function (x) { return (x.naam || '').trim().toLowerCase() === h; })[0];
    return m ? m.id : ''; } catch (e) { return ''; }
}

/* Normaliseer een project: referenties op id leidend, naam afgeleid.
   - id aanwezig → naam (her)afleiden uit de bron (rename-safe).
   - alleen legacy naam → id afleiden (migratie naar id, op de read).
   - 'verantwoordelijke' ontbreekt → default de engineer (id + naam). */
function bftNormProject(p) {
  if (!p) return p;
  // Klant
  if (p.klantId) { var kn = _bftKlantNaam(p.klantId); if (kn) p.klant = kn; }
  else if (p.klant) { p.klantId = _bftKlantId(p.klant) || ''; }
  // Persoonsrollen
  ['pl', 'eng', 'wvb', 'verantwoordelijke'].forEach(function (rol) {
    var idKey = rol + 'Id';
    if (p[idKey]) { var nm = _bftMdwNaam(p[idKey]); if (nm) p[rol] = nm; }
    else if (p[rol]) { p[idKey] = _bftMdwId(p[rol]) || ''; }
  });
  // Verantwoordelijke default = engineer (id én naam)
  if ((p.verantwoordelijke == null || p.verantwoordelijke === '') && !p.verantwoordelijkeId) {
    p.verantwoordelijke = p.eng || '';
    p.verantwoordelijkeId = p.engId || '';
  }
  return p;
}

/* Samengevoegde lijst: seed + custom (custom op id wint, bv. bij bewerken;
   tombstone `_deleted` verwijdert — ook seed-projecten). */
function bftAlleProjecten() {
  const custom = bftCustomProjecten();
  const ids = custom.map(p => p.id);
  const basis = BFT_PROJECTEN.filter(p => ids.indexOf(p.id) === -1);
  const live  = custom.filter(p => !p._deleted);
  return basis.concat(live).map(bftNormProject);
}

/* Upsert een (custom) project in de runtime-store */
function bftSlaProjectOp(proj) {
  if (!proj || !proj.id) return false;
  const custom = bftCustomProjecten().filter(p => p.id !== proj.id);
  custom.push(proj);
  try { localStorage.setItem(BFT_PROJECTEN_LS, JSON.stringify(custom)); return true; }
  catch (e) { return false; }
}

/* Verwijder een project (tombstone — werkt ook voor seed-projecten). */
function bftVerwijderProject(id) {
  if (!id) return false;
  const custom = bftCustomProjecten().filter(p => p.id !== id);
  custom.push({ id: id, _deleted: true });
  try { localStorage.setItem(BFT_PROJECTEN_LS, JSON.stringify(custom)); return true; }
  catch (e) { return false; }
}

/* Genereer <option>-elementen voor een <select> (uit de samengevoegde lijst) */
function bftProjectOptions(gekozenId) {
  return '<option value="">— Kies project —</option>' +
    bftAlleProjecten().map(p =>
      `<option value="${p.id}" ${p.id === gekozenId ? 'selected' : ''}>${p.projectnr} · ${p.naam}</option>`
    ).join('');
}

/* ──────────────────────────────────────────────────────────────────────
   Beheer-modal (gedeeld) — projecten verwijderen. BFTProjecten.openBeheer
   ({ onChange }). Lijst (lezen) + verwijderen; aanmaken/bewerken blijft
   NieuwProject. Gespiegeld op bft-klanten.js (bft-pr-*).
   ────────────────────────────────────────────────────────────────────── */
(function (global) {
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  var CSS_ID = 'bft-pr-css';
  function injectCss() {
    if (typeof document === 'undefined' || document.getElementById(CSS_ID)) return;
    var css = ''
      + '.bft-pr-ov{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10001;display:flex;'
      +   'align-items:center;justify-content:center;padding:20px;box-sizing:border-box;font-family:"IBM Plex Sans",system-ui,sans-serif;}'
      + '.bft-pr-modal{background:#fff;border-radius:10px;max-width:720px;width:100%;max-height:calc(100vh - 40px);'
      +   'display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3);}'
      + '.bft-pr-top{background:#000;color:#fff;padding:15px 22px;display:flex;align-items:center;gap:12px;flex:none;}'
      + '.bft-pr-top .ic{width:30px;height:30px;border-radius:50%;background:#e8a000;color:#000;font-weight:700;'
      +   'display:flex;align-items:center;justify-content:center;font-family:"IBM Plex Mono",monospace;}'
      + '.bft-pr-ttl{font-size:13px;font-weight:600;letter-spacing:.02em;font-family:"IBM Plex Mono",monospace;text-transform:uppercase;}'
      + '.bft-pr-body{padding:8px 24px 18px;flex:1;overflow:auto;}'
      + '.bft-pr-head,.bft-pr-row{display:grid;grid-template-columns:78px 1fr 1fr 64px 34px;gap:10px;align-items:center;}'
      + '.bft-pr-head{font-family:"IBM Plex Mono",monospace;font-size:11px;color:#8a909c;text-transform:uppercase;padding:8px 2px 6px;position:sticky;top:0;background:#fff;}'
      + '.bft-pr-row{padding:7px 2px;border-top:1px solid #eef0f4;font-size:13px;color:#1a1f2e;}'
      + '.bft-pr-row .nr{font-family:"IBM Plex Mono",monospace;color:#3d4558;}'
      + '.bft-pr-row .st{font-family:"IBM Plex Mono",monospace;font-size:10px;color:#8a909c;text-transform:uppercase;}'
      + '.bft-pr-del{border:1px solid #c8ccd4;background:#fff;color:#8a909c;border-radius:6px;width:30px;height:30px;cursor:pointer;font-size:16px;line-height:1;}'
      + '.bft-pr-del:hover{background:#d63030;color:#fff;border-color:#d63030;}'
      + '.bft-pr-leeg{font-family:"IBM Plex Mono",monospace;font-size:12px;color:#8a909c;padding:14px 2px;}'
      + '.bft-pr-actions{display:flex;gap:10px;align-items:center;padding:14px 22px;background:#fafbfc;border-top:1px solid #e3e6ec;flex:none;}'
      + '.bft-pr-btn{padding:9px 18px;border:1px solid #c8ccd4;border-radius:6px;background:#fff;color:#1a1f2e;cursor:pointer;'
      +   'font-size:13px;font-weight:500;font-family:"IBM Plex Sans",sans-serif;}'
      + '.bft-pr-btn.primary{background:#e8a000;color:#000;border-color:#e8a000;margin-left:auto;}';
    var st = document.createElement('style'); st.id = CSS_ID; st.textContent = css;
    document.head.appendChild(st);
  }

  function openBeheer(opts) {
    if (typeof document === 'undefined') return Promise.resolve();
    opts = opts || {};
    injectCss();
    return new Promise(function (resolve) {
      var ov = document.createElement('div'); ov.className = 'bft-pr-ov';
      var gewijzigd = false;

      function rowsHtml() {
        var list = bftAlleProjecten();
        var head = '<div class="bft-pr-head"><span>WO-nr</span><span>Naam</span><span>Klant</span><span>Status</span><span></span></div>';
        if (!list.length) return head + '<p class="bft-pr-leeg">Nog geen projecten.</p>';
        return head + list.map(function (p) {
          return '<div class="bft-pr-row" data-id="' + esc(p.id) + '">'
            + '<span class="nr">' + esc(p.projectnr || '') + '</span>'
            + '<span>' + esc(p.naam || '') + '</span>'
            + '<span>' + esc(p.klant || '') + '</span>'
            + '<span class="st">' + esc(p.status || '') + '</span>'
            + '<button class="bft-pr-del" data-del="' + esc(p.id) + '" title="Verwijderen">×</button>'
            + '</div>';
        }).join('');
      }
      function bind() {
        ov.querySelectorAll('.bft-pr-del').forEach(function (b) {
          b.addEventListener('click', function () {
            var id = b.getAttribute('data-del');
            var p = bftAlleProjecten().filter(function (x) { return x.id === id; })[0];
            if (global.confirm && !global.confirm('Project “' + (p ? (p.projectnr + ' · ' + p.naam) : id) + '” verwijderen?\n\nDe planning van dit project blijft staan tot je het daar ook verwijdert.')) return;
            bftVerwijderProject(id);
            gewijzigd = true; if (typeof opts.onChange === 'function') { try { opts.onChange(); } catch (e) {} }
            paint();
          });
        });
      }
      function paint() { ov.querySelector('#bft-pr-list').innerHTML = rowsHtml(); bind(); }

      ov.innerHTML = ''
        + '<div class="bft-pr-modal" role="dialog" aria-modal="true">'
        +   '<div class="bft-pr-top"><span class="ic">📋</span><span class="bft-pr-ttl">Projecten beheren</span></div>'
        +   '<div class="bft-pr-body"><div id="bft-pr-list"></div></div>'
        +   '<div class="bft-pr-actions">'
        +     '<span style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;color:#8a909c">Aanmaken/bewerken via “Nieuw project”.</span>'
        +     '<button class="bft-pr-btn primary" type="button" id="bft-pr-close">Sluiten</button>'
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
      ov.querySelector('#bft-pr-close').addEventListener('click', close);
    });
  }

  global.BFTProjecten = {
    alle: bftAlleProjecten,
    opslaan: bftSlaProjectOp,
    verwijder: bftVerwijderProject,
    options: bftProjectOptions,
    openBeheer: openBeheer
  };
})(typeof window !== 'undefined' ? window : this);
