"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  apiSession,
  WEB_AUTH_BROADCAST,
  WEB_SESSION_LOST_EVENT,
  WEB_TAB_SESSION_STORAGE_KEY,
  clearWebTabSessionId,
} from "@/lib/api";

/** How often to re-check session while the dashboard tab is visible (backup if no API call fires). */
const POLL_MS = 8000;

/**
 * Keeps the dashboard in sync when the session is revoked elsewhere:
 * - BroadcastChannel when another tab logs in
 * - global fetch 401 hook (see api.js) → WEB_SESSION_LOST_EVENT
 * - periodic apiSession while tab is visible
 * Uses client-side navigation (no full page reload).
 */
export default function WebSessionLiveGuard() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const redirecting = useRef(false);

  const goLogin = useCallback(
    (search) => {
      if (redirecting.current) return;
      if (!pathname.startsWith("/dashboard")) return;
      redirecting.current = true;
      router.replace(`/login${search}`);
    },
    [pathname, router],
  );

  useEffect(() => {
    if (!pathname.startsWith("/dashboard")) return;

    const runSessionCheck = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      try {
        const data = await apiSession();
        // Only 401 → null. Network / 5xx must not log the user out.
        if (data == null) goLogin("?expired=1");
      } catch {
        /* ignore transient errors */
      }
    };

    const interval = setInterval(runSessionCheck, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") runSessionCheck();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", runSessionCheck);

    const onLost = () => goLogin("?expired=1");
    window.addEventListener(WEB_SESSION_LOST_EVENT, onLost);

    let bc;
    try {
      bc = new BroadcastChannel(WEB_AUTH_BROADCAST);
      bc.onmessage = (ev) => {
        if (ev?.data?.type !== "web_session_replaced" || typeof ev.data.sid !== "string") return;
        let mine = "";
        try {
          mine = sessionStorage.getItem(WEB_TAB_SESSION_STORAGE_KEY) || "";
        } catch (_) {}
        if (mine && mine === ev.data.sid) return;
        clearWebTabSessionId();
        goLogin("?replaced=1");
      };
    } catch (_) {}

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", runSessionCheck);
      window.removeEventListener(WEB_SESSION_LOST_EVENT, onLost);
      bc?.close();
    };
  }, [pathname, goLogin]);

  return null;
}
