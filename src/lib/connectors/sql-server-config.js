/**
 * Shared SQL Server connection config for Docker and local.
 * Use 127.0.0.1 instead of localhost on Windows for better Docker connectivity.
 * Longer timeouts so the container has time to respond after startup.
 */

/**
 * Build mssql config from credentials/params.
 * @param {{ host: string, port?: number|string, databaseName?: string, username: string, password: string }} params
 * @returns {import("mssql").config}
 */
export function getSqlServerConfig(params) {
  const host = (params?.host != null && String(params.host).trim()) ? String(params.host).trim() : "localhost";
  let port = parseInt(params?.port || "1433", 10) || 1433;
  if (port === 1443) port = 1433;
  const database = (params?.databaseName != null && String(params.databaseName).trim())
    ? String(params.databaseName).trim()
    : "master";
  const user = (params?.username != null && String(params.username).trim()) ? String(params.username).trim() : "";
  const password = params?.password != null ? String(params.password) : "";

  const server = (host.toLowerCase() === "localhost" || host === "localhost.") ? "127.0.0.1" : host;

  return {
    server,
    port,
    user,
    password,
    database,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
      connectTimeout: 20000,
      requestTimeout: 15000,
    },
  };
}

/**
 * Turn connection errors into user-friendly messages (Docker, login, etc.).
 * @param {unknown} err
 * @returns {Error}
 */
export function wrapSqlServerError(err) {
  const msg = err?.message || String(err);
  if (msg.includes("ECONNREFUSED") || msg.includes("connect ETIMEDOUT") || msg.includes("connect ENOENT")) {
    return new Error(
      "Could not reach SQL Server. Check that the container is running (docker compose -f docker-compose.sqlserver.yml up -d), host is localhost or 127.0.0.1, and port is 1433."
    );
  }
  if (msg.includes("Login failed") || msg.includes("password") || msg.includes("authentication")) {
    return new Error("Login failed. Check username and password (e.g. sa / YourStrong!Pass123).");
  }
  if (msg.includes("timeout") || msg.includes("Timeout")) {
    return new Error("Connection timed out. Is SQL Server running? Try again in a few seconds after starting Docker.");
  }
  return new Error(msg || "SQL Server connection failed.");
}
