"use client";

import { useRouter } from "next/navigation";
import { Car, LogOut } from "lucide-react";
import { apiLogout } from "@/lib/api";

export function NavSection({ children }) {
  return <div className="pt-4 pb-1 px-3 first:pt-2">{children}</div>;
}

export function NavLabel({ children }) {
  return (
    <div className="text-[10px] text-white/30 tracking-[0.08em] uppercase px-2 mb-1.5 font-medium">
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
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          aria-label="Close menu"
        />
      )}
      <aside
        className={`
          w-[220px] min-w-[220px] h-screen flex flex-col pt-5 pb-4 text-white shrink-0 overflow-x-hidden
          fixed md:relative left-0 top-0 z-50 md:z-auto
          transform transition-transform duration-200 ease-out
          border-r border-[var(--sidebar-border)]
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{ backgroundColor: "var(--sidebar-bg)" }}
      >
        <div className="shrink-0 px-5 pb-5 border-b border-[var(--sidebar-border)] min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--brand-icon-bg)" }}
              >
                <Car className="w-[18px] h-[18px]" strokeWidth={1.5} style={{ color: "var(--brand-icon-fg)" }} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white leading-tight">FleetAdmin</p>
                <p className="text-[11px] text-white/40 mt-0.5">Car sharing platform</p>
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="md:hidden p-2 -m-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors shrink-0"
                aria-label="Close menu"
              >
                ✕
              </button>
            )}
          </div>

          {showViewToggle && (
            <div className="mt-4">
              <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1.5 px-0.5">View as</p>
              <div
                className="flex rounded-lg p-0.5 bg-white/5 border border-white/10"
                role="tablist"
                aria-label="Switch between User and Admin view"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewAs === "user"}
                  onClick={() => setViewAs("user")}
                  className={`flex-1 py-2 px-2 rounded-md text-xs font-semibold transition-all ${
                    viewAs === "user" ? "text-white shadow-sm" : "text-white/45 hover:text-white/80 hover:bg-white/5"
                  }`}
                  style={viewAs === "user" ? { backgroundColor: "var(--brand-icon-bg)" } : undefined}
                >
                  User
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewAs === "admin"}
                  onClick={() => setViewAs("admin")}
                  className={`flex-1 py-2 px-2 rounded-md text-xs font-semibold transition-all ${
                    viewAs === "admin" ? "text-white shadow-sm" : "text-white/45 hover:text-white/80 hover:bg-white/5"
                  }`}
                  style={viewAs === "admin" ? { backgroundColor: "var(--brand-icon-bg)" } : undefined}
                >
                  Admin
                </button>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 min-w-0 flex flex-col">{children}</nav>

        <div className="shrink-0 mt-auto pt-3 border-t border-[var(--sidebar-border)] px-3 min-w-0">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <div
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-medium shrink-0"
              style={{ backgroundColor: "var(--brand-icon-bg)", color: "var(--brand-icon-fg)" }}
            >
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name || "User"}</p>
              <p className="text-[10px] text-white/40 truncate">{roleLabel}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-lg text-white/45 hover:text-red-300 hover:bg-red-950/30 transition-colors shrink-0"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function NavItem({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-2.5 w-full min-w-0 min-h-[40px] mx-2 px-2.5 py-2 rounded-[7px] text-left text-[13px] transition-colors cursor-pointer mb-0.5
        ${active ? "font-medium" : "font-normal"}
      `}
      style={
        active
          ? { backgroundColor: "var(--sidebar-nav-active-bg)", color: "var(--sidebar-nav-active-text)" }
          : { color: "var(--sidebar-nav-muted)" }
      }
    >
      <span
        className={`shrink-0 flex items-center justify-center w-4 h-4 ${active ? "" : "opacity-90"}`}
        style={{ color: active ? "var(--sidebar-nav-active-text)" : "rgba(255,255,255,0.35)" }}
        aria-hidden
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}
