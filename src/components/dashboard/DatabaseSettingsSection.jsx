"use client";

/**
 * Database Settings – Hybrid Data Bridge. Three layers (Users, Cars, Reservations).
 * Navy/Slate theme; credential modals with Test Connection; Save Configuration; status "Running on Local DB" / "Running on [Provider]".
 * Isolated: uses orchestrator context; when orchestrator is removed, this section is not rendered.
 */

import { useState, useCallback, useEffect } from "react";
import { Shield, Database, Flame, FileSpreadsheet, Server, Lock, X, RotateCcw } from "lucide-react";
import { useOrchestrator } from "@/orchestrator";
import { LAYERS, LAYER_PROVIDERS, PROVIDERS, CREDENTIAL_SCHEMAS, getProviderLabel } from "@/orchestrator/config";
import { apiDataSourceConfigGet, apiDataSourceConfigSave, apiDataSourceTablesFetch, apiDataSourceCredentialsSave, apiDataSourceTestFirebase } from "@/lib/api";

const ICON_MAP = {
  [PROVIDERS.LOCAL]: Server,
  [PROVIDERS.ENTRA]: Shield,
  [PROVIDERS.SQL_SERVER]: Database,
  [PROVIDERS.POSTGRES]: Database,
  [PROVIDERS.FIREBASE]: Flame,
  [PROVIDERS.SHAREPOINT]: FileSpreadsheet,
};

const PROVIDER_LABELS = {
  [PROVIDERS.LOCAL]: "Built-in PostgreSQL",
  [PROVIDERS.ENTRA]: "Microsoft Entra (AD)",
  [PROVIDERS.SQL_SERVER]: "SQL Server",
  [PROVIDERS.POSTGRES]: "External PostgreSQL",
  [PROVIDERS.FIREBASE]: "Firebase",
  [PROVIDERS.SHAREPOINT]: "SharePoint",
};

function ToggleButton({ providerId, label, icon: Icon, active, disabled, hasCredentials, onClick }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onClick(providerId)}
      disabled={disabled}
      className={`
        flex flex-col sm:flex-row items-center gap-2 sm:gap-3 px-4 py-3 rounded-xl border-2 min-w-[120px] sm:min-w-[140px]
        transition-all duration-200 text-left relative
        ${active
          ? "border-[var(--primary)] bg-[var(--primary)]/10 text-slate-900 shadow-sm ring-2 ring-[var(--primary-ring)]"
          : disabled
            ? "border-slate-200 bg-slate-100/80 text-slate-400 cursor-not-allowed"
            : "border-slate-200 bg-slate-50/80 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
        }
      `}
    >
      {hasCredentials && (
        <span className="absolute top-2 right-2 text-slate-500" title="Credentials stored">
          <Lock className="w-4 h-4" aria-hidden />
        </span>
      )}
      {Icon && <Icon className={`w-5 h-5 shrink-0 ${active ? "text-[#1E293B]" : "text-slate-500"}`} aria-hidden />}
      <span className="block font-semibold text-sm pr-6">{label}</span>
    </button>
  );
}

function ConnectModal({ open, title, providerId, schema, initialValues, initialTableName, onClose, onTest, onConnect }) {
  const [values, setValues] = useState(() => ({ ...initialValues }));
  const [tableNameInput, setTableNameInput] = useState(initialTableName ?? "");
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testMessage, setTestMessage] = useState(null);
  const [connectError, setConnectError] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");

  const needsRelationalTable =
    providerId === PROVIDERS.SQL_SERVER || providerId === PROVIDERS.POSTGRES;

  useEffect(() => {
    if (open) {
      setValues({ ...initialValues });
      setTableNameInput(initialTableName ?? "");
      setTestMessage(null);
      setConnectError(null);
      setTables([]);
      setSelectedTable("");
    }
  }, [open, initialValues, initialTableName]);

  if (!open) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestMessage(null);
    setConnectError(null);
    setTables([]);
    try {
      const result = await (onTest?.(values) ?? Promise.resolve());
      setTestMessage({ ok: true, text: "Connection successful." });
      if (needsRelationalTable && Array.isArray(result)) {
        setTables(result);
        if (result.length > 0 && !tableNameInput.trim()) setSelectedTable(result[0]);
      }
    } catch (e) {
      const msg = e?.message || (typeof e === "string" ? e : "Connection failed.");
      setTestMessage({ ok: false, text: msg });
    } finally {
      setTesting(false);
    }
  };

  const handleConnect = async () => {
    setConnectError(null);
    const effectiveTableName = (tableNameInput || "").trim() || selectedTable || "";
    if (needsRelationalTable && !effectiveTableName) {
      setConnectError("Enter a data table name or run Test Connection and select a table.");
      return;
    }
    if (!onConnect) return;
    setConnecting(true);
    try {
      await onConnect(values, needsRelationalTable ? effectiveTableName : undefined);
      onClose?.();
    } catch (e) {
      const msg = e?.message || (typeof e === "string" ? e : "Connect failed. Try again.");
      setConnectError(msg);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#1E293B] text-white px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Connect to {title}</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form className="p-6 space-y-4 max-h-[70vh] overflow-y-auto" onSubmit={(e) => { e.preventDefault(); handleConnect(); }}>
          {schema.map(({ key, label, type, hint, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
              <input
                type={type}
                value={values[key] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 bg-white focus:border-[#1E293B] focus:ring-2 focus:ring-[#1E293B]/20 outline-none"
                placeholder={placeholder ?? (hint ? undefined : label)}
                autoComplete={type === "password" ? "current-password" : "off"}
              />
              {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
            </div>
          ))}
          {needsRelationalTable && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Data table name</label>
              <input
                type="text"
                value={tableNameInput}
                onChange={(e) => setTableNameInput(e.target.value)}
                placeholder="e.g. Users, Cars, Reservation"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 bg-white focus:border-[#1E293B] focus:ring-2 focus:ring-[#1E293B]/20 outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">Table from which this layer reads data. Type the name or select below after Test Connection.</p>
            </div>
          )}
          {needsRelationalTable && testMessage?.ok && tables.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Or select from list (after Test Connection)</label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 bg-white focus:border-[#1E293B] focus:ring-2 focus:ring-[#1E293B]/20 outline-none"
              >
                <option value="">Choose a table…</option>
                {tables.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
          {testMessage && (
            <p className={`text-sm font-medium ${testMessage.ok ? "text-emerald-600" : "text-red-600"}`}>{testMessage.text}</p>
          )}
          {connectError && (
            <p className="text-sm font-medium text-red-600" role="alert">{connectError}</p>
          )}
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" onClick={handleTest} disabled={testing} className="px-4 py-2.5 rounded-xl font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              {testing ? "Testing…" : "Test Connection"}
            </button>
            <button type="submit" disabled={connecting} className="px-4 py-2.5 rounded-xl font-semibold bg-[#1E293B] text-white hover:bg-[#334155] disabled:opacity-50">
              {connecting ? "Connecting…" : "Connect"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LayerSection({ title, subtitle, options, layer, activeProvider, hasCredentials, onButtonClick, statusLabel }) {
  const active = activeProvider;
  const disabled = (providerId) => active != null && active !== PROVIDERS.LOCAL && active !== providerId;

  return (
    <section className="p-6 sm:p-8 rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        {statusLabel && (
          <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            {statusLabel}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-3 sm:gap-4">
        {options.map((opt) => {
          const Icon = ICON_MAP[opt.id];
          const isActive = active === opt.id;
          const isDisabled = disabled(opt.id);
          const hasCreds = hasCredentials(layer, opt.id);
          return (
            <ToggleButton
              key={opt.id}
              providerId={opt.id}
              label={opt.name}
              icon={Icon}
              active={isActive}
              disabled={isDisabled}
              hasCredentials={hasCreds}
              onClick={() => onButtonClick(opt.id)}
            />
          );
        })}
      </div>
    </section>
  );
}

export default function DatabaseSettingsSection() {
  const { config, saveConfiguration, getCredentials, hasCredentials, connect, setLayerProvider } = useOrchestrator();
  const [modal, setModal] = useState({ open: false, layer: null, providerId: null, title: "" });
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [loadingBackend, setLoadingBackend] = useState(true);
  const [backendConfig, setBackendConfig] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingBackend(true);
      try {
        const data = await apiDataSourceConfigGet();
        if (cancelled) return;
        setBackendConfig(data);
        if (data && typeof data === "object") {
          saveConfiguration({
            [LAYERS.USERS]: data.users ?? config[LAYERS.USERS],
            [LAYERS.CARS]: data.cars ?? config[LAYERS.CARS],
            [LAYERS.RESERVATIONS]: data.reservations ?? config[LAYERS.RESERVATIONS],
            usersTable: data.usersTable ?? config.usersTable,
            carsTable: data.carsTable ?? config.carsTable,
            reservationsTable: data.reservationsTable ?? config.reservationsTable,
          });
        }
      } catch {
        if (!cancelled) setBackendConfig(null);
      } finally {
        if (!cancelled) setLoadingBackend(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const openModal = useCallback((layer, providerId, title) => {
    setModal({ open: true, layer, providerId, title });
  }, []);

  const closeModal = useCallback(() => setModal((m) => ({ ...m, open: false })), []);

  const handleLayerButtonClick = useCallback((layer, providerId, providerName) => {
    if (providerId === PROVIDERS.LOCAL) {
      setLayerProvider(layer, PROVIDERS.LOCAL);
      return;
    }
    openModal(layer, providerId, providerName);
  }, [openModal, setLayerProvider]);

  const handleTestConnection = useCallback(async (layer, providerId, values) => {
    if (providerId === PROVIDERS.SQL_SERVER) {
      const data = await apiDataSourceTablesFetch({
        provider: PROVIDERS.SQL_SERVER,
        host: values.host,
        port: values.port,
        databaseName: values.databaseName,
        username: values.username,
        password: values.password,
      });
      return data.tables || [];
    }
    if (providerId === PROVIDERS.POSTGRES) {
      const data = await apiDataSourceTablesFetch({
        provider: PROVIDERS.POSTGRES,
        host: values.host,
        port: values.port,
        databaseName: values.databaseName,
        username: values.username,
        password: values.password,
        ssl: values.ssl,
      });
      return data.tables || [];
    }
    if (providerId === PROVIDERS.FIREBASE) {
      if (!values?.serviceAccountJson?.trim()) throw new Error("Paste the Service account JSON from Firebase Console → Service accounts → Generate new private key.");
      await apiDataSourceTestFirebase({ credentials: { serviceAccountJson: values.serviceAccountJson } });
      return;
    }
    if (providerId === PROVIDERS.ENTRA) {
      if (!values?.clientId?.trim()) throw new Error("Application (client) ID is required.");
      if (!values?.tenantId?.trim()) throw new Error("Directory (tenant) ID is required.");
      if (!values?.clientSecret?.trim()) throw new Error("Client Secret is required.");
      return;
    }
    if (providerId === PROVIDERS.SHAREPOINT) {
      if (!values?.siteUrl?.trim()) throw new Error("Site URL is required.");
      if (!values?.clientId?.trim()) throw new Error("Client ID is required.");
      if (!values?.clientSecret?.trim()) throw new Error("Client Secret is required.");
      return;
    }
    return Promise.resolve();
  }, []);

  const handleConnect = useCallback((layer, providerId) => async (creds, selectedTable) => {
    if (providerId === PROVIDERS.SQL_SERVER || providerId === PROVIDERS.POSTGRES) {
      await apiDataSourceCredentialsSave({
        layer,
        provider: providerId,
        credentials: creds,
        tableName: selectedTable || undefined,
      });
      const tablePayload = {
        users: layer === LAYERS.USERS ? providerId : config[LAYERS.USERS],
        cars: layer === LAYERS.CARS ? providerId : config[LAYERS.CARS],
        reservations: layer === LAYERS.RESERVATIONS ? providerId : config[LAYERS.RESERVATIONS],
        usersTable: layer === LAYERS.USERS ? selectedTable : config.usersTable,
        carsTable: layer === LAYERS.CARS ? selectedTable : config.carsTable,
        reservationsTable: layer === LAYERS.RESERVATIONS ? selectedTable : config.reservationsTable,
      };
      await apiDataSourceConfigSave(tablePayload);
      setBackendConfig((prev) => ({ ...prev, ...tablePayload }));
    } else if (providerId === PROVIDERS.FIREBASE) {
      await apiDataSourceCredentialsSave({
        layer,
        provider: providerId,
        credentials: creds,
      });
      const configPayload = {
        users: layer === LAYERS.USERS ? providerId : config[LAYERS.USERS],
        cars: layer === LAYERS.CARS ? providerId : config[LAYERS.CARS],
        reservations: layer === LAYERS.RESERVATIONS ? providerId : config[LAYERS.RESERVATIONS],
        usersTable: layer === LAYERS.USERS ? undefined : config.usersTable,
        carsTable: layer === LAYERS.CARS ? undefined : config.carsTable,
        reservationsTable: layer === LAYERS.RESERVATIONS ? undefined : config.reservationsTable,
      };
      await apiDataSourceConfigSave(configPayload);
      setBackendConfig((prev) => ({ ...prev, ...configPayload }));
    } else if (providerId === PROVIDERS.ENTRA || providerId === PROVIDERS.SHAREPOINT) {
      await apiDataSourceCredentialsSave({
        layer,
        provider: providerId,
        credentials: creds,
      });
      const configPayload = {
        users: layer === LAYERS.USERS ? providerId : config[LAYERS.USERS],
        cars: layer === LAYERS.CARS ? providerId : config[LAYERS.CARS],
        reservations: layer === LAYERS.RESERVATIONS ? providerId : config[LAYERS.RESERVATIONS],
        usersTable: layer === LAYERS.USERS ? undefined : config.usersTable,
        carsTable: layer === LAYERS.CARS ? undefined : config.carsTable,
        reservationsTable: layer === LAYERS.RESERVATIONS ? undefined : config.reservationsTable,
      };
      await apiDataSourceConfigSave(configPayload);
      setBackendConfig((prev) => ({ ...prev, ...configPayload }));
    }
    connect(layer, providerId, creds, selectedTable);
    closeModal();
  }, [connect, closeModal, config]);

  const handleSave = useCallback(async () => {
    setSaveError("");
    try {
      await apiDataSourceConfigSave({
        users: config[LAYERS.USERS],
        cars: config[LAYERS.CARS],
        reservations: config[LAYERS.RESERVATIONS],
        usersTable: config.usersTable || undefined,
        carsTable: config.carsTable || undefined,
        reservationsTable: config.reservationsTable || undefined,
      });
      setBackendConfig({ ...config });
      saveConfiguration(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("dataSourceConfigSaved"));
    } catch (err) {
      setSaveError(err?.message || "Failed to save configuration");
    }
  }, [config, saveConfiguration]);

  const handleResetAllToLocal = useCallback(async () => {
    if (!confirm("Reset all layers to the built-in PostgreSQL database? This will apply immediately.")) return;
    setSaveError("");
    setResetting(true);
    try {
      await apiDataSourceConfigSave({
        users: PROVIDERS.LOCAL,
        cars: PROVIDERS.LOCAL,
        reservations: PROVIDERS.LOCAL,
        usersTable: null,
        carsTable: null,
        reservationsTable: null,
      });
      const localConfig = {
        [LAYERS.USERS]: PROVIDERS.LOCAL,
        [LAYERS.CARS]: PROVIDERS.LOCAL,
        [LAYERS.RESERVATIONS]: PROVIDERS.LOCAL,
        usersTable: null,
        carsTable: null,
        reservationsTable: null,
      };
      setBackendConfig(localConfig);
      saveConfiguration(localConfig);
      setResetDone(true);
      setTimeout(() => setResetDone(false), 2500);
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("dataSourceConfigSaved"));
    } catch (err) {
      setSaveError(err?.message || "Failed to reset to local");
    } finally {
      setResetting(false);
    }
  }, [saveConfiguration]);

  const statusFor = (layer) => {
    const provider = backendConfig?.[layer] ?? config[layer];
    const tableKey = layer === LAYERS.USERS ? "usersTable" : layer === LAYERS.CARS ? "carsTable" : "reservationsTable";
    const tableName = backendConfig?.[tableKey] ?? config[tableKey];
    if (provider === PROVIDERS.LOCAL) return "Running on built-in PostgreSQL";
    if (tableName) return `Running on ${getProviderLabel(provider)} (Table: ${tableName})`;
    return `Running on ${getProviderLabel(provider)}`;
  };

  const usersOptions = LAYER_PROVIDERS[LAYERS.USERS].map((id) => ({ id, name: PROVIDER_LABELS[id] || id }));
  const carsOptions = LAYER_PROVIDERS[LAYERS.CARS].map((id) => ({ id, name: PROVIDER_LABELS[id] || id }));
  const reservationsOptions = LAYER_PROVIDERS[LAYERS.RESERVATIONS].map((id) => ({ id, name: PROVIDER_LABELS[id] || id }));
  const schema = modal.providerId ? (CREDENTIAL_SCHEMAS[modal.providerId] || []) : [];
  const initialValues = modal.layer && modal.providerId ? getCredentials(modal.layer, modal.providerId) : {};
  const initialTableName =
    modal.layer === LAYERS.USERS ? (backendConfig?.usersTable ?? config.usersTable ?? "")
      : modal.layer === LAYERS.CARS ? (backendConfig?.carsTable ?? config.carsTable ?? "")
        : modal.layer === LAYERS.RESERVATIONS ? (backendConfig?.reservationsTable ?? config.reservationsTable ?? "") : "";

  return (
    <div className="flex flex-col w-full min-h-full max-w-6xl mx-auto">
      <div className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mb-8 p-5 sm:p-6 rounded-xl bg-[#1E293B] text-white border border-slate-600/50 shadow-sm">
          <h2 className="text-xl font-bold text-white mb-1">Database Settings</h2>
          <p className="text-sm text-slate-300">
            Choose one connection per layer (Users, Cars, Reservations). Built-in PostgreSQL (FleetShare app database) is the default. For external PostgreSQL, SQL Server, Firebase, Entra, or SharePoint: pick the provider, enter credentials, Test Connection, then Connect. Use Save Configuration to persist all layers.
          </p>
        </div>

        <div className="space-y-8 sm:space-y-10">
          <LayerSection
            title="Users Layer"
            subtitle="Built-in PostgreSQL, Entra, SQL Server, external PostgreSQL, Firebase, SharePoint"
            options={usersOptions}
            layer={LAYERS.USERS}
            activeProvider={config[LAYERS.USERS]}
            hasCredentials={hasCredentials}
            onButtonClick={(id) => handleLayerButtonClick(LAYERS.USERS, id, PROVIDER_LABELS[id])}
            statusLabel={statusFor(LAYERS.USERS)}
          />
          <LayerSection
            title="Cars Layer"
            subtitle="Built-in PostgreSQL, SQL Server, external PostgreSQL, Firebase, SharePoint"
            options={carsOptions}
            layer={LAYERS.CARS}
            activeProvider={config[LAYERS.CARS]}
            hasCredentials={hasCredentials}
            onButtonClick={(id) => handleLayerButtonClick(LAYERS.CARS, id, PROVIDER_LABELS[id])}
            statusLabel={statusFor(LAYERS.CARS)}
          />
          <LayerSection
            title="Reservations Layer"
            subtitle="Built-in PostgreSQL, SQL Server, external PostgreSQL, Firebase, SharePoint"
            options={reservationsOptions}
            layer={LAYERS.RESERVATIONS}
            activeProvider={config[LAYERS.RESERVATIONS]}
            hasCredentials={hasCredentials}
            onButtonClick={(id) => handleLayerButtonClick(LAYERS.RESERVATIONS, id, PROVIDER_LABELS[id])}
            statusLabel={statusFor(LAYERS.RESERVATIONS)}
          />
        </div>
      </div>

      <footer className="w-full mt-auto border-t border-slate-200 bg-slate-50/80 px-4 sm:px-6 md:px-8 py-4 sm:py-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={loadingBackend}
              className="w-full sm:w-auto px-6 py-3 bg-[#1E293B] text-white font-semibold rounded-xl hover:bg-[#334155] shadow-sm transition-colors disabled:opacity-50"
              title="Save current provider and table choices for Users, Cars, and Reservations layers"
            >
              Save Configuration
            </button>
            <button
              type="button"
              onClick={handleResetAllToLocal}
              disabled={loadingBackend || resetting}
              className="w-full sm:w-auto px-5 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 hover:border-slate-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              title="Set all layers (Users, Cars, Reservations) back to Local DB"
            >
              <RotateCcw className={`w-4 h-4 shrink-0 ${resetting ? "animate-spin" : ""}`} aria-hidden />
              Reset all to Local
            </button>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {saved && <span className="text-sm font-medium text-emerald-600">Configuration saved.</span>}
            {resetDone && <span className="text-sm font-medium text-emerald-600">Reset to Local applied.</span>}
            {saveError && <span className="text-sm font-medium text-red-600">{saveError}</span>}
          </div>
        </div>
      </footer>

      <ConnectModal
        open={modal.open}
        title={modal.title}
        providerId={modal.providerId}
        schema={schema}
        initialValues={initialValues}
        initialTableName={initialTableName}
        onClose={closeModal}
        onTest={modal.layer && modal.providerId ? (values) => handleTestConnection(modal.layer, modal.providerId, values) : undefined}
        onConnect={modal.layer && modal.providerId ? handleConnect(modal.layer, modal.providerId) : undefined}
      />
    </div>
  );
}
