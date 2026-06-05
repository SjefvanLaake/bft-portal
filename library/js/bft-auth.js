/**
 * bft-auth.js — BFTAuth v1.0
 * ─────────────────────────────────────────────────────────────────
 * MSAL-wrapper voor Azure AD SSO met M365-accounts.
 *
 * VEREIST: msal-browser CDN geladen vóór dit script:
 *   <script src="https://alcdn.msauth.net/browser/2.38.3/js/msal-browser.min.js"></script>
 *   <script src="../library/js/bft-auth.js" defer></script>
 *
 * ── Configuratie ──────────────────────────────────────────────────
 * Vul TENANT_ID en CLIENT_ID in zodra IT de App Registration levert.
 * ─────────────────────────────────────────────────────────────────
 */
const BFTAuth = (function () {
  'use strict';

  /* ── Pas deze twee waarden aan zodra IT ze levert ── */
  const TENANT_ID = 'PLACEHOLDER_TENANT_ID';
  const CLIENT_ID = 'PLACEHOLDER_CLIENT_ID';

  const SCOPES   = ['Sites.ReadWrite.All', 'User.Read'];
  const ADMINS   = [
    /* M365-bedrijfse-mailadressen van beheerders — invullen na ingebruikname.
       Geen privé-/gmail-adressen: isAdmin() matcht op de SSO-identiteit. */
    'PLACEHOLDER_ADMIN@bofram.nl'
  ];

  /* ── Interne state ── */
  let _msal    = null;
  let _account = null;
  let _ready   = false;

  /* ── Controleer of placeholders nog niet zijn ingevuld ── */
  function isConfigured() {
    return TENANT_ID !== 'PLACEHOLDER_TENANT_ID' &&
           CLIENT_ID !== 'PLACEHOLDER_CLIENT_ID';
  }

  /* ── Init: MSAL instantiëren + stil inloggen als er al een sessie is ── */
  async function init() {
    if (!isConfigured()) {
      console.warn('[BFTAuth] Tenant ID / Client ID nog niet ingevuld — mock-modus actief.');
      return false;
    }
    if (!window.msal) {
      console.error('[BFTAuth] msal-browser niet geladen. Voeg de CDN-script tag toe.');
      return false;
    }

    try {
      _msal = new msal.PublicClientApplication({
        auth: {
          clientId:    CLIENT_ID,
          authority:   `https://login.microsoftonline.com/${TENANT_ID}`,
          redirectUri: window.location.origin + window.location.pathname
        },
        cache: { cacheLocation: 'localStorage', storeAuthStateInCookie: false },
        system: { loggerOptions: { loggerCallback: () => {} } }
      });

      await _msal.initialize();

      /* Verwerk redirect-respons (fallback voor browsers zonder popup-support) */
      await _msal.handleRedirectPromise();

      /* Probeer stil in te loggen met bestaande sessie */
      const accounts = _msal.getAllAccounts();
      if (accounts.length > 0) {
        _account = accounts[0];
        _ready   = true;
      }

      return _ready;
    } catch (err) {
      console.error('[BFTAuth] init mislukt:', err);
      return false;
    }
  }

  /* ── Login via popup (vereist user-gesture: klik op knop) ── */
  async function login() {
    if (!_msal) throw new Error('[BFTAuth] init() eerst aanroepen.');
    try {
      const result = await _msal.loginPopup({ scopes: SCOPES });
      _account = result.account;
      _ready   = true;
      return _account;
    } catch (err) {
      if (err.errorCode === 'user_cancelled') return null;
      throw err;
    }
  }

  /* ── Logout ── */
  async function logout() {
    if (!_msal || !_account) return;
    await _msal.logoutPopup({ account: _account });
    _account = null;
    _ready   = false;
  }

  /* ── Token ophalen: stil proberen, anders popup ── */
  async function getToken() {
    if (!isConfigured()) return null;
    if (!_msal)          throw new Error('[BFTAuth] init() eerst aanroepen.');
    if (!_account)       throw new Error('[BFTAuth] Niet ingelogd.');

    const request = { scopes: SCOPES, account: _account };

    try {
      const result = await _msal.acquireTokenSilent(request);
      return result.accessToken;
    } catch {
      /* Stil ophalen mislukt — toon popup */
      const result = await _msal.acquireTokenPopup(request);
      return result.accessToken;
    }
  }

  /* ── Huidige gebruiker ── */
  function getUser() {
    if (!_account) return null;
    return {
      naam:  _account.name  || _account.username,
      email: _account.username,
      id:    _account.localAccountId
    };
  }

  /* ── Beheerderscontrole ── */
  function isAdmin() {
    const user = getUser();
    if (!user) return false;
    return ADMINS.map(e => e.toLowerCase()).includes(user.email.toLowerCase());
  }

  /* ── Status ── */
  function isReady()      { return _ready; }
  function isConfigured_  () { return isConfigured(); }

  return { init, login, logout, getToken, getUser, isAdmin, isReady, isConfigured: isConfigured_ };
})();
