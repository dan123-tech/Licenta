"use client";

import { useState, useEffect } from "react";
import { BarChart2 } from "lucide-react";
import { Sidebar, NavItem } from "./Sidebar";
import StatisticsDashboard from "./StatisticsDashboard";
import {
  apiCars,
  apiUsers,
  apiInvites,
  apiReservations,
  apiAddCar,
  apiUpdateCar,
  apiDeleteCar,
  apiInviteUser,
  apiCreateUser,
  apiUpdateUserRole,
  apiRemoveUser,
  apiCreateReservation,
  apiCancelReservation,
  apiReleaseReservation,
  apiUpdateCompanyCurrent,
  apiSetUserDrivingLicenceStatus,
  apiPendingExceededApprovals,
  apiSetExceededApproval,
  apiRefreshReservationCodes,
  apiVerifyPickupCode,
  apiDataSourceConfigGet,
} from "@/lib/api";
import DatabaseSettingsSection from "./DatabaseSettingsSection";
import DataSourceNotConfiguredEmptyState from "./DataSourceNotConfiguredEmptyState";
import { getProviderLabelWithTable } from "@/orchestrator/config";

const SECTIONS = [
  { id: "company", label: "Company", icon: "🏢" },
  { id: "statistics", label: "Statistics & Reports", icon: <BarChart2 className="w-5 h-5 shrink-0" aria-hidden /> },
  { id: "cars", label: "Manage Cars", icon: "🚗" },
  { id: "verifyCode", label: "Verify Pickup Code", icon: "🔐" },
  { id: "users", label: "Manage Users", icon: "👥" },
  { id: "invites", label: "Invites", icon: "✉️" },
  { id: "history", label: "Car Sharing History", icon: "📋" },
  { id: "myReservations", label: "My Reservations", icon: "📅" },
  { id: "aiVerification", label: "AI Verification", icon: "🤖" },
  { id: "databaseSettings", label: "Database Settings", icon: "⚙️" },
];

const FUEL_BADGE = {
  Benzine: "bg-amber-100 text-amber-800 border-amber-200",
  Diesel: "bg-slate-200 text-slate-800 border-slate-300",
  Electric: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Hybrid: "bg-teal-100 text-teal-800 border-teal-200",
};

function FuelTypeBadge({ fuelType }) {
  const t = fuelType || "Benzine";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${FUEL_BADGE[t] || FUEL_BADGE.Benzine}`}>
      {t}
    </span>
  );
}

function needsService(car) {
  const km = car.km ?? 0;
  const last = car.lastServiceMileage ?? 0;
  const fuelType = (car.fuelType || "Benzine").toLowerCase();
  if (fuelType === "electric") return { need: km > 0, type: "Battery check" };
  if (fuelType === "hybrid" || fuelType === "benzine" || fuelType === "diesel") {
    const since = km - last;
    return { need: since > 10000, type: "Oil change", since };
  }
  return { need: false, type: null };
}

function CarConsumptionCell({ car, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(car.averageConsumptionL100km == null ? "" : String(car.averageConsumptionL100km));
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setValue(car.averageConsumptionL100km == null ? "" : String(car.averageConsumptionL100km));
  }, [car.averageConsumptionL100km]);
  async function save() {
    const num = value.trim() === "" ? null : parseFloat(String(value).replace(",", "."));
    if (value.trim() !== "" && (Number.isNaN(num) || num < 0 || num > 30)) return;
    setSaving(true);
    try {
      await apiUpdateCar(car.id, { averageConsumptionL100km: num });
      onUpdated?.();
      setEditing(false);
    } catch {
      // keep editing
    } finally {
      setSaving(false);
    }
  }
  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          max={30}
          step={0.1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          onBlur={save}
          autoFocus
          className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 outline-none"
          placeholder="7.5"
        />
        {saving && <span className="text-xs text-slate-500">Saving…</span>}
      </div>
    );
  }
  const display = car.averageConsumptionL100km != null && car.averageConsumptionL100km !== ""
    ? Number(car.averageConsumptionL100km)
    : null;
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="text-left text-sm text-slate-700 hover:text-[#3B82F6] hover:underline"
      title="Click to edit"
    >
      {display != null ? `${display} L/100km` : "Default"}
    </button>
  );
}

export default function AdminDashboard({ user, company, onCompanyUpdated, viewAs, setViewAs }) {
  const [section, setSection] = useState("cars");
  const [cars, setCars] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddCar, setShowAddCar] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [addCarBrand, setAddCarBrand] = useState("");
  const [addCarReg, setAddCarReg] = useState("");
  const [addCarKm, setAddCarKm] = useState(0);
  const [addCarStatus, setAddCarStatus] = useState("AVAILABLE");
  const [addCarFuelType, setAddCarFuelType] = useState("Benzine");
  const [addCarConsumption, setAddCarConsumption] = useState("");
  const [addCarConsumptionKwh, setAddCarConsumptionKwh] = useState("");
  const [addCarBatteryLevel, setAddCarBatteryLevel] = useState("");
  const [addCarBatteryCapacityKwh, setAddCarBatteryCapacityKwh] = useState("");
  const [addCarLastServiceMileage, setAddCarLastServiceMileage] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("USER");
  const [addUserPassword, setAddUserPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [invites, setInvites] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reserveCar, setReserveCar] = useState(null);
  const [reservePurpose, setReservePurpose] = useState("");
  const [reserveCarId, setReserveCarId] = useState("");
  const [releaseModal, setReleaseModal] = useState(null);
  const [releaseNewKm, setReleaseNewKm] = useState("");
  const [releaseExceededReason, setReleaseExceededReason] = useState("");
  const [releaseSubmitting, setReleaseSubmitting] = useState(false);
  const [defaultKmUsage, setDefaultKmUsage] = useState(company?.defaultKmUsage ?? 100);
  const [averageFuelPricePerLiter, setAverageFuelPricePerLiter] = useState(company?.averageFuelPricePerLiter ?? "");
  const [defaultConsumptionL100km, setDefaultConsumptionL100km] = useState(company?.defaultConsumptionL100km ?? "");
  const [priceBenzinePerLiter, setPriceBenzinePerLiter] = useState(company?.priceBenzinePerLiter ?? "");
  const [priceDieselPerLiter, setPriceDieselPerLiter] = useState(company?.priceDieselPerLiter ?? "");
  const [priceElectricityPerKwh, setPriceElectricityPerKwh] = useState(company?.priceElectricityPerKwh ?? "");
  const [defaultKmSaving, setDefaultKmSaving] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [pendingApprovalObservations, setPendingApprovalObservations] = useState({}); // reservationId -> text
  const [dlImageModal, setDlImageModal] = useState(null);
  const [refreshingCodeId, setRefreshingCodeId] = useState(null);
  const [verifyCodeInput, setVerifyCodeInput] = useState("");
  const [verifyBypass, setVerifyBypass] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifySubmitting, setVerifySubmitting] = useState(false);

  // Car Sharing History filters (all fields except start/end code)
  const [historyFilterCar, setHistoryFilterCar] = useState("");
  const [historyFilterUser, setHistoryFilterUser] = useState("");
  const [historyFilterDateFrom, setHistoryFilterDateFrom] = useState("");
  const [historyFilterDateTo, setHistoryFilterDateTo] = useState("");
  const [historyFilterStatus, setHistoryFilterStatus] = useState("");
  const [historyFilterPurpose, setHistoryFilterPurpose] = useState("");
  // Manage Cars filters
  const [carsFilterBrand, setCarsFilterBrand] = useState("");
  const [carsFilterReg, setCarsFilterReg] = useState("");
  const [carsFilterFuel, setCarsFilterFuel] = useState("");
  const [carsFilterStatus, setCarsFilterStatus] = useState("");
  // Manage Users filters
  const [usersFilterEmail, setUsersFilterEmail] = useState("");
  const [usersFilterName, setUsersFilterName] = useState("");
  const [usersFilterRole, setUsersFilterRole] = useState("");
  const [usersFilterStatus, setUsersFilterStatus] = useState("");
  const [usersFilterDl, setUsersFilterDl] = useState("");
  const [dataSourceConfig, setDataSourceConfig] = useState(null);
  const [dataSourceNotConfigured, setDataSourceNotConfigured] = useState({ users: false, cars: false, reservations: false });

  async function load() {
    setLoading(true);
    setError("");
    setDataSourceNotConfigured({ users: false, cars: false, reservations: false });
    try {
      const [configRes, carsRes, usersRes, invitesRes, reservRes, approvalsRes] = await Promise.all([
        apiDataSourceConfigGet().catch(() => ({ users: "LOCAL", cars: "LOCAL", reservations: "LOCAL" })),
        apiCars().catch((err) => ({ __error: err })),
        apiUsers().catch((err) => ({ __error: err })),
        apiInvites().catch(() => []),
        apiReservations().catch((err) => ({ __error: err })),
        apiPendingExceededApprovals().catch(() => []),
      ]);
      if (configRes && !configRes.__error) setDataSourceConfig(configRes);
      if (carsRes?.__error) {
        const err = carsRes.__error;
        if (err.code === "DATA_SOURCE_NOT_CONFIGURED") setDataSourceNotConfigured((s) => ({ ...s, cars: true }));
        setError((e) => (e ? e : err?.message || "Failed to load cars"));
        setCars([]);
      } else setCars(Array.isArray(carsRes) ? carsRes : []);
      if (usersRes?.__error) {
        const err = usersRes.__error;
        if (err.code === "DATA_SOURCE_NOT_CONFIGURED") setDataSourceNotConfigured((s) => ({ ...s, users: true }));
        setError((e) => (e ? e : err?.message || "Failed to load users"));
        setUsers([]);
      } else setUsers(Array.isArray(usersRes) ? usersRes : []);
      setInvites(Array.isArray(invitesRes) ? invitesRes : []);
      if (reservRes?.__error) {
        const err = reservRes.__error;
        if (err.code === "DATA_SOURCE_NOT_CONFIGURED") setDataSourceNotConfigured((s) => ({ ...s, reservations: true }));
        setError((e) => (e ? e : err?.message || "Failed to load reservations"));
        setReservations([]);
      } else setReservations(Array.isArray(reservRes) ? reservRes : []);
      setPendingApprovals(Array.isArray(approvalsRes) ? approvalsRes : []);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const handler = () => load();
    window.addEventListener("dataSourceConfigSaved", handler);
    return () => window.removeEventListener("dataSourceConfigSaved", handler);
  }, []);

  function formatDate(d) {
    if (!d) return "—";
    const x = new Date(d);
    return x.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  }

  const myReservations = reservations.filter((r) => r.userId === user?.id);
  const activeReservations = myReservations.filter((r) => (r.status || "").toLowerCase() === "active");

  async function handleRefreshCodes(reservationId) {
    setRefreshingCodeId(reservationId);
    setError("");
    try {
      await apiRefreshReservationCodes(reservationId);
      await load();
    } catch (err) {
      setError(err.message || "Failed to refresh codes");
    } finally {
      setRefreshingCodeId(null);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    const code = verifyCodeInput.trim();
    if (!code) return;
    setVerifySubmitting(true);
    setVerifyResult(null);
    setError("");
    try {
      const data = await apiVerifyPickupCode(code, verifyBypass);
      setVerifyResult({ valid: true, reservation: data.reservation });
    } catch (err) {
      setVerifyResult({ valid: false, error: err.message || "Verification failed" });
    } finally {
      setVerifySubmitting(false);
    }
  }

  function openReserve(car) {
    setReserveCar(car || null);
    setReserveCarId(car ? car.id : "");
    setReservePurpose("");
    setShowReserveModal(true);
  }

  async function handleReserve(e) {
    e.preventDefault();
    const carId = reserveCar?.id || reserveCarId;
    if (!carId) return;
    setSubmitting(true);
    setError("");
    try {
      await apiCreateReservation(carId, reservePurpose || undefined);
      setShowReserveModal(false);
      setReserveCar(null);
      setReserveCarId("");
      load();
    } catch (err) {
      setError(err.message || "Failed to create reservation");
    } finally {
      setSubmitting(false);
    }
  }

  const availableCars = cars.filter((c) => (c.status || "").toLowerCase() === "available");
  const defaultKm = company?.defaultKmUsage ?? 100;
  const releaseCurrentKm = releaseModal?.car?.km ?? 0;
  const releaseKmUsed = (() => {
    const n = parseInt(releaseNewKm, 10);
    if (isNaN(n) || n < releaseCurrentKm) return null;
    return n - releaseCurrentKm;
  })();
  const releaseExceedsLimit = defaultKm != null && releaseKmUsed != null && releaseKmUsed > defaultKm;

  // Filtered lists
  const filteredHistory = reservations.filter((r) => {
    const carStr = [r.car?.brand, r.car?.registrationNumber].filter(Boolean).join(" ").toLowerCase();
    const userStr = [r.user?.name, r.user?.email].filter(Boolean).join(" ").toLowerCase();
    if (historyFilterCar && !carStr.includes(historyFilterCar.trim().toLowerCase())) return false;
    if (historyFilterUser && !userStr.includes(historyFilterUser.trim().toLowerCase())) return false;
    if (historyFilterDateFrom) {
      const start = r.startDate ? new Date(r.startDate).toISOString().slice(0, 10) : "";
      if (start < historyFilterDateFrom) return false;
    }
    if (historyFilterDateTo) {
      const start = r.startDate ? new Date(r.startDate).toISOString().slice(0, 10) : "";
      if (start > historyFilterDateTo) return false;
    }
    if (historyFilterStatus && (r.status || "").toLowerCase() !== historyFilterStatus.toLowerCase()) return false;
    if (historyFilterPurpose && !(r.purpose || "").toLowerCase().includes(historyFilterPurpose.trim().toLowerCase())) return false;
    return true;
  });

  const filteredCars = cars.filter((c) => {
    if (carsFilterBrand && !(c.brand || "").toLowerCase().includes(carsFilterBrand.trim().toLowerCase())) return false;
    if (carsFilterReg && !(c.registrationNumber || "").toLowerCase().includes(carsFilterReg.trim().toLowerCase())) return false;
    if (carsFilterFuel && (c.fuelType || "") !== carsFilterFuel) return false;
    if (carsFilterStatus && (c.status || "") !== carsFilterStatus) return false;
    return true;
  });

  const filteredUsers = users.filter((m) => {
    if (usersFilterEmail && !(m.email || "").toLowerCase().includes(usersFilterEmail.trim().toLowerCase())) return false;
    if (usersFilterName && !(m.name || "").toLowerCase().includes(usersFilterName.trim().toLowerCase())) return false;
    if (usersFilterRole && (m.role || "") !== usersFilterRole) return false;
    if (usersFilterStatus && (m.status || "") !== usersFilterStatus) return false;
    if (usersFilterDl) {
      const dl = (m.drivingLicenceStatus || "").toUpperCase();
      const want = usersFilterDl.toUpperCase();
      if (want === "NONE" && dl) return false;
      if (want !== "NONE" && dl !== want) return false;
    }
    return true;
  });

  function openReleaseModal(r) {
    setReleaseModal({ id: r.id, car: r.car });
    setReleaseNewKm("");
    setReleaseExceededReason("");
  }

  async function submitRelease(e) {
    e.preventDefault();
    if (!releaseModal) return;
    const newKm = parseInt(releaseNewKm, 10);
    if (isNaN(newKm) || newKm < 0) {
      setError("Please enter the current odometer reading (new km of the car).");
      return;
    }
    if (newKm < releaseCurrentKm) {
      setError("New km cannot be less than the car's km when reserved (" + releaseCurrentKm + " km).");
      return;
    }
    if (releaseExceedsLimit && !releaseExceededReason.trim()) {
      setError("You exceeded the company limit (" + defaultKm + " km). Please provide a reason.");
      return;
    }
    setReleaseSubmitting(true);
    setError("");
    try {
      await apiReleaseReservation(releaseModal.id, newKm, releaseExceedsLimit ? releaseExceededReason : undefined);
      setReleaseModal(null);
      load();
    } catch (err) {
      setError(err.message || "Failed to release");
    } finally {
      setReleaseSubmitting(false);
    }
  }

  async function saveCompanySettings(e) {
    e.preventDefault();
    const kmVal = parseInt(defaultKmUsage, 10);
    if (isNaN(kmVal) || kmVal < 1) {
      setError("Default km must be at least 1");
      return;
    }
    const toNum = (v) => (v === "" || v == null ? null : (() => { const n = parseFloat(String(v).replace(",", ".")); return Number.isNaN(n) ? null : n; })());
    const fuelVal = toNum(averageFuelPricePerLiter);
    if (fuelVal !== null && fuelVal < 0) {
      setError("Fuel price must be non-negative");
      return;
    }
    setDefaultKmSaving(true);
    setError("");
    try {
      await apiUpdateCompanyCurrent({
        defaultKmUsage: kmVal,
        averageFuelPricePerLiter: fuelVal,
        defaultConsumptionL100km: toNum(defaultConsumptionL100km) ?? undefined,
        priceBenzinePerLiter: toNum(priceBenzinePerLiter) ?? undefined,
        priceDieselPerLiter: toNum(priceDieselPerLiter) ?? undefined,
        priceElectricityPerKwh: toNum(priceElectricityPerKwh) ?? undefined,
      });
      onCompanyUpdated?.();
      setError("");
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setDefaultKmSaving(false);
    }
  }

  async function cancelReservation(id) {
    if (!confirm("Cancel this reservation?")) return;
    try {
      await apiCancelReservation(id);
      load();
    } catch (err) {
      setError(err.message || "Failed to cancel");
    }
  }

  async function handleDlStatus(userId, status) {
    try {
      await apiSetUserDrivingLicenceStatus(userId, status);
      load();
    } catch (err) {
      setError(err.message || "Failed to update");
    }
  }

  async function handleExceededApproval(reservationId, action) {
    const observations = pendingApprovalObservations[reservationId];
    try {
      await apiSetExceededApproval(reservationId, action, observations);
      setPendingApprovalObservations((prev) => {
        const next = { ...prev };
        delete next[reservationId];
        return next;
      });
      load();
    } catch (err) {
      setError(err.message || "Failed to update");
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (company?.defaultKmUsage != null) setDefaultKmUsage(company.defaultKmUsage);
    if (company?.averageFuelPricePerLiter !== undefined) setAverageFuelPricePerLiter(company.averageFuelPricePerLiter == null ? "" : String(company.averageFuelPricePerLiter));
    if (company?.defaultConsumptionL100km !== undefined) setDefaultConsumptionL100km(company.defaultConsumptionL100km == null ? "" : String(company.defaultConsumptionL100km));
    if (company?.priceBenzinePerLiter !== undefined) setPriceBenzinePerLiter(company.priceBenzinePerLiter == null ? "" : String(company.priceBenzinePerLiter));
    if (company?.priceDieselPerLiter !== undefined) setPriceDieselPerLiter(company.priceDieselPerLiter == null ? "" : String(company.priceDieselPerLiter));
    if (company?.priceElectricityPerKwh !== undefined) setPriceElectricityPerKwh(company.priceElectricityPerKwh == null ? "" : String(company.priceElectricityPerKwh));
  }, [company?.defaultKmUsage, company?.averageFuelPricePerLiter, company?.defaultConsumptionL100km, company?.priceBenzinePerLiter, company?.priceDieselPerLiter, company?.priceElectricityPerKwh]);

  async function handleAddCar(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const consumptionVal = addCarConsumption.trim() === "" ? null : parseFloat(String(addCarConsumption).replace(",", "."));
      const consumption = consumptionVal != null && !Number.isNaN(consumptionVal) && consumptionVal >= 0 && consumptionVal <= 30 ? consumptionVal : null;
      const consumptionKwhVal = addCarConsumptionKwh.trim() === "" ? null : parseFloat(String(addCarConsumptionKwh).replace(",", "."));
      const consumptionKwh = consumptionKwhVal != null && !Number.isNaN(consumptionKwhVal) && consumptionKwhVal >= 0 ? consumptionKwhVal : null;
      const batteryLevelVal = addCarBatteryLevel.trim() === "" ? null : parseInt(addCarBatteryLevel, 10);
      const batteryLevel = batteryLevelVal != null && !Number.isNaN(batteryLevelVal) ? Math.min(100, Math.max(0, batteryLevelVal)) : null;
      const batteryCapVal = addCarBatteryCapacityKwh.trim() === "" ? null : parseFloat(String(addCarBatteryCapacityKwh).replace(",", "."));
      const batteryCapacityKwh = batteryCapVal != null && !Number.isNaN(batteryCapVal) && batteryCapVal >= 0 ? batteryCapVal : null;
      const lastServiceVal = addCarLastServiceMileage.trim() === "" ? null : parseInt(addCarLastServiceMileage, 10);
      const lastServiceMileage = lastServiceVal != null && !Number.isNaN(lastServiceVal) && lastServiceVal >= 0 ? lastServiceVal : null;
      await apiAddCar({
        brand: addCarBrand.trim(),
        registrationNumber: addCarReg.trim(),
        km: Number(addCarKm) || 0,
        status: addCarStatus,
        fuelType: addCarFuelType,
        averageConsumptionL100km: consumption,
        averageConsumptionKwh100km: (addCarFuelType === "Electric" || addCarFuelType === "Hybrid") ? consumptionKwh : undefined,
        batteryLevel: (addCarFuelType === "Electric" || addCarFuelType === "Hybrid") ? batteryLevel : undefined,
        batteryCapacityKwh: (addCarFuelType === "Electric" || addCarFuelType === "Hybrid") ? batteryCapacityKwh : undefined,
        lastServiceMileage: lastServiceMileage ?? undefined,
      });
      setAddCarBrand("");
      setAddCarReg("");
      setAddCarKm(0);
      setAddCarStatus("AVAILABLE");
      setAddCarFuelType("Benzine");
      setAddCarConsumption("");
      setAddCarConsumptionKwh("");
      setAddCarBatteryLevel("");
      setAddCarBatteryCapacityKwh("");
      setAddCarLastServiceMileage("");
      setShowAddCar(false);
      load();
    } catch (err) {
      setError(err.message || "Failed to add car");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCarStatusChange(carId, newStatus) {
    try {
      await apiUpdateCar(carId, { status: newStatus });
      load();
    } catch (err) {
      setError(err.message || "Failed to update");
    }
  }

  async function handleDeleteCar(carId) {
    if (!confirm("Delete this car?")) return;
    try {
      await apiDeleteCar(carId);
      load();
    } catch (err) {
      setError(err.message || "Failed to delete");
    }
  }

  async function handleInviteUser(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await apiInviteUser(inviteEmail.trim(), inviteName.trim() || undefined, inviteRole);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("USER");
      setShowAddUser(false);
      load();
    } catch (err) {
      setError(err.message || "Failed to invite");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await apiCreateUser(inviteEmail.trim(), inviteName.trim() || inviteEmail.trim(), addUserPassword.trim() || undefined, inviteRole);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("USER");
      setAddUserPassword("");
      setShowAddUser(false);
      load();
    } catch (err) {
      setError(err.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleChange(memberUserId, newRole) {
    try {
      await apiUpdateUserRole(memberUserId, newRole);
      load();
    } catch (err) {
      setError(err.message || "Failed to update role");
    }
  }

  async function handleRemoveUser(memberUserId) {
    if (!confirm("Remove this user from the company?")) return;
    try {
      await apiRemoveUser(memberUserId);
      load();
    } catch (err) {
      setError(err.message || "Failed to remove");
    }
  }

  return (
    <div className="flex h-full w-full bg-[#F8FAFC]">
      <Sidebar user={user} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} viewAs={viewAs} setViewAs={setViewAs}>
        {SECTIONS.map((s) => (
          <NavItem
            key={s.id}
            active={section === s.id}
            onClick={() => { setSection(s.id); setMobileOpen(false); }}
            icon={s.icon}
            label={s.label}
          />
        ))}
      </Sidebar>
      <div className="flex-1 flex flex-col min-h-0 min-w-0 md:ml-2 my-2 md:my-3 md:mr-3 bg-white rounded-l-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <header className="shrink-0 flex items-center gap-3 py-3 px-4 sm:px-6 md:px-8 border-b border-slate-200/80 bg-white shadow-sm z-10">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-slate-200 transition-colors"
            aria-label="Open menu"
          >
            ☰
          </button>
          <h1 className="text-lg font-bold text-slate-800 truncate">Admin</h1>
        </header>
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6 sm:p-8 md:p-10">
        {company?.joinCode && (
          <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 text-sm shadow-sm">
            <strong>Join code for your company:</strong> <code className="font-mono text-lg text-[#3B82F6]">{company.joinCode}</code>
            <span className="block mt-1 text-slate-600">Share this code so others can join.</span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
        )}

        {section === "company" && (
          <section className="w-full min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Company</h2>
              {company?.joinCode && (
                <div className="shrink-0 bg-[#1E293B] text-white rounded-xl px-4 py-3 border border-slate-600/50 shadow-sm">
                  <p className="text-xs font-medium text-slate-300 uppercase tracking-wide">Join code</p>
                  <p className="text-xl font-bold font-mono text-white mt-0.5">{company.joinCode}</p>
                  <p className="text-xs text-slate-400 mt-1">Share so others can join</p>
                </div>
              )}
            </div>
            <div className="w-full bg-white rounded-[12px] shadow-[0_1px_3px_0_rgb(0_0_0/0.06),0_1px_2px_-1px_rgb(0_0_0/0.06)] p-4 sm:p-6 border border-slate-100/80">
              <form onSubmit={saveCompanySettings} className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Default km per reservation</label>
                  <p className="text-xs text-slate-500 mb-2">Allowed km per reservation. Users must give a reason if they exceed this.</p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <input
                      type="number"
                      min={1}
                      max={99999}
                      value={defaultKmUsage}
                      onChange={(e) => setDefaultKmUsage(e.target.value)}
                      className="w-24 px-3 py-2 border border-slate-200 rounded-xl text-slate-800 bg-white focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none transition-shadow"
                    />
                    <span className="text-slate-500">km</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Default consumption (L/100km)</label>
                  <p className="text-xs text-slate-500 mb-2">Used when a car has no consumption set (e.g. 7.5).</p>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    step={0.1}
                    value={defaultConsumptionL100km}
                    onChange={(e) => setDefaultConsumptionL100km(e.target.value)}
                    placeholder="7.5"
                    className="w-24 px-3 py-2 border border-slate-200 rounded-xl text-slate-800 bg-white focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                  />
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">Global fuel & electricity pricing (for Statistics)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Benzine (currency/L)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={priceBenzinePerLiter}
                        onChange={(e) => setPriceBenzinePerLiter(e.target.value)}
                        placeholder="e.g. 1.50"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 bg-white focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Diesel (currency/L)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={priceDieselPerLiter}
                        onChange={(e) => setPriceDieselPerLiter(e.target.value)}
                        placeholder="e.g. 1.45"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 bg-white focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Electricity (currency/kWh)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={priceElectricityPerKwh}
                        onChange={(e) => setPriceElectricityPerKwh(e.target.value)}
                        placeholder="e.g. 0.25"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 bg-white focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Legacy: single &quot;Price per Liter&quot; below (used if per-type prices not set).</p>
                  <div className="flex flex-wrap gap-2 items-center mt-2">
                    <input
                      type="number"
                      min={0}
                      max={999}
                      step={0.01}
                      value={averageFuelPricePerLiter}
                      onChange={(e) => setAverageFuelPricePerLiter(e.target.value)}
                      placeholder="e.g. 1.50"
                      className="w-28 px-3 py-2 border border-slate-200 rounded-xl text-slate-800 bg-white focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                    />
                    <span className="text-slate-500">currency/L (fallback)</span>
                  </div>
                </div>
                <button type="submit" disabled={defaultKmSaving} className="px-4 py-2 bg-[#3B82F6] text-white font-semibold rounded-xl hover:bg-[#2563EB] disabled:opacity-50 min-h-[44px] shadow-sm transition-colors">
                  {defaultKmSaving ? "Saving…" : "Save settings"}
                </button>
              </form>
            </div>
            {pendingApprovals.length > 0 && (
              <div className="mt-6 w-full">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Pending km-exceeded approvals</h3>
                <p className="text-sm text-slate-500 mb-4">Users exceeded the allowed km and gave a reason. Approve or reject.</p>
                <div className="space-y-4">
                  {pendingApprovals.map((r) => (
                    <div key={r.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 shadow-sm">
                      <div className="flex flex-wrap gap-2 items-center justify-between mb-2">
                        <span className="font-medium text-slate-800">{r.user?.name} – {r.car?.brand} {r.car?.registrationNumber}</span>
                        <span className="text-sm text-slate-500">{r.releasedKmUsed} km used</span>
                      </div>
                      <p className="text-sm text-slate-700 mb-3">{r.releasedExceededReason}</p>
                      <div className="mb-3">
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Observations (visible to user)</label>
                        <textarea
                          value={pendingApprovalObservations[r.id] ?? ""}
                          onChange={(e) => setPendingApprovalObservations((prev) => ({ ...prev, [r.id]: e.target.value }))}
                          placeholder="Optional comment for the user…"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 bg-white text-sm focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleExceededApproval(r.id, "approveExceeded")}
                          className="px-3 py-2 min-h-[44px] bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 shadow-sm transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExceededApproval(r.id, "rejectExceeded")}
                          className="px-3 py-2 min-h-[44px] bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 shadow-sm transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {section === "statistics" && (
          <StatisticsDashboard
            reservations={reservations}
            company={company}
            users={users}
            cars={cars}
          />
        )}

        {section === "cars" && (
          <section className="w-full min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Manage Cars</h2>
              {dataSourceConfig?.cars != null && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  Source: {getProviderLabelWithTable(dataSourceConfig.cars, dataSourceConfig.carsTable)}
                </span>
              )}
            </div>
            {dataSourceNotConfigured.cars ? (
              <DataSourceNotConfiguredEmptyState layerLabel="Cars" className="min-h-[200px]" />
            ) : (
            <>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <div className="flex-1 min-w-0" />
              <button
                type="button"
                onClick={() => setShowAddCar(!showAddCar)}
                className="px-4 py-2.5 bg-[#3B82F6] text-white font-semibold rounded-xl hover:bg-[#2563EB] shadow-sm transition-colors"
              >
                {showAddCar ? "Hide form" : "Add Car"}
              </button>
            </div>
            <div className="flex flex-wrap gap-3 p-4 mb-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-sm font-semibold text-slate-600 self-center">Filters:</span>
              <input
                type="text"
                placeholder="Brand"
                value={carsFilterBrand}
                onChange={(e) => setCarsFilterBrand(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm min-w-[100px] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 outline-none"
              />
              <input
                type="text"
                placeholder="Registration"
                value={carsFilterReg}
                onChange={(e) => setCarsFilterReg(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm min-w-[120px] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 outline-none"
              />
              <select
                value={carsFilterFuel}
                onChange={(e) => setCarsFilterFuel(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 outline-none"
              >
                <option value="">All fuel types</option>
                <option value="Benzine">Benzine</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
              <select
                value={carsFilterStatus}
                onChange={(e) => setCarsFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 outline-none"
              >
                <option value="">All statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="RESERVED">Reserved</option>
                <option value="IN_MAINTENANCE">In maintenance</option>
              </select>
              <button
                type="button"
                onClick={() => { setCarsFilterBrand(""); setCarsFilterReg(""); setCarsFilterFuel(""); setCarsFilterStatus(""); }}
                className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                Clear filters
              </button>
            </div>
            {showAddCar && (
              <form onSubmit={handleAddCar} className="flex flex-wrap gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                <input
                  type="text"
                  value={addCarBrand}
                  onChange={(e) => setAddCarBrand(e.target.value)}
                  placeholder="Brand"
                  className="px-3 py-2 border border-slate-200 rounded-xl min-w-[120px] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                  required
                />
                <input
                  type="text"
                  value={addCarReg}
                  onChange={(e) => setAddCarReg(e.target.value)}
                  placeholder="Registration Number"
                  className="px-3 py-2 border border-slate-200 rounded-xl min-w-[140px] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                  required
                />
                <input
                  type="number"
                  value={addCarKm}
                  onChange={(e) => setAddCarKm(e.target.value)}
                  placeholder="Km"
                  min={0}
                  className="px-3 py-2 border border-slate-200 rounded-xl w-24 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                />
                <select
                  value={addCarStatus}
                  onChange={(e) => setAddCarStatus(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="IN_MAINTENANCE">In maintenance</option>
                </select>
                <select
                  value={addCarFuelType}
                  onChange={(e) => setAddCarFuelType(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                  title="Fuel type"
                >
                  <option value="Benzine">Benzine</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
                {(addCarFuelType === "Benzine" || addCarFuelType === "Diesel") && (
                  <input
                    type="number"
                    min={0}
                    max={30}
                    step={0.1}
                    value={addCarConsumption}
                    onChange={(e) => setAddCarConsumption(e.target.value)}
                    placeholder="L/100km"
                    className="px-3 py-2 border border-slate-200 rounded-xl w-24 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                  />
                )}
                {(addCarFuelType === "Electric" || addCarFuelType === "Hybrid") && (
                  <>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={addCarBatteryLevel}
                      onChange={(e) => setAddCarBatteryLevel(e.target.value)}
                      placeholder="Battery %"
                      className="px-3 py-2 border border-slate-200 rounded-xl w-24 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={addCarBatteryCapacityKwh}
                      onChange={(e) => setAddCarBatteryCapacityKwh(e.target.value)}
                      placeholder="Battery capacity (kWh)"
                      className="px-3 py-2 border border-slate-200 rounded-xl w-36 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={addCarConsumptionKwh}
                      onChange={(e) => setAddCarConsumptionKwh(e.target.value)}
                      placeholder="kWh/100km"
                      className="px-3 py-2 border border-slate-200 rounded-xl w-28 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                    />
                  </>
                )}
                <input
                  type="number"
                  min={0}
                  value={addCarLastServiceMileage}
                  onChange={(e) => setAddCarLastServiceMileage(e.target.value)}
                  placeholder="Last service km"
                  className="px-3 py-2 border border-slate-200 rounded-xl w-28 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                  title="Odometer at last service (for maintenance forecast)"
                />
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-[#3B82F6] text-white font-semibold rounded-xl hover:bg-[#2563EB] disabled:opacity-50 shadow-sm transition-colors">
                  Save Car
                </button>
              </form>
            )}
            <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 shadow-sm">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="py-4 px-4 font-semibold text-slate-700">Brand</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Registration</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Fuel</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Km</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Consumption</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Service</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Status</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Access codes</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-slate-800">
                  {filteredCars.map((c) => {
                    const service = needsService(c);
                    const activeRes = reservations.find((r) => r.carId === c.id && (r.status || "").toLowerCase() === "active");
                    return (
                      <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4">{c.brand}</td>
                        <td className="py-4 px-4">{c.registrationNumber}</td>
                        <td className="py-4 px-4"><FuelTypeBadge fuelType={c.fuelType} /></td>
                        <td className="py-4 px-4">{c.km ?? 0}</td>
                        <td className="py-4 px-4">
                          {(c.fuelType === "Electric" || c.fuelType === "Hybrid")
                            ? (c.averageConsumptionKwh100km != null ? `${c.averageConsumptionKwh100km} kWh/100km` : "—")
                            : <CarConsumptionCell car={c} onUpdated={load} />}
                        </td>
                        <td className="py-4 px-4">
                          {service.need ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200" title={service.since != null ? `${service.since} km since last service` : ""}>
                              {service.type} due
                            </span>
                          ) : (
                            <span className="text-slate-500 text-sm">—</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <select
                            value={c.status}
                            onChange={(e) => handleCarStatusChange(c.id, e.target.value)}
                            className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 outline-none"
                          >
                            <option value="AVAILABLE">Available</option>
                            <option value="RESERVED">Reserved</option>
                            <option value="IN_MAINTENANCE">In maintenance</option>
                          </select>
                        </td>
                        <td className="py-4 px-4">
                          {activeRes ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-lg bg-[#1E293B]/10 text-[#1E293B] font-mono text-sm font-semibold tabular-nums" title="Start rental">{activeRes.pickup_code ?? "—"}</span>
                              <span className="inline-flex items-center px-2 py-1 rounded-lg bg-[#1E293B]/10 text-[#1E293B] font-mono text-sm font-semibold tabular-nums" title="End rental">{activeRes.release_code ?? "—"}</span>
                              <button
                                type="button"
                                onClick={() => handleRefreshCodes(activeRes.id)}
                                disabled={refreshingCodeId === activeRes.id}
                                className="px-2 py-1 text-xs font-semibold text-[#1E293B] border border-[#1E293B]/30 rounded-lg hover:bg-[#1E293B]/10 disabled:opacity-50"
                              >
                                {refreshingCodeId === activeRes.id ? "…" : "Generate New Code"}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            type="button"
                            onClick={() => handleDeleteCar(c.id)}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 shadow-sm transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCars.length === 0 && !loading && (
                    <tr><td colSpan={9} className="py-10 px-4 text-center text-slate-500">{cars.length === 0 ? "No cars yet" : "No cars match the filters"}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            </>
            )}
          </section>
        )}

        {section === "verifyCode" && (
          <section className="w-full min-w-0">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Verify Pickup Code</h2>
            <p className="text-sm text-slate-500 mb-4">Enter the 6-digit pickup code to validate. Use &quot;Bypass time window&quot; to accept codes outside the 30-minute window (e.g. user is late).</p>
            <form onSubmit={handleVerifyCode} className="max-w-md space-y-4 p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Pickup code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verifyCodeInput}
                  onChange={(e) => setVerifyCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="e.g. 123456"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-mono text-lg tracking-widest focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifyBypass}
                  onChange={(e) => setVerifyBypass(e.target.checked)}
                  className="rounded border-slate-300 text-[#1E293B] focus:ring-[#1E293B]"
                />
                <span className="text-sm font-medium text-slate-700">Bypass time window</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={verifySubmitting || !verifyCodeInput.trim()}
                  className="px-4 py-2.5 bg-[#1E293B] text-white font-semibold rounded-xl hover:bg-[#334155] disabled:opacity-50 shadow-sm transition-colors"
                >
                  {verifySubmitting ? "Verifying…" : "Verify"}
                </button>
                <button
                  type="button"
                  onClick={() => { setVerifyCodeInput(""); setVerifyResult(null); setVerifyBypass(false); }}
                  className="px-4 py-2.5 bg-slate-100 text-slate-800 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Clear
                </button>
              </div>
            </form>
            {verifyResult && (
              <div className={`mt-4 p-4 rounded-xl border ${verifyResult.valid ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                {verifyResult.valid ? (
                  <>
                    <p className="font-semibold text-emerald-800 mb-2">✓ Code valid</p>
                    <p className="text-sm text-emerald-700">
                      {verifyResult.reservation?.car?.brand} {verifyResult.reservation?.car?.registrationNumber} — {verifyResult.reservation?.user?.name || verifyResult.reservation?.user?.email}
                    </p>
                  </>
                ) : (
                  <p className="font-semibold text-red-800">{verifyResult.error}</p>
                )}
              </div>
            )}
          </section>
        )}

        {section === "users" && (
          <section>
            <div className="flex flex-wrap items-center gap-3 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Manage Users</h2>
              {dataSourceConfig?.users != null && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  Source: {getProviderLabelWithTable(dataSourceConfig.users, dataSourceConfig.usersTable)}
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowAddUser(true)}
                className="px-4 py-2.5 min-h-[44px] bg-[#3B82F6] text-white font-semibold rounded-xl hover:bg-[#2563EB] flex items-center gap-2 shadow-sm transition-colors"
              >
                Add User
              </button>
            </div>
            {dataSourceNotConfigured.users ? (
              <DataSourceNotConfiguredEmptyState layerLabel="Users" className="min-h-[200px]" />
            ) : (
            <>
            <div className="flex flex-wrap gap-3 p-4 mb-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-sm font-semibold text-slate-600 self-center">Filters:</span>
              <input
                type="text"
                placeholder="Email"
                value={usersFilterEmail}
                onChange={(e) => setUsersFilterEmail(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm min-w-[140px] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 outline-none"
              />
              <input
                type="text"
                placeholder="Name"
                value={usersFilterName}
                onChange={(e) => setUsersFilterName(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm min-w-[120px] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 outline-none"
              />
              <select
                value={usersFilterRole}
                onChange={(e) => setUsersFilterRole(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 outline-none"
              >
                <option value="">All roles</option>
                <option value="ADMIN">Admin</option>
                <option value="USER">User</option>
              </select>
              <select
                value={usersFilterStatus}
                onChange={(e) => setUsersFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 outline-none"
              >
                <option value="">All statuses</option>
                <option value="enrolled">Enrolled</option>
                <option value="pending">Pending</option>
              </select>
              <select
                value={usersFilterDl}
                onChange={(e) => setUsersFilterDl(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 outline-none"
              >
                <option value="">All driving licence</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
                <option value="NONE">None</option>
              </select>
              <button
                type="button"
                onClick={() => { setUsersFilterEmail(""); setUsersFilterName(""); setUsersFilterRole(""); setUsersFilterStatus(""); setUsersFilterDl(""); }}
                className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                Clear filters
              </button>
            </div>
            <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 shadow-sm">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="py-4 px-4 font-semibold text-slate-700">Email</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Name</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Role</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Status</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Driving licence</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-slate-800">
                  {filteredUsers.map((m) => (
                    <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4">{m.email}</td>
                      <td className="py-4 px-4">{m.name}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${m.role === "ADMIN" ? "bg-slate-600 text-white" : "bg-[#3B82F6]/90 text-white"}`}>
                          {m.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">{m.status}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                          m.drivingLicenceStatus === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                          m.drivingLicenceStatus === "PENDING" ? "bg-amber-100 text-amber-800" :
                          m.drivingLicenceStatus === "REJECTED" ? "bg-red-100 text-red-800" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {m.drivingLicenceStatus === "APPROVED" ? "Approved" : m.drivingLicenceStatus === "PENDING" ? "Pending" : m.drivingLicenceStatus === "REJECTED" ? "Rejected" : "—"}
                        </span>
                        {m.drivingLicenceUrl && (
                          <>
                            <button type="button" onClick={() => setDlImageModal(m.drivingLicenceUrl)} className="ml-2 px-2 py-1 text-xs font-semibold text-[#3B82F6] hover:underline">View</button>
                            {m.drivingLicenceStatus === "PENDING" && (
                              <span className="inline-flex gap-1 ml-1">
                                <button type="button" onClick={() => handleDlStatus(m.userId, "APPROVED")} className="px-2 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Approve</button>
                                <button type="button" onClick={() => handleDlStatus(m.userId, "REJECTED")} className="px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700">Reject</button>
                              </span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="py-4 px-4 flex flex-wrap gap-2">
                        {m.userId !== user?.id ? (
                          <button
                            type="button"
                            onClick={() => handleRoleChange(m.userId, m.role === "ADMIN" ? "USER" : "ADMIN")}
                            className="px-3 py-2 min-h-[44px] sm:min-h-0 bg-slate-600 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 shadow-sm transition-colors"
                          >
                            {m.role === "ADMIN" ? "Set User" : "Set Admin"}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">(you)</span>
                        )}
                        {m.userId !== user?.id && (
                          <button
                            type="button"
                            onClick={() => handleRemoveUser(m.userId)}
                            className="px-3 py-2 min-h-[44px] sm:min-h-0 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 shadow-sm transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && !loading && (
                    <tr><td colSpan={6} className="py-10 px-4 text-center text-slate-500">{users.length === 0 ? "No users yet" : "No users match the filters"}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            </>
            )}
          </section>
        )}

        {section === "invites" && (
          <section className="w-full min-w-0">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Invites</h2>
            <p className="text-sm text-slate-500 mb-4">See who was invited and whether they joined the platform.</p>
            <div className="w-full overflow-hidden rounded-xl border border-slate-200/80 shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="py-4 px-4 font-semibold text-slate-700">Email</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Invited at</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Status</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Expires</th>
                  </tr>
                </thead>
                <tbody className="text-slate-800">
                  {invites.map((inv) => (
                    <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4">{inv.email}</td>
                      <td className="py-4 px-4">{formatDate(inv.createdAt)}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                          inv.status === "joined" ? "bg-emerald-100 text-emerald-800" :
                          inv.status === "expired" ? "bg-slate-200 text-slate-700" :
                          "bg-amber-100 text-amber-800"
                        }`}>
                          {inv.status === "joined" ? "Joined" : inv.status === "expired" ? "Expired" : "Pending"}
                        </span>
                      </td>
                      <td className="py-4 px-4">{formatDate(inv.expiresAt)}</td>
                    </tr>
                  ))}
                  {invites.length === 0 && !loading && (
                    <tr><td colSpan={4} className="py-10 px-4 text-center text-slate-500">No invites yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {section === "history" && (
          <section className="w-full min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Car Sharing History</h2>
              {dataSourceConfig?.reservations != null && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  Source: {getProviderLabelWithTable(dataSourceConfig.reservations, dataSourceConfig.reservationsTable)}
                </span>
              )}
            </div>
            {dataSourceNotConfigured.reservations ? (
              <DataSourceNotConfiguredEmptyState layerLabel="Reservations" className="min-h-[200px]" />
            ) : (
            <>
            <p className="text-sm text-slate-500 mb-4">All reservations in your company.</p>
            <div className="flex flex-wrap gap-3 p-4 mb-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-sm font-semibold text-slate-600 self-center">Filters:</span>
              <input
                type="text"
                placeholder="Car (brand or reg.)"
                value={historyFilterCar}
                onChange={(e) => setHistoryFilterCar(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm min-w-[140px] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 outline-none"
              />
              <input
                type="text"
                placeholder="User (name or email)"
                value={historyFilterUser}
                onChange={(e) => setHistoryFilterUser(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm min-w-[140px] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 outline-none"
              />
              <input
                type="date"
                placeholder="From date"
                value={historyFilterDateFrom}
                onChange={(e) => setHistoryFilterDateFrom(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 outline-none"
              />
              <input
                type="date"
                placeholder="To date"
                value={historyFilterDateTo}
                onChange={(e) => setHistoryFilterDateTo(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 outline-none"
              />
              <select
                value={historyFilterStatus}
                onChange={(e) => setHistoryFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 outline-none"
              >
                <option value="">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <input
                type="text"
                placeholder="Purpose"
                value={historyFilterPurpose}
                onChange={(e) => setHistoryFilterPurpose(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm min-w-[120px] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/20 outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setHistoryFilterCar("");
                  setHistoryFilterUser("");
                  setHistoryFilterDateFrom("");
                  setHistoryFilterDateTo("");
                  setHistoryFilterStatus("");
                  setHistoryFilterPurpose("");
                }}
                className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                Clear filters
              </button>
            </div>
            <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 shadow-sm">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="py-4 px-4 font-semibold text-slate-700">Car</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">User</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Reserved at</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Status</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Start / End code</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-slate-800">
                  {filteredHistory.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4">{r.car?.brand} {r.car?.registrationNumber}</td>
                      <td className="py-4 px-4">{r.user?.name || r.user?.email || "—"}</td>
                      <td className="py-4 px-4">{formatDate(r.startDate)}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                          (r.status || "").toLowerCase() === "active" ? "bg-emerald-100 text-emerald-800" :
                          (r.status || "").toLowerCase() === "completed" ? "bg-[#3B82F6]/10 text-[#2563EB]" :
                          (r.status || "").toLowerCase() === "cancelled" ? "bg-red-100 text-red-800" :
                          "bg-slate-100 text-slate-800"
                        }`}>{r.status}</span>
                      </td>
                      <td className="py-4 px-4">
                        {r.pickup_code != null || r.release_code != null ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-sm tabular-nums">
                            <span className="px-2 py-0.5 rounded bg-[#1E293B]/10 text-[#1E293B] font-semibold" title="Start rental">{r.pickup_code ?? "—"}</span>
                            <span className="text-slate-300">/</span>
                            <span className="px-2 py-0.5 rounded bg-[#1E293B]/10 text-[#1E293B] font-semibold" title="End rental">{r.release_code ?? "—"}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {(r.status || "").toLowerCase() === "active" && (r.pickup_code != null || r.release_code != null) ? (
                          <button
                            type="button"
                            onClick={() => handleRefreshCodes(r.id)}
                            disabled={refreshingCodeId === r.id}
                            className="px-2 py-1 text-xs font-semibold text-[#1E293B] border border-[#1E293B]/30 rounded-lg hover:bg-[#1E293B]/10 disabled:opacity-50"
                          >
                            {refreshingCodeId === r.id ? "…" : "Generate New Code"}
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && !loading && (
                    <tr><td colSpan={6} className="py-10 px-4 text-center text-slate-500">{reservations.length === 0 ? "No reservations yet" : "No reservations match the filters"}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            </>
            )}
          </section>
        )}

        {section === "myReservations" && (
          <section className="w-full min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-slate-800">My Reservations</h2>
              {dataSourceConfig?.reservations != null && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  Source: {getProviderLabelWithTable(dataSourceConfig.reservations, dataSourceConfig.reservationsTable)}
                </span>
              )}
              <button
                type="button"
                onClick={() => openReserve()}
                className="px-4 py-2.5 bg-[#3B82F6] text-white font-semibold rounded-xl hover:bg-[#2563EB] shadow-sm transition-colors"
              >
                Reserve a car
              </button>
            </div>
            {dataSourceNotConfigured.reservations ? (
              <DataSourceNotConfiguredEmptyState layerLabel="Reservations" className="min-h-[200px]" />
            ) : (
            <div className="w-full overflow-hidden rounded-xl border border-slate-200/80 shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="py-4 px-4 font-semibold text-slate-700">Car</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Reserved at</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Status</th>
                    <th className="py-4 px-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-slate-800">
                  {myReservations.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4">{r.car?.brand} {r.car?.registrationNumber}</td>
                      <td className="py-4 px-4">{formatDate(r.startDate)}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                          (r.status || "").toLowerCase() === "active" ? "bg-emerald-100 text-emerald-800" :
                          (r.status || "").toLowerCase() === "completed" ? "bg-[#3B82F6]/10 text-[#2563EB]" :
                          "bg-red-100 text-red-800"
                        }`}>{r.status}</span>
                      </td>
                      <td className="py-4 px-4 flex gap-2">
                        {(r.status || "").toLowerCase() === "active" && (
                          <>
                            <button
                              type="button"
                              onClick={() => openReleaseModal(r)}
                              className="px-3 py-1.5 bg-[#3B82F6] text-white text-sm font-semibold rounded-xl hover:bg-[#2563EB] shadow-sm transition-colors"
                            >
                              Release
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelReservation(r.id)}
                              className="px-3 py-1.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 shadow-sm transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {myReservations.length === 0 && !loading && (
                    <tr><td colSpan={4} className="py-10 px-4 text-center text-slate-500">No reservations. Reserve a car above.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            )}
          </section>
        )}

        {section === "aiVerification" && (() => {
          const aiUsers = users.filter((m) => m.drivingLicenceVerifiedBy === "AI");
          const aiApproved = aiUsers.filter((m) => m.drivingLicenceStatus === "APPROVED");
          const aiRejected = aiUsers.filter((m) => m.drivingLicenceStatus === "REJECTED");
          return (
          <section className="w-full min-w-0">
            <div className="mb-8 p-5 sm:p-6 rounded-xl bg-[#1E293B] text-white border border-slate-600/50 shadow-sm">
              <h2 className="text-xl font-bold text-white mb-1">AI Verification</h2>
              <p className="text-sm text-slate-300">
                Driving licences verified by the Gemini AI. Admin can override any AI decision.
              </p>
              <div className="flex gap-4 mt-3">
                <span className="px-3 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 text-sm font-semibold">{aiApproved.length} Approved</span>
                <span className="px-3 py-1 rounded-lg bg-red-600/20 text-red-300 text-sm font-semibold">{aiRejected.length} Rejected</span>
                <span className="px-3 py-1 rounded-lg bg-slate-600/30 text-slate-300 text-sm font-semibold">{aiUsers.length} Total</span>
              </div>
            </div>
            {aiUsers.length === 0 ? (
              <div className="p-6 rounded-xl border border-slate-200/80 bg-white shadow-sm">
                <p className="text-slate-500">No driving licences have been verified by AI yet. When a user uploads a licence and clicks Save, the AI will automatically verify it.</p>
              </div>
            ) : (
              <div className="w-full bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="py-4 px-4 font-semibold text-slate-700">User</th>
                      <th className="py-4 px-4 font-semibold text-slate-700">Email</th>
                      <th className="py-4 px-4 font-semibold text-slate-700">AI Decision</th>
                      <th className="py-4 px-4 font-semibold text-slate-700">Photo</th>
                      <th className="py-4 px-4 font-semibold text-slate-700">Admin Override</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-800">
                    {aiUsers.map((m) => (
                      <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4 font-medium">{m.name}</td>
                        <td className="py-4 px-4 text-slate-600">{m.email}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                            m.drivingLicenceStatus === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                            m.drivingLicenceStatus === "REJECTED" ? "bg-red-100 text-red-800" :
                            "bg-amber-100 text-amber-800"
                          }`}>
                            {m.drivingLicenceStatus === "APPROVED" ? "Approved by AI" : m.drivingLicenceStatus === "REJECTED" ? "Rejected by AI" : "Pending"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {m.drivingLicenceUrl ? (
                            <button type="button" onClick={() => setDlImageModal(m.drivingLicenceUrl)} className="px-3 py-1.5 text-xs font-semibold text-white bg-[#3B82F6] rounded-lg hover:bg-[#2563EB] transition-colors shadow-sm">
                              View Photo
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">No photo</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex gap-1">
                            {m.drivingLicenceStatus !== "APPROVED" && (
                              <button type="button" onClick={() => handleDlStatus(m.userId, "APPROVED")} className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Approve</button>
                            )}
                            {m.drivingLicenceStatus !== "REJECTED" && (
                              <button type="button" onClick={() => handleDlStatus(m.userId, "REJECTED")} className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Reject</button>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          );
        })()}

        {section === "databaseSettings" && (
          <section className="w-full min-w-0">
            <DatabaseSettingsSection />
          </section>
        )}

        {loading && <p className="text-slate-500">Loading…</p>}
        </main>
      </div>

      {/* Release car – new km (odometer) + reason if exceeded */}
      {releaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Release car</h3>
            <p className="text-sm text-slate-500 mb-4">
              {releaseModal.car?.brand} {releaseModal.car?.registrationNumber}
              {releaseCurrentKm != null && (
                <span className="block mt-1">Current odometer when reserved: {releaseCurrentKm} km</span>
              )}
            </p>
            <form onSubmit={submitRelease} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">New km (odometer reading)</label>
                <input
                  type="number"
                  min={releaseCurrentKm}
                  value={releaseNewKm}
                  onChange={(e) => setReleaseNewKm(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 bg-white focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                  placeholder={String(releaseCurrentKm)}
                  required
                />
                {releaseKmUsed != null && releaseKmUsed >= 0 && (
                  <p className="text-xs text-slate-500 mt-1">Km used: {releaseKmUsed} km {defaultKm != null && releaseKmUsed > defaultKm && "(exceeds company limit of " + defaultKm + " km)"}</p>
                )}
              </div>
              {releaseExceedsLimit && (
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Reason for exceeding company limit (required)</label>
                  <textarea
                    value={releaseExceededReason}
                    onChange={(e) => setReleaseExceededReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 bg-white focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                    placeholder="Why did you exceed the allowed km?"
                    rows={3}
                    required
                  />
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setReleaseModal(null)} className="px-4 py-2 bg-slate-100 text-slate-800 font-semibold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" disabled={releaseSubmitting} className="px-4 py-2 bg-[#3B82F6] text-white font-semibold rounded-xl hover:bg-[#2563EB] disabled:opacity-50 shadow-sm transition-colors">{releaseSubmitting ? "Releasing…" : "Release"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Driving licence image modal */}
      {dlImageModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setDlImageModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto p-4 border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-slate-800">Driving licence</h3>
              <button type="button" onClick={() => setDlImageModal(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors" aria-label="Close">✕</button>
            </div>
            <img src={dlImageModal} alt="Driving licence" className="w-full h-auto rounded-xl border border-slate-200" />
          </div>
        </div>
      )}

      {/* Reserve car modal */}
      {showReserveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-slate-800">Reserve a car</h3>
              <button type="button" onClick={() => { setShowReserveModal(false); setReserveCar(null); }} className="text-2xl text-slate-500 hover:text-slate-800 transition-colors">&times;</button>
            </div>
            <form onSubmit={handleReserve} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Car</label>
                {reserveCar ? (
                  <p className="py-2 text-slate-800">{reserveCar.brand} {reserveCar.registrationNumber}</p>
                ) : (
                  <select
                    value={reserveCarId}
                    onChange={(e) => setReserveCarId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 bg-white focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                    required
                  >
                    <option value="">Select car</option>
                    {availableCars.map((c) => (
                      <option key={c.id} value={c.id}>{c.brand} {c.registrationNumber}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Purpose (optional)</label>
                <input type="text" value={reservePurpose} onChange={(e) => setReservePurpose(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 bg-white focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none" placeholder="e.g. Client visit" />
              </div>
              <p className="text-xs text-slate-500">The car will be reserved instantly until you release it.</p>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => { setShowReserveModal(false); setReserveCar(null); }} className="px-4 py-2 bg-slate-100 text-slate-800 font-semibold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-[#3B82F6] text-white font-semibold rounded-xl hover:bg-[#2563EB] disabled:opacity-50 shadow-sm transition-colors">{submitting ? "Reserving…" : "Reserve"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User modal – create user directly (Local DB or SQL Server) */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-slate-800">Add User</h3>
              <button type="button" onClick={() => setShowAddUser(false)} className="text-2xl text-slate-500 hover:text-slate-800 transition-colors">&times;</button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Create a new user. They will appear in the list. For Local DB a default password is used if left empty.</p>
            {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                  placeholder="user@company.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Password (optional)</label>
                <input
                  type="password"
                  value={addUserPassword}
                  onChange={(e) => setAddUserPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
                  placeholder="Min 6 characters; empty = default for Local"
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Role</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none">
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowAddUser(false)} className="px-4 py-2 bg-slate-100 text-slate-800 font-semibold rounded-xl hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-[#3B82F6] text-white font-semibold rounded-xl hover:bg-[#2563EB] disabled:opacity-50 shadow-sm transition-colors">
                  {submitting ? "Creating…" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
