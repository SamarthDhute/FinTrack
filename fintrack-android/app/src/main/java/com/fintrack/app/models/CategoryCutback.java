package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class CategoryCutback {
    @SerializedName("category_name")
    private String categoryName;

    @SerializedName("current_avg_spend")
    private double currentAvgSpend;

    @SerializedName("suggested_cutback_amount")
    private double suggestedCutbackAmount;

    @SerializedName("suggested_new_limit")
    private double suggestedNewLimit;

    @SerializedName("savings_tip")
    private String savingsTip;

    public String getCategoryName() { return categoryName; }
    public double getCurrentAvgSpend() { return currentAvgSpend; }
    public double getSuggestedCutbackAmount() { return suggestedCutbackAmount; }
    public double getSuggestedNewLimit() { return suggestedNewLimit; }
    public String getSavingsTip() { return savingsTip; }
}
