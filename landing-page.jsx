import Link from "next/link";
import { Car, Users, BarChart2, Shield } from "lucide-react";

const features = [
  {
    icon: Car,
    title: "Fleet Management",
    desc: "Track every vehicle in real time — availability, mileage, and maintenance status.",
  },
  {
    icon: Users,
    title: "Team Reservations",
    desc: "Employees reserve cars instantly or in advance with built-in conflict detection.",
  },
  {
    icon: Shield,
    title: "AI Licence Verification",
    desc: "Automatically validate driving licences with Gemini AI before approving reservations.",
  },
  {
    icon: BarChart2,
    title: "Cost Analytics",
    desc: "Track fuel consumption, CO₂ emissions and costs with detailed PDF reports.",
  },
];

export default function Home() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "#0c1220" }}
    >
      {/* ── Topbar */}
      <header
        className="border-b sticky top-0 z-20"
        style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(12,18,32,0.9)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#1d4ed8" }}
            >
              <Car className="w-[15px] h-[15px]" strokeWidth={1.6} style={{ color: "#bfdbfe" }} />
            </div>
            <span className="text-white font-bold text-[15px] tracking-tight">FleetAdmin</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-[13px] font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-[13px] font-semibold px-3.5 py-1.5 rounded-lg text-white transition-all"
              style={{ background: "#1d4ed8", boxShadow: "0 1px 3px rgb(0 0 0 / 0.2)" }}
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero */}
      <main className="max-w-5xl mx-auto px-5">
        <div className="pt-20 pb-16 sm:pt-28 sm:pb-20 text-center">
          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold mb-6"
            style={{
              background: "rgba(29,78,216,0.2)",
              border: "1px solid rgba(29,78,216,0.4)",
              color: "#93c5fd",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-blue-400"
              style={{ boxShadow: "0 0 6px #60a5fa" }}
            />
            Company Car Sharing Platform
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-5"
            style={{ letterSpacing: "-0.04em", lineHeight: 1.1 }}
          >
            Manage your fleet
            <br />
            <span style={{ color: "#60a5fa" }}>with confidence.</span>
          </h1>
          <p
            className="text-base sm:text-lg max-w-xl mx-auto mb-10"
            style={{ color: "rgba(255,255,255,0.48)", lineHeight: 1.7 }}
          >
            Reserve vehicles, validate licences automatically, and track fleet costs — all in one platform built for modern teams.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="flex items-center justify-center h-12 px-6 rounded-xl text-white font-semibold text-sm transition-all"
              style={{ background: "#1d4ed8", boxShadow: "0 2px 8px rgb(29 78 216 / 0.35)" }}
            >
              Start for free →
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center h-12 px-6 rounded-xl font-semibold text-sm transition-all"
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.7)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              Sign in to dashboard
            </Link>
          </div>
        </div>

        {/* ── Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-20">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="p-6 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "rgba(29,78,216,0.25)", border: "1px solid rgba(29,78,216,0.35)" }}
              >
                <Icon className="w-4.5 h-4.5" style={{ color: "#93c5fd" }} strokeWidth={1.6} />
              </div>
              <h3 className="text-white font-semibold text-[15px] mb-1.5">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* ── Footer */}
        <div
          className="pb-8 text-center border-t pt-6"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            <span>© {new Date().getFullYear()} FleetAdmin</span>
            <span>·</span>
            <Link href="/api-docs" className="hover:underline" style={{ color: "rgba(29,78,216,0.7)" }}>
              API Docs
            </Link>
            <span>·</span>
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
