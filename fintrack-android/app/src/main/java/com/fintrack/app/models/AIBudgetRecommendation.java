package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class AIBudgetRecommendation {
    @SerializedName("category_name")
    private String categoryName;

    @SerializedName("current_spending")
    private double currentSpending;

    @SerializedName("suggested_budget")
    private double suggestedBudget;

    @SerializedName("reasoning")
    private String reasoning;

    public String getCategoryName() { return categoryName; }
    public double getCurrentSpending() { return currentSpending; }
    public double getSuggestedBudget() { return suggestedBudget; }
    public String getReasoning() { return reasoning; }
}
