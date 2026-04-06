/**
 * List users from a PostgreSQL table (column mapping aligned with SQL Server connector).
 */

import pg from "pg";
import { getStoredCredentials, getLayerTable, LAYERS, PROVIDERS } from "@/lib/data-source-manager";
import { getPostgresConfig, quotePgTableIdent, wrapPostgresError } from "./postgres-config";

const { Client } = pg;

const USER_COLUMN_MAP = [
  [{ id: "id" }, ["id", "Id", "ID", "UserId", "user_id"]],
  [{ email: "email" }, ["email", "Email", "EMAIL", "Mail", "mail"]],
  [{ name: "name" }, ["name", "Name", "NAME", "FullName", "full_name", "DisplayName", "display_name", "UserName", "user_name"]],
  [{ role: "role" }, ["role", "Role", "ROLE", "UserRole", "user_role"]],
  [{ status: "status" }, ["status", "Status", "STATUS", "UserStatus", "user_status"]],
  [{ drivingLicenceUrl: "drivingLicenceUrl" }, ["drivingLicenceUrl", "driving_licence_url", "DrivingLicenceUrl"]],
  [{ drivingLicenceStatus: "drivingLicenceStatus" }, ["drivingLicenceStatus", "driving_licence_status", "DrivingLicenceStatus"]],
  [{ createdAt: "createdAt" }, ["createdAt", "created_at", "CreatedAt", "Created", "created"]],
];

function mapRowToUser(row) {
  const rawByLower = {};
  for (const key of Object.keys(row)) rawByLower[key.toLowerCase()] = row[key];
  const user = {
    id: null,
    userId: null,
    email: "",
    name: "",
    role: "USER",
    status: "enrolled",
    drivingLicenceUrl: null,
    drivingLicenceStatus: null,
    createdAt: new Date().toISOString(),
  };
  for (const [out, possibleKeys] of USER_COLUMN_MAP) {
    const key = Object.keys(out)[0];
    const target = out[key];
    for (const candidate of possibleKeys) {
      const val = rawByLower[candidate.toLowerCase()];
      if (val !== undefined && val !== null) {
        user[target] = val;
        break;
      }
    }
  }
  user.userId = user.userId ?? user.id;
  user.id = user.id ?? user.userId ?? `pg-${user.email || Math.random().toString(36).slice(2)}`;
  return user;
}

export async function listPostgresUsers(companyId, tableNameOverride) {
  const tableName = tableNameOverride ?? (await getLayerTable(companyId, LAYERS.USERS));
  if (!tableName) return null;
  const creds = await getStoredCredentials(companyId, LAYERS.USERS, PROVIDERS.POSTGRES);
  if (!creds || !creds.host || !creds.username) return null;

  const config = getPostgresConfig(creds);
  const client = new Client(config);
  const quoted = quotePgTableIdent(tableName);
  try {
    await client.connect();
    const res = await client.query(`SELECT * FROM ${quoted}`);
    const rows = res.rows || [];
    return rows.map((r) => mapRowToUser(r));
  } catch (e) {
    throw wrapPostgresError(e);
  } finally {
    try {
      await client.end();
    } catch (_) {}
  }
}
