package com.fintrack.app.api;

import android.content.Context;
import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import java.util.concurrent.TimeUnit;

public class ApiClient {
    private static Retrofit retrofit = null;
    private static ApiService apiService = null;
    private static String lastBaseUrl = null;

    public static ApiService getService(Context context) {
        SessionManager sessionManager = new SessionManager(context.getApplicationContext());
        String currentUrl = sessionManager.getServerUrl();
        if (currentUrl == null || currentUrl.isEmpty()) {
            currentUrl = Constants.DEFAULT_BASE_URL;
        }

        if (apiService == null || !currentUrl.equals(lastBaseUrl)) {
            lastBaseUrl = currentUrl;
            Constants.BASE_URL = currentUrl;

            HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
            logging.setLevel(HttpLoggingInterceptor.Level.BODY);

            OkHttpClient okHttpClient = new OkHttpClient.Builder()
                    .addInterceptor(new AuthInterceptor(sessionManager))
                    .addInterceptor(logging)
                    .connectTimeout(30, TimeUnit.SECONDS)
                    .readTimeout(45, TimeUnit.SECONDS)
                    .writeTimeout(30, TimeUnit.SECONDS)
                    .build();

            retrofit = new Retrofit.Builder()
                    .baseUrl(lastBaseUrl)
                    .client(okHttpClient)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build();

            apiService = retrofit.create(ApiService.class);
        }
        return apiService;
    }

    public static void updateBaseUrl(Context context, String newBaseUrl) {
        SessionManager sessionManager = new SessionManager(context.getApplicationContext());
        sessionManager.saveServerUrl(newBaseUrl);
        retrofit = null;
        apiService = null;
        lastBaseUrl = null;
    }
}
