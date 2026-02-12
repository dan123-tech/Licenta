package com.company.carsharing.data.preferences;

import androidx.annotation.Nullable;

/**
 * Abstraction for session cookie storage (used by OkHttp interceptor).
 * Implemented by SecureSessionPreferences.
 */
public interface SessionCookieStore {
    @Nullable
    String getSessionCookie();
    void setSessionCookie(String cookieValue);
}
