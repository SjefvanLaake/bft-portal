/**
 * bft-checklist.js — BFTChecklist v0.1
 * ────────────────────────────────────────────────────────────────────────
 * Gefaseerde checklist-engine voor BFT-V2 (MachinebouwChecklist, IBN,
 * Bouwvolgordelijst). Rendert sidebar-nav + fasen + rijen en handelt
 * interactie af (afvinken/N.v.t., notities, voortgang, sequential-hint).
 *
 * ONTWERP: de engine is PRESENTATIONAL. Hij krijgt de state (checks/notes)
 * via setData() en meldt mutaties via onChange(); PERSISTENTIE (localStorage
 * nu, Graph later) en SNAPSHOT blijven in de tool. Eén opslagplek, één swap.
 *
 * Vereist: bft-tool-shell.js (BFTToolShell) voor monteur-gating/stempel,
 *          ring en toast. Degradeert als die ontbreekt.
 *
 * Eén actieve instance per pagina (inline onclick-handlers delegeren naar
 * BFTChecklist.<actie>). Datamodel:
 *   checks: { [itemId]: { status:'ok'|'nvt', monteur, ts } }
 *   notes:  { [itemId]: string }
 *   fasen:  [{ id, titel, items:[{ id, desc, ... }] }]
 * ────────────────────────────────────────────────────────────────────────
 */
const BFTChecklist = (function (global) {
  'use strict';

  let _active = null;

  /* LET OP: BFTToolShell is een top-level const → hangt NIET aan window.
     Daarom bare referentie met typeof-guard (niet global.BFTToolShell). */
  function _shell(){ return (typeof BFTToolShell !== 'undefined') ? BFTToolShell : null; }
  function esc(s){
    const sh = _shell();
    if (sh && sh.esc) return sh.esc(s);
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  const CSS_ID = 'bft-cl-css';
  function injectCss(){
    if (typeof document === 'undefined' || document.getElementById(CSS_ID)) return;
    const css = ''
      // sidebar-nav
      + '.bft-cl-navbtn{width:100%;text-align:left;display:flex;align-items:center;gap:9px;padding:8px 10px;margin-bottom:4px;border:1px solid transparent;border-radius:6px;background:transparent;cursor:pointer;transition:background .12s;}'
      + '.bft-cl-navbtn:hover{background:var(--bg2);}'
      + '.bft-cl-navbtn.active{background:rgba(232,160,0,0.10);border-color:rgba(232,160,0,0.3);}'
      + '.bft-cl-navbtn.huidig{border-color:var(--accent);}'
      + '.bft-cl-navbtn.done .bft-cl-navnum{background:var(--success);}'
      + '.bft-cl-navnum{width:22px;height:22px;border-radius:5px;background:var(--accent);color:#fff;font-family:var(--mono);font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}'
      + '.bft-cl-navnum.huidig{box-shadow:0 0 0 2px var(--accent);}'
      + '.bft-cl-navtitel{flex:1;font-size:12px;color:var(--text);line-height:1.3;}'
      + '.bft-cl-navpct{font-family:var(--mono);font-size:10px;color:var(--muted);flex-shrink:0;}'
      // fase-sectie
      + '.bft-cl-fase{background:var(--surface);border:1px solid var(--border);border-radius:8px;margin-bottom:12px;overflow:hidden;box-shadow:var(--shadow);}'
      + '.bft-cl-fase-head{padding:14px 18px;background:var(--surface2);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;cursor:pointer;user-select:none;}'
      + '.bft-cl-fase-head:hover{background:var(--bg2);}'
      + '.bft-cl-fnum{width:26px;height:26px;border-radius:5px;background:var(--accent);color:#fff;font-family:var(--mono);font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}'
      + '.bft-cl-fnum.klaar{background:var(--success);}'
      + '.bft-cl-fnum.huidig{box-shadow:0 0 0 2px var(--accent);}'
      + '.bft-cl-ftitel{font-size:13px;font-weight:600;color:var(--text);flex:1;}'
      + '.bft-cl-fprog{font-family:var(--mono);font-size:11px;color:var(--muted);}'
      + '.bft-cl-fprog.klaar{color:var(--success);font-weight:700;}'
      + '.bft-cl-fchev{font-size:11px;color:var(--muted);transition:transform .2s;}'
      + '.bft-cl-fase.inklap .bft-cl-fchev{transform:rotate(-90deg);}'
      + '.bft-cl-fase.inklap .bft-cl-fase-body{display:none;}'
      // check-tabel
      + '.bft-cl-fase-body{padding:0;}'
      + '.bft-cl-tblhead{display:grid;grid-template-columns:1fr 36px 56px 56px;padding:5px 18px;background:var(--bg2);border-bottom:1px solid var(--border);}'
      + '.bft-cl-tblhead span{font-family:var(--mono);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);text-align:center;}'
      + '.bft-cl-tblhead span:first-child{text-align:left;}'
      + '.bft-cl-row{display:grid;grid-template-columns:1fr 36px 56px 56px;align-items:center;border-bottom:1px solid var(--border);transition:background .12s;min-height:46px;}'
      + '.bft-cl-row:last-child{border-bottom:none;}'
      + '.bft-cl-row.is-ok{background:rgba(30,158,94,0.05);}'
      + '.bft-cl-row.is-nvt{background:rgba(122,132,154,0.06);}'
      + '.bft-cl-rowcontent{padding:10px 8px 10px 18px;min-width:0;}'
      + '.bft-cl-desc{font-size:12px;color:var(--text);line-height:1.5;}'
      + '.bft-cl-row.is-ok .bft-cl-desc{text-decoration:line-through;color:var(--muted);}'
      + '.bft-cl-row.is-nvt .bft-cl-desc{color:var(--muted);font-style:italic;}'
      + '.bft-cl-sub{font-family:var(--mono);font-size:10px;color:var(--muted);margin-top:2px;}'
      + '.bft-cl-stempel{font-family:var(--mono);font-size:9px;color:var(--success);margin-top:3px;display:none;}'
      + '.bft-cl-row.is-ok .bft-cl-stempel{display:block;}'
      + '.bft-cl-notebtn{display:flex;align-items:center;justify-content:center;width:36px;height:100%;min-height:46px;border:none;background:transparent;cursor:pointer;font-size:14px;color:var(--muted);transition:all .12s;}'
      + '.bft-cl-notebtn:hover{color:var(--accent-dk);background:rgba(232,160,0,0.07);}'
      + '.bft-cl-notebtn.heeft-note{color:var(--accent-dk);}'
      + '.bft-cl-chkcol{display:flex;align-items:center;justify-content:center;height:100%;min-height:46px;border-left:1px solid var(--border);}'
      + '.bft-cl-chk{width:28px;height:28px;border-radius:5px;border:1.5px solid var(--border);background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all .12s;user-select:none;color:transparent;flex-shrink:0;}'
      + '.bft-cl-chk-ok:hover{border-color:var(--success);color:var(--success);}'
      + '.bft-cl-chk-nvt:hover{border-color:var(--muted);}'
      + '.bft-cl-chk-ok.actief{background:var(--success);border-color:var(--success);color:#fff;}'
      + '.bft-cl-chk-nvt.actief{background:var(--muted);border-color:var(--muted);color:#fff;font-weight:700;}'
      + '.bft-cl-noterow{max-height:0;overflow:hidden;transition:max-height .2s;padding:0 18px;}'
      + '.bft-cl-noterow.open{max-height:120px;padding:8px 18px;}'
      + '.bft-cl-noteta{width:100%;padding:7px 10px;border:1.5px solid var(--border);border-radius:5px;font-family:var(--mono);font-size:11px;color:var(--text);background:#fff;resize:none;height:60px;outline:none;}'
      + '.bft-cl-noteta:focus{border-color:var(--accent2);}';
    const st = document.createElement('style'); st.id = CSS_ID; st.textContent = css;
    document.head.appendChild(st);
  }

  function createInstance(opts){
    /* Containers VERS opvragen bij elke render: de tool kan #fasenContainer
       opnieuw opbouwen (bv. bij monteur-wissel) → gecachte refs raken los. */
    function _fasenEl(){ return (typeof opts.fasenContainer === 'string') ? document.querySelector(opts.fasenContainer) : opts.fasenContainer; }
    function _sidebarEl(){ return (typeof opts.sidebarContainer === 'string') ? document.querySelector(opts.sidebarContainer) : opts.sidebarContainer; }
    function _ringCircle(){ return opts.ringCircle ? document.querySelector(opts.ringCircle) : null; }
    function _ringPct(){ return opts.ringPct ? document.querySelector(opts.ringPct) : null; }

    const fasen     = opts.fasen || [];
    const seq       = opts.sequential !== false;
    const itemSub   = typeof opts.itemSub  === 'function' ? opts.itemSub  : function(){ return ''; };
    const rowExtra  = typeof opts.rowExtra === 'function' ? opts.rowExtra : function(){ return ''; };
    const itemLabel = opts.itemLabel || 'Item';
    const onChange   = typeof opts.onChange   === 'function' ? opts.onChange   : function(){};
    const onProgress = typeof opts.onProgress === 'function' ? opts.onProgress : function(){};

    let checks = {}, notes = {}, activeFaseId = fasen.length ? fasen[0].id : null;

    function telFase(f){
      let done = 0, nvt = 0;
      f.items.forEach(it => { const s = checks[it.id] && checks[it.id].status; if (s === 'ok') done++; if (s === 'nvt') nvt++; });
      return { totaal: f.items.length, done, nvt };
    }
    function huidigeFaseId(){
      for (const f of fasen){ const t = telFase(f); if (t.done + t.nvt < t.totaal) return f.id; }
      return null;
    }
    function huidigeFase(){ const id = huidigeFaseId(); if (!id) return null; const f = fasen.find(x => x.id === id); return { id, titel: f ? f.titel : '' }; }
    function progress(){
      let totaal = 0, gedaan = 0;
      fasen.forEach(f => { const t = telFase(f); totaal += t.totaal; gedaan += t.done + t.nvt; });
      return { totaal, gedaan, open: totaal - gedaan, pct: totaal > 0 ? Math.round(gedaan / totaal * 100) : 0 };
    }

    function stempel(check){ const sh = _shell(); return sh ? sh.monteur.stempel(check, '✓') : ''; }

    function renderRij(it){
      const check  = checks[it.id];
      const status = (check && check.status) || '';
      const note   = notes[it.id] || '';
      const rijCls = status === 'ok' ? 'is-ok' : status === 'nvt' ? 'is-nvt' : '';
      const stamp  = stempel(check);
      const sub    = itemSub(it);
      return `
    <div class="bft-cl-row ${rijCls}" id="clrow-${it.id}">
      <div class="bft-cl-rowcontent">
        <div class="bft-cl-desc">${esc(it.desc)}${rowExtra(it)}</div>
        ${sub ? `<div class="bft-cl-sub">${esc(sub)}</div>` : ''}
        <div class="bft-cl-stempel">${stamp ? esc(stamp) : ''}</div>
      </div>
      <button class="bft-cl-notebtn ${note ? 'heeft-note' : ''}" title="Opmerking toevoegen" onclick="BFTChecklist.toggleNote('${it.id}')">✎</button>
      <div class="bft-cl-chkcol"><div class="bft-cl-chk bft-cl-chk-ok ${status === 'ok' ? 'actief' : ''}" title="Gedaan" onclick="BFTChecklist.vink('${it.id}','ok')">✓</div></div>
      <div class="bft-cl-chkcol"><div class="bft-cl-chk bft-cl-chk-nvt ${status === 'nvt' ? 'actief' : ''}" title="Niet van toepassing" onclick="BFTChecklist.vink('${it.id}','nvt')">—</div></div>
    </div>
    <div class="bft-cl-noterow ${note ? 'open' : ''}" id="clnote-${it.id}">
      <textarea class="bft-cl-noteta" id="clta-${it.id}" placeholder="Opmerking bij deze stap..." oninput="BFTChecklist.notitie('${it.id}', this.value)">${esc(note)}</textarea>
    </div>`;
    }

    function renderFase(f){
      const t = telFase(f);
      const klaar = t.totaal > 0 && t.done + t.nvt === t.totaal;
      const huidig = seq && f.id === huidigeFaseId();   /* huidige-fase-hint alleen bij sequential */
      return `
    <div class="bft-cl-fase" id="clfase-${f.id}">
      <div class="bft-cl-fase-head" onclick="BFTChecklist.toggleFase(${f.id})">
        <div class="bft-cl-fnum ${klaar ? 'klaar' : ''} ${huidig ? 'huidig' : ''}">${f.id}</div>
        <div class="bft-cl-ftitel">${esc(f.titel)}</div>
        <div class="bft-cl-fprog ${klaar ? 'klaar' : ''}">${t.done + t.nvt} / ${t.totaal}</div>
        <span class="bft-cl-fchev">▾</span>
      </div>
      <div class="bft-cl-fase-body">
        <div class="bft-cl-tblhead"><span>${esc(itemLabel)}</span><span></span><span>OK</span><span>N.v.t.</span></div>
        ${f.items.map(renderRij).join('')}
      </div>
    </div>`;
    }

    function renderSidebar(){
      const sidebarEl = _sidebarEl();
      if (!sidebarEl) return;
      const huidig = seq ? huidigeFaseId() : null;
      sidebarEl.innerHTML = fasen.map(f => {
        const t = telFase(f);
        const klaar = t.totaal > 0 && t.done + t.nvt === t.totaal;
        return `
      <button class="bft-cl-navbtn ${klaar ? 'done' : ''} ${f.id === activeFaseId ? 'active' : ''} ${f.id === huidig ? 'huidig' : ''}" onclick="BFTChecklist.scrollNaarFase(${f.id})">
        <div class="bft-cl-navnum ${f.id === huidig ? 'huidig' : ''}">${f.id}</div>
        <div class="bft-cl-navtitel">${esc(f.titel)}</div>
        <div class="bft-cl-navpct">${t.done + t.nvt}/${t.totaal}</div>
      </button>`;
      }).join('');
    }

    function pushProgress(){ const p = progress(); const sh = _shell(); if (sh) sh.setRing(_ringCircle(), _ringPct(), p.pct); onProgress(p); }

    function render(){ const fel = _fasenEl(); if (fel) fel.innerHTML = fasen.map(renderFase).join(''); renderSidebar(); pushProgress(); }

    function updateRij(id){
      const oud = document.getElementById('clrow-' + id);
      if (!oud) return;
      const fase = fasen.find(f => f.items.some(it => it.id === id));
      const item = fase && fase.items.find(it => it.id === id);
      if (!item) return;
      const tmp = document.createElement('div');
      tmp.innerHTML = renderRij(item);
      oud.replaceWith(tmp.firstElementChild);
    }

    function vink(id, modus){
      const huidig = checks[id] && checks[id].status;
      const sh = _shell();
      if (huidig !== modus && sh && !sh.monteur.eis()) return;   /* afvinken: monteur verplicht */
      if (huidig === modus) {
        delete checks[id];
      } else {
        checks[id] = { status: modus, monteur: sh ? sh.monteur.naam() : '', ts: new Date().toISOString() };
        if (seq) {
          const eersteOpen = huidigeFaseId();
          const dezeFase = fasen.find(f => f.items.some(it => it.id === id));
          if (eersteOpen && dezeFase && dezeFase.id > eersteOpen && sh) {
            const ef = fasen.find(f => f.id === eersteOpen);
            sh.toast(`Let op — fase ${eersteOpen} (${ef ? ef.titel : ''}) is nog niet afgerond`);
          }
        }
      }
      onChange();
      updateRij(id); pushProgress(); renderSidebar();
    }

    function toggleFase(id){ const el = document.getElementById('clfase-' + id); if (el) el.classList.toggle('inklap'); activeFaseId = id; }
    function scrollNaarFase(id){ activeFaseId = id; const el = document.getElementById('clfase-' + id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); renderSidebar(); }
    function toggleNote(id){ const el = document.getElementById('clnote-' + id); if (el) el.classList.toggle('open'); }
    function notitie(id, tekst){
      if (tekst.trim()) notes[id] = tekst; else delete notes[id];
      onChange();
      const btn = document.querySelector(`#clrow-${id} .bft-cl-notebtn`);
      if (btn) btn.classList.toggle('heeft-note', !!tekst.trim());
    }

    /* Programmatisch een item zetten (bv. via BFTWizard). modus: 'ok'|'nvt'|'' */
    function setStatus(id, modus, note){
      const sh = _shell();
      if (modus === 'ok' || modus === 'nvt') {
        if (sh && !sh.monteur.eis()) return;   /* monteur verplicht — nooit een nep-actor ('Wizard') stempelen */
        checks[id] = { status: modus, monteur: sh ? sh.monteur.naam() : '', ts: new Date().toISOString() };
      } else {
        delete checks[id];
      }
      if (typeof note === 'string') { if (note.trim()) notes[id] = note; else delete notes[id]; }
      onChange();
      updateRij(id); pushProgress(); renderSidebar();
    }

    const inst = {
      render,
      setData(c, n){ checks = c || {}; notes = n || {}; activeFaseId = fasen.length ? fasen[0].id : null; render(); },
      getState(){ return { checks, notes }; },
      reset(){ checks = {}; notes = {}; render(); onChange(); },
      progress, huidigeFase, setStatus,
      vink, toggleFase, scrollNaarFase, toggleNote, notitie
    };
    _active = inst;
    return inst;
  }

  return {
    version: '0.1',
    register(opts){ injectCss(); return createInstance(opts || {}); },
    /* statische delegators voor inline onclick (één actieve instance) */
    vink(id, m){ if (_active) _active.vink(id, m); },
    toggleFase(id){ if (_active) _active.toggleFase(id); },
    scrollNaarFase(id){ if (_active) _active.scrollNaarFase(id); },
    toggleNote(id){ if (_active) _active.toggleNote(id); },
    notitie(id, v){ if (_active) _active.notitie(id, v); }
  };

})(typeof self !== 'undefined' ? self : this);
