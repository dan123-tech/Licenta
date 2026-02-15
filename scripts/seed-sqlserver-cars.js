/**
 * Populate SQL Server FleetStream database with 3 sample cars.
 * Ensures a Company exists, then inserts cars into the Cars table.
 *
 * Run: node scripts/seed-sqlserver-cars.js
 *
 * Env (optional): SQLSERVER_HOST, SQLSERVER_PORT, SQLSERVER_USER, SQLSERVER_PASSWORD
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

const COMPANY_ID = "sqlserver-company-001";

const SAMPLE_CARS = [
  {
    Id: "sql-car-001",
    CompanyId: COMPANY_ID,
    Brand: "Volkswagen",
    Model: "Golf",
    RegistrationNumber: "B 123 ABC",
    Km: 45000,
    Status: "AVAILABLE",
    FuelType: "Benzine",
    AverageConsumptionL100km: 6.2,
    AverageConsumptionKwh100km: null,
    BatteryLevel: null,
    BatteryCapacityKwh: null,
    LastServiceMileage: 40000,
  },
  {
    Id: "sql-car-002",
    CompanyId: COMPANY_ID,
    Brand: "Toyota",
    Model: "Corolla Hybrid",
    RegistrationNumber: "B 456 DEF",
    Km: 22000,
    Status: "AVAILABLE",
    FuelType: "Hybrid",
    AverageConsumptionL100km: 4.1,
    AverageConsumptionKwh100km: 12,
    BatteryLevel: 85,
    BatteryCapacityKwh: 1.6,
    LastServiceMileage: 20000,
  },
  {
    Id: "sql-car-003",
    CompanyId: COMPANY_ID,
    Brand: "Tesla",
    Model: "Model 3",
    RegistrationNumber: "B 789 GHI",
    Km: 15000,
    Status: "AVAILABLE",
    FuelType: "Electric",
    AverageConsumptionL100km: null,
    AverageConsumptionKwh100km: 14.5,
    BatteryLevel: 92,
    BatteryCapacityKwh: 57.5,
    LastServiceMileage: 10000,
  },
];

async function run() {
  console.log("Connecting to SQL Server at", config.server + ":" + config.port, "database:", config.database, "...");
  const pool = await sql.connect(config);
  try {
    const request = pool.request();

    // Ensure Company exists
    const companyCheck = await request.query(
      `SELECT Id FROM Company WHERE Id = N'${COMPANY_ID}'`
    );
    if (!companyCheck.recordset || companyCheck.recordset.length === 0) {
      await pool.request().query(`
        INSERT INTO Company (Id, Name, DefaultKmUsage, CreatedAt, UpdatedAt)
        VALUES (N'${COMPANY_ID}', N'FleetStream Demo', 100, GETUTCDATE(), GETUTCDATE())
      `);
      console.log("Company created:", COMPANY_ID);
    } else {
      console.log("Company exists:", COMPANY_ID);
    }

    // Insert cars (skip if already present)
    for (const car of SAMPLE_CARS) {
      const exists = await pool.request()
        .input("Id", sql.NVarChar(50), car.Id)
        .query("SELECT Id FROM Cars WHERE Id = @Id");
      if (exists.recordset && exists.recordset.length > 0) {
        console.log("  Car already exists:", car.RegistrationNumber, "-", car.Brand, car.Model);
        continue;
      }
      await pool.request()
        .input("Id", sql.NVarChar(50), car.Id)
        .input("CompanyId", sql.NVarChar(50), car.CompanyId)
        .input("Brand", sql.NVarChar(100), car.Brand)
        .input("Model", sql.NVarChar(100), car.Model)
        .input("RegistrationNumber", sql.NVarChar(50), car.RegistrationNumber)
        .input("Km", sql.Int, car.Km)
        .input("Status", sql.NVarChar(30), car.Status)
        .input("FuelType", sql.NVarChar(20), car.FuelType)
        .input("AverageConsumptionL100km", sql.Float, car.AverageConsumptionL100km)
        .input("AverageConsumptionKwh100km", sql.Float, car.AverageConsumptionKwh100km)
        .input("BatteryLevel", sql.Int, car.BatteryLevel)
        .input("BatteryCapacityKwh", sql.Float, car.BatteryCapacityKwh)
        .input("LastServiceMileage", sql.Int, car.LastServiceMileage)
        .query(`
          INSERT INTO Cars (Id, CompanyId, Brand, Model, RegistrationNumber, Km, Status, FuelType,
            AverageConsumptionL100km, AverageConsumptionKwh100km, BatteryLevel, BatteryCapacityKwh, LastServiceMileage)
          VALUES (@Id, @CompanyId, @Brand, @Model, @RegistrationNumber, @Km, @Status, @FuelType,
            @AverageConsumptionL100km, @AverageConsumptionKwh100km, @BatteryLevel, @BatteryCapacityKwh, @LastServiceMileage)
        `);
      console.log("  Car inserted:", car.RegistrationNumber, "-", car.Brand, car.Model);
    }

    console.log("\n--- 3 cars in Cars table ---");
    const list = await pool.request().query("SELECT Id, Brand, Model, RegistrationNumber, Status FROM Cars ORDER BY Id");
    (list.recordset || []).forEach((r) => console.log("  ", r.RegistrationNumber, r.Brand, r.Model, "-", r.Status));
  } catch (err) {
    console.error("Error:", err.message);
    if (err.message && err.message.includes("Invalid object name 'Company'")) {
      console.error("Run the schema first: node scripts/run-sqlserver-schema.js");
    }
    if (err.message && err.message.includes("Invalid object name 'Cars'")) {
      console.error("Run the schema first: node scripts/run-sqlserver-schema.js");
    }
    process.exit(1);
  } finally {
    await pool.close();
  }
}

run();
