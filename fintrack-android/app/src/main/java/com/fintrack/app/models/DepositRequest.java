package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class DepositRequest {
    @SerializedName("amount")
    private double amount;

    @SerializedName(value = "notes", alternate = {"reason"})
    private String notes;

    public DepositRequest(double amount, String notes) {
        this.amount = amount;
        this.notes = notes;
    }

    public double getAmount() { return amount; }
    public String getNotes() { return notes; }
    public String getReason() { return notes; }
}
