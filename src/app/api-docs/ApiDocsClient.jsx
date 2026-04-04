"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import LanguageCurrencySwitcher from "@/components/LanguageCurrencySwitcher";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });
import "swagger-ui-react/swagger-ui.css";

export default function ApiDocsClient() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900 tracking-tight">{t("apiDocs.title")}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{t("apiDocs.subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <LanguageCurrencySwitcher variant="light" />
            <Link
              href="/"
              className="text-sm font-semibold text-[#185fa5] hover:text-[#1d4ed8] hover:underline shrink-0"
            >
              {t("apiDocs.backHome")}
            </Link>
          </div>
        </div>
      </header>
      <div className="bg-white min-h-[calc(100vh-4rem)]">
        <SwaggerUI url="/api/openapi" />
      </div>
    </div>
  );
}
