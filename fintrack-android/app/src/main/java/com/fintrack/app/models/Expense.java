package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class Expense {
    @SerializedName("id")
    private int id;

    @SerializedName("amount")
    private double amount;

    @SerializedName(value = "title", alternate = {"description"})
    private String title;

    @SerializedName(value = "date", alternate = {"expense_date"})
    private String date;

    @SerializedName("category_id")
    private Integer categoryId;

    @SerializedName("category_name")
    private String categoryName;

    @SerializedName("payment_method_id")
    private Integer paymentMethodId;

    @SerializedName("payment_method_name")
    private String paymentMethodName;

    @SerializedName("wallet_id")
    private Integer walletId;

    @SerializedName("wallet_name")
    private String walletName;

    @SerializedName("notes")
    private String notes;

    public int getId() { return id; }
    public double getAmount() { return amount; }
    public String getTitle() { return title != null ? title : "Expense"; }
    public String getDescription() { return getTitle(); }
    public String getDate() { return date != null ? date : ""; }
    public String getExpenseDate() { return getDate(); }
    public Integer getCategoryId() { return categoryId; }
    public String getCategoryName() { return categoryName != null ? categoryName : "General"; }
    public Integer getPaymentMethodId() { return paymentMethodId; }
    public String getPaymentMethodName() { return paymentMethodName; }
    public Integer getWalletId() { return walletId; }
    public String getWalletName() { return walletName; }
    public String getNotes() { return notes; }
}
