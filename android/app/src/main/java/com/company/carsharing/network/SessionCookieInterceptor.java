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
 * Supports production {@code __Host-car_sharing_session} and legacy {@code car_sharing_session}.
 */
public class SessionCookieInterceptor implements Interceptor {

    private static final String COOKIE_HEADER = "Cookie";
    private static final String SET_COOKIE_HEADER = "Set-Cookie";
    private static final Pattern SESSION_COOKIE_IN_SET = Pattern.compile(
            "((?:__Host-)?car_sharing_session)=([^;\\s]+)",
            Pattern.CASE_INSENSITIVE
    );

    private final SessionCookieStore store;

    public SessionCookieInterceptor(SessionCookieStore store) {
        this.store = store;
    }

    @NonNull
    @Override
    public Response intercept(@NonNull Chain chain) throws IOException {
        Request original = chain.request();
        Request.Builder builder = original.newBuilder();

        String value = store.getSessionCookieValue();
        String name = store.getSessionCookieName();
        if (value != null && !value.isEmpty() && name != null && !name.isEmpty()) {
            builder.addHeader(COOKIE_HEADER, name + "=" + value);
        }

        Response response = chain.proceed(builder.build());

        try {
            List<String> setCookies = response.headers(SET_COOKIE_HEADER);
            if (setCookies != null) {
                for (String header : setCookies) {
                    Matcher m = SESSION_COOKIE_IN_SET.matcher(header);
                    if (m.find()) {
                        String cname = m.group(1);
                        String cval = m.group(2);
                        if (cname != null && cval != null) {
                            store.setSessionCookie(cname, cval);
                        }
                        break;
                    }
                }
            }
        } catch (Exception ignored) {
        }

        return response;
    }
}
