package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class AISubscriptionItem {
    @SerializedName("name")
    private String name;

    @SerializedName("category_name")
    private String categoryName;

    @SerializedName("average_amount")
    private double averageAmount;

    @SerializedName("cadence")
    private String cadence;

    @SerializedName("last_payment_date")
    private String lastPaymentDate;

    @SerializedName("next_predicted_date")
    private String nextPredictedDate;

    @SerializedName("transaction_count")
    private int transactionCount;

    @SerializedName("status")
    private String status;

    public String getName() { return name; }
    public String getCategoryName() { return categoryName; }
    public double getAverageAmount() { return averageAmount; }
    public String getCadence() { return cadence; }
    public String getLastPaymentDate() { return lastPaymentDate; }
    public String getNextPredictedDate() { return nextPredictedDate; }
    public int getTransactionCount() { return transactionCount; }
    public String getStatus() { return status; }
}
