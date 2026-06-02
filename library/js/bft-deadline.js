/* BFT Deadline Reminder v1.0
 * Toont bij tool-open een popup met dagen-tot-deadline + aantal open items.
 *
 * API:
 *   BFTDeadline.register({
 *     name:          string,                       // tool-naam (titel in popup)
 *     getDeadline:   function() -> 'YYYY-MM-DD',   // leeg → geen popup
 *     getOpenCount:  function() -> number,         // 0 → geen popup
 *     getTotalCount: function() -> number          // optioneel, voor "X / Y items"
 *   });
 *
 * Gedrag:
 *   - 1x per tool-open (geen snooze, geen "niet meer tonen").
 *   - Verstreken deadline → rode kleur, zelfde gedrag.
 *   - "Bekijk wizard" → sluit popup + klikt de BFTWizard-launch-knop (.bft-wiz-btn-launch).
 *   - Geen wizard aanwezig → "Bekijk wizard"-knop verbergen.
 */
(function (global) {
  'use strict';

  var injected = false;
  var shown = {};   // dedup per cfg.key (bv. projectId): 1× per tool-open, niet bij elke projectwissel

  function injectStyles() {
    if (injected) return;
    injected = true;
    /* Kleuren/fonts via de BFT-theme-vars; fallback = oorspronkelijke waarde (uiterlijk identiek waar de var gelijk is, theme-adaptief waar hij afwijkt). */
    var css = ''
      + '.bft-dl-overlay{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.55);display:none;align-items:center;justify-content:center;font-family:var(--sans,"IBM Plex Sans",sans-serif);}'
      + '.bft-dl-overlay.open{display:flex;}'
      + '.bft-dl-overlay{padding:20px;box-sizing:border-box;}'
      + '.bft-dl-modal{background:#fff;border-radius:10px;box-shadow:0 18px 48px rgba(0,0,0,0.35);max-width:1100px;width:100%;min-height:520px;display:flex;flex-direction:column;overflow:hidden;animation:bft-dl-in .18s ease-out;}'
      + '@keyframes bft-dl-in{from{opacity:0;transform:translateY(8px)scale(.98)}to{opacity:1;transform:none}}'
      + '.bft-dl-top{background:#000;color:#fff;padding:18px 22px;display:flex;align-items:center;gap:12px;}'
      + '.bft-dl-top .bft-dl-icon{width:30px;height:30px;border-radius:50%;background:var(--accent,#e8a000);display:flex;align-items:center;justify-content:center;color:#000;font-weight:700;font-family:var(--mono,"IBM Plex Mono",monospace);font-size:15px;flex:none;}'
      + '.bft-dl-top.overdue .bft-dl-icon{background:var(--danger,#d63030);color:#fff;}'
      + '.bft-dl-top .bft-dl-title{font-size:13px;font-family:var(--mono,"IBM Plex Mono",monospace);color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:.08em;}'
      + '.bft-dl-top .bft-dl-name{font-size:15px;font-weight:600;margin-top:2px;}'
      + '.bft-dl-body{padding:22px;flex:1;}'
      + '.bft-dl-big{font-size:32px;font-weight:700;color:var(--text,#1a1f2e);line-height:1;margin-bottom:4px;font-family:var(--sans,"IBM Plex Sans",sans-serif);}'
      + '.bft-dl-big.overdue{color:var(--danger,#d63030);}'
      + '.bft-dl-sub{font-size:13px;color:var(--muted,#7a849a);margin-bottom:18px;font-family:var(--mono,"IBM Plex Mono",monospace);}'
      + '.bft-dl-rows{border-top:1px solid #e3e6ec;padding-top:14px;display:grid;gap:8px;}'
      + '.bft-dl-row{display:flex;justify-content:space-between;font-size:13px;color:var(--text2,#3d4558);}'
      + '.bft-dl-row b{color:var(--text,#1a1f2e);font-family:var(--mono,"IBM Plex Mono",monospace);}'
      + '.bft-dl-actions{display:flex;gap:8px;padding:14px 22px;background:#fafbfc;border-top:1px solid #e3e6ec;}'
      + '.bft-dl-btn{flex:1;padding:10px 14px;border:1px solid #c8ccd4;border-radius:6px;background:#fff;color:var(--text,#1a1f2e);cursor:pointer;font-size:13px;font-family:var(--sans,"IBM Plex Sans",sans-serif);font-weight:500;transition:all .12s;}'
      + '.bft-dl-btn:hover{background:#f1f3f6;border-color:#9ca3ad;}'
      + '.bft-dl-btn.primary{background:var(--accent,#e8a000);color:#000;border-color:var(--accent,#e8a000);}'
      + '.bft-dl-btn.primary:hover{background:var(--accent-dk,#d49000);border-color:var(--accent-dk,#d49000);}';
    var st = document.createElement('style');
    st.setAttribute('data-bft-deadline', '1');
    st.textContent = css;
    document.head.appendChild(st);
  }

  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function daysBetween(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    var now = new Date(); now.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return Math.round((d - now) / (86400000));
  }

  function bigText(days) {
    if (days === 0)  return 'Vandaag deadline';
    if (days === 1)  return 'Nog 1 dag';
    if (days === -1) return '1 dag verstreken';
    if (days > 0)    return 'Nog ' + days + ' dagen';
    return Math.abs(days) + ' dagen verstreken';
  }

  function buildOverlay(cfg, deadline, days, open, total) {
    var overdue = days < 0;

    var overlay = document.createElement('div');
    overlay.className = 'bft-dl-overlay';

    var wizardKnop = document.querySelector('.bft-wiz-btn-launch');
    var wizardKnopHTML = wizardKnop
      ? '<button class="bft-dl-btn primary" data-act="wizard">Bekijk wizard</button>'
      : '';

    var todayLabel = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

    overlay.innerHTML = ''
      + '<div class="bft-dl-modal">'
      +   '<div class="bft-dl-top' + (overdue ? ' overdue' : '') + '">'
      +     '<div class="bft-dl-icon">&#x23F0;</div>'
      +     '<div>'
      +       '<div class="bft-dl-title">Deadline-herinnering</div>'
      +       '<div class="bft-dl-name">' + escapeHtml(cfg.name || '') + '</div>'
      +     '</div>'
      +   '</div>'
      +   '<div class="bft-dl-body">'
      +     '<div class="bft-dl-big' + (overdue ? ' overdue' : '') + '">' + escapeHtml(bigText(days)) + '</div>'
      +     '<div class="bft-dl-sub">Vandaag: ' + escapeHtml(todayLabel) + ' &middot; Deadline: ' + escapeHtml(fmtDate(deadline)) + '</div>'
      +     '<div class="bft-dl-rows">'
      +       '<div class="bft-dl-row"><span>Open items</span><b>' + open + (total ? ' van ' + total : '') + '</b></div>'
      +       (total ? '<div class="bft-dl-row"><span>Voortgang</span><b>' + (total - open) + ' / ' + total + ' afgerond</b></div>' : '')
      +     '</div>'
      +   '</div>'
      +   '<div class="bft-dl-actions">'
      +     '<button class="bft-dl-btn" data-act="close">Sluiten</button>'
      +     wizardKnopHTML
      +   '</div>'
      + '</div>';

    document.body.appendChild(overlay);

    function dismiss() {
      overlay.classList.remove('open');
      setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 220);
    }

    overlay.addEventListener('click', function (e) {
      var act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
      if (act === 'close') { dismiss(); return; }
      if (act === 'wizard') {
        dismiss();
        var btn = document.querySelector('.bft-wiz-btn-launch');
        if (btn) setTimeout(function(){ btn.click(); }, 230);
        return;
      }
      if (e.target === overlay) dismiss();
    });

    document.addEventListener('keydown', function escHandler(ev){
      if (ev.key === 'Escape') { dismiss(); document.removeEventListener('keydown', escHandler); }
    });

    // Open op volgende tick (transition kans)
    requestAnimationFrame(function(){ overlay.classList.add('open'); });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function check(cfg) {
    try {
      var deadline = cfg.getDeadline ? (cfg.getDeadline() || '') : '';
      if (!deadline) return;
      var days = daysBetween(deadline);
      if (days === null) return;
      var open  = cfg.getOpenCount  ? Number(cfg.getOpenCount())  : 0;
      var total = cfg.getTotalCount ? Number(cfg.getTotalCount()) : 0;
      if (!(open > 0)) return;
      if (cfg.key != null) {              // 1× per sleutel (projectId) per tool-open
        if (shown[cfg.key]) return;
        shown[cfg.key] = true;
      }
      injectStyles();
      buildOverlay(cfg, deadline, days, open, total);
    } catch (e) {
      // Stil falen — deadline-popup mag de tool nooit breken
      if (global.console && console.warn) console.warn('BFTDeadline.check fout:', e);
    }
  }

  function register(cfg) {
    if (!cfg || typeof cfg.getDeadline !== 'function' || typeof cfg.getOpenCount !== 'function') {
      if (global.console && console.warn) console.warn('BFTDeadline.register: ongeldige config');
      return;
    }
    if (document.readyState === 'complete') {
      setTimeout(function(){ check(cfg); }, 50);
    } else {
      window.addEventListener('load', function(){ setTimeout(function(){ check(cfg); }, 50); });
    }
  }

  global.BFTDeadline = {
    register: register,
    VERSION: '1.0'
  };
})(window);
