package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class BudgetCreateRequest {
    @SerializedName("category_id")
    private Integer categoryId;

    @SerializedName("amount_limit")
    private double amountLimit;

    @SerializedName("period")
    private String period;

    public BudgetCreateRequest(Integer categoryId, double amountLimit, String period) {
        this.categoryId = categoryId;
        this.amountLimit = amountLimit;
        this.period = period;
    }

    public Integer getCategoryId() { return categoryId; }
    public double getAmountLimit() { return amountLimit; }
    public String getPeriod() { return period; }
}
