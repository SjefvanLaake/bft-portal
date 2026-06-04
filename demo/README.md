# BFT demo-recorder (Optie 1 — gescripte opname van de échte tool)

Playwright stuurt een **echte** BFT-tool door een scenario (met zichtbare cursor +
titelkaarten) en neemt op:

- **`output/<id>.mp4`** — H.264, PowerPoint-vriendelijk (insluiten met *Invoegen → Video*)
- **`output/<id>.gif`** — voor in een web-handleiding of snelle preview
- **`output/<id>.webm`** — bronopname
- **`output/shots/<id>/`** — stap-screenshots (ook bruikbaar als geannoteerd storyboard in een PDF)

Eén bron = de echte tool. Verandert de UI? **Opnieuw draaien** → beelden zijn weer actueel.
Dit is meteen de weg voor het uiteindelijke portaal (in CI te genereren).

## Eenmalig installeren
```
cd demo
npm install
npx playwright install chromium ffmpeg
```
Op deze machine met TLS-onderschepping: zet `NODE_OPTIONS=--use-system-ca` vóór de
twee commando's (anders faalt de download — zie de project-memo).

## Draaien
```
node record.mjs            # alle scenario's
node record.mjs overall    # alleen scenario's waarvan de id 'overall' bevat
node smoke.mjs             # snelle sanity-check (screenshot)
```
Output komt in `demo/output/` (genegeerd door git — lokaal/voor de presentatie).

## Een tool toevoegen
Zet een blok bij in de `SCENARIOS`-array onderaan `record.mjs`:
```js
{
  id: 'mijntool',
  tool: 'tools/BFT_MijnTool.html',
  seed: { data: {...}, fn: (d) => { /* localStorage seeden, optioneel */ } },
  run: async (h) => {
    await h.card('Bofram Portaal', 'MijnTool — wat het doet');
    await h.click('#eenKnop');
    await h.pause(700);
    await h.shot('stap1');
    // helpers: h.click(sel), h.paintDrag(cellSel, van, tot), h.card(titel, sub),
    //          h.pause(ms), h.shot(naam), h.moveTo(sel)
  }
}
```
**Tip (geleerd):** klik op een *klein, links/zichtbaar* element (bv. `.og-caret`), niet op
een volledige rij — in week-modus is een rij superbreed en valt het midden buiten beeld.

## Afhankelijkheden
- `playwright` (browser) + `@ffmpeg-installer/ffmpeg` (volwaardige ffmpeg met H.264;
  Playwright's eigen ffmpeg is uitgekleed en kan alleen webm opnemen).
- `node_modules/` en `output/` staan in `.gitignore`.
