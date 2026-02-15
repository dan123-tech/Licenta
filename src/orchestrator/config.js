/**
 * SSO & Database Orchestrator – configuration constants.
 * Isolated module: remove this folder to fall back to local-only behaviour.
 */

export const LAYERS = {
  USERS: "users",
  CARS: "cars",
  RESERVATIONS: "reservations",
};

export const PROVIDERS = {
  LOCAL: "LOCAL",
  ENTRA: "ENTRA",
  SQL_SERVER: "SQL_SERVER",
  FIREBASE: "FIREBASE",
  SHAREPOINT: "SHAREPOINT",
};

export const LAYER_PROVIDERS = {
  [LAYERS.USERS]: [PROVIDERS.LOCAL, PROVIDERS.ENTRA, PROVIDERS.SQL_SERVER, PROVIDERS.FIREBASE, PROVIDERS.SHAREPOINT],
  [LAYERS.CARS]: [PROVIDERS.LOCAL, PROVIDERS.SQL_SERVER, PROVIDERS.FIREBASE, PROVIDERS.SHAREPOINT],
  [LAYERS.RESERVATIONS]: [PROVIDERS.LOCAL, PROVIDERS.SQL_SERVER, PROVIDERS.FIREBASE, PROVIDERS.SHAREPOINT],
};

export const DEFAULT_CONFIG = {
  [LAYERS.USERS]: PROVIDERS.LOCAL,
  [LAYERS.CARS]: PROVIDERS.LOCAL,
  [LAYERS.RESERVATIONS]: PROVIDERS.LOCAL,
  usersTable: null,
  carsTable: null,
  reservationsTable: null,
};

const STORAGE_KEY = "fleetstream_db_orchestrator_config";

export function loadStoredConfig() {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      [LAYERS.USERS]: LAYER_PROVIDERS[LAYERS.USERS].includes(parsed[LAYERS.USERS]) ? parsed[LAYERS.USERS] : PROVIDERS.LOCAL,
      [LAYERS.CARS]: LAYER_PROVIDERS[LAYERS.CARS].includes(parsed[LAYERS.CARS]) ? parsed[LAYERS.CARS] : PROVIDERS.LOCAL,
      [LAYERS.RESERVATIONS]: LAYER_PROVIDERS[LAYERS.RESERVATIONS].includes(parsed[LAYERS.RESERVATIONS]) ? parsed[LAYERS.RESERVATIONS] : PROVIDERS.LOCAL,
      usersTable: typeof parsed.usersTable === "string" ? parsed.usersTable : null,
      carsTable: typeof parsed.carsTable === "string" ? parsed.carsTable : null,
      reservationsTable: typeof parsed.reservationsTable === "string" ? parsed.reservationsTable : null,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      [LAYERS.USERS]: config[LAYERS.USERS],
      [LAYERS.CARS]: config[LAYERS.CARS],
      [LAYERS.RESERVATIONS]: config[LAYERS.RESERVATIONS],
      usersTable: config.usersTable ?? null,
      carsTable: config.carsTable ?? null,
      reservationsTable: config.reservationsTable ?? null,
    }));
  } catch (e) {
    console.warn("[Orchestrator] saveConfig failed", e);
  }
}

const CREDENTIALS_KEY = "fleetstream_db_orchestrator_credentials";

export const CREDENTIAL_SCHEMAS = {
  [PROVIDERS.SQL_SERVER]: [
    { key: "host", label: "Host", type: "text", hint: "localhost, 127.0.0.1 (Docker on Windows), or sqlserver (if app runs in Docker)" },
    { key: "port", label: "Port", type: "text", hint: "1433 (default). Use 1433, not 1443.", placeholder: "1433" },
    { key: "databaseName", label: "Database Name", type: "text", hint: "Database to use, e.g. FleetStream or your DB name" },
    { key: "username", label: "Username", type: "text", hint: "SQL login, e.g. sa or app user" },
    { key: "password", label: "Password", type: "password", hint: "Password for the SQL login" },
  ],
  [PROVIDERS.FIREBASE]: [
    {
      key: "serviceAccountJson",
      label: "Service account JSON",
      type: "text",
      hint: "Paste full JSON from Firebase Console → Project Settings → Service accounts → Generate new private key. Required for server to list users.",
    },
    { key: "projectId", label: "Project ID", type: "text", hint: "Optional: from Firebase config (for reference)" },
    { key: "apiKey", label: "API Key", type: "password", hint: "Optional: from Firebase config (for reference)" },
    { key: "authDomain", label: "Auth Domain", type: "text", hint: "Usually {projectId}.firebaseapp.com" },
    { key: "storageBucket", label: "Storage Bucket", type: "text", hint: "config.storageBucket (e.g. {projectId}.appspot.com)" },
    { key: "messagingSenderId", label: "Messaging Sender ID", type: "text", hint: "config.messagingSenderId from Firebase config" },
    { key: "appId", label: "App ID", type: "text", hint: "config.appId from Firebase Console → Your apps" },
  ],
  [PROVIDERS.ENTRA]: [
    { key: "clientId", label: "Application (client) ID", type: "text", hint: "Azure Portal → App registration → Overview → Application (client) ID" },
    { key: "tenantId", label: "Directory (tenant) ID", type: "text", hint: "Azure Portal → App registration → Overview → Directory (tenant) ID" },
    { key: "clientSecret", label: "Client Secret", type: "password", hint: "Azure Portal → App registration → Certificates & secrets → New client secret" },
  ],
  [PROVIDERS.SHAREPOINT]: [
    { key: "siteUrl", label: "Site URL", type: "text", hint: "Full site URL, e.g. https://yourtenant.sharepoint.com/sites/YourSite" },
    { key: "clientId", label: "Client ID", type: "text", hint: "Azure AD app registration → Application (client) ID" },
    { key: "clientSecret", label: "Client Secret", type: "password", hint: "Azure AD app registration → Certificates & secrets" },
  ],
};

export function loadCredentials() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveCredentials(credentials) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  } catch (e) {
    console.warn("[Orchestrator] saveCredentials failed", e);
  }
}

export function getProviderLabel(provider) {
  const labels = {
    [PROVIDERS.LOCAL]: "Local DB",
    [PROVIDERS.ENTRA]: "Microsoft Entra (AD)",
    [PROVIDERS.SQL_SERVER]: "SQL Server",
    [PROVIDERS.FIREBASE]: "Firebase",
    [PROVIDERS.SHAREPOINT]: "SharePoint",
  };
  return labels[provider] || provider;
}

/** Provider label + optional table for source badge, e.g. "SQL Server (Table: Employees)". */
export function getProviderLabelWithTable(provider, tableName) {
  const base = getProviderLabel(provider);
  if (tableName && typeof tableName === "string" && tableName.trim()) return `${base} (Table: ${tableName.trim()})`;
  return base;
}
