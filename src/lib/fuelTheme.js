/**
 * Single source for fuel-type colors across the web app (badges + charts).
 * Keep chart hex and Tailwind badge classes visually aligned per type.
 */

/** Recharts / PDF / any hex consumer */
export const FUEL_CHART_COLORS = {
  Benzine: "#F59E0B",
  Diesel: "#475569",
  Electric: "#10B981",
  Hybrid: "#0D9488",
};

/** Tailwind utility strings for bordered pills */
export const FUEL_BADGE_CLASSES = {
  Benzine: "bg-amber-100 text-amber-900 border-amber-300",
  Diesel: "bg-slate-200 text-slate-800 border-slate-400",
  Electric: "bg-emerald-100 text-emerald-900 border-emerald-300",
  Hybrid: "bg-teal-100 text-teal-900 border-teal-300",
};

export const FUEL_TYPE_ORDER = ["Benzine", "Diesel", "Electric", "Hybrid"];

export function fuelChartColor(fuelType) {
  return FUEL_CHART_COLORS[fuelType] || "#94A3B8";
}

export function fuelTypeBadgeClass(fuelType) {
  return FUEL_BADGE_CLASSES[fuelType] || FUEL_BADGE_CLASSES.Benzine;
}
