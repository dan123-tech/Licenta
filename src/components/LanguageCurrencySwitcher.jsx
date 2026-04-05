"use client";

import { useI18n } from "@/i18n/I18nProvider";

const LOCALE_LABELS = { en: "English", ro: "Română" };
const CURRENCY_LABELS = {
  EUR: "EUR",
  RON: "RON",
  USD: "USD",
  GBP: "GBP",
};

const CHEVRON_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")";

/** Currency only (statistics); compact light style */
const CURRENCY_SELECT_LIGHT =
  "text-[13px] rounded-lg px-2.5 py-2 bg-white text-slate-900 border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/35 min-w-[7.5rem]";

/** Language — light surfaces: chevron, hover, primary focus */
const LANGUAGE_SELECT_LIGHT =
  "text-[13px] font-medium rounded-xl pl-3.5 pr-10 py-2.5 bg-white text-slate-800 border border-slate-200/95 shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:border-slate-300 hover:shadow-[0_2px_6px_rgba(15,23,42,0.06)] transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] min-w-[10rem] appearance-none bg-[length:15px] bg-[right_0.65rem_center] bg-no-repeat cursor-pointer";

/**
 * @param {"light"|"dark"|"landing"} variant
 * @param {boolean} [showLanguage=true]
 * @param {boolean} [showCurrency=false] — e.g. only on admin Statistics (in-page)
 */
export default function LanguageCurrencySwitcher({
  variant = "light",
  showCurrency = false,
  showLanguage = true,
}) {
  const { locale, setLocale, currency, setCurrency, t, currencies, locales } = useI18n();

  const isDark = variant === "dark";
  const isLanding = variant === "landing";
  const currencyVisible = showCurrency === true;
  const languageVisible = showLanguage !== false;

  if (!languageVisible && !currencyVisible) return null;

  let labelClass;
  if (isLanding) {
    labelClass = "landing-locale-label";
  } else if (isDark) {
    labelClass = "text-[10px] font-semibold uppercase tracking-wide text-white/75";
  } else {
    labelClass = "text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500";
  }

  const languageSelectClass = isLanding ? "landing-locale-select" : LANGUAGE_SELECT_LIGHT;
  const currencySelectClass = CURRENCY_SELECT_LIGHT;

  const languageSelectStyle = isLanding ? { colorScheme: "light" } : { colorScheme: "light", backgroundImage: CHEVRON_BG };

  const currencySelectStyle = { colorScheme: "light" };

  return (
    <div
      className={`flex flex-wrap items-end ${isLanding ? "gap-3 sm:gap-4" : currencyVisible ? "gap-4" : "gap-2"}`}
      role="group"
      aria-label={t("i18n.preferences")}
    >
      {languageVisible && (
        <div className={`flex flex-col ${isLanding ? "gap-0" : "gap-1"}`}>
          <label htmlFor="app-locale" className={labelClass}>
            {t("i18n.language")}
          </label>
          <select
            id="app-locale"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className={languageSelectClass}
            style={languageSelectStyle}
          >
            {locales.map((code) => (
              <option key={code} value={code}>
                {LOCALE_LABELS[code] || code}
              </option>
            ))}
          </select>
        </div>
      )}
      {currencyVisible && (
        <div className="flex flex-col gap-1">
          <label htmlFor="app-currency" className={labelClass}>
            {t("i18n.currency")}
          </label>
          <select
            id="app-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={currencySelectClass}
            style={currencySelectStyle}
          >
            {currencies.map((code) => (
              <option key={code} value={code}>
                {CURRENCY_LABELS[code] || code}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
