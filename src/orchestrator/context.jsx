"use client";

/**
 * SSO & Database Orchestrator – Provider Pattern.
 * Rest of app uses useOrchestrator(); when disabled, defaults to local config.
 * Isolated: remove this folder to fall back to local-only behaviour.
 */

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  LAYERS,
  LAYER_PROVIDERS,
  DEFAULT_CONFIG,
  loadStoredConfig,
  loadCredentials,
  saveConfig as persistConfig,
  saveCredentials as persistCredentials,
} from "./config";

const OrchestratorContext = createContext(null);

function credKey(layer, provider) {
  return `${layer}:${provider}`;
}

export function DatabaseOrchestratorProvider({ children }) {
  const [config, setConfigState] = useState(() => loadStoredConfig());
  const [credentials, setCredentialsState] = useState(() => (typeof window !== "undefined" ? loadCredentials() : {}));

  useEffect(() => {
    if (typeof window === "undefined") return;
    setConfigState(loadStoredConfig());
    setCredentialsState(loadCredentials());
  }, []);

  const setLayerProvider = useCallback((layer, provider) => {
    if (!LAYER_PROVIDERS[layer]?.includes(provider)) return;
    setConfigState((prev) => {
      const next = { ...prev, [layer]: provider };
      persistConfig(next);
      return next;
    });
  }, []);

  const saveConfiguration = useCallback((newConfig) => {
    const merged = {
      [LAYERS.USERS]: LAYER_PROVIDERS[LAYERS.USERS].includes(newConfig?.[LAYERS.USERS]) ? newConfig[LAYERS.USERS] : config[LAYERS.USERS],
      [LAYERS.CARS]: LAYER_PROVIDERS[LAYERS.CARS].includes(newConfig?.[LAYERS.CARS]) ? newConfig[LAYERS.CARS] : config[LAYERS.CARS],
      [LAYERS.RESERVATIONS]: LAYER_PROVIDERS[LAYERS.RESERVATIONS].includes(newConfig?.[LAYERS.RESERVATIONS]) ? newConfig[LAYERS.RESERVATIONS] : config[LAYERS.RESERVATIONS],
      usersTable: newConfig?.usersTable !== undefined ? newConfig.usersTable : config.usersTable,
      carsTable: newConfig?.carsTable !== undefined ? newConfig.carsTable : config.carsTable,
      reservationsTable: newConfig?.reservationsTable !== undefined ? newConfig.reservationsTable : config.reservationsTable,
    };
    setConfigState(merged);
    persistConfig(merged);
  }, [config]);

  const setLayerTable = useCallback((layer, tableName) => {
    const key = layer === LAYERS.USERS ? "usersTable" : layer === LAYERS.CARS ? "carsTable" : layer === LAYERS.RESERVATIONS ? "reservationsTable" : null;
    if (!key) return;
    setConfigState((prev) => {
      const next = { ...prev, [key]: tableName || null };
      persistConfig(next);
      return next;
    });
  }, []);

  const setCredentials = useCallback((layer, provider, creds) => {
    const key = credKey(layer, provider);
    setCredentialsState((prev) => {
      const next = { ...prev, [key]: creds };
      persistCredentials(next);
      return next;
    });
  }, []);

  const getCredentials = useCallback((layer, provider) => {
    return credentials[credKey(layer, provider)] ?? {};
  }, [credentials]);

  const hasCredentials = useCallback((layer, provider) => {
    const c = credentials[credKey(layer, provider)];
    return c && Object.keys(c).length > 0;
  }, [credentials]);

  const connect = useCallback((layer, provider, creds, tableName) => {
    if (!LAYER_PROVIDERS[layer]?.includes(provider)) return;
    const key = credKey(layer, provider);
    setCredentialsState((prev) => {
      const next = { ...prev, [key]: creds };
      persistCredentials(next);
      return next;
    });
    setConfigState((prev) => {
      const next = { ...prev, [layer]: provider };
      if (tableName != null && tableName.trim()) {
        const tk = layer === LAYERS.USERS ? "usersTable" : layer === LAYERS.CARS ? "carsTable" : layer === LAYERS.RESERVATIONS ? "reservationsTable" : null;
        if (tk) next[tk] = tableName.trim();
      }
      persistConfig(next);
      return next;
    });
  }, []);

  const getLayerTable = useCallback((layer) => {
    const key = layer === LAYERS.USERS ? "usersTable" : layer === LAYERS.CARS ? "carsTable" : layer === LAYERS.RESERVATIONS ? "reservationsTable" : null;
    return key ? (config[key] ?? null) : null;
  }, [config]);

  const value = {
    config,
    setLayerProvider,
    saveConfiguration,
    setLayerTable,
    getLayerTable,
    setCredentials,
    getCredentials,
    hasCredentials,
    connect,
    getActiveProvider: (layer) => config[layer] ?? "LOCAL",
  };

  return (
    <OrchestratorContext.Provider value={value}>
      {children}
    </OrchestratorContext.Provider>
  );
}

export function useOrchestrator() {
  const ctx = useContext(OrchestratorContext);
  if (!ctx) {
    return {
      config: DEFAULT_CONFIG,
      setLayerProvider: () => {},
      saveConfiguration: () => {},
      setLayerTable: () => {},
      getLayerTable: () => null,
      setCredentials: () => {},
      getCredentials: () => ({}),
      hasCredentials: () => false,
      connect: () => {},
      getActiveProvider: () => "LOCAL",
    };
  }
  return ctx;
}
