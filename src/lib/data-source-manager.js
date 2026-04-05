/**
 * DataSourceManager – reads saved Database Settings config (Company.dataSourceConfig).
 * Supports provider per layer + optional table name per layer (usersTable, carsTable, reservationsTable).
 * Encrypted credentials stored in Company.dataSourceCredentials.
 */

import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/encrypt";

export const LAYERS = { USERS: "users", CARS: "cars", RESERVATIONS: "reservations" };
export const PROVIDERS = { LOCAL: "LOCAL", ENTRA: "ENTRA", SQL_SERVER: "SQL_SERVER", FIREBASE: "FIREBASE", SHAREPOINT: "SHAREPOINT" };

const DEFAULT_CONFIG = { [LAYERS.USERS]: PROVIDERS.LOCAL, [LAYERS.CARS]: PROVIDERS.LOCAL, [LAYERS.RESERVATIONS]: PROVIDERS.LOCAL };

const DEFAULT_CONFIG_FULL = {
  ...DEFAULT_CONFIG,
  usersTable: null,
  carsTable: null,
  reservationsTable: null,
};

const TABLE_KEYS = { [LAYERS.USERS]: "usersTable", [LAYERS.CARS]: "carsTable", [LAYERS.RESERVATIONS]: "reservationsTable" };

function credKey(layer, provider) {
  return `${layer}:${provider}`;
}

export async function getDataSourceConfig(companyId) {
  if (!companyId) return { ...DEFAULT_CONFIG_FULL };
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { dataSourceConfig: true },
    });
    const raw = company?.dataSourceConfig;
    if (!raw || typeof raw !== "object") return { ...DEFAULT_CONFIG_FULL };
    return {
      [LAYERS.USERS]: [PROVIDERS.LOCAL, PROVIDERS.ENTRA, PROVIDERS.SQL_SERVER, PROVIDERS.FIREBASE, PROVIDERS.SHAREPOINT].includes(raw.users) ? raw.users : PROVIDERS.LOCAL,
      [LAYERS.CARS]: [PROVIDERS.LOCAL, PROVIDERS.SQL_SERVER, PROVIDERS.FIREBASE, PROVIDERS.SHAREPOINT].includes(raw.cars) ? raw.cars : PROVIDERS.LOCAL,
      [LAYERS.RESERVATIONS]: [PROVIDERS.LOCAL, PROVIDERS.SQL_SERVER, PROVIDERS.FIREBASE, PROVIDERS.SHAREPOINT].includes(raw.reservations) ? raw.reservations : PROVIDERS.LOCAL,
      usersTable: typeof raw.usersTable === "string" && raw.usersTable.trim() ? raw.usersTable.trim() : null,
      carsTable: typeof raw.carsTable === "string" && raw.carsTable.trim() ? raw.carsTable.trim() : null,
      reservationsTable: typeof raw.reservationsTable === "string" && raw.reservationsTable.trim() ? raw.reservationsTable.trim() : null,
    };
  } catch (e) {
    console.warn("[DataSourceManager] getDataSourceConfig error:", e);
    return { ...DEFAULT_CONFIG_FULL };
  }
}

export async function getProvider(companyId, layer) {
  const config = await getDataSourceConfig(companyId);
  return config[layer] ?? PROVIDERS.LOCAL;
}

export async function getLayerTable(companyId, layer) {
  const config = await getDataSourceConfig(companyId);
  const key = TABLE_KEYS[layer];
  return key ? (config[key] ?? null) : null;
}

export async function saveDataSourceConfig(companyId, config) {
  if (!companyId) throw new Error("Missing companyId");
  const current = await getDataSourceConfig(companyId);
  const next = { ...current };
  if (config.users != null) next[LAYERS.USERS] = config.users;
  if (config.cars != null) next[LAYERS.CARS] = config.cars;
  if (config.reservations != null) next[LAYERS.RESERVATIONS] = config.reservations;
  if (config.usersTable !== undefined) next.usersTable = config.usersTable;
  if (config.carsTable !== undefined) next.carsTable = config.carsTable;
  if (config.reservationsTable !== undefined) next.reservationsTable = config.reservationsTable;
  try {
    await prisma.company.update({
      where: { id: companyId },
      data: { dataSourceConfig: next },
    });
  } catch (e) {
    const msg = e?.message || String(e);
    if (e?.code === "P2025") throw new Error("Company not found or was deleted.");
    throw new Error("Failed to save data source config: " + msg);
  }
}

export async function getStoredCredentials(companyId, layer, provider) {
  if (!companyId || !layer || !provider) return null;
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { dataSourceCredentials: true },
    });
    const raw = company?.dataSourceCredentials;
    if (!raw || typeof raw !== "object" || !raw.encrypted) return null;
    const json = decrypt(raw.encrypted);
    const all = JSON.parse(json);
    return all[credKey(layer, provider)] ?? null;
  } catch (e) {
    console.warn("[DataSourceManager] getStoredCredentials error:", e);
    return null;
  }
}

export async function saveStoredCredentials(companyId, layer, provider, payload) {
  if (!companyId || !layer || !provider) {
    throw new Error("Missing companyId, layer, or provider");
  }
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { dataSourceCredentials: true },
  });
  if (!company) {
    throw new Error("Company not found");
  }
  let all = {};
  const rawCreds = company?.dataSourceCredentials;
  const encryptedExisting =
    rawCreds && typeof rawCreds === "object" && rawCreds.encrypted
      ? rawCreds.encrypted
      : typeof rawCreds === "string"
        ? (() => {
            try {
              const o = JSON.parse(rawCreds);
              return o?.encrypted;
            } catch {
              return null;
            }
          })()
        : null;
  try {
    if (encryptedExisting && typeof encryptedExisting === "string") {
      const json = decrypt(encryptedExisting);
      all = JSON.parse(json);
    }
  } catch (_) {
    // Existing credentials unreadable (e.g. different AUTH_SECRET); start fresh
  }
  const key = credKey(layer, provider);
  if (payload == null) delete all[key];
  else all[key] = payload;

  let jsonStr;
  try {
    jsonStr = JSON.stringify(all);
  } catch (e) {
    throw new Error("Credentials could not be serialized: " + (e?.message || String(e)));
  }
  if (typeof jsonStr !== "string") {
    throw new Error("Credentials serialization produced invalid value");
  }

  let encrypted;
  try {
    encrypted = encrypt(jsonStr);
  } catch (e) {
    const msg = e?.message || String(e);
    if (msg.includes("AUTH_SECRET")) {
      throw new Error("Encryption failed: set AUTH_SECRET in .env (at least 16 characters) and restart the server.");
    }
    throw new Error("Encryption failed: " + msg);
  }

  try {
    await prisma.company.update({
      where: { id: companyId },
      data: { dataSourceCredentials: { encrypted } },
    });
  } catch (e) {
    const msg = e?.message || String(e);
    const code = e?.code;
    if (code === "P2025") throw new Error("Company not found or was deleted.");
    if (code === "P2002") throw new Error("Database conflict. Please try again.");
    throw new Error("Database error while saving credentials: " + msg);
  }
}
