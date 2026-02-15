/**
 * Run sql-server-schema.sql against SQL Server (Docker).
 * Uses the same connection as seed-sqlserver.js.
 *
 * 1. Start SQL Server:  docker compose -f docker-compose.sqlserver.yml up -d
 * 2. Run this script:   node scripts/run-sqlserver-schema.js
 *
 * Env (optional): SQLSERVER_HOST, SQLSERVER_PORT, SQLSERVER_USER, SQLSERVER_PASSWORD
 */

const sql = require("mssql");
const fs = require("fs");
const path = require("path");

const config = {
  server: process.env.SQLSERVER_HOST || "localhost",
  port: parseInt(process.env.SQLSERVER_PORT || "1433", 10),
  user: process.env.SQLSERVER_USER || "sa",
  password: process.env.SQLSERVER_PASSWORD || "YourStrong!Pass123",
  database: "master",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

const TARGET_DB = process.env.SQLSERVER_TARGET_DB || "FleetStream";
const SCHEMA_PATH = path.join(__dirname, "..", "sql-server-schema.sql");

function splitBatches(content) {
  const lines = content.split(/\r?\n/);
  const batches = [];
  let current = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toUpperCase() === "GO") {
      const batch = current.join("\n").trim();
      if (batch) batches.push(batch);
      current = [];
    } else {
      current.push(line);
    }
  }
  const last = current.join("\n").trim();
  if (last) batches.push(last);
  return batches;
}

async function run() {
  console.log("Connecting to SQL Server at", config.server + ":" + config.port, "as", config.user, "...");
  let pool;
  try {
    pool = await sql.connect(config);
    console.log("Connected.\n");

    await pool.request().query(`
      IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'${TARGET_DB}')
      BEGIN
        CREATE DATABASE [${TARGET_DB}];
        PRINT 'Database ${TARGET_DB} created.';
      END
    `);
    await pool.close();

    const dbConfig = { ...config, database: TARGET_DB };
    pool = await sql.connect(dbConfig);

    if (!fs.existsSync(SCHEMA_PATH)) {
      console.error("Schema file not found:", SCHEMA_PATH);
      process.exit(1);
    }
    const content = fs.readFileSync(SCHEMA_PATH, "utf8");
    const batches = splitBatches(content);
    console.log("Running", batches.length, "batch(es) from sql-server-schema.sql ...\n");

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      if (!batch) continue;
      try {
        await pool.request().query(batch);
        console.log("  Batch", i + 1, "OK");
      } catch (err) {
        console.error("  Batch", i + 1, "error:", err.message);
        throw err;
      }
    }

    console.log("\n--- Schema applied to database", TARGET_DB, "---");
    console.log("Tables (Car, Cars, Users, etc.) are in database:", TARGET_DB);
    console.log("In DBeaver: expand Databases →", TARGET_DB, "→ Tables to see them.");
    console.log("In the app: Database Settings → use Database name:", TARGET_DB);
    console.log("Verify tables: node scripts/list-sqlserver-tables.js");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    if (pool) await pool.close();
  }
}

run();
