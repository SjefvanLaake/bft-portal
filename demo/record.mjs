/* ────────────────────────────────────────────────────────────────────────
   record.mjs — Director-pipeline: Playwright stuurt de ÉCHTE BFT-tool door een
   scenario, met zichtbare cursor + titelkaarten, en neemt op:
     • video (webm) → geconverteerd naar mp4 + gif (PowerPoint-vriendelijk)
     • stap-screenshots (output/shots/)
   Eén bron = de echte tool → her-genereren bij UI-wijziging = dit opnieuw draaien.

   Een tool toevoegen = een nieuw blok in SCENARIOS onderaan (zelfde helpers).
   Draaien:  node record.mjs            (alle scenario's)
             node record.mjs overall    (alleen dat scenario)
   ──────────────────────────────────────────────────────────────────────── */
import { chromium } from 'playwright';
import ffmpegPkg from '@ffmpeg-installer/ffmpeg';
import { pathToFileURL } from 'node:url';
import { mkdirSync, readdirSync, existsSync, copyFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve('..');                       // BFT-V2/
const OUT  = 'output';
const VIEW = { width: 1440, height: 900 };

/* ── Zichtbare cursor (volgt echte muis-events) ── */
const CURSOR = () => {
  const d = document.createElement('div');
  d.id = '__cur';
  Object.assign(d.style, { position:'fixed', zIndex:2147483647, width:'20px', height:'20px',
    marginLeft:'-10px', marginTop:'-10px', borderRadius:'50%', background:'rgba(232,160,0,0.30)',
    border:'2px solid #e8a000', boxShadow:'0 0 0 2px rgba(0,0,0,.15)', pointerEvents:'none',
    left:'0', top:'0', transition:'transform .08s ease' });
  const add = () => document.body && document.body.appendChild(d);
  if (document.body) add(); else addEventListener('DOMContentLoaded', add);
  addEventListener('mousemove', e => { d.style.left = e.clientX+'px'; d.style.top = e.clientY+'px'; }, true);
  addEventListener('mousedown', () => { d.style.transform = 'scale(0.55)'; }, true);
  addEventListener('mouseup',   () => { d.style.transform = 'scale(1)'; }, true);
};

/* ── Helpers gebonden aan een page ── */
function makeHelpers(page, shotsDir) {
  let shotN = 0;
  async function moveTo(sel) {
    const el = page.locator(sel).first();
    await el.scrollIntoViewIfNeeded().catch(()=>{});
    const b = await el.boundingBox();
    if (!b) return null;
    const x = b.x + b.width/2, y = b.y + b.height/2;
    await page.mouse.move(x, y, { steps: 28 });
    return { x, y };
  }
  return {
    page,
    pause: (ms) => page.waitForTimeout(ms),
    moveTo,
    async click(sel) {
      const p = await moveTo(sel);
      await page.waitForTimeout(160);
      if (p) await page.mouse.click(p.x, p.y);
      await page.waitForTimeout(120);
    },
    async paintDrag(cellSel, fromIdx, toIdx) {
      const cells = page.locator(cellSel);
      const a = cells.nth(fromIdx), b = cells.nth(toIdx);
      const ba = await a.boundingBox().catch(()=>null);
      const bb = await b.boundingBox().catch(()=>null);
      if (!ba || !bb) return false;
      await page.mouse.move(ba.x+ba.width/2, ba.y+ba.height/2, { steps: 14 });
      await page.mouse.down();
      await page.mouse.move(bb.x+bb.width/2, bb.y+bb.height/2, { steps: 26 });
      await page.mouse.up();
      return true;
    },
    async card(title, sub) {
      await page.evaluate(({title, sub}) => {
        const d = document.createElement('div'); d.id = '__card';
        d.style.cssText = 'position:fixed;inset:0;z-index:2000000;background:#0b0e14;display:flex;'
          + 'flex-direction:column;align-items:center;justify-content:center;gap:12px;'
          + 'font-family:system-ui,Segoe UI,sans-serif;opacity:0;transition:opacity .35s';
        d.innerHTML = '<div style="color:#e8a000;font-weight:800;font-size:36px;letter-spacing:.5px">'
          + title + '</div><div style="color:#cbd2dc;font-size:17px">' + sub + '</div>';
        document.body.appendChild(d); requestAnimationFrame(() => d.style.opacity = '1');
      }, { title, sub });
      await page.waitForTimeout(1700);
      await page.evaluate(() => { const d = document.getElementById('__card'); if (d){ d.style.opacity='0'; setTimeout(()=>d.remove(),400);} });
      await page.waitForTimeout(460);
    },
    async shot(name) {
      const f = path.join(shotsDir, String(++shotN).padStart(2,'0') + '_' + name + '.png');
      await page.screenshot({ path: f });
    }
  };
}

/* ── Eén scenario opnemen ── */
async function record(scn) {
  const shotsDir = path.join(OUT, 'shots', scn.id);
  mkdirSync(shotsDir, { recursive: true });
  const vidDir = path.join(OUT, 'video', scn.id);
  mkdirSync(vidDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: VIEW, recordVideo: { dir: vidDir, size: VIEW } });
  const page = await context.newPage();
  await page.addInitScript(CURSOR);
  if (scn.seed) await page.addInitScript(scn.seed.fn, scn.seed.data);

  const url = pathToFileURL(path.join(ROOT, scn.tool)).href;
  await page.goto(url);
  await page.waitForTimeout(500);

  const h = makeHelpers(page, shotsDir);
  await scn.run(h);

  await context.close();           // finaliseert de video
  await browser.close();

  // webm → vaste naam → mp4 + gif
  const webm = readdirSync(vidDir).find(f => f.endsWith('.webm'));
  if (webm) {
    const src = path.join(vidDir, webm);
    const friendly = path.join(OUT, scn.id + '.webm');
    copyFileSync(src, friendly);
    convert(friendly, scn.id);
    console.log('  video : ' + friendly);
  }
  console.log('  shots : ' + shotsDir);
}

/* ── Converteren met een volwaardige ffmpeg (H.264 voor mp4, palette-gif) ── */
function convert(webm, id) {
  const ff = ffmpegPkg && ffmpegPkg.path;
  if (!ff || !existsSync(ff)) { console.log('  (ffmpeg niet gevonden — alleen webm)'); return; }
  const mp4 = path.join(OUT, id + '.mp4');
  const gif = path.join(OUT, id + '.gif');
  // PowerPoint-vriendelijke mp4 (H.264 + faststart + even afmetingen)
  spawnSync(ff, ['-y','-i',webm,'-c:v','libx264','-preset','medium','-crf','22',
    '-movflags','+faststart','-pix_fmt','yuv420p','-vf','scale=1440:-2',mp4], { stdio:'ignore' });
  // GIF met palette voor nette kleuren
  spawnSync(ff, ['-y','-i',webm,'-vf',
    'fps=12,scale=1000:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',gif], { stdio:'ignore' });
  if (existsSync(mp4)) console.log('  mp4   : ' + mp4);
  if (existsSync(gif)) console.log('  gif   : ' + gif);
}

/* ════════════════════════════════════════════════════════════════════════
   SCENARIO'S — een tool toevoegen = hier een blok bijzetten.
   ════════════════════════════════════════════════════════════════════════ */
const SNAPS = {
  '201267_BFMR2000EK': { mbcl:{pct:65,openItems:7},  bvl:{pct:80,fase:'Fase 3 — Montage'} },
  '201268_BFR500':     { mbcl:{pct:30,openItems:14}, bvl:{pct:20,fase:'Fase 2 — Bovenbak'} },
  '201250_BFM800':     { mbcl:{pct:100,openItems:0}, bvl:{pct:100,fase:'Afgerond'} },
  '201682_MR':         { mbcl:{pct:45,openItems:9} },
  '201700_MP':         { bvl:{pct:10,fase:'Fase 1 — Voorbereiding'} }
};

/* Projectoverzicht: feiten-snapshots (mbcl/bvl/ibn/eval) + een geseede planning
   voor het hero-project, zodat de per-project editor échte balken toont. */
const PO_SNAPS = {
  '201267_BFMR2000EK': { mbcl:{pct:65,openItems:7}, bvl:{pct:80,fase:'Fase 3 — Montage'}, ibn:{pct:40}, eval:{score:4.2,status:'klaar'} },
  '201250_BFM800':     { mbcl:{pct:100,openItems:0}, bvl:{pct:100,fase:'Afgerond'}, ibn:{pct:100}, eval:{score:4.6,status:'klaar'} },
  '201268_BFR500':     { mbcl:{pct:30,openItems:14}, bvl:{pct:20,fase:'Fase 2 — Bovenbak'} }
};
const PO_PLAN = {
  bftId:'201267_BFMR2000EK', klant:'Demo Klant BV', omschrijving:'BFMR2000EK',
  wo:'201267', servnr:'201224', pl:'JdV', eng:'SH', wvb:'TW',
  weken: { engineering:[[24,28]], wvb:[[25,29]], randtaken:[[26,30]] }
};

const SCENARIOS = [
  {
    id: 'overallplanning',
    tool: 'tools/BFT_OverallPlanning.html',
    seed: {
      data: SNAPS,
      fn: (snaps) => {
        try {
          const now = new Date().toISOString();
          for (const [id, v] of Object.entries(snaps)) {
            if (v.mbcl) localStorage.setItem('bft_v2_snap_mbcl_'+id, JSON.stringify(Object.assign({}, v.mbcl, {updated:now})));
            if (v.bvl)  localStorage.setItem('bft_v2_snap_bvl_'+id,  JSON.stringify(Object.assign({}, v.bvl,  {updated:now})));
          }
        } catch(e){}
      }
    },
    run: async (h) => {
      await h.card('Bofram Portaal', 'Overall Planning — plannen, feiten &amp; capaciteit');
      await h.shot('start');

      await h.click('#btnSync');                 // projecten uit de lijst halen
      await h.pause(1300);
      await h.shot('gesynct');

      await h.click('#btnRes');                  // → week-modus
      await h.pause(700);

      await h.click('tr.og-row-project .og-caret'); // eerste project uitklappen (caret = links, zichtbaar)
      await h.pause(800);
      await h.shot('uitgeklapt');

      await h.paintDrag('tr.og-row-disc[data-disc="engineering"] .og-paint-cell', 1, 4);
      await h.pause(450);
      await h.paintDrag('tr.og-row-disc[data-disc="wvb"] .og-paint-cell', 2, 5);
      await h.pause(750);
      await h.shot('geschilderd');

      await h.click('#btnRes');                  // → terug naar maand (balken)
      await h.pause(850);
      await h.shot('maand_balken');

      await h.click('#btnHeelJaar');             // heel jaar tonen
      await h.pause(950);
      await h.shot('heeljaar');

      await h.card('Bofram Portaal', 'Eén plek: plan, werkelijkheid en capaciteit');
    }
  },

  {
    id: 'projectoverzicht',
    tool: 'tools/BFT_Projectoverzicht.html',
    seed: {
      data: { snaps: PO_SNAPS, plan: PO_PLAN },
      fn: ({ snaps, plan }) => {
        try {
          const now = new Date().toISOString();
          const Y = new Date().getFullYear();
          for (const [id, v] of Object.entries(snaps)) {
            if (v.mbcl) localStorage.setItem('bft_v2_snap_mbcl_'+id, JSON.stringify(Object.assign({}, v.mbcl, {updated:now})));
            if (v.bvl)  localStorage.setItem('bft_v2_snap_bvl_'+id,  JSON.stringify(Object.assign({}, v.bvl,  {updated:now})));
            if (v.ibn)  localStorage.setItem('bft_v2_snap_ibn_'+id,  JSON.stringify(Object.assign({}, v.ibn,  {updated:now})));
            if (v.eval) localStorage.setItem('bft_v2_snap_eval_'+id, JSON.stringify(Object.assign({}, v.eval, {updated:now})));
          }
          // planning-store zodat de per-project editor balken toont
          const P = 'bft_overallplanning_';
          const disc = [
            {key:'engineering',label:'Engineering',color:'#FFFF00'},
            {key:'wvb',label:'WVB',color:'#92D050'},
            {key:'randtaken',label:'Randtaken',color:'#FFC000'},
            {key:'begeleiding',label:'Begeleiding opbouw',color:'#00B0F0'}
          ];
          localStorage.setItem(P+'config', JSON.stringify({ versie:1, jaar:Y, disciplines:disc }));
          localStorage.setItem(P+'index', JSON.stringify(['pr_demo1']));
          const weken = {};
          for (const [k, rs] of Object.entries(plan.weken)) weken[k] = rs.map(r => ({ startWeek:r[0], eindWeek:r[1], jaar:Y, notitie:'' }));
          localStorage.setItem(P+'proj_pr_demo1', JSON.stringify({
            id:'pr_demo1', bftId:plan.bftId, klant:plan.klant, omschrijving:plan.omschrijving,
            wo:plan.wo, servnr:plan.servnr, pl:plan.pl, eng:plan.eng, wvb:plan.wvb, weken, bezetting:{}
          }));
        } catch(e){}
      }
    },
    run: async (h) => {
      await h.card('Bofram Portaal', 'Projectoverzicht — feiten &amp; planning per project');
      await h.shot('start');

      await h.click('.po-card:has-text("BFMR2000EK")');   // hero-project openen
      await h.pause(1000);
      await h.shot('detail_feiten');

      await h.page.locator('#poDetailPlan').scrollIntoViewIfNeeded().catch(()=>{});
      await h.pause(900);
      await h.shot('planning');

      await h.click('#planResBtn');                        // editor → week-modus
      await h.pause(950);
      await h.shot('planning_week');

      await h.page.locator('.po-detail').evaluate(e => e.scrollTo({ top:0 })).catch(()=>{});
      await h.pause(400);
      await h.click('.po-card:has-text("BFM800")');        // ander (afgerond) project
      await h.pause(1000);
      await h.shot('ander_project');

      await h.card('Bofram Portaal', 'Eén klik: status, voortgang en planning');
    }
  },

  {
    id: 'bouwvolgordelijst',
    tool: 'tools/BFT_Bouwvolgordelijst.html',
    run: async (h) => {
      await h.card('Bofram Portaal', 'Bouwvolgordelijst — sjabloon per machinetype, afgevinkt met monteur-stempel');
      await h.shot('start');

      // project met een sjabloon kiezen (BFMR2000EK)
      await h.page.selectOption('#projSelect', '201267_BFMR2000EK').catch(()=>{});
      await h.pause(1200);
      await h.shot('geladen');

      // monteur invullen + bevestigen (verplicht om af te vinken)
      await h.click('#bft-monteur-input');                 // cursor → veld, focus
      await h.page.fill('#bft-monteur-input', 'JdV');
      await h.pause(450);
      await h.page.press('#bft-monteur-input', 'Enter');   // bevestigt (onkeydown → bevestig)
      await h.pause(800);
      await h.shot('monteur');

      // eerste stappen afvinken → krijgen een monteur-stempel
      await h.click('.bft-cl-chk-ok >> nth=0');
      await h.pause(450);
      await h.click('.bft-cl-chk-ok >> nth=1');
      await h.pause(450);
      await h.click('.bft-cl-chk-ok >> nth=2');
      await h.pause(800);
      await h.shot('afgevinkt');

      await h.card('Bofram Portaal', 'Elke stap getekend — voortgang en fase live bijgewerkt');
    }
  }
];

/* ── runner ── */
const filter = process.argv[2];
mkdirSync(OUT, { recursive: true });
for (const scn of SCENARIOS) {
  if (filter && !scn.id.includes(filter)) continue;
  console.log('▶ scenario: ' + scn.id);
  try { await record(scn); console.log('  klaar.\n'); }
  catch (e) { console.log('  FOUT: ' + e.message + '\n'); }
}
console.log('Done.');
