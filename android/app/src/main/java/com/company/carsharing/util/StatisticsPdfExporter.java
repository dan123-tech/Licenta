package com.company.carsharing.util;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.pdf.PdfDocument;
import android.os.Build;

import com.company.carsharing.R;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Locale;

/**
 * Minimal text PDF export for statistics (matches web “download report” intent).
 */
public final class StatisticsPdfExporter {

    private static final int PAGE_W = 595;
    private static final int PAGE_H = 842;
    private static final int MARGIN = 48;
    private static final int LINE = 14;

    private StatisticsPdfExporter() {}

    public static File export(
            Context ctx,
            StatisticsPeriodHelper.PeriodStats s,
            String periodLabel,
            boolean hasFuelPrices,
            Locale locale) throws IOException {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.KITKAT) {
            throw new IOException("PDF export requires API 19+");
        }
        Locale loc = locale != null ? locale : Locale.getDefault();
        PdfDocument document = new PdfDocument();
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        PdfDocument.Page page = document.startPage(new PdfDocument.PageInfo.Builder(PAGE_W, PAGE_H, 1).create());
        Canvas canvas = page.getCanvas();
        int y = MARGIN;

        y = drawTitle(canvas, paint, y, ctx.getString(R.string.pdf_report_header_fmt, periodLabel));
        y += 6;
        y = drawBody(canvas, paint, y, ctx.getString(R.string.pdf_active_reservations, s.activeCount));
        y = drawBody(canvas, paint, y, ctx.getString(R.string.pdf_trip_km, s.totalKmPeriod));
        String fuelStr = hasFuelPrices ? String.format(loc, "%.2f", s.fuelCostPeriod) : ctx.getString(R.string.pdf_not_available);
        y = drawBody(canvas, paint, y, ctx.getString(R.string.pdf_est_fuel, fuelStr));
        y = drawBody(canvas, paint, y, ctx.getString(R.string.pdf_co2_line, String.format(loc, "%.1f kg", s.co2KgPeriod)));
        y += 8;
        y = drawBody(canvas, paint, y, ctx.getString(R.string.pdf_cost_leaderboard_header));
        for (int i = 0; i < s.costLeaderboard.size() && i < 15; i++) {
            StatisticsPeriodHelper.CostLeaderRow row = s.costLeaderboard.get(i);
            String plate = row.car.getRegistrationNumber() != null ? row.car.getRegistrationNumber() : "";
            String line = (i + 1) + ". " + StatisticsPeriodHelper.formatCarTitle(row.car) + " | " + plate
                    + " | " + String.format(loc, "%.2f", row.cost);
            y = drawBody(canvas, paint, y, line);
        }
        y += 6;
        y = drawBody(canvas, paint, y, ctx.getString(R.string.pdf_top_users_header));
        for (int i = 0; i < s.topUsers.size(); i++) {
            StatisticsPeriodHelper.UserCountRow u = s.topUsers.get(i);
            y = drawBody(canvas, paint, y, (i + 1) + ". " + u.name + " — " + u.count);
        }

        document.finishPage(page);
        File out = new File(ctx.getCacheDir(), "statistics-" + s.periodKey + "-" + System.currentTimeMillis() + ".pdf");
        try (FileOutputStream fos = new FileOutputStream(out)) {
            document.writeTo(fos);
        }
        document.close();
        return out;
    }

    private static int drawTitle(Canvas canvas, Paint paint, int y, String text) {
        paint.setTextSize(16);
        canvas.drawText(trunc(text, 55), MARGIN, y, paint);
        return y + 22;
    }

    private static int drawBody(Canvas canvas, Paint paint, int y, String text) {
        paint.setTextSize(10);
        canvas.drawText(trunc(text, 85), MARGIN, y, paint);
        return y + LINE;
    }

    private static String trunc(String text, int max) {
        if (text == null) return "";
        return text.length() > max ? text.substring(0, max - 1) + "…" : text;
    }
}
