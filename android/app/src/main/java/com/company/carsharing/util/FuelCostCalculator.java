package com.company.carsharing.util;

import com.company.carsharing.models.Car;
import com.company.carsharing.models.Company;

/**
 * Mirrors web StatisticsDashboard fuel/electricity cost logic.
 */
public final class FuelCostCalculator {

    private FuelCostCalculator() {}

    public static double estimatedCostForKm(Company company, Car car, int km, double defaultL100, double defaultKwh100) {
        if (km <= 0 || company == null || car == null) return 0;
        double avg = company.getAverageFuelPricePerLiter() != null ? company.getAverageFuelPricePerLiter() : 0;
        double pb = company.getPriceBenzinePerLiter() != null ? company.getPriceBenzinePerLiter() : avg;
        double pd = company.getPriceDieselPerLiter() != null ? company.getPriceDieselPerLiter() : avg;
        double ph = company.getPriceHybridPerLiter() != null ? company.getPriceHybridPerLiter() : 0;
        double pkwh = company.getPriceElectricityPerKwh() != null ? company.getPriceElectricityPerKwh() : 0;
        double l100 = car.getAverageConsumptionL100km() != null ? car.getAverageConsumptionL100km() : defaultL100;
        double kwh100 = car.getAverageConsumptionKwh100km() != null ? car.getAverageConsumptionKwh100km() : defaultKwh100;
        String ft = car.getFuelType() != null ? car.getFuelType() : "Benzine";
        if ("Electric".equals(ft)) {
            return (km / 100.0) * kwh100 * pkwh;
        }
        if ("Hybrid".equals(ft)) {
            double literPrice = ph > 0 ? ph : (pb > 0 ? pb : pd);
            return (km / 100.0) * l100 * literPrice + (km / 100.0) * kwh100 * pkwh;
        }
        if ("Diesel".equals(ft)) {
            return (km / 100.0) * l100 * pd;
        }
        return (km / 100.0) * l100 * pb;
    }

    public static boolean hasAnyUnitPrice(Company company) {
        if (company == null) return false;
        double avg = company.getAverageFuelPricePerLiter() != null ? company.getAverageFuelPricePerLiter() : 0;
        if (avg > 0) return true;
        if (company.getPriceBenzinePerLiter() != null && company.getPriceBenzinePerLiter() > 0) return true;
        if (company.getPriceDieselPerLiter() != null && company.getPriceDieselPerLiter() > 0) return true;
        if (company.getPriceHybridPerLiter() != null && company.getPriceHybridPerLiter() > 0) return true;
        return company.getPriceElectricityPerKwh() != null && company.getPriceElectricityPerKwh() > 0;
    }

    /** Mirrors web StatisticsDashboard CO₂ factors (Hybrid uses benzine factor). */
    private static final double CO2_KG_PER_L_BENZINE = 2.31;
    private static final double CO2_KG_PER_L_DIESEL = 2.68;
    private static final double CO2_ELECTRIC_KG_PER_KWH = 0.2;

    public static double co2KgForKm(Car car, int km, double defaultL100, double defaultKwh100) {
        if (km <= 0 || car == null) return 0;
        double l100 = car.getAverageConsumptionL100km() != null ? car.getAverageConsumptionL100km() : defaultL100;
        double kwh100 = car.getAverageConsumptionKwh100km() != null ? car.getAverageConsumptionKwh100km() : defaultKwh100;
        String ft = car.getFuelType() != null ? car.getFuelType() : "Benzine";
        if ("Electric".equals(ft)) {
            return (km / 100.0) * kwh100 * CO2_ELECTRIC_KG_PER_KWH;
        }
        if ("Diesel".equals(ft)) {
            return (km / 100.0) * l100 * CO2_KG_PER_L_DIESEL;
        }
        return (km / 100.0) * l100 * CO2_KG_PER_L_BENZINE;
    }
}
