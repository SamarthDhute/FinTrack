package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class DashboardSummary {
    @SerializedName(value = "current_month_spend", alternate = {"total_spent_current_month"})
    private double currentMonthSpend;

    @SerializedName(value = "today_spend", alternate = {"spent_today"})
    private double todaySpend;

    @SerializedName(value = "all_time_spend", alternate = {"total_spend"})
    private double allTimeSpend;

    @SerializedName(value = "previous_month_spend", alternate = {"total_spent_previous_month"})
    private double previousMonthSpend;

    @SerializedName(value = "month_over_month_change_pct", alternate = {"percentage_change"})
    private Double percentageChange;

    @SerializedName("recent_expenses")
    private List<Expense> recentExpenses;

    public double getCurrentMonthSpend() { return currentMonthSpend; }
    public double getTotalSpentCurrentMonth() { return currentMonthSpend; }
    public double getTodaySpend() { return todaySpend; }
    public double getAllTimeSpend() { return allTimeSpend; }
    public double getPreviousMonthSpend() { return previousMonthSpend; }
    public double getTotalSpentPreviousMonth() { return previousMonthSpend; }
    public Double getPercentageChange() { return percentageChange; }
    public List<Expense> getRecentExpenses() { return recentExpenses; }
}
