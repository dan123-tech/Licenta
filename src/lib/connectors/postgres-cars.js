/**
 * List cars from PostgreSQL (read-only; same column mapping as SQL Server).
 */

import pg from "pg";
import { getStoredCredentials, getLayerTable, LAYERS, PROVIDERS } from "@/lib/data-source-manager";
import { getPostgresConfig, quotePgTableIdent, wrapPostgresError } from "./postgres-config";

const { Client } = pg;

const CAR_COLUMN_MAP = [
  ["id", ["id", "Id", "ID", "CarId", "car_id"]],
  ["brand", ["brand", "Brand", "BRAND"]],
  ["model", ["model", "Model", "MODEL"]],
  ["registrationNumber", ["registrationNumber", "RegistrationNumber", "registration_number"]],
  ["km", ["km", "Km", "KM"]],
  ["status", ["status", "Status", "STATUS"]],
  ["fuelType", ["fuelType", "FuelType", "fuel_type"]],
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
  car.id = car.id || `pg-car-${car.registrationNumber || Math.random().toString(36).slice(2)}`;
  const statusUpper = (car.status || "").toUpperCase().replace(/[\s-]/g, "_");
  if (["AVAILABLE", "RESERVED", "IN_MAINTENANCE"].includes(statusUpper)) car.status = statusUpper;
  else car.status = "AVAILABLE";
  return car;
}

export async function listPostgresCars(companyId, statusFilter) {
  const tableName = await getLayerTable(companyId, LAYERS.CARS);
  if (!tableName) return null;
  const creds = await getStoredCredentials(companyId, LAYERS.CARS, PROVIDERS.POSTGRES);
  if (!creds || !creds.host || !creds.username) return null;

  const config = getPostgresConfig(creds);
  const client = new Client(config);
  const quoted = quotePgTableIdent(tableName);
  try {
    await client.connect();
    const res = await client.query(`SELECT * FROM ${quoted}`);
    let rows = res.rows || [];
    if (statusFilter) {
      const want = statusFilter.toUpperCase().replace(/[\s-]/g, "_");
      rows = rows.filter((r) => {
        const s = (r.Status || r.status || "").toString().toUpperCase().replace(/[\s-]/g, "_");
        return s === want;
      });
    }
    return rows.map((r) => mapRowToCar(r));
  } catch (e) {
    throw wrapPostgresError(e);
  } finally {
    try {
      await client.end();
    } catch (_) {}
  }
}
