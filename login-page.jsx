"use client";

import { useState } from "react";
import Link from "next/link";
import { Car, ArrowRight, AlertCircle } from "lucide-react";
import { apiLogin } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiLogin(email, password);
      window.location.assign("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--main-bg)" }}
    >
      {/* ── Left panel (branding) */}
      <div
        className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between p-10 shrink-0"
        style={{ background: "var(--sidebar-bg)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--brand-icon-bg)" }}
          >
            <Car className="w-5 h-5" strokeWidth={1.6} style={{ color: "var(--brand-icon-fg)" }} />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">FleetAdmin</span>
        </div>

        {/* Central content */}
        <div>
          <h2
            className="text-4xl font-bold text-white leading-tight mb-4"
            style={{ letterSpacing: "-0.04em" }}
          >
            Manage your
            <br />
            fleet smarter.
          </h2>
          <p className="text-base" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
            Reserve vehicles, track usage, and keep your team moving — all from one place.
          </p>

          {/* Feature list */}
          <div className="mt-8 space-y-3">
            {[
              "AI-powered driving licence verification",
              "Real-time fleet availability",
              "Reservation history & analytics",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(29,78,216,0.35)", border: "1px solid rgba(29,78,216,0.5)" }}
                >
                  <svg className="w-2.5 h-2.5 text-blue-300" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          © {new Date().getFullYear()} FleetAdmin · All rights reserved
        </p>
      </div>

      {/* ── Right panel (form) */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--brand-icon-bg)" }}
            >
              <Car className="w-4 h-4" strokeWidth={1.6} style={{ color: "var(--brand-icon-fg)" }} />
            </div>
            <span className="text-slate-900 font-bold text-base">FleetAdmin</span>
          </div>

          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: "var(--text)", letterSpacing: "-0.03em" }}
          >
            Welcome back
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            Sign in to access your fleet dashboard.
          </p>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-[13px] font-semibold mb-1.5"
                style={{ color: "var(--text)" }}
              >
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all duration-150"
                style={{
                  border: "1px solid rgba(15,23,42,0.14)",
                  color: "var(--text)",
                  background: "#fff",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px var(--primary-ring)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(15,23,42,0.14)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className="block text-[13px] font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  Password
                </label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all duration-150"
                style={{
                  border: "1px solid rgba(15,23,42,0.14)",
                  color: "var(--text)",
                  background: "#fff",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px var(--primary-ring)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(15,23,42,0.14)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-white font-semibold rounded-xl transition-all duration-150 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "var(--primary)",
                boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.08)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "var(--primary-hover)";
                  e.currentTarget.style.transform = "translateY(-0.5px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px -2px rgb(29 78 216 / 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--primary)";
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 1px 2px 0 rgb(0 0 0 / 0.08)";
              }}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold hover:underline"
              style={{ color: "var(--primary)" }}
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
