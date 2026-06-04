/* ────────────────────────────────────────────────────────────────────────
   bft-tutorial.js — "▷ Uitleg"-knoppen + video-modal op het portaal.
   Data-gedreven: alleen tool-kaarten waarvan de href in VIDEOS staat krijgen
   automatisch een knop. Nieuwe demo toevoegen = mp4 in library/tutorials/ +
   één regel hieronder. Geen wijziging aan de kaarten zelf nodig.
   Insluiten in index.html:  <script src="library/js/bft-tutorial.js" defer></script>
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* href (zoals in index.html) → { src (mp4), titel } */
  var VIDEOS = {
    'tools/BFT_OverallPlanning.html':   { src: 'library/tutorials/overallplanning.mp4',   titel: 'Overall Planning' },
    'tools/BFT_Projectoverzicht.html':  { src: 'library/tutorials/projectoverzicht.mp4',  titel: 'Projectoverzicht' },
    'tools/BFT_Bouwvolgordelijst.html': { src: 'library/tutorials/bouwvolgordelijst.mp4', titel: 'Bouwvolgordelijst' }
  };

  function injectCss() {
    if (document.getElementById('bft-tut-css')) return;
    var css = ''
      + '.bft-tut-btn{position:absolute;top:10px;right:10px;z-index:5;display:inline-flex;align-items:center;'
      +   'gap:5px;padding:3px 9px;border-radius:20px;border:1px solid var(--border,#e1e4e8);'
      +   'background:rgba(255,255,255,0.92);color:var(--accent2,#1a6ec7);font-family:var(--mono,monospace);'
      +   'font-size:10px;font-weight:700;cursor:pointer;line-height:1.6;box-shadow:0 1px 3px rgba(0,0,0,.08);'
      +   'transition:all .12s;backdrop-filter:blur(2px);}'
      + '.bft-tut-btn:hover{background:var(--accent2,#1a6ec7);color:#fff;border-color:var(--accent2,#1a6ec7);transform:translateY(-1px);}'
      + '.bft-tut-btn .tri{font-size:8px}'
      + '.bft-tut-ov{position:fixed;inset:0;z-index:10000;background:rgba(8,11,18,.78);display:none;'
      +   'align-items:center;justify-content:center;padding:24px;box-sizing:border-box;}'
      + '.bft-tut-ov.open{display:flex;}'
      + '.bft-tut-box{width:min(1080px,94vw);background:#0b0e14;border-radius:12px;overflow:hidden;'
      +   'box-shadow:0 24px 80px rgba(0,0,0,.5);}'
      + '.bft-tut-top{display:flex;align-items:center;gap:10px;padding:12px 16px;background:#000;color:#fff;}'
      + '.bft-tut-ttl{flex:1;font-family:var(--mono,monospace);font-size:13px;font-weight:700;letter-spacing:.3px;}'
      + '.bft-tut-ttl .acc{color:var(--accent,#e8a000);}'
      + '.bft-tut-x{border:none;background:rgba(255,255,255,.1);color:#fff;width:30px;height:30px;border-radius:50%;'
      +   'cursor:pointer;font-size:16px;line-height:1;}'
      + '.bft-tut-x:hover{background:var(--danger,#d63030);}'
      + '.bft-tut-box video{display:block;width:100%;height:auto;background:#000;}'
      + '.bft-tut-cap{padding:8px 16px 12px;font-family:var(--mono,monospace);font-size:10px;color:#9aa3b2;background:#000;}';
    var st = document.createElement('style');
    st.id = 'bft-tut-css'; st.textContent = css;
    document.head.appendChild(st);
  }

  var ov, vid, ttl, cap;
  function buildModal() {
    ov = document.createElement('div');
    ov.className = 'bft-tut-ov';
    ov.innerHTML =
      '<div class="bft-tut-box" role="dialog" aria-modal="true">'
      + '<div class="bft-tut-top"><div class="bft-tut-ttl"></div>'
      +   '<button class="bft-tut-x" title="Sluiten" aria-label="Sluiten">×</button></div>'
      + '<video controls preload="metadata" playsinline></video>'
      + '<div class="bft-tut-cap">Demo van de échte tool · druk Esc of klik buiten het kader om te sluiten</div>'
      + '</div>';
    document.body.appendChild(ov);
    vid = ov.querySelector('video');
    ttl = ov.querySelector('.bft-tut-ttl');
    cap = ov.querySelector('.bft-tut-cap');
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.querySelector('.bft-tut-x').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  function open(info) {
    if (!ov) buildModal();
    ttl.innerHTML = '<span class="acc">▷ Uitleg</span> — ' + info.titel;
    vid.src = info.src;
    ov.classList.add('open');
    try { vid.currentTime = 0; vid.play(); } catch (e) {}
  }
  function close() {
    if (!ov) return;
    try { vid.pause(); } catch (e) {}
    ov.classList.remove('open');
  }

  function init() {
    injectCss();
    var cards = document.querySelectorAll('a.tool-card[href], a.featured[href]');
    cards.forEach(function (card) {
      var href = card.getAttribute('href');
      var info = VIDEOS[href];
      if (!info) return;
      if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
      var btn = document.createElement('span');
      btn.className = 'bft-tut-btn';
      btn.setAttribute('role', 'button');
      btn.title = 'Bekijk uitleg-video van deze tool';
      btn.innerHTML = '<span class="tri">▷</span> Uitleg';
      btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();   /* niet doorklikken naar de tool */
        open(info);
      });
      card.appendChild(btn);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
