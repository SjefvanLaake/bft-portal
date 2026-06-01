/**
 * bft-tool-shell.js — BFTToolShell v0.1
 * ────────────────────────────────────────────────────────────────────────
 * Gedeelde tool-shell voor BFT-V2. Bundelt de scaffolding die in ELKE tool
 * identiek is, zodat een fix/feature één plek raakt i.p.v. ~10:
 *   - project-resolutie (?project=, select vullen, lookup)
 *   - backend-init (BFTAuth + BFTGraph; degradeert stil naar mock)
 *   - monteur-beheer (balk, gating/eis, stempel, persistentie, auth)
 *   - voortgangsring + mock-banner + gedeelde toast + esc
 *
 * Optionele afhankelijkheden (degradeert als ze ontbreken):
 *   bft-projects.js (BFT_PROJECTEN/bftProjectOptions), bft-auth.js, bft-graph.js
 *
 * Conventies die de module oplegt:
 *   - de monteur-balk gebruikt vaste ids #bft-monteur-input en #bft-monteur-warn
 *   - de tool registreert BFTToolShell.monteur.onChange(fn) om te herrenderen
 *   - de tool heeft (optioneel) een #toast element; anders maakt de module er een
 *   - de tool heeft een .mock-banner CSS-regel (in alle BFT-tools aanwezig)
 * ────────────────────────────────────────────────────────────────────────
 */
const BFTToolShell = (function (global) {
  'use strict';

  const RING_OMTREK = 106.8;
  const LS_MONTEUR  = 'bft_v2_monteur';
  const ID_INPUT    = 'bft-monteur-input';
  const ID_WARN     = 'bft-monteur-warn';

  let _monteur = '';
  let _onMonteurChange = null;

  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ── CSS eenmalig injecteren (module-eigen klassen) ── */
  const CSS_ID = 'bft-shell-css';
  function injectCss(){
    if (typeof document === 'undefined' || document.getElementById(CSS_ID)) return;
    const css = ''
      + '.bft-monteur{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;gap:14px;box-shadow:var(--shadow);}'
      + '.bft-mont-avatar{width:36px;height:36px;border-radius:50%;background:var(--accent);color:#fff;font-family:var(--mono);font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}'
      + '.bft-mont-avatar.leeg{background:var(--border2);color:var(--muted);}'
      + '.bft-mont-info{flex:1;}'
      + '.bft-mont-naam{font-size:13px;font-weight:600;color:var(--text);}'
      + '.bft-mont-sub{font-family:var(--mono);font-size:10px;color:var(--muted);}'
      + '.bft-mont-input{flex:1;padding:8px 10px;border:1.5px solid var(--accent);border-radius:5px;font-family:var(--mono);font-size:12px;color:var(--text);background:#fff;outline:none;}'
      + '.bft-warn{background:rgba(232,160,0,0.08);border:1px solid rgba(232,160,0,0.3);border-radius:6px;padding:10px 16px;margin-bottom:16px;font-family:var(--mono);font-size:11px;color:var(--accent-dk);display:none;}'
      + '.bft-warn.zichtbaar{display:block;}'
      + '.bft-toast{position:fixed;bottom:70px;left:50%;transform:translateX(-50%);background:var(--text);color:#fff;padding:11px 22px;border-radius:6px;font-family:var(--mono);font-size:12px;box-shadow:var(--shadow-md);opacity:0;pointer-events:none;transition:opacity .2s;z-index:1000;}'
      + '.bft-toast.show{opacity:1;}';
    const st = document.createElement('style'); st.id = CSS_ID; st.textContent = css;
    document.head.appendChild(st);
  }

  /* ── Toast: hergebruik tool-eigen #toast, anders module-eigen ── */
  function toast(msg){
    let t = document.getElementById('toast') || document.getElementById('bft-toast');
    if (!t){ injectCss(); t = document.createElement('div'); t.id = 'bft-toast'; t.className = 'bft-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ── Project-resolutie ──
     LET OP: BFT_PROJECTEN/BFTAuth/BFTGraph zijn top-level `const` in hun scripts
     en hangen dus NIET aan window. Daarom bare referenties met typeof-guard. */
  function _projecten(){ return (typeof BFT_PROJECTEN !== 'undefined') ? BFT_PROJECTEN : []; }

  function vulSelect(selectEl, gekozenId){
    if (!selectEl) return;
    if (typeof bftProjectOptions === 'function') {
      selectEl.innerHTML = bftProjectOptions(gekozenId || '');
    } else {
      selectEl.innerHTML = '<option value="">— Kies project —</option>'
        + _projecten().map(p =>
            `<option value="${esc(p.id)}"${p.id === gekozenId ? ' selected' : ''}>${esc(p.projectnr)} · ${esc(p.naam)}</option>`).join('');
    }
  }
  function leesParam(){ return new URLSearchParams(global.location.search).get('project'); }
  function getProject(id){ return _projecten().find(p => p.id === id) || null; }

  /* ── Backend-init (auth → graph); stil terug op mock ── */
  function initBackend(){
    const auth = (typeof BFTAuth !== 'undefined') ? BFTAuth : null;
    if (!(auth && auth.isConfigured && auth.isConfigured())) return Promise.resolve({ ready: false });
    return auth.init()
      .then(() => { const g = (typeof BFTGraph !== 'undefined') ? BFTGraph : null; return (g && g.init) ? g.init() : null; })
      .then(() => {
        const ready = !!(auth.isReady && auth.isReady());
        if (ready) {
          const u = auth.getUser && auth.getUser();
          if (u && u.naam) { _monteur = u.naam; if (_onMonteurChange) _onMonteurChange(_monteur); }
        }
        return { ready };
      })
      .catch(() => ({ ready: false }));
  }

  function mockBanner(){
    return '<div class="mock-banner">⚠ Mock-modus — wijzigingen opgeslagen in browser. Na IT App Registration → automatisch naar SharePoint.</div>';
  }

  function setRing(circleEl, pctEl, pct){
    if (circleEl) circleEl.style.strokeDashoffset = RING_OMTREK - (RING_OMTREK * pct / 100);
    if (pctEl) pctEl.textContent = pct + '%';
  }

  /* ── Monteur ── */
  const monteur = {
    onChange(fn){ _onMonteurChange = fn; },
    laad(){
      const auth = (typeof BFTAuth !== 'undefined') ? BFTAuth : null;
      if (auth && auth.isReady && auth.isReady()) {
        const u = auth.getUser && auth.getUser();
        _monteur = (u && u.naam) || '';
      } else {
        _monteur = localStorage.getItem(LS_MONTEUR) || '';
      }
      return _monteur;
    },
    naam(){ return _monteur; },
    set(naam){
      _monteur = (naam || '').trim();
      if (_monteur) localStorage.setItem(LS_MONTEUR, _monteur);
      if (_onMonteurChange) _onMonteurChange(_monteur);
    },
    bevestig(){
      const inp = document.getElementById(ID_INPUT);
      if (!inp) return;
      const n = inp.value.trim();
      if (!n) { inp.focus(); return; }
      monteur.set(n);
    },
    wissel(){ monteur.set(''); },
    eis(){
      if (_monteur) return true;
      const inp = document.getElementById(ID_INPUT);
      if (inp) { inp.focus(); inp.style.borderColor = 'var(--danger)'; setTimeout(() => { inp.style.borderColor = ''; }, 1500); }
      const w = document.getElementById(ID_WARN); if (w) w.classList.add('zichtbaar');
      toast('Vul eerst een monteur in');
      return false;
    },
    stempel(rec, prefix){
      if (!rec || !rec.monteur) return '';
      const ts = rec.ts ? new Date(rec.ts).toLocaleString('nl-NL', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '';
      return `${prefix} ${rec.monteur}${ts ? ' · ' + ts : ''}`;
    },
    renderBalk(){
      injectCss();
      let balk;
      if (_monteur) {
        const ini = _monteur.trim().split(/\s+/).map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
        balk = `
    <div class="bft-monteur">
      <div class="bft-mont-avatar">${esc(ini)}</div>
      <div class="bft-mont-info">
        <div class="bft-mont-naam">${esc(_monteur)}</div>
        <div class="bft-mont-sub">Actieve monteur — stempel wordt gezet bij afvinken</div>
      </div>
      <button class="bf-btn bf-btn-ghost" style="font-size:11px" onclick="BFTToolShell.monteur.wissel()">Wissel</button>
    </div>`;
      } else {
        balk = `
    <div class="bft-monteur">
      <div class="bft-mont-avatar leeg">?</div>
      <input class="bft-mont-input" id="${ID_INPUT}" type="text"
        placeholder="Vul naam monteur in voor je begint..." value=""
        onkeydown="if(event.key==='Enter')BFTToolShell.monteur.bevestig()">
      <button class="bf-btn bf-btn-primary" style="font-size:11px" onclick="BFTToolShell.monteur.bevestig()">Bevestigen</button>
    </div>`;
      }
      const warn = `
    <div class="bft-warn ${_monteur ? '' : 'zichtbaar'}" id="${ID_WARN}">
      ⚠ Geen monteur actief — vul naam in voor je begint met afvinken.
    </div>`;
      return balk + warn;
    }
  };

  return { vulSelect, leesParam, getProject, initBackend, mockBanner, setRing, toast, esc, monteur };

})(typeof self !== 'undefined' ? self : this);
