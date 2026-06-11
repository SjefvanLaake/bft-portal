# Mail aan Bever Software — read-only PowerAll Connect API voor demo

**Datum:** 2026-06-11 · **Status:** concept, klaar om te mailen
**Doel:** binnen de rolverdeling die Bever zelf aangaf (infra ja, app-bouw/-beheer nee) de **read-only API-toegang** losmaken die de demo blokkeert. Hosting van de proxy doen we zelf (omweg: PowerAll Connect is een cloud-API, bereikbaar met token) → Bever staat niet op het kritieke pad.

> Belangrijkste punt bovenaan, geformuleerd als acties (niet als vragenlijst). Werkt de demo-lijst af: punt 1–3 = exact wat de demo nodig heeft.

---

**Onderwerp:** PowerAll Connect API — read-only toegang voor demo BFT-portaal

Beste [naam],

Om de eerste demo van ons interne BFT-portaal te kunnen bouwen, hebben we van jullie kant nog **één ding** nodig: **read-only toegang tot de PowerAll Connect API**. De sleutel is al goedgekeurd; we horen graag langs welke weg die ons bereikt en hoe we ons authenticeren. Willen jullie ons daarvoor in contact brengen met de PowerAll-helpdesk voor de technische details?

Ter geruststelling over de scope: we bouwen een kleine, **read-only** demo die live werkordergegevens uit PowerAll naast onze eigen referentie-stuklijst toont. De sleutel blijft **server-side** (nooit in de browser); we hosten dit demo-onderdeel **zelf** via een kleine proxy. We vragen jullie dus uitdrukkelijk **niet** om de applicatie te bouwen, te hosten of te beheren — alleen om de API-toegang mogelijk te maken. Dat sluit aan bij de rolverdeling uit jullie eerdere antwoord.

Wat we concreet van jullie nodig hebben:

1. **Bevestig langs welke weg de reeds goedgekeurde sleutel ons bereikt** (en dat deze **read-only** gescoped is). Wordt de sleutel door PowerAll zelf uitgegeven, dan volstaat dat we weten waar we hem ophalen.
2. **Breng ons in contact met de PowerAll-helpdesk** voor de auth-methode en het endpoint (`connect.powerall.io/v1`).
3. **Bevestig of we een test-/sandbox-omgeving gebruiken** of read-only op de productieomgeving werken — en of er **geen IP-restrictie** op de Connect-API staat (we benaderen hem vanaf onze eigen proxy).

Zodra dit geregeld is, kunnen wij de demo volledig zelfstandig afbouwen. De bredere live-omgeving (Entra-app, SharePoint, Azure-hosting) pakken we als een apart, later traject op — daar komen we separaat op terug.

Met vriendelijke groet,
[Sjef]

---

## Achtergrond (niet meesturen)

- **Waarom alleen toegang vragen:** Bever gaf aan de app niet te bouwen/beheren/hosten en verwees voor de API door naar de PowerAll-helpdesk (zie `Checklist_Beheerder_LiveHosting.md`). Deze mail blijft binnen die grens.
- **De omweg:** `connect.powerall.io` is een internet-cloud-API; met een token draait onze read-only proxy overal. Bever-hosting is dus géén demo-blokker — alleen sleutel + auth-methode zijn dat.
- **Wat hierna van ons komt:** compare-logica van de V1-Stuklijstvergelijker porten naar V2 en `parseFile()` → `fetchWorkOrderLines()` op `WorkOrderLine`. Zie `PvA_MachineBOM_Materiaaldekking.md` §6b.
- **Nog buiten deze mail (voor de echte tool, niet de demo):** WO↔BFT-projectnummer-veld bevestigen; rate limits.
