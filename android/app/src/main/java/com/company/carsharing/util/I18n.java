package com.company.carsharing.util;

import android.content.Context;

import com.company.carsharing.R;

import java.util.Locale;

/**
 * Maps API enum values to localized UI labels.
 */
public final class I18n {

    private I18n() {}

    public static String carStatus(Context c, String api) {
        if (api == null) return "";
        switch (api.trim().toUpperCase(Locale.ROOT)) {
            case "AVAILABLE":
                return c.getString(R.string.car_status_available);
            case "RESERVED":
                return c.getString(R.string.car_status_reserved);
            case "IN_MAINTENANCE":
                return c.getString(R.string.car_status_maintenance);
            default:
                return api;
        }
    }

    public static String fuelType(Context c, String api) {
        if (api == null || api.isEmpty()) return c.getString(R.string.em_dash);
        switch (api) {
            case "Diesel":
                return c.getString(R.string.fuel_type_diesel);
            case "Electric":
                return c.getString(R.string.fuel_type_electric);
            case "Hybrid":
                return c.getString(R.string.fuel_type_hybrid);
            case "Benzine":
            default:
                return c.getString(R.string.fuel_type_benzine);
        }
    }

    /** User-visible driving licence review state (session or list). */
    public static String drivingLicenceStatusForDisplay(Context c, String api) {
        if (api == null || api.isEmpty()) return c.getString(R.string.dl_status_not_set);
        switch (api.toUpperCase(Locale.ROOT)) {
            case "PENDING":
                return c.getString(R.string.dl_status_pending_label);
            case "APPROVED":
                return c.getString(R.string.driving_licence_status_approved);
            case "REJECTED":
                return c.getString(R.string.driving_licence_status_rejected);
            default:
                return api;
        }
    }

    public static String reservationStatus(Context c, String api) {
        if (api == null) return "";
        switch (api.trim().toUpperCase(Locale.ROOT)) {
            case "ACTIVE":
                return c.getString(R.string.reservation_status_active);
            case "COMPLETED":
                return c.getString(R.string.reservation_status_completed);
            case "CANCELLED":
            case "CANCELED":
                return c.getString(R.string.reservation_status_cancelled);
            case "PENDING":
                return c.getString(R.string.reservation_status_pending);
            default:
                return api;
        }
    }

    /** @return string resource id for statistics period label */
    public static int periodLabelResId(String period) {
        if (period == null) return R.string.period_30d;
        switch (period) {
            case StatisticsPeriodHelper.PERIOD_7D:
                return R.string.period_7d;
            case StatisticsPeriodHelper.PERIOD_30D:
                return R.string.period_30d;
            case StatisticsPeriodHelper.PERIOD_6M:
                return R.string.period_6m;
            case StatisticsPeriodHelper.PERIOD_1Y:
                return R.string.period_1y;
            default:
                return R.string.period_30d;
        }
    }
}
