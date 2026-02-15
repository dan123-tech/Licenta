/**
 * Seed SQL Server (Docker) with FleetStream database and one login user.
 * Run after: docker compose -f docker-compose.sqlserver.yml up -d
 *
 * Usage: node scripts/seed-sqlserver.js
 *
 * Env (optional):
 *   SQLSERVER_HOST=localhost
 *   SQLSERVER_PORT=1433
 *   SQLSERVER_USER=sa
 *   SQLSERVER_PASSWORD=YourStrong!Pass123
 *   SQLSERVER_DATABASE=FleetStream
 */

const sql = require("mssql");
const bcrypt = require("bcryptjs");

const config = {
  server: process.env.SQLSERVER_HOST || "localhost",
  port: parseInt(process.env.SQLSERVER_PORT || "1433", 10),
  user: process.env.SQLSERVER_USER || "sa",
  password: process.env.SQLSERVER_PASSWORD || "YourStrong!Pass123",
  database: process.env.SQLSERVER_DATABASE || "master",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    instanceName: undefined,
  },
};

const TARGET_DB = process.env.SQLSERVER_TARGET_DB || "FleetStream";

async function run() {
  console.log("Connecting to SQL Server at", config.server + ":" + config.port, "as", config.user, "...");
  let pool;
  try {
    pool = await sql.connect(config);
    console.log("Connected.\n");

    // Create database if not exists
    await pool.request().query(`
      IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'${TARGET_DB}')
      BEGIN
        CREATE DATABASE [${TARGET_DB}];
        PRINT 'Database ${TARGET_DB} created.';
      END
      ELSE
        PRINT 'Database ${TARGET_DB} already exists.';
    `);
    await pool.close();

    // Connect to the target database for tables and data
    const dbConfig = { ...config, database: TARGET_DB };
    pool = await sql.connect(dbConfig);

    // Create Users table (compatible with app's user shape for SQL Server layer)
    await pool.request().query(`
      IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
      BEGIN
        CREATE TABLE dbo.Users (
          id NVARCHAR(128) NOT NULL PRIMARY KEY,
          email NVARCHAR(255) NOT NULL UNIQUE,
          password NVARCHAR(255) NOT NULL,
          name NVARCHAR(255) NOT NULL,
          avatarUrl NVARCHAR(512) NULL,
          drivingLicenceUrl NVARCHAR(512) NULL,
          drivingLicenceStatus NVARCHAR(32) NULL,
          createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
          updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
        );
        CREATE INDEX IX_Users_email ON dbo.Users(email);
        PRINT 'Table Users created.';
      END
      ELSE
        PRINT 'Table Users already exists.';
    `);

    // Hash for password "Password123!" (bcrypt, 10 rounds)
    const passwordHash = await bcrypt.hash("Password123!", 10);

    // Insert default admin user if not exists
    const adminId = "sqlserver-admin-001";
    const { recordset } = await pool.request()
      .input("email", sql.NVarChar(255), "admin@example.com")
      .query("SELECT id FROM dbo.Users WHERE email = @email");

    if (recordset.length === 0) {
      await pool.request()
        .input("id", sql.NVarChar(128), adminId)
        .input("email", sql.NVarChar(255), "admin@example.com")
        .input("password", sql.NVarChar(255), passwordHash)
        .input("name", sql.NVarChar(255), "Admin")
        .input("createdAt", sql.DateTime2, new Date())
        .input("updatedAt", sql.DateTime2, new Date())
        .query(`
          INSERT INTO dbo.Users (id, email, password, name, createdAt, updatedAt)
          VALUES (@id, @email, @password, @name, @createdAt, @updatedAt)
        `);
      console.log("User created: admin@example.com / Password123!");
    } else {
      console.log("User admin@example.com already exists.");
    }

    // Optional: create app login (so you don't use sa in production) – run against master
    try {
      const masterPool = await sql.connect({ ...config, database: "master" });
      await masterPool.request().query(`
        IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'fleetstream_app')
        BEGIN
          CREATE LOGIN fleetstream_app WITH PASSWORD = 'AppPass!123';
          PRINT 'Login fleetstream_app created (password: AppPass!123).';
        END
      `);
      await masterPool.close();
      await pool.request().query(`
        IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'fleetstream_app')
        BEGIN
          CREATE USER fleetstream_app FOR LOGIN fleetstream_app;
          ALTER ROLE db_datareader ADD MEMBER fleetstream_app;
          ALTER ROLE db_datawriter ADD MEMBER fleetstream_app;
          PRINT 'User fleetstream_app added to database ${TARGET_DB}.';
        END
      `);
    } catch (e) {
      console.warn("Optional app login creation skipped:", e.message);
    }

    console.log("\n--- SQL Server seed done ---");
    console.log("Connection info for Database Settings:");
    console.log("  Host:     ", config.server);
    console.log("  Port:     1433");
    console.log("  Database: ", TARGET_DB);
    console.log("  Username: sa (or fleetstream_app)");
    console.log("  Password: YourStrong!Pass123 (or AppPass!123 for app user)");
    console.log("Login to app (when using SQL Server as Users layer): admin@example.com / Password123!");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    if (pool) await pool.close();
  }
}

run();
