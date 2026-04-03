"use client";

import { useRouter } from "next/navigation";
import { Car, LogOut } from "lucide-react";
import { apiLogout } from "@/lib/api";

export function NavSection({ children }) {
  return <div className="pt-3 pb-1 px-3 first:pt-2">{children}</div>;
}

export function NavLabel({ children }) {
  return (
    <div
      className="px-2 mb-1 font-semibold"
      style={{
        fontSize: "10px",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.25)",
      }}
    >
      {children}
    </div>
  );
}

export function Sidebar({ user, children, mobileOpen, onClose, viewAs, setViewAs }) {
  const router = useRouter();
  const showViewToggle = viewAs != null && setViewAs != null;
  const roleLabel = user?.role === "ADMIN" ? "Administrator" : "Member";
  const initial = (user?.name || user?.email || "U").charAt(0).toUpperCase();

  async function handleLogout() {
    await apiLogout();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          aria-label="Close menu"
        />
      )}

      <aside
        className={`
          w-[224px] min-w-[224px] h-screen flex flex-col pb-3 text-white shrink-0 overflow-x-hidden
          fixed md:relative left-0 top-0 z-50 md:z-auto
          transform transition-transform duration-200 ease-out
        `}
        style={{
          backgroundColor: "var(--sidebar-bg)",
          borderRight: "1px solid var(--sidebar-border)",
          transform: mobileOpen ? "translateX(0)" : undefined,
        }}
      >
        {/* ── Brand header */}
        <div
          className="shrink-0 px-4 py-4 min-w-0"
          style={{ borderBottom: "1px solid var(--sidebar-border)" }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--brand-icon-bg)" }}
              >
                <Car
                  className="w-[17px] h-[17px]"
                  strokeWidth={1.6}
                  style={{ color: "var(--brand-icon-fg)" }}
                  aria-hidden
                />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-white leading-tight tracking-tight">
                  FleetAdmin
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Car sharing platform
                </p>
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="md:hidden p-2 -m-1 rounded-lg text-white/60 hover:bg-white/10 hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors shrink-0"
                aria-label="Close menu"
              >
                ✕
              </button>
            )}
          </div>

          {/* View toggle (admin only) */}
          {showViewToggle && (
            <div className="mt-4">
              <p
                className="mb-1.5 px-0.5"
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)",
                }}
              >
                View as
              </p>
              <div
                className="flex rounded-lg p-0.5"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                role="tablist"
                aria-label="Switch view"
              >
                {["user", "admin"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    role="tab"
                    aria-selected={viewAs === v}
                    onClick={() => setViewAs(v)}
                    className="flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition-all capitalize"
                    style={
                      viewAs === v
                        ? { backgroundColor: "var(--brand-icon-bg)", color: "#fff" }
                        : { color: "rgba(255,255,255,0.4)" }
                    }
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 min-w-0 flex flex-col py-1">
          {children}
        </nav>

        {/* ── User footer */}
        <div
          className="shrink-0 pt-2 px-3 min-w-0"
          style={{ borderTop: "1px solid var(--sidebar-border)" }}
        >
          <div
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
              style={{ backgroundColor: "var(--brand-icon-bg)", color: "var(--brand-icon-fg)" }}
            >
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-white/90 truncate leading-tight">
                {user?.name || "User"}
              </p>
              <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                {roleLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-md transition-colors shrink-0"
              style={{ color: "rgba(255,255,255,0.35)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#fca5a5";
                e.currentTarget.style.background = "rgba(220,38,38,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.35)";
                e.currentTarget.style.background = "transparent";
              }}
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function NavItem({ active, onClick, icon, label, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2.5 w-full min-w-0 min-h-[38px] mx-2 px-2.5 py-2 rounded-lg text-left text-[13px] transition-all duration-100 cursor-pointer mb-0.5 group"
      style={
        active
          ? {
              backgroundColor: "var(--sidebar-nav-active-bg)",
              color: "var(--sidebar-nav-active-text)",
              fontWeight: 600,
            }
          : {
              color: "var(--sidebar-nav-muted)",
              fontWeight: 400,
            }
      }
    >
      <span
        className="shrink-0 flex items-center justify-center w-[15px] h-[15px]"
        style={{ color: active ? "var(--sidebar-nav-active-text)" : "rgba(255,255,255,0.3)" }}
        aria-hidden
      >
        {icon}
      </span>
      <span className="truncate flex-1">{label}</span>
      {badge != null && (
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
          style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5" }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
