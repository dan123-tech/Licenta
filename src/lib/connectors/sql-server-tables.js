/**
 * List table names from a SQL Server database (for Dynamic Table Mapper).
 */

import sql from "mssql";
import { getSqlServerConfig, wrapSqlServerError } from "./sql-server-config";

export async function listSqlServerTables(connectionParams) {
  if (!connectionParams?.host || !connectionParams?.username) {
    throw new Error("Missing host or username");
  }
  const config = getSqlServerConfig(connectionParams);
  let pool;
  try {
    pool = await sql.connect(config);
  } catch (connErr) {
    throw wrapSqlServerError(connErr);
  }
  try {
    const result = await pool.request().query("SELECT name FROM sys.tables ORDER BY name");
    return (result.recordset || []).map((r) => r.name);
  } finally {
    try {
      await pool.close();
    } catch (_) {}
  }
}
