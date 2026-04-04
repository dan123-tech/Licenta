"use client";

import Link from "next/link";
import { Car, Users, BarChart2, Shield } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import LanguageCurrencySwitcher from "@/components/LanguageCurrencySwitcher";
import FleetShareBrandBlock from "@/components/FleetShareBrandBlock";

const COL = {
  base: "#0c1220",
  primary: "#185fa5",
  secondary: "#1d4ed8",
  accent: "#f5a623",
};

export default function HomePageClient() {
  const { t } = useI18n();

  const features = [
    {
      id: "fleet",
      icon: Car,
      titleKey: "landing.features.fleetTitle",
      descKey: "landing.features.fleetDesc",
    },
    {
      id: "team",
      icon: Users,
      titleKey: "landing.features.teamTitle",
      descKey: "landing.features.teamDesc",
    },
    {
      id: "ai",
      icon: Shield,
      titleKey: "landing.features.aiTitle",
      descKey: "landing.features.aiDesc",
    },
    {
      id: "cost",
      icon: BarChart2,
      titleKey: "landing.features.costTitle",
      descKey: "landing.features.costDesc",
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: COL.base }}>
      <header
        className="border-b sticky top-0 z-20"
        style={{
          borderColor: "rgba(255,255,255,0.07)",
          background: "rgba(12, 18, 32, 0.92)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-5 py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-y-3 gap-x-3">
          <Link href="/" className="flex items-center min-w-0 shrink-0 hover:opacity-90 transition-opacity">
            <FleetShareBrandBlock tone="dark" size="nav" priority showSubtitle={false} className="max-w-[min(300px,82vw)]" />
          </Link>
          <div className="flex flex-wrap items-end justify-end gap-3 sm:gap-4 w-full sm:w-auto">
            <LanguageCurrencySwitcher variant="landing" />
            <div
              className="hidden sm:block w-px h-9 shrink-0 bg-white/15 mb-0.5"
              aria-hidden
            />
            <nav className="flex items-center gap-2 shrink-0">
              <Link
                href="/login"
                className="text-[13px] font-medium px-3 py-2 rounded-lg transition-colors hover:text-white/90 hover:bg-white/5"
                style={{ color: "rgba(255,255,255,0.72)" }}
              >
                {t("landing.signIn")}
              </Link>
              <Link
                href="/register"
                className="text-[13px] font-semibold px-3.5 py-2 rounded-lg text-white transition-colors shadow-sm bg-[#185fa5] hover:bg-[#1d4ed8] border border-white/10"
              >
                {t("landing.getStarted")}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-5">
        <div className="pt-10 pb-6 sm:pt-14 sm:pb-8 md:pt-16 md:pb-8 text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold mb-4"
            style={{
              background: "rgba(24, 95, 165, 0.22)",
              border: `1px solid rgba(24, 95, 165, 0.45)`,
              color: "#a8d4f5",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: COL.accent, boxShadow: `0 0 8px ${COL.accent}` }}
            />
            {t("landing.eyebrow")}
          </div>

          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3"
            style={{ letterSpacing: "-0.03em", lineHeight: 1.15 }}
          >
            <span style={{ color: COL.accent }}>{t("landing.heroAccentWord")}</span>
            <span className="text-white">{t("landing.heroLine1Rest")}</span>
            <br />
            <span className="text-white">{t("landing.heroLine2Before")}</span>
            <span style={{ color: COL.accent }}>{t("landing.heroLine2Accent")}</span>
            <span className="text-white">{t("landing.heroLine2After")}</span>
          </h1>
          <p
            className="text-sm sm:text-base max-w-xl mx-auto mb-5 md:mb-6"
            style={{ color: "rgba(255,255,255,0.48)", lineHeight: 1.6 }}
          >
            {t("landing.heroSub")}
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center mb-2 sm:mb-4">
            <Link
              href="/register"
              className="flex items-center justify-center h-12 px-6 rounded-xl text-white font-semibold text-sm transition-colors bg-[#185fa5] hover:bg-[#1d4ed8] shadow-[0_2px_10px_rgba(24,95,165,0.4)]"
            >
              {t("landing.ctaPrimary")}
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center h-12 px-6 rounded-xl font-semibold text-sm transition-all hover:border-white/20"
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.7)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              {t("landing.ctaSecondary")}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 pb-12 lg:pb-16">
          {features.map(({ id, icon: Icon, titleKey, descKey }) => (
            <div
              key={id}
              className="p-3 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col min-h-0 min-w-0"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center mb-3 shrink-0"
                style={{
                  background: "rgba(24, 95, 165, 0.22)",
                  border: "1px solid rgba(24, 95, 165, 0.4)",
                }}
              >
                <Icon className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" style={{ color: "#7ec0ea" }} strokeWidth={1.6} />
              </div>
              <h3
                className="font-semibold text-[13px] sm:text-[15px] mb-1 leading-tight"
                style={{ color: COL.accent }}
              >
                {t(titleKey)}
              </h3>
              <p
                className="text-[11px] sm:text-sm leading-snug sm:leading-relaxed line-clamp-3 sm:line-clamp-4 lg:line-clamp-none"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                {t(descKey)}
              </p>
            </div>
          ))}
        </div>

        <div
          className="pb-8 text-center border-t pt-6"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <div
            className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            <span>{t("common.copyright")}</span>
            <span aria-hidden>·</span>
            <Link
              href="/privacy"
              className="hover:underline text-[#185fa5] hover:text-[#1d4ed8] transition-colors"
            >
              {t("landing.footer.privacy")}
            </Link>
            <span aria-hidden>·</span>
            <Link
              href="/terms"
              className="hover:underline text-[#185fa5] hover:text-[#1d4ed8] transition-colors"
            >
              {t("landing.footer.terms")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
