package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class AIInsightsResponse {
    @SerializedName("health_score")
    private AIFinancialHealthScore healthScore;

    @SerializedName("key_insights")
    private List<AIInsightItem> keyInsights;

    @SerializedName("budget_recommendations")
    private List<AIBudgetRecommendation> budgetRecommendations;

    @SerializedName("top_spending_category")
    private String topSpendingCategory;

    @SerializedName("total_analyzed_spend")
    private double totalAnalyzedSpend;

    @SerializedName("provider_used")
    private String providerUsed;

    public AIFinancialHealthScore getHealthScore() { return healthScore; }
    public List<AIInsightItem> getKeyInsights() { return keyInsights; }
    public List<AIBudgetRecommendation> getBudgetRecommendations() { return budgetRecommendations; }
    public String getTopSpendingCategory() { return topSpendingCategory; }
    public double getTotalAnalyzedSpend() { return totalAnalyzedSpend; }
    public String getProviderUsed() { return providerUsed; }
}
