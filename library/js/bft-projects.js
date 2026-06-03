/**
 * bft-projects.js — gedeelde projectenlijst voor alle BFT-tools
 * Vervang later door BFTGraph.query('BFT_Projecten')
 *
 * plannerUrl (optioneel): volledige deep-link naar het Planner-bord van dit
 *   project. PLAK de URL uit Planner's eigen "Koppeling naar plan kopiëren" —
 *   construeer hem NIET zelf (Microsoft migreert Planner-URL's). Leeg = de
 *   "Taken in Planner"-knop verschijnt niet.
 */
const BFT_PROJECTEN = [
  {
    id: '201267_BFMR2000EK',
    projectnr: '201267',
    servicenr: '201224',
    naam: 'BFMR2000EK',
    klant: 'Demo Klant BV',
    oplevering: '2026-08-15',
    pl: 'JdV',
    eng: 'SH',
    wvb: 'TW',
    machineType: 'BFMR2000EK',
    aangemaakt: '2026-01-10',
    status: 'actief',
    plannerUrl: ''
  },
  {
    id: '201268_BFR500',
    projectnr: '201268',
    servicenr: '201231',
    naam: 'BFR500',
    klant: 'Ander Bedrijf NV',
    oplevering: '2026-10-01',
    pl: 'PJ',
    eng: 'KE',
    wvb: 'RD',
    machineType: 'BFR500',
    aangemaakt: '2026-02-20',
    status: 'actief',
    plannerUrl: ''
  },
  {
    id: '201250_BFM800',
    projectnr: '201250',
    servicenr: '201205',
    naam: 'BFM800',
    klant: 'Klant C Holding',
    oplevering: '2026-03-01',
    pl: 'MB',
    eng: 'SH',
    wvb: 'TW',
    machineType: 'BFM800',
    aangemaakt: '2025-09-15',
    status: 'klaar',
    plannerUrl: ''
  },
  {
    id: '201682_MR',
    projectnr: '201682',
    servicenr: '201338',
    naam: 'BFMR1000EK',
    klant: 'Krafteam',
    oplevering: '2026-06-16',
    pl: 'SH',
    eng: 'SH',
    wvb: 'SH',
    machineType: 'MR',
    aangemaakt: '2026-06-02',
    status: 'actief',
    plannerUrl: ''
  },{
    id: '201700_MP',
    projectnr: '201700',
    servicenr: '201352',
    naam: 'BFMP750E',
    klant: 'Michels',
    oplevering: '2027-01-08',
    pl: 'SL',
    eng: 'SL',
    wvb: 'SL',
    machineType: 'MP',
    aangemaakt: '2026-06-02',
    status: 'actief',
    plannerUrl: ''
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
