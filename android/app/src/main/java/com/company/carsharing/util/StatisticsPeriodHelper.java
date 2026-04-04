package com.company.carsharing.util;

import com.company.carsharing.models.Car;
import com.company.carsharing.models.Company;
import com.company.carsharing.models.Member;
import com.company.carsharing.models.Reservation;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

/**
 * Time-windowed statistics aligned with web {@code statistics-period.js}.
 */
public final class StatisticsPeriodHelper {

    public static final String PERIOD_7D = "7d";
    public static final String PERIOD_30D = "30d";
    public static final String PERIOD_6M = "6m";
    public static final String PERIOD_1Y = "1y";

    private StatisticsPeriodHelper() {}

    public static final class Window {
        public final long start;
        public final long end;
        /** "day" or "month" trend buckets */
        public final String bucket;

        public Window(long start, long end, String bucket) {
            this.start = start;
            this.end = end;
            this.bucket = bucket;
        }
    }

    public static Window periodWindow(String period) {
        long end = System.currentTimeMillis();
        Calendar now = Calendar.getInstance();
        if (PERIOD_7D.equals(period)) {
            return new Window(end - 7L * 86400000L, end, "day");
        }
        if (PERIOD_30D.equals(period)) {
            return new Window(end - 30L * 86400000L, end, "day");
        }
        if (PERIOD_6M.equals(period)) {
            Calendar s = (Calendar) now.clone();
            s.add(Calendar.MONTH, -6);
            s.set(Calendar.HOUR_OF_DAY, 0);
            s.set(Calendar.MINUTE, 0);
            s.set(Calendar.SECOND, 0);
            s.set(Calendar.MILLISECOND, 0);
            return new Window(s.getTimeInMillis(), end, "month");
        }
        if (PERIOD_1Y.equals(period)) {
            Calendar s = (Calendar) now.clone();
            s.add(Calendar.YEAR, -1);
            s.set(Calendar.HOUR_OF_DAY, 0);
            s.set(Calendar.MINUTE, 0);
            s.set(Calendar.SECOND, 0);
            s.set(Calendar.MILLISECOND, 0);
            return new Window(s.getTimeInMillis(), end, "month");
        }
        return new Window(end - 30L * 86400000L, end, "day");
    }

    private static long startOfDay(long ms) {
        Calendar x = Calendar.getInstance();
        x.setTimeInMillis(ms);
        x.set(Calendar.HOUR_OF_DAY, 0);
        x.set(Calendar.MINUTE, 0);
        x.set(Calendar.SECOND, 0);
        x.set(Calendar.MILLISECOND, 0);
        return x.getTimeInMillis();
    }

    private static long startOfMonth(long ms) {
        Calendar x = Calendar.getInstance();
        x.setTimeInMillis(ms);
        x.set(Calendar.DAY_OF_MONTH, 1);
        x.set(Calendar.HOUR_OF_DAY, 0);
        x.set(Calendar.MINUTE, 0);
        x.set(Calendar.SECOND, 0);
        x.set(Calendar.MILLISECOND, 0);
        return x.getTimeInMillis();
    }

    public static final class TrendBucket {
        public final long key;
        public final String label;
        public double fuelCost;
        public double km;
        public double co2Kg;

        public TrendBucket(long key, String label) {
            this.key = key;
            this.label = label;
        }
    }

    private static List<TrendBucket> buildTrendBuckets(long startMs, long endMs, String bucket, Locale locale) {
        Locale loc = locale != null ? locale : Locale.getDefault();
        if ("day".equals(bucket)) {
            List<TrendBucket> out = new ArrayList<>();
            long t = startOfDay(startMs);
            long endDay = startOfDay(endMs);
            SimpleDateFormat dayFmt = new SimpleDateFormat("yyyy-MM-dd", loc);
            while (t <= endDay) {
                out.add(new TrendBucket(t, dayFmt.format(t)));
                t += 86400000L;
            }
            return out;
        }
        List<Long> keys = new ArrayList<>();
        Calendar d = Calendar.getInstance();
        d.setTimeInMillis(startMs);
        d.set(Calendar.DAY_OF_MONTH, 1);
        d.set(Calendar.HOUR_OF_DAY, 0);
        d.set(Calendar.MINUTE, 0);
        d.set(Calendar.SECOND, 0);
        d.set(Calendar.MILLISECOND, 0);
        Calendar endDate = Calendar.getInstance();
        endDate.setTimeInMillis(endMs);
        SimpleDateFormat monthFmt = new SimpleDateFormat("MMM yyyy", loc);
        while (!d.after(endDate)) {
            long k = startOfMonth(d.getTimeInMillis());
            if (!keys.contains(k)) keys.add(k);
            d.add(Calendar.MONTH, 1);
        }
        Collections.sort(keys);
        List<TrendBucket> out = new ArrayList<>();
        for (Long k : keys) {
            out.add(new TrendBucket(k, monthFmt.format(k)));
        }
        return out;
    }

    private static boolean completedInWindow(Reservation r, long start, long end) {
        if (r == null || r.getStatus() == null) return false;
        if (!"completed".equalsIgnoreCase(r.getStatus().trim())) return false;
        String u = r.getUpdatedAt();
        if (u == null || u.isEmpty()) return false;
        long t = DateParseUtil.parseIsoToMillis(u);
        return t >= start && t <= end;
    }

    private static boolean startedInWindow(Reservation r, long start, long end) {
        if (r == null || r.getStartDate() == null || r.getStartDate().isEmpty()) return false;
        long t = DateParseUtil.parseIsoToMillis(r.getStartDate());
        if (t < 0) return false;
        return t >= start && t <= end;
    }

    public static final class CostLeaderRow {
        public final Car car;
        public final double cost;

        public CostLeaderRow(Car car, double cost) {
            this.car = car;
            this.cost = cost;
        }
    }

    public static final class UserCountRow {
        public final String userId;
        public final String name;
        public final String email;
        public final int count;

        public UserCountRow(String userId, String name, String email, int count) {
            this.userId = userId;
            this.name = name;
            this.email = email;
            this.count = count;
        }
    }

    public static final class CarUsageRow {
        public final String carId;
        public final String brandModel;
        public final String plate;
        public final long km;
        public final int reservationsStartedInWindow;
        public final Car car;

        public CarUsageRow(String carId, String brandModel, String plate, long km, int res, Car car) {
            this.carId = carId;
            this.brandModel = brandModel;
            this.plate = plate;
            this.km = km;
            this.reservationsStartedInWindow = res;
            this.car = car;
        }
    }

    public static final class PeriodStats {
        public int activeCount;
        public long totalKmPeriod;
        public double fuelCostPeriod;
        public double co2KgPeriod;
        public final List<CostLeaderRow> costLeaderboard = new ArrayList<>();
        public final List<UserCountRow> topUsers = new ArrayList<>();
        public final List<CarUsageRow> carUsage = new ArrayList<>();
        public final List<TrendBucket> co2Trend = new ArrayList<>();
        public String periodKey = PERIOD_30D;
    }

    private static String carBrandModel(Car c) {
        if (c == null) return "—";
        String m = c.getModel() != null ? c.getModel() : "";
        String b = c.getBrand() != null ? c.getBrand() : "";
        String t = (b + " " + m).trim();
        return t.isEmpty() ? "—" : t;
    }

    /** For PDF / share lines */
    public static String formatCarTitle(Car c) {
        return carBrandModel(c);
    }

    public static PeriodStats compute(
            String period,
            List<Reservation> reservations,
            List<Car> cars,
            List<Member> members,
            Company company,
            double defaultL100,
            double defaultKwh100,
            Locale locale) {
        PeriodStats out = new PeriodStats();
        out.periodKey = period != null ? period : PERIOD_30D;
        Window w = periodWindow(out.periodKey);
        List<Reservation> res = reservations != null ? reservations : Collections.emptyList();
        List<Car> carList = cars != null ? cars : Collections.emptyList();

        Map<String, Car> carMap = new HashMap<>();
        for (Car c : carList) {
            if (c.getId() != null) carMap.put(c.getId(), c);
        }

        int active = 0;
        for (Reservation r : res) {
            if (r.getStatus() != null && "active".equalsIgnoreCase(r.getStatus().trim())) active++;
        }
        out.activeCount = active;

        List<Reservation> completedInRange = new ArrayList<>();
        for (Reservation r : res) {
            if (completedInWindow(r, w.start, w.end)) completedInRange.add(r);
        }

        long totalKm = 0;
        double fuel = 0;
        double co2 = 0;
        for (Reservation r : completedInRange) {
            int km = r.getReleasedKmUsed() != null ? r.getReleasedKmUsed() : 0;
            totalKm += km;
            String carId = r.getCarId() != null ? r.getCarId() : (r.getCar() != null ? r.getCar().getId() : null);
            Car tripCar = carId != null ? carMap.get(carId) : null;
            if (km > 0 && tripCar != null) {
                fuel += FuelCostCalculator.estimatedCostForKm(company, tripCar, km, defaultL100, defaultKwh100);
                co2 += FuelCostCalculator.co2KgForKm(tripCar, km, defaultL100, defaultKwh100);
            }
        }
        out.totalKmPeriod = totalKm;
        out.fuelCostPeriod = fuel;
        out.co2KgPeriod = co2;

        Map<String, Double> byCarFuelCost = new HashMap<>();
        for (Reservation r : completedInRange) {
            String cid = r.getCarId() != null ? r.getCarId() : (r.getCar() != null ? r.getCar().getId() : null);
            if (cid == null) continue;
            int km = r.getReleasedKmUsed() != null ? r.getReleasedKmUsed() : 0;
            Car cTrip = carMap.get(cid);
            double cost = (km > 0 && cTrip != null)
                    ? FuelCostCalculator.estimatedCostForKm(company, cTrip, km, defaultL100, defaultKwh100)
                    : 0;
            byCarFuelCost.put(cid, (byCarFuelCost.containsKey(cid) ? byCarFuelCost.get(cid) : 0) + cost);
        }
        List<CostLeaderRow> leaders = new ArrayList<>();
        for (Car c : carList) {
            if (c.getId() == null) continue;
            double cost = byCarFuelCost.containsKey(c.getId()) ? byCarFuelCost.get(c.getId()) : 0;
            leaders.add(new CostLeaderRow(c, cost));
        }
        leaders.sort((a, b) -> Double.compare(b.cost, a.cost));
        out.costLeaderboard.addAll(leaders);

        Map<String, Integer> byUser = new HashMap<>();
        for (Reservation r : res) {
            if (!startedInWindow(r, w.start, w.end)) continue;
            String uid = r.getUserId() != null ? r.getUserId() : (r.getUser() != null ? r.getUser().getId() : null);
            if (uid == null) continue;
            byUser.put(uid, byUser.getOrDefault(uid, 0) + 1);
        }
        List<Map.Entry<String, Integer>> userEntries = new ArrayList<>(byUser.entrySet());
        userEntries.sort((a, b) -> Integer.compare(b.getValue(), a.getValue()));
        Map<String, Member> memberByUserId = new HashMap<>();
        if (members != null) {
            for (Member m : members) {
                if (m.getUserId() != null) memberByUserId.put(m.getUserId(), m);
                if (m.getId() != null) memberByUserId.putIfAbsent(m.getId(), m);
            }
        }
        int limit = Math.min(10, userEntries.size());
        for (int i = 0; i < limit; i++) {
            Map.Entry<String, Integer> e = userEntries.get(i);
            Member mem = memberByUserId.get(e.getKey());
            String name = mem != null && mem.getName() != null ? mem.getName() : "—";
            String email = mem != null && mem.getEmail() != null ? mem.getEmail() : "";
            out.topUsers.add(new UserCountRow(e.getKey(), name, email, e.getValue()));
        }

        Map<String, Long> byCarKm = new HashMap<>();
        for (Reservation r : completedInRange) {
            String cid = r.getCarId() != null ? r.getCarId() : (r.getCar() != null ? r.getCar().getId() : null);
            if (cid == null) continue;
            int km = r.getReleasedKmUsed() != null ? r.getReleasedKmUsed() : 0;
            byCarKm.put(cid, byCarKm.getOrDefault(cid, 0L) + km);
        }
        List<CarUsageRow> usageRows = new ArrayList<>();
        for (Car c : carList) {
            if (c.getId() == null) continue;
            long km = byCarKm.getOrDefault(c.getId(), 0L);
            int resCount = 0;
            for (Reservation r : res) {
                if (!startedInWindow(r, w.start, w.end)) continue;
                String cid = r.getCarId() != null ? r.getCarId() : (r.getCar() != null ? r.getCar().getId() : null);
                if (c.getId().equals(cid)) resCount++;
            }
            String plate = c.getRegistrationNumber() != null ? c.getRegistrationNumber() : "—";
            usageRows.add(new CarUsageRow(c.getId(), carBrandModel(c), plate, km, resCount, c));
        }
        usageRows.sort(Comparator.comparingLong((CarUsageRow x) -> x.km).reversed());
        out.carUsage.addAll(usageRows);

        List<TrendBucket> buckets = buildTrendBuckets(w.start, w.end, w.bucket, locale);
        Map<Long, TrendBucket> byKey = new HashMap<>();
        for (TrendBucket b : buckets) byKey.put(b.key, b);
        for (Reservation r : completedInRange) {
            String u = r.getUpdatedAt();
            if (u == null) continue;
            long tt = DateParseUtil.parseIsoToMillis(u);
            if (tt < 0) continue;
            long key = "day".equals(w.bucket) ? startOfDay(tt) : startOfMonth(tt);
            TrendBucket bucket = byKey.get(key);
            if (bucket == null) continue;
            int km = r.getReleasedKmUsed() != null ? r.getReleasedKmUsed() : 0;
            String carId = r.getCarId() != null ? r.getCarId() : (r.getCar() != null ? r.getCar().getId() : null);
            Car tripCar = carId != null ? carMap.get(carId) : null;
            bucket.km += km;
            if (km > 0 && tripCar != null) {
                bucket.fuelCost += FuelCostCalculator.estimatedCostForKm(company, tripCar, km, defaultL100, defaultKwh100);
                bucket.co2Kg += FuelCostCalculator.co2KgForKm(tripCar, km, defaultL100, defaultKwh100);
            }
        }
        for (TrendBucket b : buckets) {
            b.co2Kg = Math.round(b.co2Kg * 100.0) / 100.0;
        }
        out.co2Trend.addAll(buckets);

        return out;
    }
}
