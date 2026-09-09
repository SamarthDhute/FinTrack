package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class AISubscriptionsResponse {
    @SerializedName("subscriptions")
    private List<AISubscriptionItem> subscriptions;

    @SerializedName("total_monthly_burn")
    private double totalMonthlyBurn;

    @SerializedName("count")
    private int count;

    @SerializedName("provider_used")
    private String providerUsed;

    public List<AISubscriptionItem> getSubscriptions() { return subscriptions; }
    public double getTotalMonthlyBurn() { return totalMonthlyBurn; }
    public int getCount() { return count; }
    public String getProviderUsed() { return providerUsed; }
}
