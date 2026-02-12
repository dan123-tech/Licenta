package com.company.carsharing.network;

import androidx.annotation.NonNull;

import com.company.carsharing.data.preferences.SessionCookieStore;

import java.io.IOException;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;

/**
 * Adds the stored session cookie to outgoing requests and saves Set-Cookie from responses.
 * Backend uses cookie name "car_sharing_session". Supports refresh/session persistence.
 */
public class SessionCookieInterceptor implements Interceptor {

    private static final String COOKIE_HEADER = "Cookie";
    private static final String SET_COOKIE_HEADER = "Set-Cookie";
    private static final Pattern COOKIE_PATTERN = Pattern.compile("car_sharing_session=([^;]+)");

    private final SessionCookieStore store;

    public SessionCookieInterceptor(SessionCookieStore store) {
        this.store = store;
    }

    @NonNull
    @Override
    public Response intercept(@NonNull Chain chain) throws IOException {
        Request original = chain.request();
        Request.Builder builder = original.newBuilder();

        String cookie = store.getSessionCookie();
        if (cookie != null && !cookie.isEmpty()) {
            builder.addHeader(COOKIE_HEADER, "car_sharing_session=" + cookie);
        }

        Response response = chain.proceed(builder.build());

        // Persist session cookie from response (e.g. after login / refresh)
        try {
            List<String> setCookies = response.headers(SET_COOKIE_HEADER);
            if (setCookies != null) {
                for (String header : setCookies) {
                    Matcher m = COOKIE_PATTERN.matcher(header);
                    if (m.find()) {
                        String value = m.group(1);
                        if (value != null) store.setSessionCookie(value);
                        break;
                    }
                }
            }
        } catch (Exception ignored) {
            // Don't fail the request if we can't save the cookie
        }

        return response;
    }
}
