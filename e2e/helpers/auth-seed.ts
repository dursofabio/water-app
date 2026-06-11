/**
 * auth-seed.ts — US-006 / US-007
 *
 * Helper per creare utenti nell'Auth Emulator e seeding del documento /admins
 * tramite l'API REST dell'Auth Emulator (porta 9099).
 *
 * L'Auth Emulator espone la stessa API signUp/signIn di Firebase Auth
 * più endpoint admin-only per creare utenti senza verifica email.
 */

const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099';
const FIRESTORE_EMULATOR_URL = 'http://127.0.0.1:8080';
const PROJECT_ID = 'acquaapp-dev';

export interface TestUser {
  uid: string;
  email: string;
  password: string;
  idToken: string;
}

/**
 * Crea un utente nell'Auth Emulator e restituisce uid + idToken.
 */
export async function createAuthEmulatorUser(
  email: string,
  password: string,
): Promise<TestUser> {
  // Elimina prima se esiste già (ignora l'errore se non esiste)
  await deleteAuthEmulatorUser(email).catch(() => undefined);

  const response = await fetch(
    `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Auth Emulator signUp failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as { localId: string; idToken: string };
  return { uid: data.localId, email, password, idToken: data.idToken };
}

/**
 * Elimina tutti gli utenti dall'Auth Emulator (reset completo).
 */
export async function clearAuthEmulatorUsers(): Promise<void> {
  const response = await fetch(
    `${AUTH_EMULATOR_URL}/emulator/v1/projects/${PROJECT_ID}/accounts`,
    { method: 'DELETE' },
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Auth Emulator clear failed: ${response.status} ${body}`);
  }
}

/**
 * Elimina un utente specifico dall'Auth Emulator tramite lookup per email.
 */
async function deleteAuthEmulatorUser(email: string): Promise<void> {
  // Lookup UID by email
  const lookupResponse = await fetch(
    `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:lookup?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: [email] }),
    },
  );
  if (!lookupResponse.ok) return;
  const lookup = (await lookupResponse.json()) as { users?: { localId: string }[] };
  const uid = lookup.users?.[0]?.localId;
  if (!uid) return;

  await fetch(
    `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:delete?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ localId: uid }),
    },
  );
}

/**
 * Aggiunge un documento in /admins/{uid} nel Firestore Emulator
 * (usando il REST API senza regole di sicurezza).
 */
export async function addAdminToFirestore(uid: string): Promise<void> {
  const url = `${FIRESTORE_EMULATOR_URL}/v1/projects/${PROJECT_ID}/databases/(default)/documents/admins/${uid}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { uid: { stringValue: uid } } }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Firestore add admin failed: ${response.status} ${body}`);
  }
}

/**
 * Rimuove il documento /admins/{uid} dal Firestore Emulator.
 */
export async function removeAdminFromFirestore(uid: string): Promise<void> {
  const url = `${FIRESTORE_EMULATOR_URL}/v1/projects/${PROJECT_ID}/databases/(default)/documents/admins/${uid}`;
  await fetch(url, { method: 'DELETE' });
}

/**
 * Inietta il token dell'utente nel browser Angular tramite page.evaluate.
 * Usa la Firebase JS SDK già caricata nell'app per chiamare signInWithCustomToken
 * oppure usa direttamente l'API REST signIn con email+password.
 *
 * Poiché il LoginComponent usa signInWithPopup (non testabile in Playwright),
 * i test E2E bypassano il popup e iniettano direttamente lo stato di auth
 * tramite signInWithEmailAndPassword usando l'idToken dell'emulator.
 *
 * Returns the idToken for the signed-in user.
 */
export async function signInUserInBrowser(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
): Promise<string> {
  return page.evaluate(
    async ({ email, password, authEmulatorUrl }: { email: string; password: string; authEmulatorUrl: string }) => {
      // Use the Auth Emulator REST API directly from the browser context
      const response = await fetch(
        `${authEmulatorUrl}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        },
      );
      if (!response.ok) {
        throw new Error(`signIn failed: ${response.status}`);
      }
      const data = (await response.json()) as { idToken: string };
      return data.idToken;
    },
    { email, password, authEmulatorUrl: AUTH_EMULATOR_URL },
  );
}

// ─── US-007: localStorage auth seeding ───────────────────────────────────────

const API_KEY = 'REPLACE_WITH_API_KEY';
const APP_NAME = '[DEFAULT]';

/**
 * Chiave localStorage usata da Firebase SDK per persistere la sessione utente.
 * Formato: firebase:authUser:{apiKey}:{appName}
 */
export const FIREBASE_AUTH_LS_KEY = `firebase:authUser:${API_KEY}:${APP_NAME}`;

/**
 * Crea un utente nell'Auth Emulator (Node context), poi inietta il token
 * nel localStorage del browser tramite addInitScript PRIMA che Angular carichi.
 *
 * In questo modo onAuthStateChanged nell'app riceve l'utente dalla sessione
 * persistita, esattamente come dopo un page reload con sessione attiva.
 *
 * Deve essere chiamata PRIMA di page.goto().
 */
export async function seedAuthStateInBrowser(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
): Promise<void> {
  const response = await fetch(
    `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Auth Emulator signIn failed: ${response.status} ${body}`);
  }

  const data = await response.json() as {
    localId: string;
    email: string;
    idToken: string;
    refreshToken: string;
    expiresIn: string;
  };

  const firebaseUser = {
    uid: data.localId,
    email: data.email,
    emailVerified: false,
    displayName: null,
    isAnonymous: false,
    photoURL: null,
    providerData: [
      {
        providerId: 'password',
        uid: data.email,
        displayName: null,
        email: data.email,
        phoneNumber: null,
        photoURL: null,
      },
    ],
    stsTokenManager: {
      refreshToken: data.refreshToken,
      accessToken: data.idToken,
      expirationTime: Date.now() + parseInt(data.expiresIn, 10) * 1000,
    },
    createdAt: String(Date.now()),
    lastLoginAt: String(Date.now()),
    apiKey: API_KEY,
    appName: APP_NAME,
  };

  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    },
    { key: FIREBASE_AUTH_LS_KEY, value: firebaseUser },
  );
}
