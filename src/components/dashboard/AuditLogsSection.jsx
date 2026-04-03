"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { apiAuditLogs } from "@/lib/api";

// ── Action display metadata ─────────────────────────────────────────────────

const ACTION_META = {
  // Cars
  CAR_ADDED:             { label: "Car added",             color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
  CAR_UPDATED:           { label: "Car updated",           color: "#1D4ED8", bg: "#eff6ff", border: "#bfdbfe" },
  CAR_STATUS_CHANGED:    { label: "Car status changed",    color: "#D97706", bg: "#fffbeb", border: "#fde68a" },
  CAR_DELETED:           { label: "Car deleted",           color: "#DC2626", bg: "#fef2f2", border: "#fecaca" },
  // Reservations
  RESERVATION_CREATED:   { label: "Reservation created",   color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
  RESERVATION_CANCELLED: { label: "Reservation cancelled", color: "#DC2626", bg: "#fef2f2", border: "#fecaca" },
  RESERVATION_COMPLETED: { label: "Reservation completed", color: "#1D4ED8", bg: "#eff6ff", border: "#bfdbfe" },
  RESERVATION_EXTENDED:  { label: "Reservation extended",  color: "#7C3AED", bg: "#f5f3ff", border: "#ddd6fe" },
  KM_EXCEEDED_APPROVED:  { label: "Km exceeded – approved",color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
  KM_EXCEEDED_REJECTED:  { label: "Km exceeded – rejected",color: "#DC2626", bg: "#fef2f2", border: "#fecaca" },
  // Company / pricing
  PRICING_CHANGED:       { label: "Pricing changed",       color: "#D97706", bg: "#fffbeb", border: "#fde68a" },
  COMPANY_SETTINGS_CHANGED:{ label: "Settings changed",    color: "#64748B", bg: "#f8fafc", border: "#e2e8f0" },
  // Users
  USER_INVITED:          { label: "User invited",          color: "#7C3AED", bg: "#f5f3ff", border: "#ddd6fe" },
  USER_ROLE_CHANGED:     { label: "Role changed",          color: "#D97706", bg: "#fffbeb", border: "#fde68a" },
  USER_REMOVED:          { label: "User removed",          color: "#DC2626", bg: "#fef2f2", border: "#fecaca" },
  DRIVING_LICENCE_STATUS_CHANGED: { label: "Licence status changed", color: "#1D4ED8", bg: "#eff6ff", border: "#bfdbfe" },
};

const ENTITY_FILTERS = [
  { value: "", label: "All entities" },
  { value: "CAR", label: "Cars" },
  { value: "RESERVATION", label: "Reservations" },
  { value: "COMPANY", label: "Company" },
  { value: "USER", label: "Users" },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function Badge({ action }) {
  const m = ACTION_META[action] ?? { label: action, color: "#64748B", bg: "#f8fafc", border: "#e2e8f0" };
  return (
    <span
      style={{
        background: m.bg,
        color: m.color,
        border: `1px solid ${m.border}`,
        borderRadius: 6,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {m.label}
    </span>
  );
}

function MetaCell({ meta }) {
  if (!meta) return <span style={{ color: "#94A3B8" }}>—</span>;
  const entries = Object.entries(meta).filter(([, v]) => v !== null && v !== undefined);
  if (!entries.length) return <span style={{ color: "#94A3B8" }}>—</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {entries.map(([k, v]) => {
        let display = String(v);
        // Shorten ISO date strings
        if (typeof v === "string" && v.includes("T")) {
          try { display = new Date(v).toLocaleString(); } catch (_) {}
        }
        if (typeof v === "boolean") display = v ? "yes" : "no";
        return (
          <span
            key={k}
            title={`${k}: ${display}`}
            style={{
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              borderRadius: 4,
              padding: "1px 6px",
              fontSize: 11,
              color: "#475569",
              maxWidth: 180,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ color: "#94A3B8" }}>{k}:</span> {display}
          </span>
        );
      })}
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch { return iso; }
}

const LIMIT = 25;

// ── Component ────────────────────────────────────────────────────────────────

export default function AuditLogsSection() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (p, et) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiAuditLogs({ page: p, limit: LIMIT, entityType: et || undefined });
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1, ""); }, [load]);

  function handleFilter(et) {
    setEntityType(et);
    setPage(1);
    load(1, et);
  }

  function handlePage(p) {
    setPage(p);
    load(p, entityType);
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ShieldCheck size={18} style={{ color: "#1D4ED8" }} strokeWidth={1.6} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#0d1526" }}>Audit Logs</div>
          <div style={{ fontSize: 12, color: "#64748B" }}>
            Append-only record of every significant action — cannot be edited or deleted
          </div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#64748B" }}>
          {total} total {total === 1 ? "entry" : "entries"}
        </div>
      </div>

      {/* Filter bar */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <Filter size={14} style={{ color: "#64748B" }} />
        <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600, marginRight: 4 }}>Filter by:</span>
        {ENTITY_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilter(f.value)}
            style={{
              padding: "4px 12px",
              borderRadius: 8,
              border: entityType === f.value ? "1px solid #1D4ED8" : "1px solid #e2e8f0",
              background: entityType === f.value ? "#eff6ff" : "#f8fafc",
              color: entityType === f.value ? "#1D4ED8" : "#475569",
              fontWeight: entityType === f.value ? 600 : 400,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Log table */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {loading && (
          <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 14 }}>Loading…</div>
        )}
        {error && !loading && (
          <div style={{ padding: 24, color: "#DC2626", fontSize: 13 }}>Error: {error}</div>
        )}
        {!loading && !error && logs.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>
            No audit log entries yet. Actions like editing a car, cancelling a reservation, or changing prices will appear here.
          </div>
        )}
        {!loading && !error && logs.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {["Timestamp", "Action", "Entity", "Performed by", "Details"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      fontWeight: 600,
                      fontSize: 11,
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: i < logs.length - 1 ? "1px solid #f1f5f9" : "none",
                    background: "#fff",
                  }}
                >
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap", color: "#475569", fontSize: 12 }}>
                    {fmtDate(log.createdAt)}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <Badge action={log.action} />
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ color: "#0d1526", fontWeight: 500 }}>{log.entityType}</span>
                    {log.entityId && (
                      <span
                        style={{ marginLeft: 4, color: "#94A3B8", fontSize: 11, fontFamily: "monospace" }}
                        title={log.entityId}
                      >
                        {log.entityId.slice(0, 8)}…
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                    {log.actor ? (
                      <span>
                        <span style={{ fontWeight: 500, color: "#0d1526" }}>{log.actor.name}</span>
                        <span style={{ color: "#94A3B8", fontSize: 11, marginLeft: 4 }}>{log.actor.email}</span>
                      </span>
                    ) : (
                      <span style={{ color: "#94A3B8" }}>System</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <MetaCell meta={log.meta} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#64748B" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => handlePage(page - 1)}
            disabled={page <= 1}
            style={{
              padding: "5px 10px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              cursor: page <= 1 ? "not-allowed" : "pointer",
              opacity: page <= 1 ? 0.4 : 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => handlePage(page + 1)}
            disabled={page >= totalPages}
            style={{
              padding: "5px 10px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              cursor: page >= totalPages ? "not-allowed" : "pointer",
              opacity: page >= totalPages ? 0.4 : 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
