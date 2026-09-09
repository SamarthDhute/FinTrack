package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class WalletTransaction {
    @SerializedName("id")
    private int id;

    @SerializedName("wallet_id")
    private int walletId;

    @SerializedName("transaction_type")
    private String transactionType; // "DEPOSIT", "EXPENSE", "TRANSFER_IN", "TRANSFER_OUT"

    @SerializedName("amount")
    private double amount;

    @SerializedName("destination_wallet_id")
    private Integer destinationWalletId;

    @SerializedName("description")
    private String description;

    @SerializedName("transaction_date")
    private String transactionDate;

    @SerializedName("created_at")
    private String createdAt;

    public int getId() { return id; }
    public int getWalletId() { return walletId; }
    public String getTransactionType() { return transactionType != null ? transactionType : "TRANSACTION"; }
    public double getAmount() { return amount; }
    public Integer getDestinationWalletId() { return destinationWalletId; }
    public String getDescription() { return description != null ? description : ""; }
    public String getTransactionDate() { return transactionDate != null ? transactionDate : ""; }
    public String getCreatedAt() { return createdAt != null ? createdAt : ""; }

    public boolean isPositive() {
        return "DEPOSIT".equalsIgnoreCase(transactionType) || "TRANSFER_IN".equalsIgnoreCase(transactionType);
    }
}
