"use client";

import { useState } from "react";
import Link from "next/link";
import { Car } from "lucide-react";
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
      // Full navigation so the session cookie is always sent on the next load (fixes LAN / IP access).
      window.location.assign("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--main-bg)" }}>
      <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--brand-icon-bg)" }}
          >
            <Car className="w-[18px] h-[18px]" strokeWidth={1.5} style={{ color: "var(--brand-icon-fg)" }} aria-hidden />
          </div>
        </div>
        <p className="text-center text-slate-800 font-semibold text-lg mb-1">FleetAdmin</p>
        <p className="text-center text-slate-500 text-sm mb-6">Car sharing platform</p>
        <h2 className="text-center font-bold text-xl text-slate-900 mb-7">Sign in</h2>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 text-red-700 border border-red-100 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-3 border border-slate-200 rounded-xl text-base text-slate-800 placeholder:text-slate-400 bg-white focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-ring)] transition-shadow"
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-3 border border-slate-200 rounded-xl text-base text-slate-800 placeholder:text-slate-400 bg-white focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-ring)] transition-shadow"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 text-white font-bold text-lg rounded-xl disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors shadow-sm bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[var(--primary)] font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
