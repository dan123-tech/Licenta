"use client";

import { useMemo, useCallback, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, startOfWeek as dateFnsStartOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  startOfWeek: (date) => dateFnsStartOfWeek(date, { weekStartsOn: 1, locale: enUS }),
  getDay,
  locales,
});

function toDate(d) {
  if (!d) return null;
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? null : x;
}

function formatFleetHoverReservation(r, start, end) {
  if (!r) return null;
  const name = (r.user?.name || "").trim();
  const email = (r.user?.email || "").trim();
  let userLine = "—";
  if (name && email) userLine = name === email ? name : `${name} · ${email}`;
  else if (name) userLine = name;
  else if (email) userLine = email;
  const carLine = r.car
    ? [r.car.brand, r.car.registrationNumber].filter(Boolean).join(" · ") || "—"
    : r.carId
      ? `Car ID: ${r.carId}`
      : "—";
  const purpose = (r.purpose && String(r.purpose).trim()) || "—";
  const status = (r.status || "—").toString();
  const lines = [
    { k: "User", v: userLine },
    { k: "Vehicle", v: carLine },
    { k: "Start", v: format(start, "PPp", { locale: enUS }) },
    { k: "End", v: format(end, "PPp", { locale: enUS }) },
    { k: "Status", v: status },
    { k: "Purpose", v: purpose },
  ];
  if (r.pickup_code) lines.push({ k: "Pickup code", v: r.pickup_code });
  if (r.release_code) lines.push({ k: "Release code", v: r.release_code });
  if (r.releasedKmUsed != null && r.releasedKmUsed !== "") lines.push({ k: "Released km", v: String(r.releasedKmUsed) });
  return lines;
}

/** Fleet-only: hover card rendered in a portal so it is not clipped by the calendar. */
function FleetCalendarFleetEvent({ event, title }) {
  const r = event.reservation;
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const hideTimer = useRef(null);

  const clearHide = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const scheduleHide = () => {
    clearHide();
    hideTimer.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => () => clearHide(), []);

  const show = (e) => {
    clearHide();
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const w = 288;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - w - 8));
    const top = rect.bottom + 6;
    setCoords({ top, left });
    setOpen(true);
  };

  const lines = r ? formatFleetHoverReservation(r, event.start, event.end) : null;

  const panel =
    open &&
    lines &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        className="fixed z-[9999] w-72 max-w-[calc(100vw-1rem)] rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800 shadow-xl pointer-events-auto"
        style={{ top: coords.top, left: coords.left }}
        onMouseEnter={clearHide}
        onMouseLeave={scheduleHide}
        role="tooltip"
      >
        <p className="font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-2 truncate" title={title}>
          {title}
        </p>
        <dl className="space-y-1.5 m-0">
          {lines.map(({ k, v }) => (
            <div key={k} className="grid grid-cols-[5.5rem_1fr] gap-x-2 gap-y-0.5">
              <dt className="text-slate-500 font-medium">{k}</dt>
              <dd className="m-0 text-slate-800 break-words">{v}</dd>
            </div>
          ))}
        </dl>
      </div>,
      document.body,
    );

  return (
    <>
      <div
        className="relative min-h-[1em] w-full"
        onMouseEnter={show}
        onMouseLeave={scheduleHide}
      >
        <span className="block truncate text-[11px] font-medium leading-tight px-0.5">{title}</span>
      </div>
      {panel}
    </>
  );
}

function carLabelFromCar(c) {
  return [c?.brand, c?.registrationNumber].filter(Boolean).join(" ") || c?.id || "";
}

/**
 * @param {Array} reservations
 * @param {Array} [cars] — fleet rows + dropdown options (also used for personal car filter)
 * @param {"personal"|"fleet"} variant
 * @param {string} [currentUserId] — when variant is "personal", only this user's reservations are shown (defense in depth)
 */
export default function FleetBookingCalendar({
  reservations,
  cars,
  variant = "personal",
  currentUserId,
  className = "",
}) {
  const [selectedCarId, setSelectedCarId] = useState("");

  const scopedReservations = useMemo(() => {
    const list = Array.isArray(reservations) ? reservations : [];
    if (variant !== "personal") return list;
    if (!currentUserId) return [];
    return list.filter((r) => r.userId === currentUserId);
  }, [reservations, variant, currentUserId]);

  const carOptions = useMemo(() => {
    const carList = Array.isArray(cars) ? cars : [];
    if (carList.length > 0) {
      return carList
        .map((c) => ({ id: c.id, label: carLabelFromCar(c) || c.id }))
        .filter((o) => o.id)
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
    }
    const seen = new Map();
    for (const r of scopedReservations) {
      const id = r.carId || r.car?.id;
      if (!id || seen.has(id)) continue;
      const label = r.car ? carLabelFromCar(r.car) : `Car (${String(id).slice(0, 8)}…)`;
      seen.set(id, label);
    }
    return [...seen.entries()]
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  }, [cars, scopedReservations]);

  useEffect(() => {
    if (!selectedCarId) return;
    if (!carOptions.some((o) => o.id === selectedCarId)) setSelectedCarId("");
  }, [selectedCarId, carOptions]);

  const carFilteredReservations = useMemo(() => {
    if (!selectedCarId) return scopedReservations;
    return scopedReservations.filter((r) => (r.carId || r.car?.id) === selectedCarId);
  }, [scopedReservations, selectedCarId]);

  const resources = useMemo(() => {
    if (variant !== "fleet") return undefined;

    if (selectedCarId) {
      const c = Array.isArray(cars) && cars.find((x) => x.id === selectedCarId);
      if (c) {
        return [
          {
            resourceId: c.id,
            resourceTitle: carLabelFromCar(c) || c.id,
          },
        ];
      }
      const r0 = scopedReservations.find((r) => (r.carId || r.car?.id) === selectedCarId);
      if (r0) {
        return [
          {
            resourceId: selectedCarId,
            resourceTitle: r0.car
              ? carLabelFromCar(r0.car) || selectedCarId
              : `Car (${String(selectedCarId).slice(0, 8)}…)`,
          },
        ];
      }
      return [];
    }

    if (!Array.isArray(cars)) return undefined;
    const base = cars.map((c) => ({
      resourceId: c.id,
      resourceTitle: carLabelFromCar(c) || c.id,
    }));
    const seen = new Set(base.map((r) => r.resourceId));
    for (const r of scopedReservations || []) {
      const cid = r.carId || r.car?.id;
      if (!cid || seen.has(cid)) continue;
      seen.add(cid);
      base.push({
        resourceId: cid,
        resourceTitle: [r.car?.brand, r.car?.registrationNumber].filter(Boolean).join(" ") || `Car (${String(cid).slice(0, 8)}…)`,
      });
    }
    return base;
  }, [variant, cars, scopedReservations, selectedCarId]);

  const events = useMemo(() => {
    const list = carFilteredReservations;
    const out = [];
    for (const r of list) {
      const st = (r.status || "").toLowerCase();
      if (st === "cancelled") continue;
      const start = toDate(r.startDate);
      let end = toDate(r.endDate);
      if (!start) continue;
      if (!end || end <= start) {
        end = new Date(start.getTime() + 60 * 60 * 1000);
      }
      const userName = r.user?.name || r.user?.email || "User";
      const carLabel = r.car ? [r.car.brand, r.car.registrationNumber].filter(Boolean).join(" ") : "";
      const title =
        variant === "fleet"
          ? `${userName}${carLabel ? ` · ${carLabel}` : ""} (${(r.status || "").toUpperCase()})`
          : `${carLabel || "Car"} · ${(r.status || "").toUpperCase()}`;
      const carId = r.carId || r.car?.id;
      out.push({
        id: r.id,
        title,
        start,
        end,
        resourceId: carId || undefined,
        reservation: r,
      });
    }
    return out;
  }, [carFilteredReservations, variant]);

  const fleetEventComponent = useCallback((props) => <FleetCalendarFleetEvent {...props} />, []);

  const tooltipAccessor = useMemo(() => {
    if (variant !== "fleet") return undefined;
    return (ev) => {
      const lines = formatFleetHoverReservation(ev.reservation, ev.start, ev.end);
      if (!lines) return ev.title;
      return lines.map(({ k, v }) => `${k}: ${v}`).join("\n");
    };
  }, [variant]);

  const [view, setView] = useState(variant === "fleet" ? "week" : "month");
  const [date, setDate] = useState(new Date());

  const eventPropGetter = useCallback((event) => {
    const r = event.reservation;
    const st = (r?.status || "").toLowerCase();
    let bg = "#334155";
    if (st === "active") bg = "#15803d";
    if (st === "completed") bg = "#475569";
    return {
      style: {
        backgroundColor: bg,
        borderColor: "#0f172a",
        color: "#fff",
        borderRadius: "6px",
        border: "1px solid rgba(0,0,0,0.15)",
      },
    };
  }, []);

  const calendarBodyHeight = useMemo(() => {
    const base = 560;
    if (variant === "fleet" && resources && resources.length > 0) {
      return Math.max(base, 168 + resources.length * 54);
    }
    return base;
  }, [variant, resources]);

  return (
    <div
      className={`fleet-rbc flex flex-col min-h-0 w-full rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm ${className}`.trim()}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between shrink-0 mb-3 px-1">
        <p className="text-sm text-slate-600 flex-1 min-w-0">
          {variant === "fleet"
            ? "Each row is a vehicle. Blocks show booked time; empty space is free for new trips."
            : "Your bookings. Use Month / Week / Day to plan ahead."}
        </p>
        <div className="w-full sm:w-64 shrink-0">
          <label htmlFor="fleet-cal-car-filter" className="block text-xs font-semibold text-slate-500 mb-1">
            Vehicle
          </label>
          <select
            id="fleet-cal-car-filter"
            value={selectedCarId}
            onChange={(e) => setSelectedCarId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-ring)] outline-none"
          >
            <option value="">All cars</option>
            {carOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div
        className="fleet-rbc-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-auto rounded-lg border border-slate-100 touch-pan-y"
        style={{ maxHeight: "min(920px, calc(100dvh - 11.5rem))" }}
      >
        <div className="min-w-[640px]" style={{ height: calendarBodyHeight }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: calendarBodyHeight }}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            views={["month", "week", "day"]}
            resources={resources}
            resourceIdAccessor="resourceId"
            resourceTitleAccessor="resourceTitle"
            eventPropGetter={eventPropGetter}
            {...(variant === "fleet"
              ? { tooltipAccessor, components: { event: fleetEventComponent } }
              : {})}
            popup
            culture="en-US"
          />
        </div>
      </div>
    </div>
  );
}
