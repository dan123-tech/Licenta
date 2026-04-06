"use client";

/**
 * First-time admin: choose built-in PostgreSQL or configure External PostgreSQL for Users / Cars / Reservations.
 */

import { useState, useCallback } from "react";
import { Database, CheckCircle2 } from "lucide-react";
import { LAYERS, PROVIDERS, CREDENTIAL_SCHEMAS } from "@/orchestrator/config";
import {
  apiDataSourceConfigGet,
  apiDataSourceCredentialsSave,
  apiDataSourceConfigSave,
  apiDataSourceTablesFetch,
  apiDataSourceSetupComplete,
} from "@/lib/api";

const PG_SCHEMA = CREDENTIAL_SCHEMAS[PROVIDERS.POSTGRES] || [];

const STEPS = [
  { layer: LAYERS.USERS, title: "Users", desc: "Table with user / member columns (email, name, role, …)." },
  { layer: LAYERS.CARS, title: "Cars", desc: "Table with fleet vehicles (brand, registration, status, …)." },
  { layer: LAYERS.RESERVATIONS, title: "Reservations", desc: "Table with bookings (userId, carId, dates, …)." },
];

function emptyPgValues() {
  const o = {};
  for (const f of PG_SCHEMA) o[f.key] = "";
  return o;
}

export default function DataSourceSetupWizard({ companyName, onCompleted }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [builtinBusy, setBuiltinBusy] = useState(false);
  const [valuesByLayer, setValuesByLayer] = useState({
    [LAYERS.USERS]: emptyPgValues(),
    [LAYERS.CARS]: emptyPgValues(),
    [LAYERS.RESERVATIONS]: emptyPgValues(),
  });
  const [tableByLayer, setTableByLayer] = useState({
    [LAYERS.USERS]: "",
    [LAYERS.CARS]: "",
    [LAYERS.RESERVATIONS]: "",
  });
  const [tablesByLayer, setTablesByLayer] = useState({
    [LAYERS.USERS]: [],
    [LAYERS.CARS]: [],
    [LAYERS.RESERVATIONS]: [],
  });
  const [testOk, setTestOk] = useState({
    [LAYERS.USERS]: false,
    [LAYERS.CARS]: false,
    [LAYERS.RESERVATIONS]: false,
  });

  const setVal = useCallback((layer, key, v) => {
    setValuesByLayer((prev) => ({ ...prev, [layer]: { ...prev[layer], [key]: v } }));
    setTestOk((prev) => ({ ...prev, [layer]: false }));
  }, []);

  const testLayer = useCallback(async (layer) => {
    setError("");
    const v = valuesByLayer[layer];
    const data = await apiDataSourceTablesFetch({
      provider: PROVIDERS.POSTGRES,
      host: v.host,
      port: v.port,
      databaseName: v.databaseName,
      username: v.username,
      password: v.password,
      ssl: v.ssl,
    });
    const tables = data.tables || [];
    setTablesByLayer((prev) => ({ ...prev, [layer]: tables }));
    setTestOk((prev) => ({ ...prev, [layer]: true }));
    setTableByLayer((prev) => {
      if (tables.length && !prev[layer]) return { ...prev, [layer]: tables[0] };
      return prev;
    });
  }, [valuesByLayer]);

  const saveLayer = useCallback(async (layer) => {
    setError("");
    const v = valuesByLayer[layer];
    const table = (tableByLayer[layer] || "").trim();
    if (!table) throw new Error(`Enter a table name for ${layer}.`);
    const cur = await apiDataSourceConfigGet();
    await apiDataSourceCredentialsSave({
      layer,
      provider: PROVIDERS.POSTGRES,
      credentials: v,
      tableName: table,
    });
    await apiDataSourceConfigSave({
      users: layer === LAYERS.USERS ? PROVIDERS.POSTGRES : cur.users,
      cars: layer === LAYERS.CARS ? PROVIDERS.POSTGRES : cur.cars,
      reservations: layer === LAYERS.RESERVATIONS ? PROVIDERS.POSTGRES : cur.reservations,
      usersTable: layer === LAYERS.USERS ? table : cur.usersTable,
      carsTable: layer === LAYERS.CARS ? table : cur.carsTable,
      reservationsTable: layer === LAYERS.RESERVATIONS ? table : cur.reservationsTable,
    });
  }, [valuesByLayer, tableByLayer]);

  async function handleBuiltin() {
    setError("");
    setBuiltinBusy(true);
    try {
      await apiDataSourceSetupComplete("builtin");
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("dataSourceConfigSaved"));
      onCompleted?.();
    } catch (e) {
      setError(e?.message || "Could not apply built-in database.");
    } finally {
      setBuiltinBusy(false);
    }
  }

  async function handleFinishPostgres() {
    setError("");
    setBusy(true);
    try {
      await apiDataSourceSetupComplete("postgres");
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("dataSourceConfigSaved"));
      onCompleted?.();
    } catch (e) {
      setError(e?.message || "Check all three layers: External PostgreSQL, credentials, and table names.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-full overflow-y-auto" style={{ background: "var(--main-bg)" }}>
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-[#1E293B] text-white">
            <Database className="w-6 h-6" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Database setup</h1>
        </div>
        <p className="text-slate-600 text-sm sm:text-base mb-6 leading-relaxed">
          Welcome{companyName ? ` to ${companyName}` : ""}. Choose how FleetShare loads <strong>users</strong>,{" "}
          <strong>cars</strong>, and <strong>reservations</strong>. Login accounts always stay in this app&apos;s PostgreSQL
          database; these settings control where lists and fleet data are read from.
        </p>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100" role="alert">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Option A — Built-in PostgreSQL</h2>
          <p className="text-sm text-slate-600 mb-4">
            Store and manage users, cars, and reservations in the same PostgreSQL database as this FleetShare installation
            (recommended for most teams).
          </p>
          <button
            type="button"
            disabled={builtinBusy}
            onClick={handleBuiltin}
            className="w-full sm:w-auto px-5 py-3 rounded-xl font-semibold bg-[#1E293B] text-white hover:bg-[#334155] disabled:opacity-50"
          >
            {builtinBusy ? "Applying…" : "Use built-in PostgreSQL"}
          </button>
        </div>

        <div className="relative text-center text-xs text-slate-400 mb-8">
          <span className="bg-[var(--main-bg)] px-3 relative z-10">or connect three external PostgreSQL databases</span>
          <div className="absolute left-0 right-0 top-1/2 border-t border-slate-200 -z-0" />
        </div>

        <div className="space-y-8 mb-8">
          {STEPS.map(({ layer, title, desc }) => (
            <div key={layer} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-1">{title} layer</h3>
              <p className="text-xs text-slate-500 mb-4">{desc}</p>
              <div className="space-y-3">
                {PG_SCHEMA.map(({ key, label, type, hint, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                    <input
                      type={type === "password" ? "password" : "text"}
                      value={valuesByLayer[layer][key] ?? ""}
                      onChange={(e) => setVal(layer, key, e.target.value)}
                      placeholder={placeholder}
                      autoComplete="off"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-ring)] outline-none"
                    />
                    {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Table name</label>
                  <input
                    type="text"
                    value={tableByLayer[layer]}
                    onChange={(e) => setTableByLayer((p) => ({ ...p, [layer]: e.target.value }))}
                    placeholder="e.g. users"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:border-[var(--primary)] outline-none"
                  />
                </div>
                {testOk[layer] && tablesByLayer[layer].length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Pick table</label>
                    <select
                      value={tableByLayer[layer]}
                      onChange={(e) => setTableByLayer((p) => ({ ...p, [layer]: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800"
                    >
                      {tablesByLayer[layer].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => testLayer(layer).catch((e) => setError(e?.message || "Connection test failed"))}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Test connection
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    saveLayer(layer).catch((e) => setError(e?.message || `Save failed for ${layer}`))
                  }
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200"
                >
                  Save this layer
                </button>
                {testOk[layer] && <CheckCircle2 className="w-5 h-5 text-emerald-600 self-center" aria-label="Test OK" />}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={handleFinishPostgres}
          className="w-full px-5 py-3 rounded-xl font-semibold bg-[var(--primary)] text-white hover:opacity-95 disabled:opacity-50"
        >
          {busy ? "Finishing…" : "Finish — I configured all three PostgreSQL layers"}
        </button>
        <p className="text-xs text-slate-500 mt-3">
          You can change sources later under Admin → Database settings. External PostgreSQL is read-only for creating users
          or cars from the UI; use built-in or SQL Server if you need that.
        </p>
      </div>
    </div>
  );
}
