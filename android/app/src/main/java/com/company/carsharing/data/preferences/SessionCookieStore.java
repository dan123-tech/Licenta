package com.company.carsharing.data.preferences;

import androidx.annotation.Nullable;

/**
 * Abstraction for session cookie storage (used by OkHttp interceptor).
 * Implemented by SecureSessionPreferences.
 */
public interface SessionCookieStore {
    @Nullable
    String getSessionCookieValue();

    /** Cookie name from the last Set-Cookie (e.g. {@code car_sharing_session} or {@code __Host-car_sharing_session}). */
    @Nullable
    String getSessionCookieName();

    void setSessionCookie(String cookieName, String cookieValue);
}
