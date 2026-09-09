package com.fintrack.app.api;

import com.fintrack.app.BuildConfig;

public class Constants {
    // For testing on Android phone via USB cable (adb reverse tcp:8000 tcp:8000)
    public static final String LOCAL_BASE_URL = "http://127.0.0.1:8000/api/v1/";

    // For testing on physical Android phone via local Wi-Fi IP
    public static final String WIFI_BASE_URL = "http://192.168.1.62:8000/api/v1/";

    // For Android Studio Emulator without adb reverse
    public static final String EMULATOR_BASE_URL = "http://10.0.2.2:8000/api/v1/";

    // For Live Production Cloud (Render / Railway)
    public static final String PRODUCTION_BASE_URL = BuildConfig.PRODUCTION_BASE_URL;

    // Default active Base URL: Production Cloud URL (no cable or local server needed)
    public static final String DEFAULT_BASE_URL = PRODUCTION_BASE_URL;
    public static String BASE_URL = DEFAULT_BASE_URL;

    // Google OAuth Web Client ID for native token verification
    public static final String GOOGLE_SERVER_CLIENT_ID = "323143849498-j3o87ort08gbgm7nfr4hosuagdnpnql6.apps.googleusercontent.com";
}
