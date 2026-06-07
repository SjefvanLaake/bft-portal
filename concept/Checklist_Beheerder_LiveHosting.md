# Checklist voor de softwarebeheerder — live hosting BFT-toolset

**Aan:** softwarebeheerder (M365 / SharePoint / Azure / PowerAll)
**Van:** Bofram Techniek
**Doel:** de interne BFT-toolset (web) live brengen, gekoppeld aan M365/SharePoint (gedeelde data) en PowerAll (ERP). Bofram host dit **niet** op een eigen server. Graag onderstaande punten beoordelen en, waar akkoord, inrichten of toestemming verlenen.

---

## In het kort — wat het is (en niet is)

- Een **webapplicatie met interne tools** (planning, projectbeheer, checklists e.d.) voor Bofram-medewerkers.
- **Inloggen met het eigen Bofram-M365-account** (Entra ID / Azure AD). Geen aparte wachtwoorden.
- **Gedeelde data in SharePoint-lijsten** — gelezen/geschreven **namens de ingelogde gebruiker** (dus binnen diens eigen rechten), niet met brede tenant-toegang.
- **PowerAll alleen lezend (v1)**, via een afgeschermde proxy; bestellen/muteren blijft in PowerAll.
- **Geen eigen server bij Bofram.** Frontend + eventuele proxy draaien gehost (voorkeur: Azure, in jullie tenant).
- **Geen geheimen in de browser:** de PowerAll-sleutel staat uitsluitend serverside (Key Vault).

---

## 1. Entra ID (Azure AD) — app-registratie  ☐ akkoord / ☐ inrichten

**Wat we vragen:** één app-registratie in de Bofram-tenant voor de webapp.

**Waarom:** zodat medewerkers met hun M365-account kunnen inloggen en de app namens hen SharePoint kan benaderen (MSAL).

**Specificatie:**
- Type: **Single-Page Application (SPA)**.
- **Redirect-URI's** (worden aangeleverd zodra de hostingplek vaststaat), bv.:
  - `https://<naam>.azurestaticapps.net` (productie)
  - `http://localhost:*` en de huidige test-URL (ontwikkeling/test) — optioneel
- **Delegated** Microsoft Graph-permissies (least privilege, ter beoordeling):
  - `User.Read` — inloggen + naam/e-mail van de gebruiker.
  - **SharePoint** — keuze:
    - voorkeur least-privilege: **`Sites.Selected`** (app krijgt alleen toegang tot de ene BFT-site, punt 2), of
    - eenvoudiger: `Sites.ReadWrite.All` (delegated → begrensd door de eigen rechten van de gebruiker).
- **Admin-consent** op de gekozen scopes.
- Geen application-/app-only permissies nodig voor de frontend (alles delegated).

**Te bevestigen door beheerder:** welke SharePoint-scope de voorkeur heeft; wie de app-registratie beheert.

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

## 4. PowerAll — API-toegang (read-only)  ☐ akkoord / ☐ aanleveren

**Wat we vragen:** lees-toegang tot de PowerAll Connect API (`connect.powerall.io/v1`).

**Waarom:** materiaaldekking/voortgang tonen naast de planning. Uitsluitend **lezen**; muteren blijft in PowerAll.

**Specificatie / aan te leveren:**
- **API-sleutel/credentials** voor **sandbox** (eerst testen) en later **productie**.
- **Auth-methode** — bevestigen (API-key header, bearer-token, OAuth?). *Dit is nu het grootste open technische punt.*
- **Toegestane endpoints/scope** (read-only volstaat).
- **Rate limits** en of een **vast uitgaand IP** / allowlist nodig is (de Azure Function kan een vast IP krijgen).

**Te bevestigen door beheerder/PowerAll-leverancier:** auth-methode, sandbox-toegang, rate limits.

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
