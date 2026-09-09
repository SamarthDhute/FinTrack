package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class AICategorizeRequest {
    @SerializedName("title")
    private String title;

    @SerializedName("amount")
    private Double amount;

    public AICategorizeRequest(String title, Double amount) {
        this.title = title;
        this.amount = amount;
    }

    public String getTitle() { return title; }
    public Double getAmount() { return amount; }
}
