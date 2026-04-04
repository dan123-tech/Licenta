"use client";

import { useI18n } from "@/i18n/I18nProvider";

const LOCALE_LABELS = { en: "English", ro: "Română" };
const CURRENCY_LABELS = {
  EUR: "EUR",
  RON: "RON",
  USD: "USD",
  GBP: "GBP",
};

/** Native <select> dropdowns follow OS theme; color-scheme: light keeps options readable on Windows. */
const LIGHT_SELECT =
  "text-[13px] rounded-lg px-2.5 py-2 bg-white text-slate-900 border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/35 min-w-[7.5rem]";

/** Marketing header: matches dashboard-style white fields + custom chevron */
const LANDING_SELECT =
  "text-[13px] font-medium rounded-lg pl-2.5 pr-8 py-2 bg-white text-slate-800 border border-slate-200/90 shadow-[0_1px_2px_rgba(15,23,42,0.06)] focus:outline-none focus:ring-2 focus:ring-[#185fa5]/35 focus:border-[#185fa5]/40 min-w-[7.25rem] appearance-none bg-[length:14px] bg-[right_0.5rem_center] bg-no-repeat";

const CHEVRON_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")";

/**
 * Compact language + currency selectors.
 * - `light`: dashboard topbar, forms (slate labels).
 * - `dark`: dark bars — light labels + white selects.
 * - `landing`: dark intro header — uppercase muted labels + polished white selects (near Log in / CTA).
 */
export default function LanguageCurrencySwitcher({ variant = "light" }) {
  const { locale, setLocale, currency, setCurrency, t, currencies, locales } = useI18n();

  const isDark = variant === "dark";
  const isLanding = variant === "landing";
  const selectClass = isLanding ? LANDING_SELECT : LIGHT_SELECT;

  let labelClass;
  if (isLanding) {
    labelClass = "text-[10px] font-bold uppercase tracking-[0.14em] text-white/55";
  } else if (isDark) {
    labelClass = "text-[10px] font-semibold uppercase tracking-wide text-white/75";
  } else {
    labelClass = "text-[10px] uppercase tracking-wide text-slate-500";
  }

  const selectStyle = isLanding
    ? { colorScheme: "light", backgroundImage: CHEVRON_BG }
    : { colorScheme: "light" };

  return (
    <div
      className={`flex flex-wrap items-end ${isLanding ? "gap-3 sm:gap-4" : "gap-3"}`}
      role="group"
      aria-label={t("i18n.preferences")}
    >
      <div className={`flex flex-col ${isLanding ? "gap-1" : "gap-0.5"}`}>
        <label htmlFor="app-locale" className={labelClass}>
          {t("i18n.language")}
        </label>
        <select
          id="app-locale"
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          className={selectClass}
          style={selectStyle}
        >
          {locales.map((code) => (
            <option key={code} value={code}>
              {LOCALE_LABELS[code] || code}
            </option>
          ))}
        </select>
      </div>
      <div className={`flex flex-col ${isLanding ? "gap-1" : "gap-0.5"}`}>
        <label htmlFor="app-currency" className={labelClass}>
          {t("i18n.currency")}
        </label>
        <select
          id="app-currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className={selectClass}
          style={selectStyle}
        >
          {currencies.map((code) => (
            <option key={code} value={code}>
              {CURRENCY_LABELS[code] || code}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
