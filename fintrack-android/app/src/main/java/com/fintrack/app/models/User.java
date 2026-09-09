package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class User {
    @SerializedName("id")
    private String id;

    @SerializedName("email")
    private String email;

    @SerializedName(value = "full_name", alternate = {"display_name", "name"})
    private String fullName;

    @SerializedName("is_verified")
    private boolean isVerified;

    @SerializedName("is_superadmin")
    private boolean isSuperadmin;

    @SerializedName("currency_preference")
    private String currencyPreference;

    public String getId() { return id; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public boolean isVerified() { return isVerified; }
    public boolean isSuperadmin() { return isSuperadmin; }
    public String getCurrencyPreference() { return currencyPreference; }
}
