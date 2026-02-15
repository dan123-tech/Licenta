/**
 * Firebase Auth connector for Layer 1 (Users).
 * Lists users from Firebase Authentication.
 *
 * Credentials (in order of use):
 * 1. credentialsOverride.serviceAccountJson – from Database Settings (stored per company)
 * 2. GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON – server env
 */

import { getApps, getApp, initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const STORED_APP_NAME_PREFIX = "firebase-stored-";

function getFirebaseApp() {
  if (getApps().length > 0) return getApp();
  const cred = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  let app;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    app = initializeApp({ credential: applicationDefault() });
  } else if (cred) {
    try {
      const key = typeof cred === "string" ? JSON.parse(cred) : cred;
      app = initializeApp({ credential: cert(key) });
    } catch (e) {
      throw new Error("Firebase: FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON. Use a service account key from Firebase Console → Project Settings → Service Accounts.");
    }
  } else {
    throw new Error("Firebase not configured. Set GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON) or FIREBASE_SERVICE_ACCOUNT_JSON (stringified JSON).");
  }
  return app;
}

/**
 * Get or create a Firebase app from stored credentials (service account JSON).
 * Re-inits if the app already exists so updated credentials take effect.
 * @param {string} appKey - Unique key (e.g. companyId) to scope the app
 * @param {{ serviceAccountJson?: string }} credentialsOverride - Stored credentials from DB
 * @returns {Promise<import("firebase-admin/app").App>}
 */
async function getFirebaseAppFromCreds(appKey, credentialsOverride) {
  const json = credentialsOverride?.serviceAccountJson;
  if (!json || typeof json !== "string" || !json.trim()) throw new Error("Firebase service account JSON is required. Paste it in Database Settings → Users → Firebase.");
  let key;
  try {
    key = typeof json === "string" ? JSON.parse(json) : json;
  } catch (e) {
    throw new Error("Firebase service account JSON is invalid. Paste the full JSON from Firebase Console → Service accounts → Generate new private key.");
  }
  const name = STORED_APP_NAME_PREFIX + (appKey || "default");
  try {
    const existing = getApp(name);
    await existing.delete();
  } catch (_) {
    // no existing app
  }
  return initializeApp({ credential: cert(key) }, name);
}

async function getAuthForList(credentialsOverride, appKey) {
  if (credentialsOverride?.serviceAccountJson) {
    const app = await getFirebaseAppFromCreds(appKey, credentialsOverride);
    return getAuth(app);
  }
  return getAuth(getFirebaseApp());
}

/**
 * List all Firebase Auth users. Uses stored credentials if provided, else env.
 * @param {{ serviceAccountJson?: string }} [credentialsOverride] - Optional stored creds (from company data source credentials)
 * @param {string} [appKey] - Optional key for named app when using credentialsOverride (e.g. companyId)
 * @returns {Promise<Array<{ id: string, userId: string, email: string, name: string, role: string, status: string, drivingLicenceUrl: null, drivingLicenceStatus: null, createdAt: string }>>}
 */
export async function listFirebaseUsers(credentialsOverride, appKey) {
  const auth = await getAuthForList(credentialsOverride, appKey);
  const result = [];
  let pageToken;
  do {
    const listResult = await auth.listUsers(1000, pageToken);
    for (const user of listResult.users) {
      result.push({
        id: user.uid,
        userId: user.uid,
        email: user.email || "",
        name: user.displayName || user.email || user.uid,
        role: "USER",
        status: "enrolled",
        drivingLicenceUrl: null,
        drivingLicenceStatus: null,
        createdAt: user.metadata?.creationTime || new Date().toISOString(),
      });
    }
    pageToken = listResult.pageToken;
  } while (pageToken);
  return result;
}

/**
 * Test Firebase connection with provided credentials (e.g. from Database Settings form).
 * Lists 1 user to verify the credential works.
 * @param {{ serviceAccountJson?: string }} credentials - Must include serviceAccountJson
 */
export async function testFirebaseConnection(credentials) {
  const auth = await getAuthForList(credentials, "test");
  const listResult = await auth.listUsers(1);
  return listResult.users.length >= 0;
}

/**
 * Check if Firebase is configured (credentials available).
 * @returns {boolean}
 */
export function isFirebaseConfigured() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return true;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
