package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class AIGoalPlanResponse {
    @SerializedName("target_amount")
    private double targetAmount;

    @SerializedName("target_months")
    private int targetMonths;

    @SerializedName("monthly_savings_required")
    private double monthlySavingsRequired;

    @SerializedName("feasibility")
    private String feasibility; // easy, moderate, aggressive, unrealistic

    @SerializedName("total_current_monthly_spend")
    private double totalCurrentMonthlySpend;

    @SerializedName("category_cutbacks")
    private List<CategoryCutback> categoryCutbacks;

    @SerializedName("strategy_summary")
    private String strategySummary;

    public double getTargetAmount() { return targetAmount; }
    public int getTargetMonths() { return targetMonths; }
    public double getMonthlySavingsRequired() { return monthlySavingsRequired; }
    public String getFeasibility() { return feasibility; }
    public double getTotalCurrentMonthlySpend() { return totalCurrentMonthlySpend; }
    public List<CategoryCutback> getCategoryCutbacks() { return categoryCutbacks; }
    public String getStrategySummary() { return strategySummary; }
}
