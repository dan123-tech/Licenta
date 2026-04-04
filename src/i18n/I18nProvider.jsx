"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import en from "./messages/en.json";
import ro from "./messages/ro.json";

const CATALOG = { en, ro };

const LS_LOCALE = "car_sharing_locale";
const LS_CURRENCY = "car_sharing_currency";

const VALID_LOCALES = ["en", "ro"];
const VALID_CURRENCIES = ["EUR", "RON", "USD", "GBP"];

function getByPath(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[p];
  }
  return cur;
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState("en");
  const [currency, setCurrencyState] = useState("EUR");

  useEffect(() => {
    let nextLocale = "en";
    const savedL = typeof window !== "undefined" ? localStorage.getItem(LS_LOCALE) : null;
    if (savedL === "en" || savedL === "ro") {
      nextLocale = savedL;
    } else if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("ro")) {
      nextLocale = "ro";
    }
    setLocaleState(nextLocale);

    let nextCurrency = "EUR";
    const savedC = typeof window !== "undefined" ? localStorage.getItem(LS_CURRENCY) : null;
    if (savedC && VALID_CURRENCIES.includes(savedC)) {
      nextCurrency = savedC;
    } else {
      nextCurrency = nextLocale === "ro" ? "RON" : "EUR";
    }
    setCurrencyState(nextCurrency);

    if (typeof document !== "undefined") {
      document.documentElement.lang = nextLocale === "ro" ? "ro" : "en";
    }
  }, []);

  const setLocale = useCallback((next) => {
    if (!VALID_LOCALES.includes(next)) return;
    setLocaleState(next);
    try {
      localStorage.setItem(LS_LOCALE, next);
    } catch (_) {}
    if (typeof document !== "undefined") {
      document.documentElement.lang = next === "ro" ? "ro" : "en";
    }
  }, []);

  const setCurrency = useCallback((next) => {
    if (!VALID_CURRENCIES.includes(next)) return;
    setCurrencyState(next);
    try {
      localStorage.setItem(LS_CURRENCY, next);
    } catch (_) {}
  }, []);

  const catalog = CATALOG[locale] || CATALOG.en;

  const t = useCallback(
    (key, vars) => {
      let s = getByPath(catalog, key);
      if (typeof s !== "string") s = getByPath(CATALOG.en, key);
      if (typeof s !== "string") return key;
      if (vars && typeof vars === "object") {
        return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ""));
      }
      return s;
    },
    [catalog]
  );

  const formatCurrency = useCallback(
    (value, options = {}) => {
      if (value == null || Number.isNaN(Number(value))) return "—";
      const n = Number(value);
      const loc = locale === "ro" ? "ro-RO" : "en-GB";
      try {
        return new Intl.NumberFormat(loc, {
          style: "currency",
          currency,
          minimumFractionDigits: options.minimumFractionDigits ?? 2,
          maximumFractionDigits: options.maximumFractionDigits ?? 2,
        }).format(n);
      } catch {
        return `${n.toFixed(2)} ${currency}`;
      }
    },
    [locale, currency]
  );

  /** Plain numbers: en-GB uses `,` thousands / `.` decimals; ro-RO uses `.` thousands / `,` decimals. */
  const formatNumber = useCallback(
    (value, options = {}) => {
      if (value == null || Number.isNaN(Number(value))) return options.fallback ?? "—";
      const n = Number(value);
      const loc = locale === "ro" ? "ro-RO" : "en-GB";
      try {
        return new Intl.NumberFormat(loc, {
          minimumFractionDigits: options.minimumFractionDigits,
          maximumFractionDigits: options.maximumFractionDigits,
          useGrouping: options.useGrouping !== false,
        }).format(n);
      } catch {
        return String(n);
      }
    },
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      currency,
      setCurrency,
      t,
      formatCurrency,
      formatNumber,
      locales: VALID_LOCALES,
      currencies: VALID_CURRENCIES,
    }),
    [locale, setLocale, currency, setCurrency, t, formatCurrency, formatNumber]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
