package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class GoogleMobileAuthRequest {
    @SerializedName("id_token")
    private String idToken;

    public GoogleMobileAuthRequest(String idToken) {
        this.idToken = idToken;
    }

    public String getIdToken() {
        return idToken;
    }

    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }
}
