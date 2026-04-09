/**
 * Company and CompanyMember domain logic.
 * Used by API routes to resolve current company, create company, join by code.
 */

import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";
import {
  saveDataSourceConfig,
  getProvider,
  getLayerTable,
  getStoredCredentials,
  LAYERS,
  PROVIDERS,
} from "@/lib/data-source-manager";

const JOIN_CODE_LENGTH = 8;
const JOIN_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0,O,1,I to avoid confusion

function generateJoinCode() {
  const bytes = randomBytes(JOIN_CODE_LENGTH);
  let code = "";
  for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
    code += JOIN_CODE_CHARS[bytes[i] % JOIN_CODE_CHARS.length];
  }
  return code;
}

/**
 * Fetch a company by ID with optional member count.
 * @param {string} companyId - Company cuid
 * @returns {Promise<Object|null>} Company or null
 */
export async function getCompanyById(companyId) {
  return prisma.company.findUnique({
    where: { id: companyId },
    include: { _count: { select: { members: true, cars: true } } },
  });
}

/**
 * Get the current user's membership in a company (role and status).
 * @param {string} userId - User id
 * @param {string} companyId - Company id
 * @returns {Promise<Object|null>} CompanyMember or null
 */
export async function getMembership(userId, companyId) {
  return prisma.companyMember.findUnique({
    where: { userId_companyId: { userId, companyId } },
  });
}

/**
 * Check if the user is an ADMIN for the given company.
 * @param {string} userId - User id
 * @param {string} companyId - Company id
 * @returns {Promise<boolean>} True if member exists and role is ADMIN
 */
export async function isCompanyAdmin(userId, companyId) {
  const m = await getMembership(userId, companyId);
  return m?.role === "ADMIN";
}

/**
 * Update company (admin only). Fields: name?, domain?, joinCode?, defaultKmUsage?, averageFuelPricePerLiter?, defaultConsumptionL100km?, priceBenzinePerLiter?, priceDieselPerLiter?, priceHybridPerLiter?, priceElectricityPerKwh?
 * @param {string} companyId - Company id
 * @param {Object} data
 */
export async function updateCompany(companyId, data) {
  const allowed = [
    "name", "domain", "publicAppUrl", "joinCode", "defaultKmUsage", "averageFuelPricePerLiter",
    "defaultConsumptionL100km", "priceBenzinePerLiter", "priceDieselPerLiter", "priceHybridPerLiter", "priceElectricityPerKwh",
    "dataSourceConfig",
  ];
  const update = {};
  for (const key of allowed) {
    if (data[key] !== undefined) update[key] = data[key];
  }
  return prisma.company.update({
    where: { id: companyId },
    data: update,
  });
}

/**
 * Create a new company and add the user as ADMIN (enrolled).
 * Generates a unique joinCode for others to join.
 * @param {string} userId - Creator user id
 * @param {Object} data - { name, domain? }
 * @returns {Promise<Object>} Company with joinCode
 */
export async function createCompany(userId, data) {
  let joinCode;
  let existing;
  do {
    joinCode = generateJoinCode();
    existing = await prisma.company.findUnique({ where: { joinCode } });
  } while (existing);

  return prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: data.name.trim(),
        domain: data.domain?.trim() || null,
        joinCode,
      },
    });
    await tx.companyMember.create({
      data: {
        userId,
        companyId: company.id,
        role: "ADMIN",
        status: "ENROLLED",
      },
    });
    return company;
  });
}

/**
 * Find company by join code (for joining).
 * @param {string} joinCode
 * @returns {Promise<Object|null>}
 */
export async function findCompanyByJoinCode(joinCode) {
  const normalized = String(joinCode).trim().toUpperCase();
  if (!normalized) return null;
  return prisma.company.findUnique({
    where: { joinCode: normalized },
  });
}

/**
 * Add user to a company by join code (enrolled as USER).
 * @param {string} userId - User id
 * @param {string} joinCode - Company join code
 * @returns {Promise<Object|null>} CompanyMember with company, or null if code invalid or already member
 */
export async function joinCompanyByCode(userId, joinCode) {
  const company = await findCompanyByJoinCode(joinCode);
  if (!company) return null;

  const existing = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId, companyId: company.id } },
  });
  if (existing) return null;

  const member = await prisma.companyMember.create({
    data: {
      userId,
      companyId: company.id,
      role: "USER",
      status: "ENROLLED",
    },
    include: { company: true },
  });
  return member;
}

/** Mark first-time Database setup as done (admin onboarding). */
export async function markDataSourceSetupComplete(companyId) {
  return prisma.company.update({
    where: { id: companyId },
    data: { dataSourceSetupCompletedAt: new Date() },
  });
}

/** Use Prisma/FleetShare DB for all layers and complete onboarding. */
export async function applyBuiltinDataSourcesAndCompleteSetup(companyId) {
  await saveDataSourceConfig(companyId, {
    users: PROVIDERS.LOCAL,
    cars: PROVIDERS.LOCAL,
    reservations: PROVIDERS.LOCAL,
    usersTable: null,
    carsTable: null,
    reservationsTable: null,
  });
  return markDataSourceSetupComplete(companyId);
}

/** All three layers must be External PostgreSQL with credentials + table. */
export async function verifyExternalPostgresSetup(companyId) {
  for (const layer of [LAYERS.USERS, LAYERS.CARS, LAYERS.RESERVATIONS]) {
    const p = await getProvider(companyId, layer);
    if (p !== PROVIDERS.POSTGRES) {
      return { ok: false, error: `Layer "${layer}" must use External PostgreSQL, or choose built-in database instead.` };
    }
    const table = await getLayerTable(companyId, layer);
    if (!table || !String(table).trim()) {
      return { ok: false, error: `Set a table name for the "${layer}" layer.` };
    }
    const c = await getStoredCredentials(companyId, layer, PROVIDERS.POSTGRES);
    const db = c?.databaseName || c?.database;
    if (!c?.host || !c?.username || !db) {
      return { ok: false, error: `Incomplete PostgreSQL connection for "${layer}" (host, user, database required).` };
    }
  }
  return { ok: true };
}

/** Users layer must be an external provider with required credentials (Entra/Firebase/SQL Server/Postgres/SharePoint). */
export async function verifyUsersExternalSetup(companyId) {
  const p = await getProvider(companyId, LAYERS.USERS);
  if (![PROVIDERS.ENTRA, PROVIDERS.FIREBASE, PROVIDERS.SQL_SERVER, PROVIDERS.POSTGRES, PROVIDERS.SHAREPOINT].includes(p)) {
    return { ok: false, error: `Users layer must use an external provider (Entra/Firebase/SQL Server/Postgres/SharePoint).` };
  }

  const c = await getStoredCredentials(companyId, LAYERS.USERS, p);
  if (p === PROVIDERS.ENTRA) {
    if (!c?.clientId || !c?.tenantId || !c?.clientSecret) {
      return { ok: false, error: "Incomplete Entra credentials (clientId, tenantId, clientSecret required)." };
    }
    return { ok: true };
  }
  if (p === PROVIDERS.FIREBASE) {
    if (!c?.serviceAccountJson || !String(c.serviceAccountJson).trim()) {
      return { ok: false, error: "Incomplete Firebase credentials (serviceAccountJson required)." };
    }
    return { ok: true };
  }
  if (p === PROVIDERS.SHAREPOINT) {
    if (!c?.siteUrl || !c?.clientId || !c?.clientSecret) {
      return { ok: false, error: "Incomplete SharePoint credentials (siteUrl, clientId, clientSecret required)." };
    }
    return { ok: true };
  }
  if (p === PROVIDERS.SQL_SERVER || p === PROVIDERS.POSTGRES) {
    const db = c?.databaseName || c?.database;
    if (!c?.host || !c?.username || !db) {
      return { ok: false, error: `Incomplete ${p === PROVIDERS.SQL_SERVER ? "SQL Server" : "PostgreSQL"} connection (host, username, databaseName required).` };
    }
    const table = await getLayerTable(companyId, LAYERS.USERS);
    if (!table || !String(table).trim()) {
      return { ok: false, error: "Set a table name for the Users layer." };
    }
    return { ok: true };
  }
  return { ok: false, error: "Unsupported provider." };
}
