package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class AIScanReceiptResponse {
    @SerializedName("title")
    private String title;

    @SerializedName("amount")
    private Double amount;

    @SerializedName("date")
    private String date;

    @SerializedName("category_id")
    private Integer categoryId;

    @SerializedName("category_name")
    private String categoryName;

    @SerializedName("merchant_name")
    private String merchantName;

    @SerializedName("payment_method_hint")
    private String paymentMethodHint;

    @SerializedName("confidence")
    private float confidence;

    @SerializedName("provider_used")
    private String providerUsed;

    public String getTitle() { return title; }
    public Double getAmount() { return amount; }
    public String getDate() { return date; }
    public Integer getCategoryId() { return categoryId; }
    public String getCategoryName() { return categoryName; }
    public String getMerchantName() { return merchantName; }
    public String getPaymentMethodHint() { return paymentMethodHint; }
    public float getConfidence() { return confidence; }
    public String getProviderUsed() { return providerUsed; }
}
