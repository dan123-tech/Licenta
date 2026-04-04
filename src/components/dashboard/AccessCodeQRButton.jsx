"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";

/**
 * Chip styling for pickup/release digits (min size so "—" still reads as a reserved code slot).
 */
export const ACCESS_CODE_SLOT_CLASS =
  "inline-flex items-center justify-center min-w-[7rem] min-h-[2.25rem] px-2.5 py-1 rounded-lg bg-[#1E293B]/10 text-[#1E293B] font-mono text-sm font-semibold tabular-nums tracking-widest border border-[#1E293B]/12";

/**
 * Keeps the numeric code visible; adds a button that opens a modal with the same value as a QR (for scanners).
 */
export default function AccessCodeQRButton({ code, label = "Show QR", className = "" }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (code == null || String(code).trim() === "") return null;
  const value = String(code).trim();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-[var(--primary)] text-white border border-transparent shadow-sm hover:bg-[var(--primary-hover)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-ring)] focus-visible:ring-offset-2 ${className}`}
        title="Open QR code for scanners"
      >
        <QrCode className="w-3.5 h-3.5 shrink-0 opacity-95" aria-hidden />
        {label}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-label="Access code QR"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-slate-700 mb-1">Scan or show this code</p>
            <p className="text-xs text-slate-500 mb-4">Same digits as below — useful for pickup readers.</p>
            <div className="flex justify-center mb-4 p-3 bg-white rounded-xl border border-slate-100">
              <QRCodeSVG value={value} size={200} level="M" includeMargin />
            </div>
            <p className="text-3xl font-bold tabular-nums tracking-widest text-[#1E293B] mb-4">{value}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full py-2.5 rounded-xl font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
