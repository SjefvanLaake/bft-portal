/* ════════════════════════════════════════════════════════════════════
   BFT WIZARD - generieke wizard voor checklist/invul-tools
   ────────────────────────────────────────────────────────────────────
   INTEGRATIE (per tool):
     1. In <head>:
        <script src="../library/js/bft-wizard.js" defer></script>
     2. Aan einde van tool-script:
        BFTWizard.register({
          name: 'Naam van Tool',                              // verplicht
          getItems: function(){                               // verplicht
            // return [{id, label, sub?, currentStatus}, ...]
            // currentStatus: 'gedaan' | 'nvt' | 'open'
          },
          setStatus: function(id, status){                    // verplicht
            // status: 'gedaan' | 'nvt' | 'open' (= clear)
            // schrijf naar tool-state + save + re-render
          },
          onComplete: function(){}                            // optioneel
        });

   GEDRAG:
     - Wizard slaat alle items met currentStatus !== 'open' over.
     - Toont alleen vragen die nog niet beantwoord zijn.
     - Wizard-knop verschijnt automatisch rechts in de zwarte .bf-header.
     - Bij geen openstaande items: "Alles is al beantwoord" melding.

   REQUIREMENTS:
     - Tool moet een <header class="bf-header"> hebben (uit library-CSS).
     - Items moeten data-driven zijn: één bron van waarheid in tool.
   ════════════════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  // ── Injecteer CSS één keer ───────────────────────────────────────
  var css = ''
    + '.bft-wiz-host{display:flex;align-items:center;gap:14px;margin-left:auto;}'
    + '.bft-wiz-btn-launch{display:inline-flex;align-items:center;gap:6px;flex:none;'
    +   'background:rgba(232,160,0,0.15);border:1px solid rgba(232,160,0,0.4);'
    +   'color:var(--accent);font-family:var(--mono);font-size:12px;font-weight:600;'
    +   'padding:6px 14px;border-radius:4px;cursor:pointer;transition:all .15s;'
    +   'white-space:nowrap;}'
    + '.bft-wiz-btn-launch:hover{background:rgba(232,160,0,0.25);}'
    + '.bft-wiz-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);'
    +   'z-index:9999;display:none;align-items:center;justify-content:center;padding:20px;}'
    + '.bft-wiz-overlay.open{display:flex;}'
    + '.bft-wiz-modal{background:#fff;border-radius:10px;max-width:1100px;width:100%;'
    +   'min-height:520px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;'
    +   'box-shadow:0 20px 60px rgba(0,0,0,0.3);}'
    + '.bft-wiz-bar{height:4px;background:#eef0f3;position:relative;}'
    + '.bft-wiz-bar-fill{height:100%;background:#e8a000;transition:width .25s;}'
    + '.bft-wiz-top{display:flex;align-items:center;justify-content:space-between;'
    +   'padding:14px 18px;border-bottom:1px solid #dde1e8;}'
    + '.bft-wiz-top-title{font-family:"IBM Plex Mono",monospace;font-size:11px;'
    +   'color:#7a849a;letter-spacing:0.8px;text-transform:uppercase;}'
    + '.bft-wiz-counter{font-family:"IBM Plex Mono",monospace;font-size:11px;color:#7a849a;}'
    + '.bft-wiz-close{background:none;border:none;font-size:22px;color:#7a849a;'
    +   'cursor:pointer;line-height:1;padding:0 4px;}'
    + '.bft-wiz-close:hover{color:#1a1f2e;}'
    + '.bft-wiz-body{padding:32px;flex:1;overflow-y:auto;}'
    + '.bft-wiz-context{font-family:"IBM Plex Mono",monospace;font-size:11px;'
    +   'color:#7a849a;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:8px;}'
    + '.bft-wiz-id{font-family:"IBM Plex Mono",monospace;font-size:10px;color:#b87a00;'
    +   'background:rgba(232,160,0,0.10);padding:2px 7px;border-radius:3px;'
    +   'display:inline-block;margin-bottom:10px;}'
    + '.bft-wiz-question{font-size:19px;line-height:1.45;color:#1a1f2e;'
    +   'font-weight:500;margin-bottom:8px;}'
    + '.bft-wiz-current{margin-top:14px;font-size:12px;color:#7a849a;}'
    + '.bft-wiz-current strong{color:#1a1f2e;font-weight:600;}'
    + '.bft-wiz-choices{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;'
    +   'padding:0 24px 18px;}'
    + '@media(max-width:520px){.bft-wiz-choices{grid-template-columns:1fr;}}'
    + '.bft-wiz-choice{border:2px solid #dde1e8;background:#fff;border-radius:8px;'
    +   'padding:22px 14px;font-family:"IBM Plex Sans",sans-serif;font-size:14px;'
    +   'font-weight:600;cursor:pointer;transition:all .15s;display:flex;'
    +   'flex-direction:column;align-items:center;gap:6px;color:#1a1f2e;}'
    + '.bft-wiz-choice:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.1);}'
    + '.bft-wiz-choice .ico{font-size:24px;}'
    + '.bft-wiz-choice.done{border-color:#1e9e5e;}'
    + '.bft-wiz-choice.done:hover,.bft-wiz-choice.done.active{background:#1e9e5e;color:#fff;}'
    + '.bft-wiz-choice.nvt{border-color:#7a849a;}'
    + '.bft-wiz-choice.nvt:hover,.bft-wiz-choice.nvt.active{background:#7a849a;color:#fff;}'
    + '.bft-wiz-choice.open{border-color:#d63030;}'
    + '.bft-wiz-choice.open:hover,.bft-wiz-choice.open.active{background:#d63030;color:#fff;}'
    + '.bft-wiz-nav{display:flex;justify-content:space-between;align-items:center;'
    +   'padding:12px 18px;border-top:1px solid #dde1e8;background:#f8f9fa;}'
    + '.bft-wiz-nav-btn{background:#fff;border:1px solid #c8cdd8;color:#3d4558;'
    +   'font-family:"IBM Plex Sans",sans-serif;font-size:12px;padding:7px 14px;'
    +   'border-radius:5px;cursor:pointer;}'
    + '.bft-wiz-nav-btn:hover:not(:disabled){border-color:#1a1f2e;color:#1a1f2e;}'
    + '.bft-wiz-nav-btn:disabled{opacity:0.4;cursor:not-allowed;}'
    + '.bft-wiz-done-msg{text-align:center;padding:30px 20px;}'
    + '.bft-wiz-done-msg .ico{font-size:48px;margin-bottom:14px;}'
    + '.bft-wiz-done-msg h3{font-size:18px;color:#1a1f2e;margin-bottom:6px;}'
    + '.bft-wiz-done-msg p{font-size:13px;color:#7a849a;}'
    /* ── Form-mode (registerForm) ── */
    + '.bft-wiz-form-area{padding:0 24px 18px;display:none;}'
    + '.bft-wiz-form-area.active{display:block;}'
    + '.bft-wiz-form-textarea{width:100%;border:1.5px solid #dde1e8;border-radius:6px;'
    +   'font-family:"IBM Plex Sans",sans-serif;font-size:14px;padding:11px 13px;'
    +   'min-height:120px;resize:vertical;outline:none;color:#1a1f2e;line-height:1.5;'
    +   'box-sizing:border-box;}'
    + '.bft-wiz-form-textarea:focus{border-color:#e8a000;box-shadow:0 0 0 3px rgba(232,160,0,0.12);}'
    + '.bft-wiz-scale-row{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;'
    +   'margin-bottom:6px;}'
    + '.bft-wiz-scale-btn{height:44px;border:1.5px solid #c8cdd8;background:#fff;'
    +   'color:#3d4558;font-family:"IBM Plex Mono",monospace;font-size:15px;font-weight:600;'
    +   'border-radius:6px;cursor:pointer;transition:all .15s;}'
    + '.bft-wiz-scale-btn:hover{border-color:#e8a000;color:#e8a000;}'
    + '.bft-wiz-scale-btn.sel{background:#e8a000;border-color:#e8a000;color:#000;}'
    + '.bft-wiz-scale-labels{display:flex;justify-content:space-between;font-size:10px;'
    +   'color:#7a849a;font-family:"IBM Plex Mono",monospace;margin-bottom:12px;'
    +   'text-transform:uppercase;letter-spacing:0.4px;}'
    + '.bft-wiz-scale-note{margin-top:10px;}'
    + '.bft-wiz-form-actions{display:flex;gap:8px;justify-content:flex-end;'
    +   'padding:10px 24px 0;flex-wrap:wrap;}'
    + '.bft-wiz-act{border:1px solid #c8cdd8;background:#fff;color:#3d4558;'
    +   'font-family:"IBM Plex Sans",sans-serif;font-size:12px;font-weight:600;'
    +   'padding:9px 16px;border-radius:5px;cursor:pointer;transition:all .15s;}'
    + '.bft-wiz-act:hover:not(:disabled){border-color:#1a1f2e;color:#1a1f2e;}'
    + '.bft-wiz-act:disabled{opacity:0.4;cursor:not-allowed;}'
    + '.bft-wiz-act.prim{background:#e8a000;border-color:#e8a000;color:#000;}'
    + '.bft-wiz-act.prim:hover:not(:disabled){background:#b87a00;border-color:#b87a00;color:#fff;}'
    + '.bft-wiz-act.nvt{color:#7a849a;}'
    /* ── Flow-mode extra controls ── */
    + '.bft-wiz-form-input{width:100%;border:1.5px solid #dde1e8;border-radius:6px;'
    +   'font-family:"IBM Plex Sans",sans-serif;font-size:14px;padding:11px 13px;'
    +   'outline:none;color:#1a1f2e;background:#fff;box-sizing:border-box;}'
    + '.bft-wiz-form-input:focus{border-color:#e8a000;box-shadow:0 0 0 3px rgba(232,160,0,0.12);}'
    + '.bft-wiz-choice-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:6px;}'
    + '.bft-wiz-choice-btn{border:1.5px solid #c8cdd8;background:#fff;color:#3d4558;'
    +   'font-family:"IBM Plex Sans",sans-serif;font-size:13px;font-weight:600;'
    +   'padding:10px 16px;border-radius:6px;cursor:pointer;transition:all .15s;flex:1 1 auto;'
    +   'min-width:90px;}'
    + '.bft-wiz-choice-btn:hover{border-color:#e8a000;color:#e8a000;}'
    + '.bft-wiz-choice-btn.sel{background:#e8a000;border-color:#e8a000;color:#000;}'
    /* ── Checklist note-area onder de keuze-knoppen (opt-in via wantsNote:true) ── */
    + '.bft-wiz-note-area{padding:0 32px 18px;display:none;}'
    + '.bft-wiz-note-area.active{display:block;}'
    + '.bft-wiz-note-input{width:100%;border:1.5px solid #dde1e8;border-radius:6px;'
    +   'font-family:"IBM Plex Sans",sans-serif;font-size:13px;padding:10px 12px;'
    +   'min-height:72px;resize:vertical;outline:none;color:#1a1f2e;line-height:1.45;'
    +   'box-sizing:border-box;}'
    + '.bft-wiz-note-input:focus{border-color:#e8a000;box-shadow:0 0 0 3px rgba(232,160,0,0.12);}';

  var styleEl = document.createElement('style');
  styleEl.id = 'bft-wiz-styles';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── State ────────────────────────────────────────────────────────
  var config = null;       // tool registratie
  var items = [];          // platte lijst van getItems()
  var idx = 0;             // huidige index
  var overlay = null;      // DOM-overlay
  var mode = 'checklist';  // 'checklist' | 'form'

  // ── Public API ───────────────────────────────────────────────────
  window.BFTWizard = {
    register: function(cfg) {
      if (!cfg || !cfg.name || typeof cfg.getItems !== 'function' || typeof cfg.setStatus !== 'function') {
        console.warn('BFTWizard.register: ongeldige config'); return;
      }
      config = cfg;
      mode = 'checklist';
      injectLaunchButton();
    },
    registerForm: function(cfg) {
      if (!cfg || !cfg.name || typeof cfg.getItems !== 'function' || typeof cfg.setValue !== 'function') {
        console.warn('BFTWizard.registerForm: ongeldige config'); return;
      }
      config = cfg;
      mode = 'form';
      injectLaunchButton();
    },
    registerFlow: function(cfg) {
      if (!cfg || !cfg.name || typeof cfg.getSteps !== 'function' || typeof cfg.setValue !== 'function') {
        console.warn('BFTWizard.registerFlow: ongeldige config'); return;
      }
      // Normaliseer naar getItems-interface zodat de rest van de wizard
      // hetzelfde patroon kan blijven gebruiken.
      config = {
        name: cfg.name,
        onComplete: cfg.onComplete,
        getItems: cfg.getSteps,
        setValue: cfg.setValue
      };
      mode = 'flow';
      injectLaunchButton();
    }
  };

  // ── Knop in header (uiterst rechts) ──────────────────────────────
  function injectLaunchButton() {
    function tryInject() {
      var hdr = document.querySelector('.bf-header');
      if (!hdr) { setTimeout(tryInject, 200); return; }
      if (hdr.querySelector('.bft-wiz-btn-launch')) return;

      var btn = document.createElement('button');
      btn.className = 'bft-wiz-btn-launch';
      btn.innerHTML = '✨ Wizard';
      btn.title = 'Start wizard om open vragen door te lopen';
      btn.onclick = open;

      // Verzamel bestaande rechts-elementen (alles wat geen bf-header-left is)
      // en wrap ze samen met de knop in één host-container die uiterst rechts
      // gepositioneerd is via margin-left:auto. Hiermee blijft de titel-tekst
      // ongestoord midden in de balk staan en krijgt de knop eigen ruimte.
      var rights = [];
      Array.prototype.forEach.call(hdr.children, function(ch) {
        if (!ch.classList.contains('bf-header-left')) rights.push(ch);
      });
      var host = document.createElement('div');
      host.className = 'bft-wiz-host';
      rights.forEach(function(el) { host.appendChild(el); });  // bestaande inhoud
      host.appendChild(btn);                                    // knop helemaal rechts
      hdr.appendChild(host);
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryInject);
    } else tryInject();
  }

  // ── Filter: alleen items die nog niet beantwoord zijn ────────────
  function loadOpenItems() {
    var all = config.getItems() || [];
    return all.filter(function(it) { return it && it.currentStatus === 'open'; });
  }

  // ── Overlay open/sluit ───────────────────────────────────────────
  function open() {
    if (!config) return;
    /* Startvoorwaarde (bv. actieve monteur verplicht). canStart geeft zelf feedback
       (focus/toast) en false terug → wizard opent niet. */
    if (config.canStart && !config.canStart()) return;
    items = loadOpenItems();
    if (!overlay) buildOverlay();
    overlay.classList.add('open');
    if (items.length === 0) { renderAllDone(); return; }
    idx = 0;
    render();
  }

  function close() {
    if (overlay) overlay.classList.remove('open');
    if (config && config.onComplete) config.onComplete();
  }

  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'bft-wiz-overlay';
    overlay.innerHTML = ''
      + '<div class="bft-wiz-modal">'
      +   '<div class="bft-wiz-bar"><div class="bft-wiz-bar-fill" id="bft-wiz-fill"></div></div>'
      +   '<div class="bft-wiz-top">'
      +     '<div class="bft-wiz-top-title" id="bft-wiz-name"></div>'
      +     '<div style="display:flex;align-items:center;gap:12px">'
      +       '<span class="bft-wiz-counter" id="bft-wiz-counter"></span>'
      +       '<button class="bft-wiz-close" id="bft-wiz-close" title="Sluiten">×</button>'
      +     '</div>'
      +   '</div>'
      +   '<div class="bft-wiz-body" id="bft-wiz-body"></div>'
      +   '<div class="bft-wiz-choices" id="bft-wiz-choices">'
      +     '<button class="bft-wiz-choice done" data-status="gedaan"><span class="ico">✅</span>Gedaan</button>'
      +     '<button class="bft-wiz-choice nvt"  data-status="nvt"><span class="ico">⚪</span>N.v.t.</button>'
      +     '<button class="bft-wiz-choice open" data-status="open"><span class="ico">⏸</span>Nog niet</button>'
      +   '</div>'
      +   '<div class="bft-wiz-note-area" id="bft-wiz-note-area">'
      +     '<textarea class="bft-wiz-note-input" id="bft-wiz-note-input" placeholder="Opmerking (optioneel)..."></textarea>'
      +   '</div>'
      +   '<div class="bft-wiz-form-area" id="bft-wiz-form-area"></div>'
      +   '<div class="bft-wiz-form-actions" id="bft-wiz-form-actions" style="display:none">'
      +     '<button class="bft-wiz-act nvt" id="bft-wiz-form-nvt">N.v.t.</button>'
      +     '<button class="bft-wiz-act" id="bft-wiz-form-skip">Overslaan</button>'
      +     '<button class="bft-wiz-act prim" id="bft-wiz-form-save">Opslaan &amp; verder →</button>'
      +   '</div>'
      +   '<div class="bft-wiz-nav">'
      +     '<button class="bft-wiz-nav-btn" id="bft-wiz-prev">← Vorige</button>'
      +     '<button class="bft-wiz-nav-btn" id="bft-wiz-skip">Overslaan →</button>'
      +   '</div>'
      + '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector('#bft-wiz-close').onclick = close;
    overlay.querySelector('#bft-wiz-prev').onclick = function() { goto(idx - 1); };
    overlay.querySelector('#bft-wiz-skip').onclick = function() { goto(idx + 1); };
    overlay.querySelectorAll('.bft-wiz-choice').forEach(function(btn) {
      btn.onclick = function() { kies(btn.getAttribute('data-status')); };
    });
    overlay.querySelector('#bft-wiz-form-save').onclick = function() { saveAndNext(); };
    overlay.querySelector('#bft-wiz-form-nvt').onclick  = function() { markCurrentNvt(); };
    overlay.querySelector('#bft-wiz-form-skip').onclick = function() { goto(idx + 1); };
    // Klik op achtergrond sluit
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
    // Esc sluit
    document.addEventListener('keydown', function(e) {
      if (overlay.classList.contains('open') && e.key === 'Escape') close();
    });
  }

  function render() {
    if (idx >= items.length) { renderDone(); return; }
    var it = items[idx];
    overlay.querySelector('#bft-wiz-name').textContent = config.name;
    overlay.querySelector('#bft-wiz-counter').textContent = (idx + 1) + ' / ' + items.length + ' open';
    overlay.querySelector('#bft-wiz-fill').style.width = ((idx / items.length) * 100) + '%';
    var bodyHtml = '';
    if (it.sub)   bodyHtml += '<div class="bft-wiz-context">' + escapeHtml(it.sub) + '</div>';
    if (it.id)    bodyHtml += '<div class="bft-wiz-id">' + escapeHtml(it.id) + '</div>';
    bodyHtml += '<div class="bft-wiz-question">' + escapeHtml(it.label) + '</div>';
    overlay.querySelector('#bft-wiz-body').innerHTML = bodyHtml;
    // Reset visibility (kan verborgen zijn na eerdere renderDone/AllDone)
    overlay.querySelector('#bft-wiz-prev').style.display = '';
    overlay.querySelector('#bft-wiz-prev').disabled = (idx === 0);

    if (mode === 'form' || mode === 'flow') {
      overlay.querySelector('.bft-wiz-choices').style.display = 'none';
      overlay.querySelector('#bft-wiz-skip').style.display = 'none';
      overlay.querySelector('#bft-wiz-form-area').classList.add('active');
      overlay.querySelector('#bft-wiz-form-actions').style.display = 'flex';
      overlay.querySelector('#bft-wiz-note-area').classList.remove('active');
      renderFormInput(it);
    } else {
      overlay.querySelector('.bft-wiz-choices').style.display = 'grid';
      overlay.querySelector('#bft-wiz-skip').style.display = '';
      overlay.querySelector('#bft-wiz-form-area').classList.remove('active');
      overlay.querySelector('#bft-wiz-form-actions').style.display = 'none';
      // Geen 'active' state nodig: items zijn altijd open, anders zaten ze niet in de lijst
      overlay.querySelectorAll('.bft-wiz-choice').forEach(function(b) {
        b.classList.remove('active');
      });
      // Optioneel notitieveld (opt-in via wantsNote:true in register-config)
      var noteArea = overlay.querySelector('#bft-wiz-note-area');
      var noteInput = overlay.querySelector('#bft-wiz-note-input');
      if (config.wantsNote === true) {
        noteArea.classList.add('active');
        noteInput.value = (it.currentNote != null) ? String(it.currentNote) : '';
      } else {
        noteArea.classList.remove('active');
        noteInput.value = '';
      }
    }
  }

  // ── Form/Flow-mode rendering ─────────────────────────────────────
  function renderFormInput(it) {
    var area = overlay.querySelector('#bft-wiz-form-area');
    var kind = it.kind || 'textarea';
    var cv   = it.currentValue;
    var ph   = it.placeholder || '';

    if (kind === 'scale') {
      var curScore = (cv && cv.score) || 0;
      var curNote  = (cv && cv.note)  || '';
      var btns = '';
      for (var n = 1; n <= 5; n++) {
        btns += '<button type="button" class="bft-wiz-scale-btn' + (n === curScore ? ' sel' : '')
              + '" data-score="' + n + '">' + n + '</button>';
      }
      area.innerHTML = ''
        + '<div class="bft-wiz-scale-row">' + btns + '</div>'
        + '<div class="bft-wiz-scale-labels">'
        +   '<span>Slecht</span><span>Matig</span><span>Goed</span><span>Zeer goed</span><span>Uitstekend</span>'
        + '</div>'
        + '<textarea class="bft-wiz-form-textarea bft-wiz-scale-note" id="bft-wiz-input-note" '
        +   'placeholder="Toelichting op je score...">' + escapeHtml(curNote) + '</textarea>';
      area.querySelectorAll('.bft-wiz-scale-btn').forEach(function(b) {
        b.onclick = function() {
          area.querySelectorAll('.bft-wiz-scale-btn').forEach(function(x) { x.classList.remove('sel'); });
          b.classList.add('sel');
        };
      });
    } else if (kind === 'choice') {
      var opts = it.options || [];
      var curVal = (cv == null ? '' : String(cv));
      var html = '<div class="bft-wiz-choice-row">';
      opts.forEach(function(o) {
        var v = (typeof o === 'string') ? o : o.value;
        var l = (typeof o === 'string') ? o : (o.label || o.value);
        var isSel = String(v) === curVal;
        html += '<button type="button" class="bft-wiz-choice-btn' + (isSel ? ' sel' : '')
              + '" data-value="' + escapeHtml(v) + '">' + escapeHtml(l) + '</button>';
      });
      html += '</div>';
      area.innerHTML = html;
      area.querySelectorAll('.bft-wiz-choice-btn').forEach(function(b) {
        b.onclick = function() {
          area.querySelectorAll('.bft-wiz-choice-btn').forEach(function(x) { x.classList.remove('sel'); });
          b.classList.add('sel');
        };
      });
    } else if (kind === 'select') {
      var sOpts = it.options || [];
      var sCur  = (cv == null ? '' : String(cv));
      var html2 = '<select class="bft-wiz-form-input" id="bft-wiz-input-select">';
      html2 += '<option value="">— selecteer —</option>';
      sOpts.forEach(function(o) {
        var v = (typeof o === 'string') ? o : o.value;
        var l = (typeof o === 'string') ? o : (o.label || o.value);
        var isSel = String(v) === sCur;
        html2 += '<option value="' + escapeHtml(v) + '"' + (isSel ? ' selected' : '') + '>' + escapeHtml(l) + '</option>';
      });
      html2 += '</select>';
      area.innerHTML = html2;
    } else if (kind === 'text' || kind === 'number' || kind === 'datetime') {
      var inpType = (kind === 'number') ? 'number' : (kind === 'datetime' ? 'datetime-local' : 'text');
      var val = (cv == null ? '' : String(cv));
      area.innerHTML = '<input type="' + inpType + '" class="bft-wiz-form-input" id="bft-wiz-input-field" '
        + 'placeholder="' + escapeHtml(ph) + '" value="' + escapeHtml(val) + '">';
    } else {
      // textarea (default)
      area.innerHTML = '<textarea class="bft-wiz-form-textarea" id="bft-wiz-input-text" '
        + 'placeholder="' + escapeHtml(ph || 'Vul je antwoord in...') + '">'
        + escapeHtml(cv == null ? '' : String(cv)) + '</textarea>';
    }
  }

  function readFormPayload() {
    if (idx >= items.length) return null;
    var it = items[idx];
    var area = overlay.querySelector('#bft-wiz-form-area');
    var kind = it.kind || 'textarea';

    if (kind === 'scale') {
      var sel = area.querySelector('.bft-wiz-scale-btn.sel');
      var note = (area.querySelector('#bft-wiz-input-note').value || '').trim();
      if (!sel && !note) return null;
      return { score: sel ? parseInt(sel.getAttribute('data-score'), 10) : 0, note: note };
    }
    if (kind === 'choice') {
      var selB = area.querySelector('.bft-wiz-choice-btn.sel');
      if (!selB) return null;
      return { value: selB.getAttribute('data-value') };
    }
    if (kind === 'select') {
      var sv = area.querySelector('#bft-wiz-input-select').value;
      if (!sv) return null;
      return { value: sv };
    }
    if (kind === 'text' || kind === 'number' || kind === 'datetime') {
      var fv = (area.querySelector('#bft-wiz-input-field').value || '').trim();
      if (!fv) return null;
      return { value: fv };
    }
    var tv = (area.querySelector('#bft-wiz-input-text').value || '').trim();
    if (!tv) return null;
    return { value: tv };
  }

  function saveAndNext() {
    if (idx >= items.length) return;
    var payload = readFormPayload();
    if (payload == null) {
      // Niets ingevuld → behandel als overslaan
      goto(idx + 1); return;
    }
    var curId = items[idx].id;
    config.setValue(curId, payload);
    setTimeout(function() {
      items = loadOpenItems();
      if (items.length === 0) { renderDone(); return; }
      var stillIdx = -1;
      for (var i = 0; i < items.length; i++) { if (items[i].id === curId) { stillIdx = i; break; } }
      if (stillIdx >= 0) idx = stillIdx + 1;
      if (idx >= items.length) { renderDone(); return; }
      render();
    }, 120);
  }

  function markCurrentNvt() {
    if (idx >= items.length) return;
    var curId = items[idx].id;
    config.setValue(curId, { status: 'nvt' });
    setTimeout(function() {
      items = loadOpenItems();
      if (items.length === 0) { renderDone(); return; }
      var stillIdx = -1;
      for (var i = 0; i < items.length; i++) { if (items[i].id === curId) { stillIdx = i; break; } }
      if (stillIdx >= 0) idx = stillIdx + 1;
      if (idx >= items.length) { renderDone(); return; }
      render();
    }, 120);
  }

  function renderDone() {
    overlay.querySelector('#bft-wiz-name').textContent = config.name;
    overlay.querySelector('#bft-wiz-counter').textContent = '';
    overlay.querySelector('#bft-wiz-fill').style.width = '100%';
    overlay.querySelector('#bft-wiz-body').innerHTML = ''
      + '<div class="bft-wiz-done-msg">'
      +   '<div class="ico">🎉</div>'
      +   '<h3>Klaar!</h3>'
      +   '<p>Alle openstaande items doorlopen. Antwoorden zijn opgeslagen in de tool.</p>'
      + '</div>';
    overlay.querySelector('.bft-wiz-choices').style.display = 'none';
    overlay.querySelector('#bft-wiz-form-area').classList.remove('active');
    overlay.querySelector('#bft-wiz-form-actions').style.display = 'none';
    overlay.querySelector('#bft-wiz-prev').style.display = 'none';
    overlay.querySelector('#bft-wiz-skip').style.display = 'none';
  }

  function renderAllDone() {
    overlay.querySelector('#bft-wiz-name').textContent = config.name;
    overlay.querySelector('#bft-wiz-counter').textContent = '';
    overlay.querySelector('#bft-wiz-fill').style.width = '100%';
    overlay.querySelector('#bft-wiz-body').innerHTML = ''
      + '<div class="bft-wiz-done-msg">'
      +   '<div class="ico">✅</div>'
      +   '<h3>Alles is al beantwoord</h3>'
      +   '<p>Er staan geen openstaande vragen. Pas indien nodig items handmatig aan in de tool.</p>'
      + '</div>';
    overlay.querySelector('.bft-wiz-choices').style.display = 'none';
    overlay.querySelector('#bft-wiz-form-area').classList.remove('active');
    overlay.querySelector('#bft-wiz-form-actions').style.display = 'none';
    overlay.querySelector('#bft-wiz-prev').style.display = 'none';
    overlay.querySelector('#bft-wiz-skip').style.display = 'none';
  }

  function kies(status) {
    if (idx >= items.length) return;
    var curId = items[idx].id;
    // Bij wantsNote: lees textarea en geef note door als 3e argument.
    // Tools die setStatus(id,status) verwachten negeren het extra argument.
    if (config.wantsNote === true) {
      var noteInput = overlay.querySelector('#bft-wiz-note-input');
      var noteVal = (noteInput && noteInput.value != null) ? String(noteInput.value) : '';
      config.setStatus(curId, status, noteVal);
    } else {
      config.setStatus(curId, status);
    }
    // Visuele bevestiging
    var btn = overlay.querySelector('.bft-wiz-choice.' + (status === 'gedaan' ? 'done' : status));
    if (btn) { btn.classList.add('active'); }
    setTimeout(function() {
      items = loadOpenItems();
      if (items.length === 0) { renderDone(); return; }
      // Als zojuist beantwoord item nog in de lijst zit (status='open' = niet beantwoord),
      // sla 'm over zodat we niet eindeloos op hetzelfde item blijven hangen.
      var stillIdx = -1;
      for (var i = 0; i < items.length; i++) { if (items[i].id === curId) { stillIdx = i; break; } }
      if (stillIdx >= 0) idx = stillIdx + 1;
      // idx clampen op grens
      if (idx >= items.length) { renderDone(); return; }
      render();
    }, 180);
  }

  function goto(newIdx) {
    if (newIdx < 0) newIdx = 0;
    idx = newIdx;
    render();
  }

  function statusLabel(s) {
    if (s === 'gedaan') return '✅ Gedaan';
    if (s === 'nvt')    return '⚪ N.v.t.';
    return '⏸ Nog niet';
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
})();
