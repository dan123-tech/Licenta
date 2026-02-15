/**
 * Fetch users from a selected SQL Server table with dynamic column mapping.
 * Maps common column names (FullName, Email, etc.) to the app's user shape.
 */

import sql from "mssql";
import { getStoredCredentials, getLayerTable, LAYERS, PROVIDERS } from "@/lib/data-source-manager";
import { getSqlServerConfig, wrapSqlServerError } from "./sql-server-config";

// Possible SQL column names -> canonical field for user card
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
  user.id = user.id ?? user.userId ?? `sql-${user.email || Math.random().toString(36).slice(2)}`;
  return user;
}

export async function listSqlServerUsers(companyId, tableNameOverride) {
  const tableName = tableNameOverride ?? (await getLayerTable(companyId, LAYERS.USERS));
  if (!tableName) return null;
  const creds = await getStoredCredentials(companyId, LAYERS.USERS, PROVIDERS.SQL_SERVER);
  if (!creds || !creds.host || !creds.username || !creds.password) return null;

  const config = getSqlServerConfig(creds);
  let pool;
  try {
    pool = await sql.connect(config);
  } catch (connErr) {
    throw wrapSqlServerError(connErr);
  }
  try {
    const safeName = tableName.replace(/\]/g, "]]");
    const result = await pool.request().query(`SELECT * FROM [${safeName}]`);
    const rows = result.recordset || [];
    return rows.map((r) => mapRowToUser(r));
  } finally {
    await pool.close();
  }
}

/** Resolve app id (numeric string or "sql-email") to SQL Server Id (number). */
async function resolveUserId(companyId, userId, pool, tableName) {
  const str = String(userId).trim();
  if (/^\d+$/.test(str)) return parseInt(str, 10);
  if (str.startsWith("sql-")) {
    const email = str.slice(4).trim();
    const safeName = tableName.replace(/\]/g, "]]");
    const result = await pool.request().input("email", sql.NVarChar(255), email).query(
      `SELECT [Id] FROM [${safeName}] WHERE [Email] = @email`
    );
    const row = result.recordset?.[0];
    return row?.Id != null ? row.Id : null;
  }
  return null;
}

/**
 * Create a user in SQL Server Users table. Id is IDENTITY; Email, Name required. PasswordHash optional.
 */
export async function createSqlServerUser(companyId, data, tableNameOverride) {
  const tableName = tableNameOverride ?? (await getLayerTable(companyId, LAYERS.USERS));
  if (!tableName) return null;
  const creds = await getStoredCredentials(companyId, LAYERS.USERS, PROVIDERS.SQL_SERVER);
  if (!creds?.host || !creds?.username || !creds?.password) return null;

  const config = getSqlServerConfig(creds);
  const safeName = tableName.replace(/\]/g, "]]");
  let pool;
  try {
    pool = await sql.connect(config);
  } catch (connErr) {
    throw wrapSqlServerError(connErr);
  }
  try {
    await pool
      .request()
      .input("Email", sql.NVarChar(255), (data.email || "").trim().toLowerCase())
      .input("Name", sql.NVarChar(255), (data.name || "").trim())
      .input("PasswordHash", sql.NVarChar(255), data.passwordHash ?? null)
      .input("Role", sql.NVarChar(50), data.role ?? "USER")
      .input("Status", sql.NVarChar(50), data.status ?? "enrolled")
      .input("Active", sql.Bit, data.active !== false ? 1 : 0)
      .query(
        `INSERT INTO [${safeName}] ([Email],[Name],[PasswordHash],[Role],[Status],[Active])
         VALUES (@Email,@Name,@PasswordHash,@Role,@Status,@Active)`
      );
    const list = await listSqlServerUsers(companyId, tableName);
    const created = list?.find((u) => (u.email || "").toLowerCase() === (data.email || "").trim().toLowerCase());
    return created ?? null;
  } finally {
    await pool.close();
  }
}

/**
 * Update a user by app id (numeric Id or "sql-email"). Partial update.
 */
export async function updateSqlServerUser(companyId, userId, data, tableNameOverride) {
  const tableName = tableNameOverride ?? (await getLayerTable(companyId, LAYERS.USERS));
  if (!tableName) return null;
  const creds = await getStoredCredentials(companyId, LAYERS.USERS, PROVIDERS.SQL_SERVER);
  if (!creds?.host || !creds?.username || !creds?.password) return null;

  const config = getSqlServerConfig(creds);
  const safeName = tableName.replace(/\]/g, "]]");
  let pool;
  try {
    pool = await sql.connect(config);
  } catch (connErr) {
    throw wrapSqlServerError(connErr);
  }
  try {
    const sqlId = await resolveUserId(companyId, userId, pool, tableName);
    if (sqlId == null) return null;
    const setParts = [];
    const req = pool.request();
    req.input("Id", sql.Int, sqlId);
    if (data.name !== undefined) { req.input("Name", sql.NVarChar(255), data.name.trim()); setParts.push("[Name] = @Name"); }
    if (data.email !== undefined) { req.input("Email", sql.NVarChar(255), data.email.trim().toLowerCase()); setParts.push("[Email] = @Email"); }
    if (data.role !== undefined) { req.input("Role", sql.NVarChar(50), data.role); setParts.push("[Role] = @Role"); }
    if (data.status !== undefined) { req.input("Status", sql.NVarChar(50), data.status); setParts.push("[Status] = @Status"); }
    if (data.passwordHash !== undefined) { req.input("PasswordHash", sql.NVarChar(255), data.passwordHash); setParts.push("[PasswordHash] = @PasswordHash"); }
    if (data.drivingLicenceStatus !== undefined) { req.input("DrivingLicenceStatus", sql.NVarChar(50), data.drivingLicenceStatus); setParts.push("[DrivingLicenceStatus] = @DrivingLicenceStatus"); }
    if (data.drivingLicenceUrl !== undefined) { req.input("DrivingLicenceUrl", sql.NVarChar(2048), data.drivingLicenceUrl); setParts.push("[DrivingLicenceUrl] = @DrivingLicenceUrl"); }
    if (data.active !== undefined) { req.input("Active", sql.Bit, data.active ? 1 : 0); setParts.push("[Active] = @Active"); }
    setParts.push("[UpdatedAt] = GETUTCDATE()");
    if (setParts.length <= 1) return listSqlServerUsers(companyId, tableName).then((arr) => arr?.find((u) => String(u.id) === String(userId) || u.userId === sqlId) ?? null);
    await req.query(`UPDATE [${safeName}] SET ${setParts.join(", ")} WHERE [Id] = @Id`);
    const list = await listSqlServerUsers(companyId, tableName);
    return list?.find((u) => String(u.id) === String(userId) || u.userId === sqlId) ?? null;
  } finally {
    await pool.close();
  }
}

/**
 * Delete a user by app id (numeric Id or "sql-email").
 */
export async function deleteSqlServerUser(companyId, userId, tableNameOverride) {
  const tableName = tableNameOverride ?? (await getLayerTable(companyId, LAYERS.USERS));
  if (!tableName) return { count: 0 };
  const creds = await getStoredCredentials(companyId, LAYERS.USERS, PROVIDERS.SQL_SERVER);
  if (!creds?.host || !creds?.username || !creds?.password) return { count: 0 };

  const config = getSqlServerConfig(creds);
  const safeName = tableName.replace(/\]/g, "]]");
  let pool;
  try {
    pool = await sql.connect(config);
  } catch (connErr) {
    throw wrapSqlServerError(connErr);
  }
  try {
    const sqlId = await resolveUserId(companyId, userId, pool, tableName);
    if (sqlId == null) return { count: 0 };
    const result = await pool.request().input("Id", sql.Int, sqlId).query(`DELETE FROM [${safeName}] WHERE [Id] = @Id`);
    return { count: result.rowsAffected?.[0] ?? 0 };
  } finally {
    await pool.close();
  }
}
