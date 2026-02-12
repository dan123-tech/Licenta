package com.company.carsharing.network;

import com.company.carsharing.data.preferences.SessionCookieStore;

import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

/**
 * Singleton Retrofit client with OkHttp, session cookie handling, and Gson.
 * Change BASE_URL for your environment (e.g. http://10.0.2.2:3000 for emulator).
 */
public final class RetrofitClient {

    // Emulator: 10.0.2.2:3000. Real device: use your machine's IP, e.g. http://192.168.1.x:3000
    private static final String BASE_URL = "http://10.0.2.2:3000/";

    private static volatile ApiService apiService;
    private static volatile OkHttpClient okHttpClient;

    public static ApiService getApiService(SessionCookieStore sessionStore) {
        if (apiService == null) {
            synchronized (RetrofitClient.class) {
                if (apiService == null) {
                    apiService = createRetrofit(sessionStore).create(ApiService.class);
                }
            }
        }
        return apiService;
    }

    public static void reset() {
        synchronized (RetrofitClient.class) {
            apiService = null;
            okHttpClient = null;
        }
    }

    private static Retrofit createRetrofit(SessionCookieStore sessionStore) {
        HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
        logging.setLevel(HttpLoggingInterceptor.Level.BODY);

        okHttpClient = new OkHttpClient.Builder()
                .addInterceptor(new SessionCookieInterceptor(sessionStore))
                .addInterceptor(logging)
                .build();

        return new Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create())
                .build();
    }
}
