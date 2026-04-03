package com.company.carsharing;

import android.app.Application;

import com.company.carsharing.network.RetrofitClient;

/**
 * Holds API base URL for Retrofit (emulator vs real device on same Wi‑Fi as your PC).
 */
public class CarSharingApplication extends Application {

    private static final String PREFS_API = "api_config";
    private static final String KEY_BASE_URL = "base_url";

    /** Android emulator → host machine. Physical phone: set to http://&lt;PC-LAN-IP&gt;:3000/ */
    public static final String DEFAULT_API_BASE_URL = "http://10.0.2.2:3000/";

    private static CarSharingApplication instance;

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
    }

    public static String getApiBaseUrl() {
        if (instance == null) return DEFAULT_API_BASE_URL;
        String stored = instance.getSharedPreferences(PREFS_API, MODE_PRIVATE).getString(KEY_BASE_URL, null);
        return normalizeBaseUrl(stored != null ? stored : DEFAULT_API_BASE_URL);
    }

    /**
     * Persists URL and drops Retrofit so the next request uses the new host.
     * Accepts e.g. http://192.168.1.10:3000 or 192.168.1.10:3000
     */
    public static void setApiBaseUrl(String url) {
        if (instance == null) return;
        String normalized = normalizeBaseUrl(url);
        instance.getSharedPreferences(PREFS_API, MODE_PRIVATE).edit().putString(KEY_BASE_URL, normalized).apply();
        RetrofitClient.reset();
    }

    public static String normalizeBaseUrl(String url) {
        if (url == null) return DEFAULT_API_BASE_URL;
        String t = url.trim();
        if (t.isEmpty()) return DEFAULT_API_BASE_URL;
        if (!t.startsWith("http://") && !t.startsWith("https://")) {
            t = "http://" + t;
        }
        if (!t.endsWith("/")) {
            t += "/";
        }
        return t;
    }
}
