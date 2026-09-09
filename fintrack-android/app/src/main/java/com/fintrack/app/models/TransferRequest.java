package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class TransferRequest {
    @SerializedName("from_wallet_id")
    private int fromWalletId;

    @SerializedName("to_wallet_id")
    private int toWalletId;

    @SerializedName("amount")
    private double amount;

    @SerializedName(value = "notes", alternate = {"description"})
    private String notes;

    public TransferRequest(int fromWalletId, int toWalletId, double amount, String notes) {
        this.fromWalletId = fromWalletId;
        this.toWalletId = toWalletId;
        this.amount = amount;
        this.notes = notes;
    }

    public int getFromWalletId() { return fromWalletId; }
    public int getToWalletId() { return toWalletId; }
    public double getAmount() { return amount; }
    public String getNotes() { return notes; }
    public String getDescription() { return notes; }
}
