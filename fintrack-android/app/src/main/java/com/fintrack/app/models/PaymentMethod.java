package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class PaymentMethod {
    @SerializedName("id")
    private int id;

    @SerializedName("name")
    private String name;

    public int getId() { return id; }
    public String getName() { return name != null ? name : ""; }

    @Override
    public String toString() {
        return name != null ? name : "";
    }
}
