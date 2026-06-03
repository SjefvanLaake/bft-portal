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

/* ──────────────────────────────────────────────────────────────────────
   Runtime-store (mock-fase) — identiek patroon aan bft-projects.js.
   BFT_MEDEWERKERS = seed in code; toegevoegde/bewerkte personen komen in
   localStorage 'bft_v2_medewerkers'. Alles leest via bftAlleMedewerkers()
   → seed + custom samengevoegd (custom wint op id; tombstone verwijdert).
   Bij go-live: déze functies vervangen door BFTGraph.query/.create/.delete —
   het ene swap-punt. Toewijzingen elders bewaren de stabiele `id`, niet de
   naam, zodat ze de overgang overleven (ook bij hernoemen).
   ────────────────────────────────────────────────────────────────────── */
const BFT_MEDEWERKERS_LS = 'bft_v2_medewerkers';

function bftCustomMedewerkers() {
  try { var r = localStorage.getItem(BFT_MEDEWERKERS_LS); return r ? JSON.parse(r) : []; }
  catch (e) { return []; }
}

/* Samengevoegde lijst: seed + custom. Custom op id wint (= bewerken);
   een custom-entry met `_deleted:true` is een tombstone (= verwijderen). */
function bftAlleMedewerkers() {
  var custom = bftCustomMedewerkers();
  var ids = custom.map(function (m) { return m.id; });
  var basis = BFT_MEDEWERKERS.filter(function (m) { return ids.indexOf(m.id) === -1; });
  var live  = custom.filter(function (m) { return !m._deleted; });
  return basis.concat(live);
}

/* Stabiel, uniek id voor een nieuwe persoon. */
function bftNieuwMedewerkerId() {
  return 'mdw_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

/* Upsert (toevoegen of bewerken) in de runtime-store. */
function bftSlaMedewerkerOp(mdw) {
  if (!mdw || !mdw.id) return false;
  var custom = bftCustomMedewerkers().filter(function (m) { return m.id !== mdw.id; });
  custom.push({ id: mdw.id, naam: mdw.naam, discipline: mdw.discipline || 'Overig' });
  try { localStorage.setItem(BFT_MEDEWERKERS_LS, JSON.stringify(custom)); return true; }
  catch (e) { return false; }
}

/* Verwijderen: custom-only entry valt gewoon weg; een seed-persoon krijgt een
   tombstone zodat hij uit de merge verdwijnt. */
function bftVerwijderMedewerker(id) {
  if (!id) return false;
  var custom = bftCustomMedewerkers().filter(function (m) { return m.id !== id; });
  if (BFT_MEDEWERKERS.some(function (m) { return m.id === id; })) {
    custom.push({ id: id, _deleted: true });
  }
  try { localStorage.setItem(BFT_MEDEWERKERS_LS, JSON.stringify(custom)); return true; }
  catch (e) { return false; }
}

/* <option>-regels voor een <datalist>, optioneel gefilterd op discipline.
   Datalist = suggestie, niet afgedwongen → externen/uitzendkrachten kunnen
   alsnog een naam intypen. Leest de samengevoegde lijst (seed + custom). */
function bftMedewerkerOptions(discipline) {
  return bftAlleMedewerkers()
    .filter(function (m) { return !discipline || m.discipline === discipline; })
    .map(function (m) { return '<option value="' + m.naam + '">' + m.discipline + '</option>'; })
    .join('');
}
