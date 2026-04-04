"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { fuelTypeBadgeClass } from "@/lib/fuelTheme";

const FUEL_KEY = {
  Benzine: "benzine",
  Diesel: "diesel",
  Electric: "electric",
  Hybrid: "hybrid",
};

export default function FuelTypeBadge({ fuelType }) {
  const { t } = useI18n();
  const raw = fuelType || "Benzine";
  const key = FUEL_KEY[raw];
  const label = key ? t(`fuelTypes.${key}`) : raw;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${fuelTypeBadgeClass(raw)}`}
    >
      {label}
    </span>
  );
}
