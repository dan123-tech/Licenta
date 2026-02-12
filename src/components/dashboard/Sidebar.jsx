"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { apiLogout } from "@/lib/api";

export function Sidebar({ user, children, mobileOpen, onClose, viewAs, setViewAs }) {
  const router = useRouter();
  const showViewToggle = viewAs != null && setViewAs != null;

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
          w-[260px] min-w-[260px] min-h-screen flex flex-col py-5 text-white shrink-0 overflow-x-hidden
          fixed md:relative left-0 top-0 z-50 md:z-auto
          transform transition-transform duration-200 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{ backgroundColor: "var(--sidebar-bg)" }}
      >
        {/* Top: profile + optional View-as toggle */}
        <div className="shrink-0 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between md:justify-center px-4 py-3 border-b border-white/10 md:border-none">
            <div className="flex flex-col items-center flex-1 py-2 md:py-0 min-w-0">
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-xl border border-white/20 flex items-center justify-center text-xl md:text-2xl font-bold mb-2 md:mb-4 shrink-0"
                style={{ color: "var(--primary)", backgroundColor: "rgba(59, 130, 246, 0.15)" }}
              >
                {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
              </div>
              <p className="font-bold text-base md:text-lg truncate max-w-full px-2 text-center text-white">
                {user?.name || "User"}
              </p>
              <span className="text-xs text-slate-400 mt-1 truncate max-w-full px-2 text-center">
                {user?.email}
              </span>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="md:hidden p-2 -m-2 rounded-xl text-white/80 hover:bg-white/10 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                aria-label="Close menu"
              >
                ✕
              </button>
            )}
          </div>

          {/* View as: segmented control (only for admins) */}
          {showViewToggle && (
            <div className="px-4 pt-4 pb-2">
              <p className="text-xs font-medium text-slate-400 mb-2">View as</p>
              <div
                className="flex rounded-xl p-1 bg-white/5 border border-white/10"
                role="tablist"
                aria-label="Switch between User and Admin view"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewAs === "user"}
                  onClick={() => setViewAs("user")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                    viewAs === "user"
                      ? "bg-[#3B82F6] text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  User
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewAs === "admin"}
                  onClick={() => setViewAs("admin")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                    viewAs === "admin"
                      ? "bg-[#3B82F6] text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Middle: nav links */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-5 px-2 flex flex-col gap-0.5 min-h-0 min-w-0">
          {children}
        </nav>

        {/* Bottom: logout (ghost/outline, pinned) */}
        <div className="shrink-0 min-w-0 pt-2 px-4 pb-5 border-t border-white/10 overflow-hidden">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full min-w-0 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 min-h-[44px] transition-all duration-200
              border border-slate-500/50 text-slate-300
              hover:border-red-400/70 hover:text-red-400/90 hover:bg-red-950/20"
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export function NavItem({ active, onClick, icon, label }) {
  const base =
    "flex items-center gap-2.5 py-3 px-4 text-[15px] text-left rounded-xl border border-transparent transition-all duration-200 cursor-pointer w-full min-w-0 min-h-[44px] mx-2";
  const inactiveClass =
    "bg-transparent text-slate-300 hover:bg-white/10 hover:text-white";
  const activeClass = active
    ? "bg-[#334155] text-white font-medium shadow-sm"
    : inactiveClass;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${activeClass}`}
    >
      <span
        className="w-5 text-center shrink-0 text-lg opacity-90"
        style={active ? { color: "var(--primary)" } : {}}
        aria-hidden
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}
