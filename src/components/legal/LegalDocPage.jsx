"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";

const COL = { base: "#0c1220" };

/**
 * @param {{ prefix: string }} props  e.g. "legal.privacy" — expects s1Title/s1Body … sNTitle/sNBody, pageTitle, updated
 */
export default function LegalDocPage({ prefix }) {
  const { t } = useI18n();

  const sections = [];
  for (let i = 1; i <= 12; i++) {
    const titleKey = `${prefix}.s${i}Title`;
    const bodyKey = `${prefix}.s${i}Body`;
    const title = t(titleKey);
    const body = t(bodyKey);
    if (title === titleKey || body === bodyKey) break;
    sections.push({ title, body });
  }

  return (
    <div className="min-h-screen" style={{ background: COL.base }}>
      <header
        className="border-b"
        style={{
          borderColor: "rgba(255,255,255,0.07)",
          background: "rgba(12, 18, 32, 0.92)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="text-[13px] font-medium transition-colors hover:text-white/90"
            style={{ color: "rgba(255,255,255,0.72)" }}
          >
            ← {t("legal.backHome")}
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-5 py-10 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2" style={{ letterSpacing: "-0.03em" }}>
          {t(`${prefix}.pageTitle`)}
        </h1>
        <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
          {t(`${prefix}.updated`)}
        </p>

        <div className="space-y-8">
          {sections.map(({ title, body }) => (
            <section key={title}>
              <h2 className="text-base font-semibold text-white mb-2">{title}</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "rgba(255,255,255,0.55)" }}>
                {body}
              </p>
            </section>
          ))}
        </div>

        <p
          className="mt-12 pt-8 border-t text-xs leading-relaxed"
          style={{ borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }}
        >
          {t("legal.disclaimer")}
        </p>
      </main>
    </div>
  );
}
