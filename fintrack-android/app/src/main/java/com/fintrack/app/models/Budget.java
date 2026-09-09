package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class Budget {
    @SerializedName("id")
    private int id;

    @SerializedName("category_id")
    private Integer categoryId;

    @SerializedName("category_name")
    private String categoryName;

    @SerializedName("amount_limit")
    private double amountLimit;

    @SerializedName("period")
    private String period; // "monthly" or "daily"

    @SerializedName("spent_amount")
    private double spentAmount;

    @SerializedName("remaining_amount")
    private double remainingAmount;

    @SerializedName("percentage_spent")
    private double percentageSpent;

    @SerializedName("status")
    private String status; // "on_track", "near_limit", "over_budget"

    public int getId() { return id; }
    public Integer getCategoryId() { return categoryId; }
    public String getCategoryName() {
        if (categoryName != null && !categoryName.isEmpty()) {
            return categoryName;
        }
        return "daily".equalsIgnoreCase(period) ? "Daily Spending Limit" : "Overall Monthly Budget";
    }
    public double getAmountLimit() { return amountLimit; }
    public String getPeriod() { return period != null ? period : "monthly"; }
    public double getSpentAmount() { return spentAmount; }
    public double getRemainingAmount() { return remainingAmount; }
    public double getPercentageSpent() { return percentageSpent; }
    public String getStatus() { return status != null ? status : "on_track"; }
}
