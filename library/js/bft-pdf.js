/**
 * bft-pdf.js — BFTPdf v1.0
 * ─────────────────────────────────────────────────────────────────
 * Gedeelde Bofram-PDF-bouwstenen voor pdfMake: één bron voor de zwarte
 * koptekstbalk, de voettekst en de glyph-fix. Vervangt het 6× gekopieerde
 * header/footer-blok in de tools.
 *
 * Vereist (vóór dit script geladen):
 *   <script src="../library/js/bft-pdf-logo.js"></script>   (optioneel: BFT_PDF_LOGO)
 *   <script src="../library/js/bft-pdf.js"></script>
 *
 * Gebruik in een tool:
 *   pdfMake.createPdf({
 *     pageMargins:[40,88,40,40],
 *     defaultStyle:{ fontSize:10, lineHeight:1.3, color:'#3d4558' },
 *     header: BFTPdf.header(titel),
 *     footer: BFTPdf.footer(titel),
 *     content
 *   }).download(...);
 *
 * BFTPdf.pdfTxt(s) is opt-in: alleen toepassen op tekst die → of ✓ kan
 * bevatten (Roboto mist die glyphs). De meeste tools hebben dit niet nodig.
 * ─────────────────────────────────────────────────────────────────
 */
var BFTPdf = (function () {
  'use strict';

  var GOUD = '#e8a000', ZWART = '#000000';

  /* Logo-cel voor de header — met BOFRAM-tekstfallback als er geen logo is. */
  function logoCel() {
    var L = (typeof BFT_PDF_LOGO !== 'undefined') ? BFT_PDF_LOGO : null;
    return L
      ? { image: L, width: 58, margin:[12,7,0,0], border:[false,false,false,false], fillColor:ZWART }
      : { text:'BOFRAM', fontSize:13, bold:true, color:GOUD, margin:[16,15,0,0], border:[false,false,false,false], fillColor:ZWART };
  }

  /* Header: zwarte balk (logo · gecentreerde titel [+ optionele subtitel]) + gele lijn.
     Het paginanummer staat alleen in de footer (zie footer()); de rechter
     90px-cel blijft als lege spacer staan zodat de titel gecentreerd blijft.
     subtitel (optioneel): kleine regel onder de titel, bv. een datum. */
  function header(titel, subtitel) {
    var midden = subtitel
      ? { stack: [
          { text: titel, fontSize:11, bold:true, color:'#fff', alignment:'center', margin:[0,12,0,0] },
          { text: subtitel, fontSize:8, color:'#c9ccd2', alignment:'center', margin:[0,1,0,0] }
        ], border:[false,false,false,false], fillColor:ZWART }
      : { text: titel, fontSize:11, bold:true, color:'#fff', alignment:'center', margin:[0,16,0,0], border:[false,false,false,false], fillColor:ZWART };
    return { stack: [
      { table: { widths: [90, '*', 90], body: [[
        logoCel(),
        midden,
        { text: '', border:[false,false,false,false], fillColor:ZWART }
      ]] }, layout: { defaultBorder:false } },
      { canvas:[{ type:'rect', x:0, y:0, w:595, h:3, color:GOUD }] }
    ] };
  }

  /* Footer-functie: titel links, "Pagina x / y" rechts. */
  function footer(titel) {
    return function (page, pages) {
      return { columns: [
        { text: titel, fontSize:8, color:'#aaa', margin:[40,8,0,0] },
        { text: 'Pagina ' + page + ' / ' + pages, fontSize:8, color:'#aaa', alignment:'right', margin:[0,8,40,0] }
      ] };
    };
  }

  /* Glyph-fix: Roboto (pdfMake-font) mist → (U+2192) en ✓ (U+2713).
     Opt-in — alleen toepassen op tekst die deze tekens kan bevatten. */
  function pdfTxt(s) {
    return String(s == null ? '' : s)
      .replace(/\s*→\s*/g, ' › ')
      .replace(/✓\s*/g, '')
      .trim();
  }

  return { header: header, footer: footer, logoCel: logoCel, pdfTxt: pdfTxt };
})();
