/**
 * bft-medewerkers.js — gedeelde medewerkerslijst (stamgegevens)
 * ────────────────────────────────────────────────────────────────────────
 * Centrale lijst van medewerkers per discipline. Wordt gebruikt voor
 * keuzelijsten (PL / Engineer / WVB) in NieuwProject, OverallPlanning en
 * ResourcePlanning, zodat namen consistent zijn i.p.v. vrije tekst.
 *
 * Vervang later door BFTGraph.query('BFT_Medewerkers'). Beheer voorlopig
 * zoals bft-projects.js: aanpassen + git push (zie BFT_NieuwProject als beheer).
 *
 * Disciplines sluiten aan op de OverallPlanning/ResourcePlanning-disciplines.
 * ────────────────────────────────────────────────────────────────────────
 */
const BFT_MEDEWERKERS = [
  { id: 'mdw_jdv', naam: 'J. de Vries', discipline: 'Projectleider' },
  { id: 'mdw_pja', naam: 'P. Jansen',   discipline: 'Projectleider' },
  { id: 'mdw_mba', naam: 'M. Bakker',   discipline: 'Projectleider' },
  { id: 'mdw_she', naam: 'S. Hendriks', discipline: 'Engineering' },
  { id: 'mdw_kev', naam: 'K. Evers',    discipline: 'Engineering' },
  { id: 'mdw_two', naam: 'T. Wouters',  discipline: 'WVB' },
  { id: 'mdw_rde', naam: 'R. Dekker',   discipline: 'WVB' }
];

/* <option>-regels voor een <datalist>, optioneel gefilterd op discipline.
   Datalist = suggestie, niet afgedwongen → externen/uitzendkrachten kunnen
   alsnog een naam intypen. */
function bftMedewerkerOptions(discipline) {
  return BFT_MEDEWERKERS
    .filter(function (m) { return !discipline || m.discipline === discipline; })
    .map(function (m) { return '<option value="' + m.naam + '">' + m.discipline + '</option>'; })
    .join('');
}
