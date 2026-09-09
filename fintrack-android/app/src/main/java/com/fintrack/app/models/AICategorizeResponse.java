package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class AICategorizeResponse {
    @SerializedName("suggested_category_id")
    private Integer suggestedCategoryId;

    @SerializedName("category_name")
    private String categoryName;

    @SerializedName("confidence")
    private float confidence;

    @SerializedName("suggested_payment_method")
    private String suggestedPaymentMethod;

    @SerializedName("provider_used")
    private String providerUsed;

    public Integer getSuggestedCategoryId() { return suggestedCategoryId; }
    public String getCategoryName() { return categoryName; }
    public float getConfidence() { return confidence; }
    public String getSuggestedPaymentMethod() { return suggestedPaymentMethod; }
    public String getProviderUsed() { return providerUsed; }
}
