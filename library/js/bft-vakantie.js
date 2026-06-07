/**
 * bft-vakantie.js — gedeelde afwezigheids-/vakantiebron (per persoon)
 * ────────────────────────────────────────────────────────────────────────
 * Vakantie/vrij is een eigenschap van een PERSOON, niet van een project.
 * Daarom één gedeelde bron, gesleuteld op de stabiele medewerker-`id`
 * (zie bft-medewerkers.js: "toewijzingen bewaren de id, niet de naam").
 *
 * Hierdoor schaalt elke weergave zonder herbouw:
 *   - Personeelsplanning: de vakantie-band van de gekozen persoon.
 *   - OverallPlanning: afwezigheids-band die per week aggregeert wie weg is
 *     (toggle: alleen verantwoordelijken ↔ heel personeelsbestand).
 *
 * Vervang later door BFTGraph.query/.update('BFT_Vakantie'). Eén bron voor
 * álle tools (zie [[gedeelde-data-principe]]).
 *
 * Datamodel (localStorage 'bft_v2_vakantie'):
 *   { "<persoonId>": [ { jaar:Number, week:Number, half:Boolean } ] }
 *   - jaar = kalenderjaar (lost de oude jaarloze opslag op).
 *   - half = halve week vrij (anders hele week).
 * ────────────────────────────────────────────────────────────────────────
 */

var BFT_VAKANTIE_LS = 'bft_v2_vakantie';

/* Volledige map { id: [entries] } uit de store (defensief). */
function bftVakantieMap() {
  try { var r = localStorage.getItem(BFT_VAKANTIE_LS); var m = r ? JSON.parse(r) : null; return (m && typeof m === 'object') ? m : {}; }
  catch (e) { return {}; }
}
function bftVakantieMapOpslaan(m) {
  try { localStorage.setItem(BFT_VAKANTIE_LS, JSON.stringify(m || {})); } catch (e) {}
}

/* Normaliseer één entry → { jaar, week, half }. */
function bftNormVakEntry(e) {
  return { jaar: Number(e.jaar), week: Number(e.week), half: !!e.half };
}

/* Vakantie-entries van één persoon, optioneel op jaar gefilterd. */
function bftVakantieVoor(persoonId, jaar) {
  if (!persoonId) return [];
  var arr = (bftVakantieMap()[persoonId] || []).map(bftNormVakEntry);
  return (jaar == null) ? arr : arr.filter(function (e) { return e.jaar === Number(jaar); });
}

/* Entry voor (persoon, jaar, week) of null. */
function bftVakantieEntry(persoonId, jaar, week) {
  jaar = Number(jaar); week = Number(week);
  var a = bftVakantieVoor(persoonId, jaar);
  for (var i = 0; i < a.length; i++) if (a[i].week === week) return a[i];
  return null;
}

/* Zet/overschrijf vakantie voor (persoon, jaar, week). half=true → halve week. */
function bftVakantieZet(persoonId, jaar, week, half) {
  if (!persoonId) return;
  jaar = Number(jaar); week = Number(week);
  var m = bftVakantieMap();
  var arr = (m[persoonId] || []).map(bftNormVakEntry);
  var gevonden = false;
  arr = arr.map(function (e) {
    if (e.jaar === jaar && e.week === week) { gevonden = true; return { jaar: jaar, week: week, half: !!half }; }
    return e;
  });
  if (!gevonden) arr.push({ jaar: jaar, week: week, half: !!half });
  m[persoonId] = arr;
  bftVakantieMapOpslaan(m);
}

/* Wis vakantie voor (persoon, jaar, week). */
function bftVakantieWis(persoonId, jaar, week) {
  if (!persoonId) return;
  jaar = Number(jaar); week = Number(week);
  var m = bftVakantieMap();
  if (!m[persoonId]) return;
  m[persoonId] = m[persoonId].map(bftNormVakEntry).filter(function (e) { return !(e.jaar === jaar && e.week === week); });
  if (!m[persoonId].length) delete m[persoonId];
  bftVakantieMapOpslaan(m);
}

/* Vervang de volledige vakantie-lijst van één persoon (bv. import/migratie). */
function bftVakantieZetLijst(persoonId, entries) {
  if (!persoonId) return;
  var m = bftVakantieMap();
  var arr = (entries || []).map(bftNormVakEntry).filter(function (e) { return e.week && e.jaar; });
  if (arr.length) m[persoonId] = arr; else delete m[persoonId];
  bftVakantieMapOpslaan(m);
}

/* Medewerker-id bij een naam/code (2-3 letters). Leeg → ''. */
function bftMedewerkerIdVoorNaam(naam) {
  if (!naam || typeof bftAlleMedewerkers !== 'function') return '';
  var h = String(naam).trim().toLowerCase();
  var m = bftAlleMedewerkers().filter(function (x) { return (x.naam || '').trim().toLowerCase() === h; })[0];
  return m ? m.id : '';
}

/* Aggregatie voor een afwezigheids-band: per week → lijst {id, naam, half}.
   ids = optionele set persoon-ids (bv. alleen verantwoordelijken); leeg/null
   = heel personeelsbestand (alle medewerkers). */
function bftVakantiePerWeek(jaar, ids) {
  jaar = Number(jaar);
  var perWeek = {};
  var alle = (typeof bftAlleMedewerkers === 'function') ? bftAlleMedewerkers() : [];
  var naamVan = {}; alle.forEach(function (m) { naamVan[m.id] = m.naam; });
  var setIds = (ids && ids.length) ? ids.slice() : alle.map(function (m) { return m.id; });
  setIds.forEach(function (id) {
    bftVakantieVoor(id, jaar).forEach(function (e) {
      (perWeek[e.week] = perWeek[e.week] || []).push({ id: id, naam: naamVan[id] || id, half: e.half });
    });
  });
  return perWeek;
}

/* Namespace — handig voor tools die liever via één object werken. */
var BFTVakantie = {
  LS: BFT_VAKANTIE_LS,
  map: bftVakantieMap,
  voor: bftVakantieVoor,
  entry: bftVakantieEntry,
  zet: bftVakantieZet,
  wis: bftVakantieWis,
  zetLijst: bftVakantieZetLijst,
  idVoorNaam: bftMedewerkerIdVoorNaam,
  perWeek: bftVakantiePerWeek
};

/* Node-test-export (browser laadt via <script> en negeert dit). */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BFTVakantie: BFTVakantie, bftVakantieMap: bftVakantieMap, bftVakantieVoor: bftVakantieVoor,
    bftVakantieEntry: bftVakantieEntry, bftVakantieZet: bftVakantieZet, bftVakantieWis: bftVakantieWis,
    bftVakantieZetLijst: bftVakantieZetLijst, bftVakantiePerWeek: bftVakantiePerWeek,
    bftMedewerkerIdVoorNaam: bftMedewerkerIdVoorNaam
  };
}
