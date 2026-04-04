"use client";

import { useState } from "react";
import { apiCreateCompany, apiJoinCompany } from "@/lib/api";
import { useI18n } from "@/i18n/I18nProvider";

export default function NoCompanyView({ onJoined }) {
  const { t } = useI18n();
  const [createName, setCreateName] = useState("");
  const [createDomain, setCreateDomain] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await apiCreateCompany(createName.trim(), createDomain.trim() || null);
      setSuccess(t("noCompany.successCreate"));
      setCreateName("");
      setCreateDomain("");
      onJoined?.();
    } catch (err) {
      setError(err.message || "Failed to create company");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await apiJoinCompany(joinCode.trim());
      setSuccess(t("noCompany.successJoin"));
      setJoinCode("");
      onJoined?.();
    } catch (err) {
      setError(err.message || "Failed to join");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6 sm:px-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">{t("noCompany.title")}</h1>
      <p className="text-slate-500 mb-8">{t("noCompany.subtitle")}</p>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 text-red-700 border border-red-100 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 text-sm">
          {success}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <div className="bg-white rounded-[12px] shadow-[0_1px_3px_0_rgb(0_0_0/0.06),0_1px_2px_-1px_rgb(0_0_0/0.06)] p-6 border border-slate-100/80">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{t("noCompany.createHeading")}</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">{t("noCompany.companyName")}</label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-ring)] text-slate-800"
                placeholder="Acme Corp"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">{t("noCompany.domainOptional")}</label>
              <input
                type="text"
                value={createDomain}
                onChange={(e) => setCreateDomain(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-ring)] text-slate-800"
                placeholder="acme.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[var(--primary)] text-white font-semibold rounded-xl hover:bg-[var(--primary-hover)] disabled:opacity-50 shadow-sm transition-colors"
            >
              {loading ? t("noCompany.creating") : t("noCompany.createCompany")}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-[12px] shadow-[0_1px_3px_0_rgb(0_0_0/0.06),0_1px_2px_-1px_rgb(0_0_0/0.06)] p-6 border border-slate-100/80">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{t("noCompany.joinHeading")}</h2>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">{t("noCompany.joinCode")}</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-ring)] uppercase text-slate-800"
                placeholder="ABC12XYZ"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-slate-600 text-white font-semibold rounded-xl hover:bg-slate-700 disabled:opacity-50 shadow-sm transition-colors"
            >
              {loading ? t("noCompany.joining") : t("noCompany.joinCompany")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
