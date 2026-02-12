package com.company.carsharing.data.preferences;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;

import androidx.annotation.Nullable;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import com.company.carsharing.models.User;
import com.google.gson.Gson;

import java.io.IOException;
import java.security.GeneralSecurityException;

/**
 * Session storage using EncryptedSharedPreferences (API 23+).
 * Falls back to regular SharedPreferences on older devices.
 */
public class SecureSessionPreferences implements SessionCookieStore {

    private static final String PREFS_NAME = "car_sharing_secure_session";
    private static final String KEY_SESSION_COOKIE = "session_cookie";
    private static final String KEY_USER_JSON = "user_json";
    private static final String KEY_IS_LOGGED_IN = "is_logged_in";
    private static final String KEY_REMEMBER_ME = "remember_me";
    private static final String KEY_SAVED_EMAIL = "saved_email";
    private static final String KEY_SAVED_PASSWORD = "saved_password";
    private static final String KEY_BIOMETRIC_ENABLED = "biometric_enabled";

    private final SharedPreferences prefs;
    private final Gson gson = new Gson();

    public SecureSessionPreferences(Context context) {
        this.prefs = buildPrefs(context.getApplicationContext());
    }

    private SharedPreferences buildPrefs(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                MasterKey masterKey = new MasterKey.Builder(context)
                        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                        .build();
                return EncryptedSharedPreferences.create(
                        context,
                        PREFS_NAME,
                        masterKey,
                        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
                );
            } catch (GeneralSecurityException | IOException e) {
                // fallback to non-encrypted
            }
        }
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
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

    /** Save email/password for auto-login when "Keep me logged in" is checked. */
    public void saveCredentials(String email, String password) {
        if (email == null) email = "";
        if (password == null) password = "";
        prefs.edit()
                .putString(KEY_SAVED_EMAIL, email)
                .putString(KEY_SAVED_PASSWORD, password)
                .apply();
    }

    /** Clear saved credentials (e.g. on logout or when unchecking "Keep me logged in"). */
    public void clearSavedCredentials() {
        prefs.edit()
                .remove(KEY_SAVED_EMAIL)
                .remove(KEY_SAVED_PASSWORD)
                .apply();
    }

    @Nullable
    public String getSavedEmail() {
        return prefs.getString(KEY_SAVED_EMAIL, null);
    }

    @Nullable
    public String getSavedPassword() {
        return prefs.getString(KEY_SAVED_PASSWORD, null);
    }

    public boolean hasSavedCredentials() {
        String e = getSavedEmail();
        String p = getSavedPassword();
        return e != null && !e.isEmpty() && p != null && !p.isEmpty();
    }

    public void setBiometricEnabled(boolean enabled) {
        prefs.edit().putBoolean(KEY_BIOMETRIC_ENABLED, enabled).apply();
    }

    public boolean getBiometricEnabled() {
        return prefs.getBoolean(KEY_BIOMETRIC_ENABLED, false);
    }

    /** When true, keep user logged in after app exit. When false, require login on next app launch. */
    public void setRememberMe(boolean remember) {
        prefs.edit().putBoolean(KEY_REMEMBER_ME, remember).apply();
    }

    public boolean getRememberMe() {
        return prefs.getBoolean(KEY_REMEMBER_ME, true);
    }
}
