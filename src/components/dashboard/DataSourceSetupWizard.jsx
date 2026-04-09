"use client";

/**
 * First-time admin: choose built-in PostgreSQL or configure External PostgreSQL for Users / Cars / Reservations.
 */

import { useState, useCallback, useMemo } from "react";
import { Database, CheckCircle2, Shield } from "lucide-react";
import { LAYERS, PROVIDERS, CREDENTIAL_SCHEMAS, getProviderLabel } from "@/orchestrator/config";
import {
  apiDataSourceConfigGet,
  apiDataSourceCredentialsSave,
  apiDataSourceConfigSave,
  apiDataSourceTablesFetch,
  apiDataSourceSetupComplete,
} from "@/lib/api";

const PG_SCHEMA = CREDENTIAL_SCHEMAS[PROVIDERS.POSTGRES] || [];
const ENTRA_SCHEMA = CREDENTIAL_SCHEMAS[PROVIDERS.ENTRA] || [];
const SQL_SCHEMA = CREDENTIAL_SCHEMAS[PROVIDERS.SQL_SERVER] || [];
const FIREBASE_SCHEMA = CREDENTIAL_SCHEMAS[PROVIDERS.FIREBASE] || [];
const SHAREPOINT_SCHEMA = CREDENTIAL_SCHEMAS[PROVIDERS.SHAREPOINT] || [];

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
  const [usersExternalBusy, setUsersExternalBusy] = useState(false);
  const [valuesByLayer, setValuesByLayer] = useState({
    [LAYERS.USERS]: emptyPgValues(),
    [LAYERS.CARS]: emptyPgValues(),
    [LAYERS.RESERVATIONS]: emptyPgValues(),
  });
  const [usersProvider, setUsersProvider] = useState(PROVIDERS.ENTRA);
  const [usersCreds, setUsersCreds] = useState(() => ({}));
  const [usersTable, setUsersTable] = useState("");
  const [usersTables, setUsersTables] = useState([]);
  const [usersTestOk, setUsersTestOk] = useState(false);

  const usersSchema = useMemo(() => {
    if (usersProvider === PROVIDERS.ENTRA) return ENTRA_SCHEMA;
    if (usersProvider === PROVIDERS.SQL_SERVER) return SQL_SCHEMA;
    if (usersProvider === PROVIDERS.POSTGRES) return PG_SCHEMA;
    if (usersProvider === PROVIDERS.FIREBASE) return FIREBASE_SCHEMA;
    if (usersProvider === PROVIDERS.SHAREPOINT) return SHAREPOINT_SCHEMA;
    return [];
  }, [usersProvider]);

  const usersNeedsTable = usersProvider === PROVIDERS.SQL_SERVER || usersProvider === PROVIDERS.POSTGRES;
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

  const testUsersExternal = useCallback(async () => {
    setError("");
    setUsersTestOk(false);
    setUsersTables([]);
    if (!usersNeedsTable) return;
    const v = usersCreds || {};
    const data = await apiDataSourceTablesFetch({
      provider: usersProvider,
      host: v.host,
      port: v.port,
      databaseName: v.databaseName,
      username: v.username,
      password: v.password,
      ssl: v.ssl,
    });
    const tables = data.tables || [];
    setUsersTables(tables);
    setUsersTestOk(true);
    if (!usersTable && tables.length) setUsersTable(tables[0]);
  }, [usersNeedsTable, usersCreds, usersProvider, usersTable]);

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

  async function handleUsersExternal() {
    setError("");
    setUsersExternalBusy(true);
    try {
      // Save credentials + config (Users=ENTRA; others=LOCAL) then complete onboarding.
      await apiDataSourceCredentialsSave({
        layer: LAYERS.USERS,
        provider: usersProvider,
        credentials: usersCreds,
        ...(usersNeedsTable ? { tableName: (usersTable || "").trim() } : {}),
      });
      await apiDataSourceConfigSave({
        users: usersProvider,
        cars: PROVIDERS.LOCAL,
        reservations: PROVIDERS.LOCAL,
        usersTable: usersNeedsTable ? (usersTable || "").trim() || null : null,
        carsTable: null,
        reservationsTable: null,
      });
      await apiDataSourceSetupComplete("usersExternal");
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("dataSourceConfigSaved"));
      onCompleted?.();
    } catch (e) {
      setError(e?.message || "Could not apply external Users provider.");
    } finally {
      setUsersExternalBusy(false);
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

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6 mb-8">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <Shield className="w-5 h-5" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Option B — SSO / external providers for Users</h2>
              <p className="text-sm text-slate-600 mb-4">
                Choose how FleetShare reads <strong>users</strong> from your company directory or external source (Entra, Firebase, SQL Server,
                Postgres, SharePoint). Cars and reservations will use the built-in PostgreSQL database by default. You can fine-tune all layers later in <strong>Database settings</strong>.
              </p>
              <div className="mb-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Users provider</label>
                <select
                  value={usersProvider}
                  onChange={(e) => {
                    const p = e.target.value;
                    setUsersProvider(p);
                    setUsersCreds({});
                    setUsersTable("");
                    setUsersTables([]);
                    setUsersTestOk(false);
                  }}
                  className="w-full sm:max-w-[420px] px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800"
                >
                  {[PROVIDERS.ENTRA, PROVIDERS.FIREBASE, PROVIDERS.SQL_SERVER, PROVIDERS.POSTGRES, PROVIDERS.SHAREPOINT].map((p) => (
                    <option key={p} value={p}>
                      {getProviderLabel(p)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {usersSchema.map(({ key, label, type, hint, placeholder }) => (
                  <div key={key} className={key === "clientSecret" || key === "serviceAccountJson" ? "sm:col-span-2" : ""}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                    <input
                      type={type === "password" ? "password" : "text"}
                      value={usersCreds[key] ?? ""}
                      onChange={(e) => setUsersCreds((p) => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      autoComplete="off"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-ring)] outline-none"
                    />
                    {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
                  </div>
                ))}
              </div>
              {usersNeedsTable && (
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Users table</label>
                  <input
                    type="text"
                    value={usersTable}
                    onChange={(e) => setUsersTable(e.target.value)}
                    placeholder="e.g. Users"
                    className="w-full sm:max-w-[420px] px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono text-slate-800"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      type="button"
                      onClick={testUsersExternal}
                      className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 hover:bg-slate-50"
                    >
                      Test connection (list tables)
                    </button>
                    {usersTestOk && usersTables.length > 0 && (
                      <select
                        value={usersTable}
                        onChange={(e) => setUsersTable(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800"
                      >
                        {usersTables.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}
              <div className="mt-4">
                <button
                  type="button"
                  disabled={usersExternalBusy}
                  onClick={handleUsersExternal}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl font-semibold bg-[#1E293B] text-white hover:bg-[#334155] disabled:opacity-50"
                >
                  {usersExternalBusy ? "Applying…" : "Use this Users provider"}
                </button>
              </div>
            </div>
          </div>
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
