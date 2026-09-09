package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class ExpenseUpdateRequest {
    @SerializedName("amount")
    private Double amount;

    @SerializedName(value = "title", alternate = {"description"})
    private String title;

    @SerializedName(value = "date", alternate = {"expense_date"})
    private String date;

    @SerializedName("category_id")
    private Integer categoryId;

    @SerializedName("payment_method_id")
    private Integer paymentMethodId;

    @SerializedName("wallet_id")
    private Integer walletId;

    @SerializedName("notes")
    private String notes;

    public ExpenseUpdateRequest(Double amount, String title, String date, Integer categoryId, Integer paymentMethodId, Integer walletId, String notes) {
        this.amount = amount;
        this.title = title;
        this.date = date;
        this.categoryId = categoryId;
        this.paymentMethodId = paymentMethodId;
        this.walletId = walletId;
        this.notes = notes;
    }

    public Double getAmount() { return amount; }
    public String getTitle() { return title; }
    public String getDate() { return date; }
    public Integer getCategoryId() { return categoryId; }
    public Integer getPaymentMethodId() { return paymentMethodId; }
    public Integer getWalletId() { return walletId; }
    public String getNotes() { return notes; }
}
