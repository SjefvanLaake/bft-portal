# Checklist voor IT — live hosting BFT-toolset (Entra ID / SharePoint / Azure)

**Aan:** IT (Entra ID / SharePoint / Azure)
**Van:** Bofram Techniek
**Doel:** de interne BFT-toolset (web) live brengen, gekoppeld aan M365/SharePoint (gedeelde data) en PowerAll (ERP). Bofram host dit **niet** op een eigen server. Graag onderstaande punten beoordelen en, waar akkoord, inrichten of toestemming verlenen.

> **Twee-sporen-splitsing (2026-06-12):** dit is het **IT-spoor** (Entra ID / SharePoint / Azure — de live-omgeving). De **PowerAll API-sleutel/data** loopt via een apart spoor bij de **PowerAll-helpdesk** (zie `Mail_Bever_PowerAll_API.md`) en blokkeert de eerste demo; dit IT-spoor is parallel/later en is **geen** demo-afhankelijkheid.

---

## Status na antwoord Bever (2026-06-10)

Bever beantwoordde de mail puntsgewijs (1–6). **Rode draad:** Bever heeft géén eigen
ervaring met het bouwen van AI-tools/webservers en levert daar **geen support/advies**
op — Bever is de infra-/M365-/PowerAll-leverancier, niet de bouwer/beheerder van de app.

| # | Onze openstaande vraag | Bever | Status |
|---|---|---|---|
| 1 Entra-app | Scope-keuze? Wie beheert? | Kan app-registratie maken/inrichten; niet verantwoordelijk voor de software erachter. | **Deels** — inrichten kan ✅; **scope-keuze open**. |
| 2 SharePoint | Nieuw vs bestaand? Toegangsgroep? | Sites aanmaken kan; on-prem-data migreren = **apart project**. | **Deels** — aanmaken ✅; **site-keuze + groep open**. |
| 3 Hosting | Azure-abonnement? Wie deployt? | Azure kan; on-prem op huidige server sterk afgeraden; evt. VM op nieuwe server of sterk workstation. | **Open** — geen Azure-commitment; "wie deployt" open. ⚠️ botst met "geen eigen server". |
| 4 PowerAll API | Auth-methode, sandbox, rate limits. | Doorverwezen naar **PowerAll-helpdesk** (aanbod om door te zetten). | **Niet beantwoord (doorverwezen)** — grootste open technische punt. |
| 5 Security | (door ons als randvoorwaarde geframed) | Behandel als **speerpunt/eerste punt**, niet als randvoorwaarde. | **Advies** — overnemen: security naar voren. |
| 6 Proces & rollen | Wie keurt/richt in/deployt? Contactpersoon? | Geen beheer/support op zo'n tool; adviseert **3e partij**; admin-accounts: stemt af. | **Deels** — beheer/deploy ≠ Bever → 3e partij/intern; goedkeuring/contactpersoon open. |

**Beantwoord:** Bever kan Entra-app + SharePoint-site/lijsten inrichten (1–2); duidelijk dat Bever de app niet bouwt/beheert/deployt (6).

**Nog open aan onze zijde:** (i) PowerAll auth/sandbox/rate limits → PowerAll-helpdesk; (ii) hosting-keuze Azure-in-tenant vs VM/workstation + wie deployt; (iii) SharePoint-scope + toegangsgroep; (iv) eigenaar app-beheer/deploy (3e partij of intern); (v) goedkeuring + contactpersoon.

---

## In het kort — wat het is (en niet is)

- Een **webapplicatie met interne tools** (planning, projectbeheer, checklists e.d.) voor Bofram-medewerkers.
- **Inloggen met het eigen Bofram-M365-account** (Entra ID / Azure AD). Geen aparte wachtwoorden.
- **Gedeelde data in SharePoint-lijsten** — gelezen/geschreven **namens de ingelogde gebruiker** (dus binnen diens eigen rechten), niet met brede tenant-toegang.
- **PowerAll alleen lezend (v1)**, via een afgeschermde proxy; bestellen/muteren blijft in PowerAll.
- **Geen eigen server bij Bofram.** Frontend + eventuele proxy draaien gehost (voorkeur: Azure, in jullie tenant).
- **Geen geheimen in de browser:** de PowerAll-sleutel staat uitsluitend serverside (Key Vault).

---

## 1. Entra ID (Azure AD) — app-registratie  ✅ AANGEMAAKT — alleen admin-consent nog nodig

**Status (2026-06-13):** de app-registratie bestaat al (zelf aangemaakt door Bofram). Inloggen met M365 (`User.Read`) werkt al op de live testhub. Het **enige** dat IT nog moet doen, is **admin-consent verlenen** voor de SharePoint-scope — die knop is voor ons grijs.

**App-gegevens:**
- Naam: **BFT-Portal**
- Toepassings-(client-)id: **`4b66833a-51d4-464b-be6d-e895627a7ad9`**
- Tenant-id: **`74eb8598-538b-4b3b-9245-18abf10f5174`**
- Type: **Single-Page Application (SPA)**; redirect-URI's geregistreerd (GitHub Pages-testhub; productie-SWA-URL volgt).
- Huidige Graph-permissie: **`User.Read`** (gedelegeerd, werkt zonder admin-consent).

**Wat IT moet doen — één actie:**
1. Voeg de SharePoint-scope toe en **verleen admin-consent** voor app `4b66833a-…`. Scope-keuze:
   - **voorkeur least-privilege: `Sites.Selected`** (app krijgt alleen toegang tot de ene BFT-site, punt 2), of
   - eenvoudiger: `Sites.ReadWrite.All` (gedelegeerd → begrensd door de eigen rechten van de ingelogde gebruiker).
2. Bij `Sites.Selected`: de app expliciet schrijfrechten geven op alléén de BFT-site (punt 2).

**Te bevestigen door IT:** welke SharePoint-scope de voorkeur heeft. Géén nieuwe app of app-only-permissies nodig — alles gedelegeerd op de bestaande registratie.

---

## 2. SharePoint — site + lijsten  ☐ akkoord / ☐ inrichten

**Wat we vragen:** één SharePoint-site (nieuw of bestaand) met enkele lijsten als gedeelde datalaag.

**Waarom:** de tools delen data (één bron). Lijsten zijn queryebaar en passen 1-op-1 op het huidige datamodel.

**Specificatie (lijsten — exacte kolommen leveren wij aan):**
- `BFT_Projecten` (projectnr, naam, klant-ref, PL/EN/WVB/verantwoordelijke-refs, oplevering, status …)
- `BFT_Klanten` (naam, plaats, relatienummer)
- `BFT_Medewerkers` (naam, rollen)  — of koppelen aan bestaande personeels-/Entra-gegevens, ter overleg
- `BFT_Planning` (per project: weken/disciplines)
- `BFT_Vakantie` (per persoon: jaar/week/halve week)
- **Toegang:** welke groep medewerkers mag lezen/schrijven (bv. een M365-/security-groep).
- Bij `Sites.Selected`: de app expliciet toegang geven tot **alleen deze site**.

**Te bevestigen door beheerder:** nieuwe site vs. bestaande; welke M365-groep toegang krijgt.

---

## 3. Hosting — Azure Static Web Apps + Functions + Key Vault  ☐ akkoord / ☐ inrichten

**Wat we vragen:** een hostingplek in **jullie Azure-abonnement** (zelfde tenant als M365) voor:
- **Azure Static Web App** — de frontend (statische bestanden).
- **Azure Functions** — een kleine proxy voor PowerAll (punt 4).
- **Azure Key Vault** — opslag van de PowerAll-sleutel (niet in code/browser).

**Waarom:** geen eigen server; co-locatie met M365 maakt login, secrets en Graph eersteklas. Static Web Apps kent een gratis/instaptier.

**Alternatief (indien geen Azure gewenst):** frontend op GitHub Pages/Netlify + proxy als Netlify/Cloudflare-function. Dan staan proxy + sleutel buiten de M365-tenant (minder nette governance) — minder voorkeur, maar mogelijk.

**Te bevestigen door beheerder:** Azure-abonnement beschikbaar stellen (of een Bofram-abonnement in jullie tenant); wie deployt.

---

## 4. PowerAll — API-toegang (read-only)  → loopt via de PowerAll-helpdesk, NIET via IT

**Verplaatst naar het helpdesk-spoor** (`Mail_Bever_PowerAll_API.md`): de API-sleutel, auth-methode, sandbox en rate limits regelen we rechtstreeks met de PowerAll-helpdesk. Hier alleen voor de volledigheid.

**Enige IT-raakvlak (later, niet nu):** zodra de proxy van Cloudflare naar een **Azure Function** verhuist en PowerAll een **IP-allowlist** blijkt te eisen, heeft IT een **vast uitgaand IP** voor die Function nodig. Tot die tijd geen IT-actie op dit punt.

---

## 5. Security & netwerk — randvoorwaarden  ☐ beoordelen

- **Conditional Access / MFA:** de app volgt jullie bestaande beleid (inlog via Entra). Aandachtspunt als er device-/locatiebeperkingen zijn.
- **CORS / redirect-URI's:** alleen de bekende hosting-URL('s) toestaan.
- **Secrets:** PowerAll-sleutel uitsluitend in Key Vault; nooit in de frontend of in Git.
- **Data:** blijft binnen jullie M365/SharePoint-tenant; geen externe opslag.
- **Logging/audit:** standaard Azure/Graph-audittrail volstaat; geen extra eisen vanuit ons.

---

## 6. Proces & rollen  ☐ afspreken

- Wie **keurt goed** (security/IT)?
- Wie **richt in** (Entra-app, SharePoint-site, Azure-resources)?
- Wie **deployt** de app en beheert updates?
- **Contactpersoon** bij Bofram voor de technische afstemming.

---

## Wat Bofram aanlevert zodra dit akkoord is
- Exacte **kolomdefinities** per SharePoint-lijst.
- De definitieve **redirect-URI('s)** zodra de hostingplek bekend is.
- Het **proxy-contract** (welke PowerAll-endpoints de Function ontsluit, read-only).
- Een **test-/acceptatieplan** (eerst sandbox + één lijst, dan uitbreiden).

## Volgorde van inrichten (voorstel)
1. Entra-app + SharePoint-site/lijsten (punt 1–2) → inloggen + data werkt.
2. Azure Static Web App (punt 3) → frontend live in de tenant.
3. PowerAll-sandbox + Function-proxy (punt 4) → ERP-koppeling.
4. Naar productie.

*Vragen of aanpassingen? Graag — dit is een voorstel, geen vast pakket.*
