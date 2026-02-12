"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Info } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const CO2_KG_PER_L_BENZINE = 2.31;
const CO2_KG_PER_L_DIESEL = 2.68;
const CO2_ELECTRIC_KG_PER_KWH = 0.2; // optional grid constant; use 0 for "0 direct"

function getStartOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function getStartOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function isCurrentMonth(ms) {
  const now = new Date();
  return getStartOfMonth(ms) === getStartOfMonth(now.getTime());
}

const FUEL_COLORS = { Benzine: "#F59E0B", Diesel: "#64748B", Electric: "#10B981", Hybrid: "#14B8A6" };

export default function StatisticsDashboard({ reservations = [], company, users = [], cars = [] }) {
  const priceBenzine = company?.priceBenzinePerLiter ?? company?.averageFuelPricePerLiter ?? 0;
  const priceDiesel = company?.priceDieselPerLiter ?? company?.averageFuelPricePerLiter ?? 0;
  const priceElectricity = company?.priceElectricityPerKwh ?? 0;
  const fuelPrice = company?.averageFuelPricePerLiter ?? priceBenzine ?? 0;
  const defaultL100 = company?.defaultConsumptionL100km ?? 7.5;
  const defaultKwh100 = 20;
  const carMap = useMemo(() => Object.fromEntries((cars || []).map((c) => [c.id, c])), [cars]);

  function getCar(carId) {
    return carMap[carId] ?? null;
  }

  function getL100ForCar(carId) {
    const car = getCar(carId);
    return car?.averageConsumptionL100km ?? defaultL100;
  }

  function getKwh100ForCar(carId) {
    const car = getCar(carId);
    return car?.averageConsumptionKwh100km ?? defaultKwh100;
  }

  function getFuelTypeForCar(carId) {
    const car = getCar(carId);
    return car?.fuelType ?? "Benzine";
  }

  function fuelCostForReservation(r) {
    const km = r.releasedKmUsed ?? 0;
    if (km <= 0) return 0;
    const carId = r.carId || r.car?.id;
    const car = getCar(carId);
    const ft = car?.fuelType ?? "Benzine";
    if (ft === "Electric") {
      const kwh100 = getKwh100ForCar(carId);
      return (km / 100) * kwh100 * (priceElectricity || 0);
    }
    if (ft === "Hybrid") {
      const l100 = getL100ForCar(carId);
      const kwh100 = getKwh100ForCar(carId);
      const fuelPart = (km / 100) * l100 * (priceBenzine || priceDiesel || 0);
      const elecPart = (km / 100) * kwh100 * (priceElectricity || 0);
      return fuelPart + elecPart;
    }
    const l100 = getL100ForCar(carId);
    const price = ft === "Diesel" ? priceDiesel : priceBenzine;
    return (km / 100) * l100 * (price || 0);
  }

  function co2KgForReservation(r) {
    const km = r.releasedKmUsed ?? 0;
    if (km <= 0) return 0;
    const carId = r.carId || r.car?.id;
    const car = getCar(carId);
    const ft = car?.fuelType ?? "Benzine";
    if (ft === "Electric") return (km / 100) * getKwh100ForCar(carId) * CO2_ELECTRIC_KG_PER_KWH;
    if (ft === "Diesel") return (km / 100) * getL100ForCar(carId) * CO2_KG_PER_L_DIESEL;
    return (km / 100) * getL100ForCar(carId) * CO2_KG_PER_L_BENZINE;
  }

  const stats = useMemo(() => {
    const active = reservations.filter((r) => (r.status || "").toLowerCase() === "active");
    const completed = reservations.filter((r) => (r.status || "").toLowerCase() === "completed");
    const thisMonth = completed.filter((r) => r.updatedAt && isCurrentMonth(new Date(r.updatedAt).getTime()));
    const totalKmThisMonth = thisMonth.reduce((s, r) => s + (r.releasedKmUsed ?? 0), 0);
    const estimatedFuelCostThisMonth = thisMonth.reduce((s, r) => s + fuelCostForReservation(r), 0);

    const byUser = {};
    reservations.forEach((r) => {
      const uid = r.userId || r.user?.id;
      if (uid) {
        byUser[uid] = (byUser[uid] || 0) + 1;
      }
    });
    const topUsers = Object.entries(byUser)
      .map(([userId, count]) => {
        const u = users.find((m) => m.userId === userId || m.id === userId);
        return { userId, count, name: u?.name || "Unknown", email: u?.email || "" };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const byCar = {};
    reservations.forEach((r) => {
      const cid = r.carId || r.car?.id;
      if (cid) {
        byCar[cid] = (byCar[cid] || 0) + (r.releasedKmUsed ?? 0);
      }
    });
    const carUsage = cars.map((c) => ({
      id: c.id,
      name: `${c.brand} ${c.registrationNumber}`,
      km: byCar[c.id] ?? 0,
      reservations: reservations.filter((r) => (r.carId || r.car?.id) === c.id).length,
    })).sort((a, b) => b.km - a.km);

    const byCarFuelCost = {};
    completed.forEach((r) => {
      const cid = r.carId || r.car?.id;
      if (cid) byCarFuelCost[cid] = (byCarFuelCost[cid] || 0) + fuelCostForReservation(r);
    });
    const efficiencyLeaderboard = cars.map((c) => ({
      id: c.id,
      name: `${c.brand} ${c.registrationNumber}`,
      km: byCar[c.id] ?? 0,
      fuelCost: byCarFuelCost[c.id] ?? 0,
      l100: c.averageConsumptionL100km ?? defaultL100,
    })).sort((a, b) => b.fuelCost - a.fuelCost);

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const byDay = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo + i * 24 * 60 * 60 * 1000);
      const key = getStartOfDay(d);
      byDay[key] = { date: d.toISOString().slice(0, 10), fuelCost: 0, km: 0 };
    }
    completed.forEach((r) => {
      if (!r.updatedAt) return;
      const t = new Date(r.updatedAt).getTime();
      if (t < thirtyDaysAgo || t > now) return;
      const key = getStartOfDay(t);
      if (!byDay[key]) byDay[key] = { date: new Date(key).toISOString().slice(0, 10), fuelCost: 0, km: 0 };
      const km = r.releasedKmUsed ?? 0;
      byDay[key].km += km;
      byDay[key].fuelCost += fuelCostForReservation(r);
    });
    const fuelTrend = Object.keys(byDay)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => byDay[k]);

    const co2ByDay = Object.keys(byDay)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => {
        const d = byDay[k];
        let co2 = 0;
        completed.forEach((r) => {
          if (!r.updatedAt) return;
          const t = new Date(r.updatedAt).getTime();
          if (getStartOfDay(t) === Number(k)) co2 += co2KgForReservation(r);
        });
        return { ...d, co2Kg: Math.round(co2 * 100) / 100 };
      });

    const efficiencyByConsumption = [...cars]
      .map((c) => {
        const ft = c.fuelType ?? "Benzine";
        const consumption = ft === "Electric" || ft === "Hybrid"
          ? (c.averageConsumptionKwh100km ?? defaultKwh100)
          : (c.averageConsumptionL100km ?? defaultL100);
        const unit = ft === "Electric" || ft === "Hybrid" ? "kWh/100km" : "L/100km";
        return { id: c.id, name: `${c.brand} ${c.registrationNumber}`, fuelType: ft, consumption, unit };
      })
      .sort((a, b) => a.consumption - b.consumption);

    const fuelTypeCount = { Benzine: 0, Diesel: 0, Electric: 0, Hybrid: 0 };
    cars.forEach((c) => {
      const ft = c.fuelType ?? "Benzine";
      fuelTypeCount[ft] = (fuelTypeCount[ft] ?? 0) + 1;
    });
    const fuelCategoryPie = Object.entries(fuelTypeCount)
      .filter(([, n]) => n > 0)
      .map(([name, value]) => ({ name, value }));

    const costByFuelType = { Benzine: 0, Diesel: 0, Electric: 0, Hybrid: 0 };
    completed.forEach((r) => {
      const carId = r.carId || r.car?.id;
      const ft = getFuelTypeForCar(carId);
      costByFuelType[ft] = (costByFuelType[ft] ?? 0) + fuelCostForReservation(r);
    });
    const costByFuelCategoryBar = Object.entries(costByFuelType).map(([fuelType, cost]) => ({ fuelType, cost: Math.round(cost * 100) / 100 }));

    const totalCo2ThisMonth = completed
      .filter((r) => r.updatedAt && isCurrentMonth(new Date(r.updatedAt).getTime()))
      .reduce((s, r) => s + co2KgForReservation(r), 0);

    const rangeRemaining = cars
      .filter((c) => (c.fuelType === "Electric" || c.fuelType === "Hybrid") && c.batteryLevel != null && c.batteryCapacityKwh > 0 && (c.averageConsumptionKwh100km ?? 0) > 0)
      .map((c) => {
        const pct = (c.batteryLevel ?? 0) / 100;
        const cap = c.batteryCapacityKwh ?? 0;
        const kwh100 = c.averageConsumptionKwh100km ?? defaultKwh100;
        const range = pct * (100 / kwh100) * cap;
        return { id: c.id, name: `${c.brand} ${c.registrationNumber}`, fuelType: c.fuelType, batteryLevel: c.batteryLevel, rangeKm: Math.round(range) };
      });

    const maintenanceDue = cars.filter((c) => {
      const km = c.km ?? 0;
      const last = c.lastServiceMileage ?? 0;
      const ft = (c.fuelType ?? "Benzine").toLowerCase();
      if (ft === "electric") return km > 0;
      return (ft === "hybrid" || ft === "benzine" || ft === "diesel") && (km - last) > 10000;
    }).map((c) => ({ id: c.id, name: `${c.brand} ${c.registrationNumber}`, fuelType: c.fuelType, km: c.km, lastServiceMileage: c.lastServiceMileage }));

    return {
      activeCount: active.length,
      totalKmThisMonth,
      estimatedFuelCostThisMonth,
      totalCo2ThisMonth,
      topUsers,
      carUsage,
      fuelTrend,
      efficiencyLeaderboard,
      efficiencyByConsumption,
      co2ByDay,
      fuelCategoryPie,
      costByFuelCategoryBar,
      rangeRemaining,
      maintenanceDue,
    };
  }, [reservations, users, cars, fuelPrice, priceBenzine, priceDiesel, priceElectricity, defaultL100, defaultKwh100, carMap]);

  const handleDownloadPdf = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 14;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Statistics & Reports", 14, y);
    y += 8;

    if (company?.name) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(company.name, 14, y);
      y += 6;
    }
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, y);
    doc.setTextColor(0, 0, 0);
    y += 12;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 14, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total active reservations: ${stats.activeCount}`, 14, y);
    y += 6;
    doc.text(`Total mileage this month: ${stats.totalKmThisMonth.toLocaleString()} km`, 14, y);
    y += 6;
    const fuelStr = fuelPrice > 0
      ? stats.estimatedFuelCostThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "— (set fuel price in Company settings)";
    doc.text(`Estimated fuel costs (this month): ${fuelStr}`, 14, y);
    y += 14;

    autoTable(doc, {
      startY: y,
      head: [["#", "Name", "Email", "Reservations"]],
      body: stats.topUsers.map((u, i) => [i + 1, u.name, u.email, String(u.count)]),
      theme: "grid",
      headStyles: { fillColor: [71, 130, 246], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14 },
    });
    y = doc.lastAutoTable.finalY + 12;

    if (y > 250) {
      doc.addPage();
      y = 14;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Efficiency Leaderboard (by estimated fuel cost)", 14, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["#", "Car", "Km driven", "L/100km", "Est. fuel cost"]],
      body: stats.efficiencyLeaderboard.map((row, i) => [
        i + 1,
        row.name,
        `${row.km.toLocaleString()} km`,
        `${row.l100} L/100km`,
        fuelPrice > 0 ? row.fuelCost.toFixed(2) : "—",
      ]),
      theme: "grid",
      headStyles: { fillColor: [71, 130, 246], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14 },
    });
    y = doc.lastAutoTable.finalY + 12;

    if (y > 250) {
      doc.addPage();
      y = 14;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Car usage (km driven)", 14, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["Car", "Km driven", "Reservations"]],
      body: stats.carUsage.map((row) => [
        row.name,
        `${row.km.toLocaleString()} km`,
        String(row.reservations),
      ]),
      theme: "grid",
      headStyles: { fillColor: [71, 130, 246], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;

    const totalFuel30 = stats.fuelTrend.reduce((s, d) => s + d.fuelCost, 0);
    if (fuelPrice > 0 && (totalFuel30 > 0 || y < 260)) {
      if (y > 255) {
        doc.addPage();
        y = 14;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Estimated fuel expenditure (last 30 days): ${totalFuel30.toFixed(2)}`, 14, y);
    }

    doc.save(`statistics-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <section className="w-full max-w-[1600px] min-w-0 mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B]">Statistics & Reports</h2>
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="px-4 py-2.5 bg-[#3B82F6] text-white font-semibold rounded-xl hover:bg-[#2563EB] shadow-sm transition-colors flex items-center gap-2"
        >
          <span>Download PDF Report</span>
        </button>
      </div>

      {/* Top-level metric cards - Navy/Slate theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6">
          <p className="text-sm font-medium text-slate-500 mb-1">Total active reservations</p>
          <p className="text-2xl font-bold text-[#1E293B]">{stats.activeCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6">
          <p className="text-sm font-medium text-slate-500 mb-1">Total mileage this month</p>
          <p className="text-2xl font-bold text-[#1E293B]">{stats.totalKmThisMonth.toLocaleString()} km</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6">
          <p className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1.5">
            Est. fuel/electricity cost (this month)
            <span className="inline-flex text-slate-400 hover:text-slate-600 cursor-help" title="Per-fuel prices from Company settings."><Info className="w-4 h-4 shrink-0" /></span>
          </p>
          <p className="text-2xl font-bold text-[#1E293B]">
            {(priceBenzine || priceDiesel || priceElectricity || fuelPrice) ? stats.estimatedFuelCostThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6">
          <p className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1.5">
            CO₂ this month (kg)
            <span className="inline-flex text-slate-400 hover:text-slate-600 cursor-help" title="2.31 kg/L Benzine, 2.68 kg/L Diesel, Electric uses grid factor."><Info className="w-4 h-4 shrink-0" /></span>
          </p>
          <p className="text-2xl font-bold text-[#1E293B]">{stats.totalCo2ThisMonth.toFixed(1)} kg</p>
        </div>
      </div>

      {/* CO2 chart */}
      <div className="w-full bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 mb-8">
        <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Carbon footprint (last 30 days)</h3>
        <div className="w-full min-h-[260px]" style={{ height: 260 }}>
          {stats.co2ByDay.every((d) => d.co2Kg === 0) ? (
            <div className="h-full flex items-center justify-center text-slate-500 min-h-[260px]">No CO₂ data in the last 30 days</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.co2ByDay} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} unit=" kg" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} formatter={(v) => [`${v} kg CO₂`, "CO₂"]} />
                <Bar dataKey="co2Kg" fill="#0F172A" radius={[4, 4, 0, 0]} name="CO₂ (kg)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Fuel Efficiency Leaderboard (by consumption: most efficient first) */}
      <div className="w-full bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
        <h3 className="text-lg font-semibold text-[#1E293B] p-4 border-b border-slate-100">Fuel efficiency leaderboard</h3>
        <p className="text-sm text-slate-500 px-4 pb-3">Ranked from most efficient (lowest consumption) to least. L/100km for fuel cars, kWh/100km for Electric/Hybrid.</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="py-4 px-4 font-semibold text-slate-700">#</th>
                <th className="py-4 px-4 font-semibold text-slate-700">Car</th>
                <th className="py-4 px-4 font-semibold text-slate-700">Fuel type</th>
                <th className="py-4 px-4 font-semibold text-slate-700">Consumption</th>
              </tr>
            </thead>
            <tbody className="text-slate-800">
              {stats.efficiencyByConsumption.length === 0 ? (
                <tr><td colSpan={4} className="py-10 px-4 text-center text-slate-500">No cars</td></tr>
              ) : (
                stats.efficiencyByConsumption.map((row, i) => (
                  <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                    <td className="py-4 px-4">{i + 1}</td>
                    <td className="py-4 px-4 font-medium">{row.name}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${row.fuelType === "Electric" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : row.fuelType === "Diesel" ? "bg-slate-200 text-slate-800 border-slate-300" : row.fuelType === "Hybrid" ? "bg-teal-100 text-teal-800 border-teal-200" : "bg-amber-100 text-amber-800 border-amber-200"}`}>
                        {row.fuelType}
                      </span>
                    </td>
                    <td className="py-4 px-4">{row.consumption} {row.unit}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fuel category: pie (car count) + bar (cost) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
          <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Fleet by fuel type</h3>
          <div className="w-full min-h-[260px]">
            {stats.fuelCategoryPie.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-slate-500">No cars</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={stats.fuelCategoryPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => `${e.name}: ${e.value}`}>
                    {stats.fuelCategoryPie.map((e, i) => <Cell key={e.name} fill={FUEL_COLORS[e.name] || "#94A3B8"} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
          <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Cost per fuel category (completed trips)</h3>
          <div className="w-full min-h-[260px]">
            {stats.costByFuelCategoryBar.every((d) => d.cost === 0) ? (
              <div className="h-[260px] flex items-center justify-center text-slate-500">No cost data</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.costByFuelCategoryBar} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="fuelType" tick={{ fontSize: 12 }} width={50} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                    {stats.costByFuelCategoryBar.map((e, i) => <Cell key={e.fuelType} fill={FUEL_COLORS[e.fuelType] || "#94A3B8"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Range remaining (EV/Hybrid) + Maintenance due */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
          <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Range remaining (EV / Hybrid)</h3>
          <p className="text-sm text-slate-500 mb-3">(Battery % / 100) × (100 / Consumption) × Battery capacity (kWh)</p>
          {stats.rangeRemaining.length === 0 ? (
            <p className="text-slate-500">No EV/Hybrid cars with battery data</p>
          ) : (
            <ul className="space-y-2">
              {stats.rangeRemaining.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="font-medium text-slate-800">{r.name}</span>
                  <span className="text-[#1E293B] font-semibold">{r.rangeKm} km</span>
                  <span className="text-xs text-slate-500">({r.batteryLevel}% bat.)</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
          <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Service required</h3>
          <p className="text-sm text-slate-500 mb-3">Oil change &gt;10,000 km since last service (fuel/hybrid); battery check for electric.</p>
          {stats.maintenanceDue.length === 0 ? (
            <p className="text-slate-500">No cars due for service</p>
          ) : (
            <ul className="space-y-2">
              {stats.maintenanceDue.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="font-medium text-slate-800">{c.name}</span>
                  <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">Due</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Efficiency Leaderboard (by fuel cost - original) */}
      <div className="w-full bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
        <h3 className="text-lg font-semibold text-[#1E293B] p-4 border-b border-slate-100">Efficiency by estimated cost (completed trips)</h3>
        <p className="text-sm text-slate-500 px-4 pb-3">Cars ranked by total estimated fuel/electricity cost (highest = least efficient).</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="py-4 px-4 font-semibold text-slate-700">#</th>
                <th className="py-4 px-4 font-semibold text-slate-700">Car</th>
                <th className="py-4 px-4 font-semibold text-slate-700">Km driven</th>
                <th className="py-4 px-4 font-semibold text-slate-700">Consumption (L/100km)</th>
                <th className="py-4 px-4 font-semibold text-slate-700">Est. fuel cost</th>
              </tr>
            </thead>
            <tbody className="text-slate-800">
              {stats.efficiencyLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 px-4 text-center text-slate-500">No data yet</td>
                </tr>
              ) : (
                stats.efficiencyLeaderboard.map((row, i) => (
                  <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4">{i + 1}</td>
                    <td className="py-4 px-4 font-medium">{row.name}</td>
                    <td className="py-4 px-4">{row.km.toLocaleString()} km</td>
                    <td className="py-4 px-4">{row.l100} L/100km</td>
                    <td className="py-4 px-4">
                      {fuelPrice > 0
                        ? row.fuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top users table */}
      <div className="w-full bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
        <h3 className="text-lg font-semibold text-slate-800 p-4 border-b border-slate-100">Top users by reservations</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="py-4 px-4 font-semibold text-slate-700">#</th>
                <th className="py-4 px-4 font-semibold text-slate-700">Name</th>
                <th className="py-4 px-4 font-semibold text-slate-700">Email</th>
                <th className="py-4 px-4 font-semibold text-slate-700">Reservations</th>
              </tr>
            </thead>
            <tbody className="text-slate-800">
              {stats.topUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 px-4 text-center text-slate-500">No data yet</td>
                </tr>
              ) : (
                stats.topUsers.map((u, i) => (
                  <tr key={u.userId} className="border-t border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4">{i + 1}</td>
                    <td className="py-4 px-4">{u.name}</td>
                    <td className="py-4 px-4">{u.email}</td>
                    <td className="py-4 px-4 font-medium">{u.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Car usage bar chart */}
      <div className="w-full bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Car usage (km driven)</h3>
        <div className="w-full min-h-[300px]" style={{ height: 300 }}>
          {stats.carUsage.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 min-h-[300px]">No car usage data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={300} minHeight={300}>
              <BarChart data={stats.carUsage} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                  formatter={(value) => [`${value} km`, "Km driven"]}
                />
                <Bar dataKey="km" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Km driven" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Fuel expenditure line chart (last 30 days) */}
      <div className="w-full bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Estimated fuel expenditure (last 30 days)</h3>
        <div className="w-full min-h-[280px]" style={{ height: 280 }}>
          {fuelPrice <= 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 min-h-[280px]">Set average fuel price in Company settings to see estimates</div>
          ) : stats.fuelTrend.every((d) => d.fuelCost === 0) ? (
            <div className="h-full flex items-center justify-center text-slate-500 min-h-[280px]">No fuel expenditure data in the last 30 days</div>
          ) : (
            <ResponsiveContainer width="100%" height={280} minHeight={280}>
              <LineChart data={stats.fuelTrend} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                  formatter={(value, name) => [name === "fuelCost" ? Number(value).toFixed(2) : value, name === "fuelCost" ? "Fuel cost" : "Km"]}
                />
                <Legend />
                <Line type="monotone" dataKey="fuelCost" stroke="#3B82F6" strokeWidth={2} dot={{ r: 2 }} name="Fuel cost" />
                <Line type="monotone" dataKey="km" stroke="#64748B" strokeWidth={2} dot={{ r: 2 }} name="Km" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
}
