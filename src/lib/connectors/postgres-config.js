/**
 * Build node-pg client config from stored credentials (same field names as SQL Server UI).
 */

export function getPostgresConfig(creds) {
  if (!creds || typeof creds !== "object") throw new Error("Missing credentials");
  const host = String(creds.host || "").trim();
  const username = String(creds.username || "").trim();
  const password = creds.password != null ? String(creds.password) : "";
  const database = String(creds.databaseName || creds.database || "").trim();
  if (!host || !username || !database) {
    throw new Error("PostgreSQL requires host, username, password, and database name.");
  }
  const port = parseInt(String(creds.port || "5432").trim(), 10) || 5432;
  const sslRaw = creds.ssl;
  const useSsl = sslRaw === true || sslRaw === "true" || sslRaw === "1" || sslRaw === 1;
  return {
    host,
    port,
    user: username,
    password,
    database,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  };
}

/** Allow only simple identifiers for table names (public schema). */
export function quotePgTableIdent(name) {
  const t = String(name || "").trim();
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(t)) {
    throw new Error("Invalid table name: use letters, numbers, underscore only.");
  }
  return `"${t.replace(/"/g, '""')}"`;
}

export function wrapPostgresError(err) {
  const msg = err?.message || String(err);
  if (msg.includes("ECONNREFUSED")) {
    return new Error("Could not connect to PostgreSQL. Check host, port, and that the server is running.");
  }
  return new Error(msg);
}
