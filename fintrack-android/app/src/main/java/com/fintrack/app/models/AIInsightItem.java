package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class AIInsightItem {
    @SerializedName("title")
    private String title;

    @SerializedName("description")
    private String description;

    @SerializedName("category")
    private String category;

    @SerializedName("impact_type")
    private String impactType; // saving, warning, tip, praise

    @SerializedName("estimated_savings")
    private Double estimatedSavings;

    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getCategory() { return category; }
    public String getImpactType() { return impactType; }
    public Double getEstimatedSavings() { return estimatedSavings; }
}
