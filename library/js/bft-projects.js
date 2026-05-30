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
    machineType: 'BFM800',
    aangemaakt: '2025-09-15',
    status: 'klaar'
  }
];

/* Genereer <option>-elementen voor een <select> */
function bftProjectOptions(gekozenId) {
  return '<option value="">— Kies project —</option>' +
    BFT_PROJECTEN.map(p =>
      `<option value="${p.id}" ${p.id === gekozenId ? 'selected' : ''}>${p.projectnr} · ${p.naam}</option>`
    ).join('');
}
