package com.company.carsharing.util;

import android.os.Build;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Parses API ISO-8601 date strings to epoch millis (UTC-aware when possible).
 */
public final class DateParseUtil {

    private DateParseUtil() {}

    public static long parseIsoToMillis(String s) {
        if (s == null || s.trim().isEmpty()) return -1L;
        String t = s.trim();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                if (t.length() >= 19 && t.charAt(10) == 'T' && t.endsWith("Z")) {
                    return Instant.parse(t).toEpochMilli();
                }
                return OffsetDateTime.parse(t).toInstant().toEpochMilli();
            } catch (Exception ignored) {
                // fall through
            }
        }
        String[] patterns = new String[]{
                "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
                "yyyy-MM-dd'T'HH:mm:ssXXX",
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                "yyyy-MM-dd'T'HH:mm:ss'Z'",
                "yyyy-MM-dd'T'HH:mm:ss.SSS",
                "yyyy-MM-dd'T'HH:mm:ss",
        };
        for (String p : patterns) {
            try {
                SimpleDateFormat fmt = new SimpleDateFormat(p, Locale.US);
                if (p.contains("'Z'")) {
                    fmt.setTimeZone(TimeZone.getTimeZone("UTC"));
                }
                return fmt.parse(t).getTime();
            } catch (ParseException ignored) {
            }
        }
        return -1L;
    }

    /**
     * Formats an API ISO-8601 string for UI (local timezone, no "T" / "Z").
     */
    public static String formatIsoForDisplay(String iso, Locale locale) {
        if (iso == null || iso.trim().isEmpty()) return "";
        long ms = parseIsoToMillis(iso);
        if (ms < 0) {
            return iso.trim().replace('T', ' ').replaceAll("\\.\\d+(Z)?$", "").replaceAll("Z$", "").trim();
        }
        Locale loc = locale != null ? locale : Locale.getDefault();
        DateFormat df = DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT, loc);
        return df.format(new Date(ms));
    }
}
