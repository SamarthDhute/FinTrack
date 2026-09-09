package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class ExpenseCreateRequest {
    @SerializedName("amount")
    private double amount;

    @SerializedName(value = "title", alternate = {"description"})
    private String title;

    @SerializedName(value = "date", alternate = {"expense_date"})
    private String date;

    @SerializedName("category_id")
    private int categoryId;

    @SerializedName("payment_method_id")
    private int paymentMethodId;

    @SerializedName("wallet_id")
    private Integer walletId;

    @SerializedName("notes")
    private String notes;

    public ExpenseCreateRequest(double amount, String title, String date, int categoryId, int paymentMethodId, Integer walletId) {
        this.amount = amount;
        this.title = title;
        this.date = date;
        this.categoryId = categoryId;
        this.paymentMethodId = paymentMethodId;
        this.walletId = walletId;
    }

    public ExpenseCreateRequest(double amount, String title, String date, int categoryId, int paymentMethodId, Integer walletId, String notes) {
        this.amount = amount;
        this.title = title;
        this.date = date;
        this.categoryId = categoryId;
        this.paymentMethodId = paymentMethodId;
        this.walletId = walletId;
        this.notes = notes;
    }

    public double getAmount() { return amount; }
    public String getTitle() { return title; }
    public String getDate() { return date; }
    public int getCategoryId() { return categoryId; }
    public int getPaymentMethodId() { return paymentMethodId; }
    public Integer getWalletId() { return walletId; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
