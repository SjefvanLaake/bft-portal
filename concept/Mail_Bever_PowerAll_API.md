# Mail aan de PowerAll-helpdesk (Bever) — read-only Connect API voor demo

**Datum:** 2026-06-12 · **Status:** concept, klaar om te mailen
**Spoor:** **PowerAll-helpdesk** (API/data). Dit is het spoor dat de **demo blokkeert**.
**NIET dit spoor:** Entra ID / SharePoint / Azure-hosting → loopt via **IT** (zie `Checklist_Beheerder_LiveHosting.md`).
**Achtergrond:** de sleutel-aanvraag ligt al bij de helpdesk en is goedgekeurd; deze mail maakt hem bruikbaar. De proxy hosten we zelf (read-only, sleutel server-side) → de helpdesk hoeft niets te bouwen of hosten.

---

**Onderwerp:** PowerAll Connect API — read-only toegang activeren (BFT-portaal)

Beste helpdesk,

Onze aanvraag voor een PowerAll Connect API-sleutel is goedgekeurd. Om die in gebruik te nemen voor een interne demo hebben we nog een paar technische details van jullie nodig.

Scope ter geruststelling: het gebruik is **uitsluitend lezend**. De sleutel blijft **server-side** in onze eigen kleine proxy (nooit in de browser); we tonen alleen werkorder-/materiaalgegevens naast onze eigen stuklijst. Muteren en bestellen blijft volledig in PowerAll.

Concreet hebben we nodig:

1. **Langs welke weg ontvangen we de goedgekeurde sleutel**, en is die **read-only** gescoped?
2. **Auth-methode** voor de Connect API (`connect.powerall.io/v1`) — API-key-header, bearer-token of OAuth? Graag de exacte header/het format.
3. Werken we op een **sandbox/test-omgeving** of read-only op productie?
4. Staat er een **IP-restrictie/allowlist** op de API? We benaderen hem vanaf een externe proxy zonder vast IP. Zo ja, welk mechanisme is mogelijk?
5. Zijn er **rate limits** waar we rekening mee moeten houden?

Zodra dit geregeld is, kunnen wij zelfstandig verder. Alvast dank.

Met vriendelijke groet,
[Sjef]

---

## Achtergrond (niet meesturen)

- **Twee-sporen-splitsing (2026-06-12):** API-sleutel/data = **helpdesk** (deze mail); Entra ID/SharePoint/Azure = **IT** (`Checklist_Beheerder_LiveHosting.md`). Niet door elkaar halen — andere afdeling, andere afhankelijkheid.
- **Demo hangt alleen aan dit spoor.** Punt 1–4 zijn de echte blokkers; punt 4 (IP-allowlist) is bovendien de go/no-go voor de Cloudflare-omweg (R3).
- **De omweg:** `connect.powerall.io` is een internet-cloud-API; met een token draait onze read-only proxy overal. Daarom is IT/Azure géén demo-blokker.
- **Technische follow-up (na sandbox-toegang, niet in deze mail):** exacte veldnamen op `WorkOrderLine` — zit `artikel` direct op de regel of via `include=Product`, en is `aantal` de behoefte of het restant (R2). Beter te toetsen tegen echte data dan vooraf te vragen.
