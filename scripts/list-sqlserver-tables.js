/**
 * List tables in the SQL Server database (FleetStream by default).
 * Use this to verify Car, Cars, Users, Reservation exist after running the schema.
 *
 *   node scripts/list-sqlserver-tables.js
 *
 * Env (optional): SQLSERVER_HOST, SQLSERVER_PORT, SQLSERVER_USER, SQLSERVER_PASSWORD, SQLSERVER_TARGET_DB
 */

const sql = require("mssql");

const config = {
  server: process.env.SQLSERVER_HOST || "localhost",
  port: parseInt(process.env.SQLSERVER_PORT || "1433", 10),
  user: process.env.SQLSERVER_USER || "sa",
  password: process.env.SQLSERVER_PASSWORD || "YourStrong!Pass123",
  database: process.env.SQLSERVER_TARGET_DB || "FleetStream",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

async function run() {
  console.log("Connecting to", config.server + ":" + config.port, "database:", config.database, "...");
  const pool = await sql.connect(config);
  try {
    const result = await pool.request().query("SELECT name FROM sys.tables ORDER BY name");
    const tables = (result.recordset || []).map((r) => r.name);
    console.log("\nTables in database [" + config.database + "]:");
    if (tables.length === 0) {
      console.log("  (none) – run: node scripts/run-sqlserver-schema.js");
    } else {
      tables.forEach((t) => console.log("  -", t));
    }
    console.log("");
  } finally {
    await pool.close();
  }
}

run().catch((err) => {
  console.error("Error:", err.message);
  if (err.message && err.message.includes("ECONNREFUSED")) {
    console.error("Is SQL Server running? Try: docker compose -f docker-compose.sqlserver.yml up -d");
  }
  if (err.message && err.message.includes("Login failed")) {
    console.error("Check username/password (default: sa / YourStrong!Pass123)");
  }
  if (err.message && err.message.includes("Invalid object name 'sys.tables'") || (err.message && err.message.includes("database") && err.message.includes("not exist"))) {
    console.error("Database", config.database, "may not exist. Run: node scripts/run-sqlserver-schema.js");
  }
  process.exit(1);
});
