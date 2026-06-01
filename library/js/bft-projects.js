/**
 * bft-projects.js — gedeelde projectenlijst voor alle BFT-tools
 * Vervang later door BFTGraph.query('BFT_Projecten')
 */
const BFT_PROJECTEN = [
  {
    id: '201267_BFMR2000EK',
    projectnr: '201267',
    naam: 'Mix Recycler BFMR2000EK',
    klant: 'Demo Klant BV',
    oplevering: '2026-08-15',
    pl: 'J. de Vries',
    eng: 'S. Hendriks',
    wvb: 'T. Wouters',
    machineType: 'BFMR2000EK',
    aangemaakt: '2026-01-10',
    status: 'actief'
  },
  {
    id: '201268_BFR500',
    projectnr: '201268',
    naam: 'Recycler BFR500',
    klant: 'Ander Bedrijf NV',
    oplevering: '2026-10-01',
    pl: 'P. Jansen',
    eng: 'K. Evers',
    wvb: 'R. Dekker',
    machineType: 'BFR500',
    aangemaakt: '2026-02-20',
    status: 'actief'
  },
  {
    id: '201250_BFM800',
    projectnr: '201250',
    naam: 'Mixer BFM800',
    klant: 'Klant C Holding',
    oplevering: '2026-03-01',
    pl: 'M. Bakker',
    eng: 'S. Hendriks',
    wvb: 'T. Wouters',
    machineType: 'BFM800',
    aangemaakt: '2025-09-15',
    status: 'klaar'
  }
];

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

/* Samengevoegde lijst: seed + custom (custom op id wint, bv. bij bewerken) */
function bftAlleProjecten() {
  const custom = bftCustomProjecten();
  const ids = custom.map(p => p.id);
  return BFT_PROJECTEN.filter(p => ids.indexOf(p.id) === -1).concat(custom);
}

/* Upsert een (custom) project in de runtime-store */
function bftSlaProjectOp(proj) {
  if (!proj || !proj.id) return false;
  const custom = bftCustomProjecten().filter(p => p.id !== proj.id);
  custom.push(proj);
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
