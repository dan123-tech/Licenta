package com.company.carsharing.ui;

import android.content.Context;
import android.graphics.drawable.GradientDrawable;
import android.widget.TextView;

import androidx.core.content.ContextCompat;

import com.company.carsharing.R;

/**
 * Shared fuel-type colors (aligned with web {@code src/lib/fuelTheme.js}).
 */
public final class FuelTypeUi {

    private FuelTypeUi() {}

    public static void styleFuelChip(TextView tv, String fuelType) {
        if (tv == null) return;
        Context ctx = tv.getContext();
        String ft = fuelType != null ? fuelType : "Benzine";
        int bg;
        int fg;
        int border;
        switch (ft) {
            case "Diesel":
                bg = R.color.fuel_diesel_bg;
                fg = R.color.fuel_diesel_text;
                border = R.color.fuel_diesel_border;
                break;
            case "Electric":
                bg = R.color.fuel_electric_bg;
                fg = R.color.fuel_electric_text;
                border = R.color.fuel_electric_border;
                break;
            case "Hybrid":
                bg = R.color.fuel_hybrid_bg;
                fg = R.color.fuel_hybrid_text;
                border = R.color.fuel_hybrid_border;
                break;
            case "Benzine":
            default:
                bg = R.color.fuel_benzine_bg;
                fg = R.color.fuel_benzine_text;
                border = R.color.fuel_benzine_border;
                break;
        }
        int labelRes;
        switch (ft) {
            case "Diesel":
                labelRes = R.string.fuel_type_diesel;
                break;
            case "Electric":
                labelRes = R.string.fuel_type_electric;
                break;
            case "Hybrid":
                labelRes = R.string.fuel_type_hybrid;
                break;
            case "Benzine":
            default:
                labelRes = R.string.fuel_type_benzine;
                break;
        }
        tv.setText(ctx.getString(labelRes));
        tv.setTextColor(ContextCompat.getColor(ctx, fg));
        int bpx = (int) (tv.getResources().getDisplayMetrics().density * 1f);
        GradientDrawable d = new GradientDrawable();
        d.setColor(ContextCompat.getColor(ctx, bg));
        d.setCornerRadius(tv.getResources().getDisplayMetrics().density * 6f);
        d.setStroke(bpx, ContextCompat.getColor(ctx, border));
        tv.setBackground(d);
    }
}
