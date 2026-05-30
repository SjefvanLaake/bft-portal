/* ════════════════════════════════════════════════════════════════════
   BFT DIALOG — styled confirm/alert vervangers voor browser-native popups
   ────────────────────────────────────────────────────────────────────
   Uniforme BFT-popup-maat 1100×520, conform [[bft-wizard-standaard]],
   [[bft-deadline-standaard]] en [[bft-audit-standaard]].

   INTEGRATIE (per tool):
     <script src="../library/js/bft-dialog.js" defer></script>

   GEBRUIK:

     // confirm: Promise<boolean> (true = OK, false = Annuleer/Esc/buiten-klik)
     BFTDialog.confirm('Weet je het zeker?').then(function(ok){
       if (!ok) return;
       doStuff();
     });

     // alert: Promise<void> (resolves zodra user klikt of Esc)
     BFTDialog.alert('Klaar!').then(function(){
       continueAfter();
     });

     // destructieve actie → rode primaire knop:
     BFTDialog.confirm('Alles wissen?', { danger: true }).then(...);

   OPTIES (2e parameter, object — alles optioneel):
     title:       string  — kop in zwarte balk. Default: 'Bevestigen' / 'Melding'
     okLabel:     string  — tekst op primaire knop. Default: 'OK'
     cancelLabel: string  — tekst op annuleer-knop (alleen confirm). Default: 'Annuleer'
     danger:      bool    — rode primaire knop voor destructieve acties

   TOETSEN:
     Enter  → OK
     Esc    → Annuleer (confirm) / sluit (alert)
     Klik op donkere overlay buiten modal → Annuleer / sluit
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CSS_ID = 'bft-dlg-styles';

  function injectCss() {
    if (document.getElementById(CSS_ID)) return;
    var css = ''
      + '.bft-dlg-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:10000;'
      +   'display:none;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;'
      +   'font-family:"IBM Plex Sans",system-ui,sans-serif;}'
      + '.bft-dlg-overlay.open{display:flex;}'
      + '.bft-dlg-modal{background:#fff;border-radius:10px;max-width:1100px;width:100%;'
      +   'min-height:520px;max-height:calc(100vh - 40px);'
      +   'display:flex;flex-direction:column;overflow:hidden;'
      +   'box-shadow:0 20px 60px rgba(0,0,0,0.3);'
      +   'animation:bft-dlg-in .16s ease-out;}'
      + '@keyframes bft-dlg-in{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}'
      + '.bft-dlg-top{background:#000;color:#fff;padding:16px 22px;display:flex;align-items:center;gap:12px;flex:none;}'
      + '.bft-dlg-top .bft-dlg-icon{width:30px;height:30px;border-radius:50%;background:#e8a000;'
      +   'display:flex;align-items:center;justify-content:center;color:#000;font-weight:700;'
      +   'font-family:"IBM Plex Mono",monospace;font-size:15px;flex:none;}'
      + '.bft-dlg-top.danger .bft-dlg-icon{background:#d63030;color:#fff;}'
      + '.bft-dlg-title{font-size:14px;font-weight:600;letter-spacing:.02em;'
      +   'font-family:"IBM Plex Mono",monospace;text-transform:uppercase;}'
      + '.bft-dlg-body{padding:32px 36px;flex:1;overflow:auto;'
      +   'display:flex;flex-direction:column;justify-content:center;'
      +   'font-size:16px;line-height:1.55;color:#1a1f2e;white-space:pre-wrap;}'
      + '.bft-dlg-actions{display:flex;gap:10px;justify-content:flex-end;'
      +   'padding:14px 22px;background:#fafbfc;border-top:1px solid #e3e6ec;flex:none;}'
      + '.bft-dlg-btn{padding:10px 22px;border:1px solid #c8ccd4;border-radius:6px;background:#fff;'
      +   'color:#1a1f2e;cursor:pointer;font-size:13px;font-family:"IBM Plex Sans",sans-serif;'
      +   'font-weight:500;transition:all .12s;min-width:100px;}'
      + '.bft-dlg-btn:hover{background:#f1f3f6;border-color:#9ca3ad;}'
      + '.bft-dlg-btn:focus{outline:2px solid #e8a000;outline-offset:1px;}'
      + '.bft-dlg-btn.primary{background:#e8a000;color:#000;border-color:#e8a000;}'
      + '.bft-dlg-btn.primary:hover{background:#d49000;border-color:#d49000;}'
      + '.bft-dlg-btn.primary.danger{background:#d63030;color:#fff;border-color:#d63030;}'
      + '.bft-dlg-btn.primary.danger:hover{background:#aa2525;border-color:#aa2525;}';
    var st = document.createElement('style');
    st.id = CSS_ID;
    st.textContent = css;
    document.head.appendChild(st);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function open(opts) {
    injectCss();
    return new Promise(function (resolve) {
      var isConfirm = opts.kind === 'confirm';
      var icon  = isConfirm ? '?' : (opts.danger ? '!' : 'i');
      var title = opts.title || (isConfirm ? 'Bevestigen' : 'Melding');

      var overlay = document.createElement('div');
      overlay.className = 'bft-dlg-overlay open';
      overlay.innerHTML = ''
        + '<div class="bft-dlg-modal" role="dialog" aria-modal="true">'
        +   '<div class="bft-dlg-top' + (opts.danger ? ' danger' : '') + '">'
        +     '<div class="bft-dlg-icon">' + icon + '</div>'
        +     '<div class="bft-dlg-title">' + escapeHtml(title) + '</div>'
        +   '</div>'
        +   '<div class="bft-dlg-body" id="bft-dlg-body"></div>'
        +   '<div class="bft-dlg-actions">'
        +     (isConfirm
                 ? '<button class="bft-dlg-btn" data-act="cancel">'
                   + escapeHtml(opts.cancelLabel || 'Annuleer') + '</button>'
                 : '')
        +     '<button class="bft-dlg-btn primary' + (opts.danger ? ' danger' : '') + '" data-act="ok">'
        +     escapeHtml(opts.okLabel || 'OK') + '</button>'
        +   '</div>'
        + '</div>';
      // Body als plain text om HTML-injection te voorkomen, maar \n behoudt
      overlay.querySelector('#bft-dlg-body').textContent = String(opts.message == null ? '' : opts.message);
      document.body.appendChild(overlay);

      function close(val) {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        document.removeEventListener('keydown', onKey);
        resolve(val);
      }
      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); close(isConfirm ? false : undefined); }
        else if (e.key === 'Enter') { e.preventDefault(); close(isConfirm ? true : undefined); }
      }
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close(isConfirm ? false : undefined);
      });
      overlay.querySelectorAll('.bft-dlg-btn').forEach(function (b) {
        b.addEventListener('click', function () {
          var act = b.getAttribute('data-act');
          if (isConfirm) close(act === 'ok');
          else close(undefined);
        });
      });
      document.addEventListener('keydown', onKey);
      setTimeout(function () {
        var pri = overlay.querySelector('.bft-dlg-btn.primary');
        if (pri) pri.focus();
      }, 0);
    });
  }

  window.BFTDialog = {
    confirm: function (message, opts) {
      opts = opts || {};
      return open({
        kind: 'confirm', message: message,
        title: opts.title, okLabel: opts.okLabel,
        cancelLabel: opts.cancelLabel, danger: opts.danger
      });
    },
    alert: function (message, opts) {
      opts = opts || {};
      return open({
        kind: 'alert', message: message,
        title: opts.title, okLabel: opts.okLabel,
        danger: opts.danger
      });
    }
  };
})();
