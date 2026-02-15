/**
 * Fetch cars from a selected SQL Server table with dynamic column mapping.
 */

import sql from "mssql";
import { getStoredCredentials, getLayerTable, LAYERS, PROVIDERS } from "@/lib/data-source-manager";
import { getSqlServerConfig, wrapSqlServerError } from "./sql-server-config";

const CAR_COLUMN_MAP = [
  ["id", ["id", "Id", "ID", "CarId", "car_id"]],
  ["brand", ["brand", "Brand", "BRAND"]],
  ["model", ["model", "Model", "MODEL"]],
  ["registrationNumber", ["registrationNumber", "RegistrationNumber", "registration_number", "RegistrationNumber"]],
  ["km", ["km", "Km", "KM"]],
  ["status", ["status", "Status", "STATUS"]],
  ["fuelType", ["fuelType", "FuelType", "fuel_type", "FuelType"]],
  ["averageConsumptionL100km", ["averageConsumptionL100km", "AverageConsumptionL100km", "average_consumption_l100km"]],
  ["averageConsumptionKwh100km", ["averageConsumptionKwh100km", "AverageConsumptionKwh100km", "average_consumption_kwh100km"]],
  ["batteryLevel", ["batteryLevel", "BatteryLevel", "battery_level"]],
  ["batteryCapacityKwh", ["batteryCapacityKwh", "BatteryCapacityKwh", "battery_capacity_kwh"]],
  ["lastServiceMileage", ["lastServiceMileage", "LastServiceMileage", "last_service_mileage"]],
  ["companyId", ["companyId", "CompanyId", "company_id"]],
];

function mapRowToCar(row) {
  const rawByLower = {};
  for (const key of Object.keys(row)) rawByLower[key.toLowerCase()] = row[key];
  const car = {
    id: null,
    brand: "",
    model: null,
    registrationNumber: "",
    km: 0,
    status: "AVAILABLE",
    fuelType: "Benzine",
    averageConsumptionL100km: null,
    averageConsumptionKwh100km: null,
    batteryLevel: null,
    batteryCapacityKwh: null,
    lastServiceMileage: null,
    _count: { reservations: 0 },
  };
  for (const [outKey, possibleKeys] of CAR_COLUMN_MAP) {
    for (const candidate of possibleKeys) {
      const val = rawByLower[candidate.toLowerCase()];
      if (val !== undefined && val !== null) {
        if (outKey === "km" || outKey === "batteryLevel" || outKey === "lastServiceMileage") {
          car[outKey] = typeof val === "number" ? val : parseInt(val, 10) || 0;
        } else if (outKey === "averageConsumptionL100km" || outKey === "averageConsumptionKwh100km" || outKey === "batteryCapacityKwh") {
          car[outKey] = typeof val === "number" ? val : parseFloat(val);
        } else {
          car[outKey] = typeof val === "string" ? val.trim() : String(val);
        }
        break;
      }
    }
  }
  car.id = car.id || `sql-car-${car.registrationNumber || Math.random().toString(36).slice(2)}`;
  const statusUpper = (car.status || "").toUpperCase().replace(/[\s-]/g, "_");
  if (["AVAILABLE", "RESERVED", "IN_MAINTENANCE"].includes(statusUpper)) car.status = statusUpper;
  else car.status = "AVAILABLE";
  return car;
}

function columnStyle(tableName) {
  const t = (tableName || "").trim();
  return t === "Car" ? "camel" : "pascal";
}

function col(tableName, camel, pascal) {
  return columnStyle(tableName) === "camel" ? camel : pascal;
}

export async function listSqlServerCars(companyId, statusFilter) {
  const tableName = await getLayerTable(companyId, LAYERS.CARS);
  if (!tableName) return null;
  const creds = await getStoredCredentials(companyId, LAYERS.CARS, PROVIDERS.SQL_SERVER);
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
    let query = `SELECT * FROM [${safeName}]`;
    const request = pool.request();
    const result = await request.query(query);
    let rows = result.recordset || [];
    if (statusFilter) {
      const want = statusFilter.toUpperCase().replace(/[\s-]/g, "_");
      rows = rows.filter((r) => {
        const s = (r.Status || r.status || "").toString().toUpperCase().replace(/[\s-]/g, "_");
        return s === want;
      });
    }
    return rows.map((r) => mapRowToCar(r));
  } finally {
    await pool.close();
  }
}

/**
 * Get one car by id. companyId used to scope if table has companyId/CompanyId.
 */
export async function getSqlServerCarById(companyId, carId) {
  const tableName = await getLayerTable(companyId, LAYERS.CARS);
  if (!tableName) return null;
  const creds = await getStoredCredentials(companyId, LAYERS.CARS, PROVIDERS.SQL_SERVER);
  if (!creds?.host || !creds?.username || !creds?.password) return null;

  const config = getSqlServerConfig(creds);
  const idCol = col(tableName, "id", "Id");
  const companyCol = col(tableName, "companyId", "CompanyId");
  const safeName = tableName.replace(/\]/g, "]]");

  let pool;
  try {
    pool = await sql.connect(config);
  } catch (connErr) {
    throw wrapSqlServerError(connErr);
  }
  try {
    const result = await pool
      .request()
      .input("id", sql.NVarChar(50), String(carId))
      .input("companyId", sql.NVarChar(50), companyId)
      .query(
        `SELECT * FROM [${safeName}] WHERE [${idCol}] = @id AND [${companyCol}] = @companyId`
      );
    const rows = result.recordset || [];
    return rows.length > 0 ? mapRowToCar(rows[0]) : null;
  } finally {
    await pool.close();
  }
}

/**
 * Create a car in SQL Server. Generates id (UUID) and sets companyId.
 */
export async function createSqlServerCar(companyId, data) {
  const tableName = await getLayerTable(companyId, LAYERS.CARS);
  if (!tableName) return null;
  const creds = await getStoredCredentials(companyId, LAYERS.CARS, PROVIDERS.SQL_SERVER);
  if (!creds?.host || !creds?.username || !creds?.password) return null;

  const { randomUUID } = await import("crypto");
  const id = randomUUID();
  const style = columnStyle(tableName);
  const safeName = tableName.replace(/\]/g, "]]");

  const config = getSqlServerConfig(creds);
  let pool;
  try {
    pool = await sql.connect(config);
  } catch (connErr) {
    throw wrapSqlServerError(connErr);
  }
  try {
    if (style === "camel") {
      await pool
        .request()
        .input("id", sql.NVarChar(50), id)
        .input("companyId", sql.NVarChar(50), companyId)
        .input("brand", sql.NVarChar(100), (data.brand || "").trim())
        .input("model", sql.NVarChar(100), (data.model || "").trim() || null)
        .input("registrationNumber", sql.NVarChar(50), (data.registrationNumber || "").trim())
        .input("km", sql.Int, data.km ?? 0)
        .input("status", sql.NVarChar(30), data.status ?? "AVAILABLE")
        .input("fuelType", sql.NVarChar(20), data.fuelType ?? "Benzine")
        .input("averageConsumptionL100km", sql.Float, data.averageConsumptionL100km ?? null)
        .input("averageConsumptionKwh100km", sql.Float, data.averageConsumptionKwh100km ?? null)
        .input("batteryLevel", sql.Int, data.batteryLevel ?? null)
        .input("batteryCapacityKwh", sql.Float, data.batteryCapacityKwh ?? null)
        .input("lastServiceMileage", sql.Int, data.lastServiceMileage ?? null)
        .query(
          `INSERT INTO [${safeName}] ([id],[companyId],[brand],[model],[registrationNumber],[km],[status],[fuelType],[averageConsumptionL100km],[averageConsumptionKwh100km],[batteryLevel],[batteryCapacityKwh],[lastServiceMileage])
           VALUES (@id,@companyId,@brand,@model,@registrationNumber,@km,@status,@fuelType,@averageConsumptionL100km,@averageConsumptionKwh100km,@batteryLevel,@batteryCapacityKwh,@lastServiceMileage)`
        );
    } else {
      await pool
        .request()
        .input("Id", sql.NVarChar(50), id)
        .input("CompanyId", sql.NVarChar(50), companyId)
        .input("Brand", sql.NVarChar(100), (data.brand || "").trim())
        .input("Model", sql.NVarChar(100), (data.model || "").trim() || null)
        .input("RegistrationNumber", sql.NVarChar(50), (data.registrationNumber || "").trim())
        .input("Km", sql.Int, data.km ?? 0)
        .input("Status", sql.NVarChar(30), data.status ?? "AVAILABLE")
        .input("FuelType", sql.NVarChar(20), data.fuelType ?? "Benzine")
        .input("AverageConsumptionL100km", sql.Float, data.averageConsumptionL100km ?? null)
        .input("AverageConsumptionKwh100km", sql.Float, data.averageConsumptionKwh100km ?? null)
        .input("BatteryLevel", sql.Int, data.batteryLevel ?? null)
        .input("BatteryCapacityKwh", sql.Float, data.batteryCapacityKwh ?? null)
        .input("LastServiceMileage", sql.Int, data.lastServiceMileage ?? null)
        .query(
          `INSERT INTO [${safeName}] ([Id],[CompanyId],[Brand],[Model],[RegistrationNumber],[Km],[Status],[FuelType],[AverageConsumptionL100km],[AverageConsumptionKwh100km],[BatteryLevel],[BatteryCapacityKwh],[LastServiceMileage])
           VALUES (@Id,@CompanyId,@Brand,@Model,@RegistrationNumber,@Km,@Status,@FuelType,@AverageConsumptionL100km,@AverageConsumptionKwh100km,@BatteryLevel,@BatteryCapacityKwh,@LastServiceMileage)`
        );
    }
    return getSqlServerCarById(companyId, id);
  } finally {
    await pool.close();
  }
}

/**
 * Update a car. Partial update; only provided fields are set.
 */
export async function updateSqlServerCar(companyId, carId, data) {
  const tableName = await getLayerTable(companyId, LAYERS.CARS);
  if (!tableName) return null;
  const creds = await getStoredCredentials(companyId, LAYERS.CARS, PROVIDERS.SQL_SERVER);
  if (!creds?.host || !creds?.username || !creds?.password) return null;

  const style = columnStyle(tableName);
  const idCol = col(tableName, "id", "Id");
  const companyCol = col(tableName, "companyId", "CompanyId");
  const safeName = tableName.replace(/\]/g, "]]");

  const config = getSqlServerConfig(creds);
  let pool;
  try {
    pool = await sql.connect(config);
  } catch (connErr) {
    throw wrapSqlServerError(connErr);
  }
  try {
    const req = pool.request();
    req.input("id", sql.NVarChar(50), String(carId));
    req.input("companyId", sql.NVarChar(50), companyId);
    const setParts = [];

    const fields = [
      ["brand", "Brand", data.brand?.trim(), sql.NVarChar(100)],
      ["model", "Model", data.model?.trim() || null, sql.NVarChar(100)],
      ["registrationNumber", "RegistrationNumber", data.registrationNumber?.trim(), sql.NVarChar(50)],
      ["km", "Km", data.km, sql.Int],
      ["status", "Status", data.status, sql.NVarChar(30)],
      ["fuelType", "FuelType", data.fuelType, sql.NVarChar(20)],
      ["averageConsumptionL100km", "AverageConsumptionL100km", data.averageConsumptionL100km, sql.Float],
      ["averageConsumptionKwh100km", "AverageConsumptionKwh100km", data.averageConsumptionKwh100km, sql.Float],
      ["batteryLevel", "BatteryLevel", data.batteryLevel, sql.Int],
      ["batteryCapacityKwh", "BatteryCapacityKwh", data.batteryCapacityKwh, sql.Float],
      ["lastServiceMileage", "LastServiceMileage", data.lastServiceMileage, sql.Int],
    ];
    for (const [keyCamel, keyPascal, val, type] of fields) {
      if (val === undefined) continue;
      const k = style === "camel" ? keyCamel : keyPascal;
      req.input(k, type, val);
      setParts.push(`[${k}] = @${k}`);
    }
    if (setParts.length === 0) return getSqlServerCarById(companyId, carId);
    await req.query(
      `UPDATE [${safeName}] SET ${setParts.join(", ")} WHERE [${idCol}] = @id AND [${companyCol}] = @companyId`
    );
    return getSqlServerCarById(companyId, carId);
  } finally {
    await pool.close();
  }
}

/**
 * Delete a car by id.
 */
export async function deleteSqlServerCar(companyId, carId) {
  const tableName = await getLayerTable(companyId, LAYERS.CARS);
  if (!tableName) return { count: 0 };
  const creds = await getStoredCredentials(companyId, LAYERS.CARS, PROVIDERS.SQL_SERVER);
  if (!creds?.host || !creds?.username || !creds?.password) return { count: 0 };

  const idCol = col(tableName, "id", "Id");
  const companyCol = col(tableName, "companyId", "CompanyId");
  const safeName = tableName.replace(/\]/g, "]]");
  const config = getSqlServerConfig(creds);
  let pool;
  try {
    pool = await sql.connect(config);
  } catch (connErr) {
    throw wrapSqlServerError(connErr);
  }
  try {
    const result = await pool
      .request()
      .input("id", sql.NVarChar(50), String(carId))
      .input("companyId", sql.NVarChar(50), companyId)
      .query(`DELETE FROM [${safeName}] WHERE [${idCol}] = @id AND [${companyCol}] = @companyId`);
    return { count: result.rowsAffected?.[0] ?? 0 };
  } finally {
    await pool.close();
  }
}
