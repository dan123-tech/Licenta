package com.company.carsharing.data.preferences;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.annotation.Nullable;

import com.company.carsharing.models.User;
import com.google.gson.Gson;

/**
 * Securely stores session cookie and user info for session management.
 * Uses SharedPreferences (consider EncryptedSharedPreferences for production).
 */
public class SessionPreferences {

    private static final String PREFS_NAME = "car_sharing_session";
    private static final String KEY_SESSION_COOKIE = "session_cookie";
    private static final String KEY_USER_JSON = "user_json";
    private static final String KEY_IS_LOGGED_IN = "is_logged_in";

    private final SharedPreferences prefs;
    private final Gson gson = new Gson();

    public SessionPreferences(Context context) {
        this.prefs = context.getApplicationContext()
                .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public void setSessionCookie(String cookieValue) {
        prefs.edit()
                .putString(KEY_SESSION_COOKIE, cookieValue)
                .putBoolean(KEY_IS_LOGGED_IN, true)
                .apply();
    }

    @Nullable
    public String getSessionCookie() {
        return prefs.getString(KEY_SESSION_COOKIE, null);
    }

    public void saveUser(User user) {
        if (user == null) {
            prefs.edit().remove(KEY_USER_JSON).apply();
            return;
        }
        prefs.edit().putString(KEY_USER_JSON, gson.toJson(user)).apply();
    }

    @Nullable
    public User getUser() {
        String json = prefs.getString(KEY_USER_JSON, null);
        if (json == null) return null;
        try {
            return gson.fromJson(json, User.class);
        } catch (Exception e) {
            return null;
        }
    }

    public boolean isLoggedIn() {
        return prefs.getBoolean(KEY_IS_LOGGED_IN, false) && getSessionCookie() != null;
    }

    public void clearSession() {
        prefs.edit()
                .remove(KEY_SESSION_COOKIE)
                .remove(KEY_USER_JSON)
                .putBoolean(KEY_IS_LOGGED_IN, false)
                .apply();
    }
}
