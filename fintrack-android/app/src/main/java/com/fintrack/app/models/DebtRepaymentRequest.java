package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class DebtRepaymentRequest {
    @SerializedName("amount")
    private double amount;

    @SerializedName("payment_date")
    private String paymentDate;

    @SerializedName("payment_method")
    private String paymentMethod;

    @SerializedName("notes")
    private String notes;

    public DebtRepaymentRequest(double amount, String paymentDate, String paymentMethod, String notes) {
        this.amount = amount;
        this.paymentDate = paymentDate;
        this.paymentMethod = paymentMethod;
        this.notes = notes;
    }

    public double getAmount() { return amount; }
    public String getPaymentDate() { return paymentDate; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getNotes() { return notes; }
}
