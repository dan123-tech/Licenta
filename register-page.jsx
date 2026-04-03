"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car, ArrowRight, AlertCircle } from "lucide-react";
import { apiRegister } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await apiRegister(email, password, name);
      router.push("/login");
      router.refresh();
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    border: "1px solid rgba(15,23,42,0.14)",
    color: "var(--text)",
    background: "#fff",
  };
  const focusIn = (e) => {
    e.currentTarget.style.borderColor = "var(--primary)";
    e.currentTarget.style.boxShadow = "0 0 0 3px var(--primary-ring)";
  };
  const focusOut = (e) => {
    e.currentTarget.style.borderColor = "rgba(15,23,42,0.14)";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--main-bg)" }}>
      {/* ── Left branding panel */}
      <div
        className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between p-10 shrink-0"
        style={{ background: "var(--sidebar-bg)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--brand-icon-bg)" }}
          >
            <Car className="w-5 h-5" strokeWidth={1.6} style={{ color: "var(--brand-icon-fg)" }} />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">FleetAdmin</span>
        </div>

        <div>
          <h2
            className="text-4xl font-bold text-white leading-tight mb-4"
            style={{ letterSpacing: "-0.04em" }}
          >
            Start managing
            <br />
            your fleet today.
          </h2>
          <p className="text-base" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
            Create your account and get your team set up in minutes.
          </p>

          <div className="mt-8 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-sm font-semibold text-white mb-1">Quick setup</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
              Register → Create your company → Invite your team → Start reserving cars
            </p>
          </div>
        </div>

        <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          © {new Date().getFullYear()} FleetAdmin · All rights reserved
        </p>
      </div>

      {/* ── Right form panel */}
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
            Create your account
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            Join FleetAdmin and manage your company cars.
          </p>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--text)" }}>
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all duration-150"
                style={inputStyle}
                onFocus={focusIn}
                onBlur={focusOut}
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--text)" }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all duration-150"
                style={inputStyle}
                onFocus={focusIn}
                onBlur={focusOut}
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--text)" }}>
                Password
                <span className="font-normal ml-1" style={{ color: "var(--text-muted)" }}>(min. 8 characters)</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all duration-150"
                style={inputStyle}
                onFocus={focusIn}
                onBlur={focusOut}
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-white font-semibold rounded-xl transition-all duration-150 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--primary)", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.08)" }}
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
                  Creating account…
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--primary)" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
