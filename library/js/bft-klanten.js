/**
 * bft-klanten.js — gedeelde klantenlijst (stamgegevens)
 * ────────────────────────────────────────────────────────────────────────
 * Centrale lijst van klanten, voor keuzelijsten bij het aanmaken van
 * projecten (zodat klantnamen consistent zijn i.p.v. vrije tekst).
 *
 * Vervang later door BFTGraph.query('BFT_Klanten'). Beheer voorlopig
 * zoals bft-projects.js / bft-medewerkers.js: aanpassen + git push.
 * ────────────────────────────────────────────────────────────────────────
 */
const BFT_KLANTEN = [
  { id: 'kl_demo',    naam: 'Demo Klant BV',    plaats: '' },
  { id: 'kl_ander',   naam: 'Ander Bedrijf NV', plaats: '' },
  { id: 'kl_holding', naam: 'Klant C Holding',  plaats: '' }
];

/* <option>-regels voor een <datalist>. Datalist = suggestie, niet afgedwongen
   → een nieuwe/eenmalige klant kun je alsnog intypen. */
function bftKlantOptions() {
  return BFT_KLANTEN
    .map(function (k) { return '<option value="' + k.naam + '">' + (k.plaats || '') + '</option>'; })
    .join('');
}
