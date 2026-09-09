package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class AIForecastResponse {
    @SerializedName("current_month_spend_to_date")
    private double currentMonthSpendToDate;

    @SerializedName("days_elapsed")
    private int daysElapsed;

    @SerializedName("days_remaining")
    private int daysRemaining;

    @SerializedName("projected_month_end_spend")
    private double projectedMonthEndSpend;

    @SerializedName("daily_run_rate")
    private double dailyRunRate;

    @SerializedName("comparison_to_last_month_pct")
    private double comparisonToLastMonthPct;

    @SerializedName("forecast_status")
    private String forecastStatus;

    @SerializedName("summary")
    private String summary;

    public double getCurrentMonthSpendToDate() { return currentMonthSpendToDate; }
    public int getDaysElapsed() { return daysElapsed; }
    public int getDaysRemaining() { return daysRemaining; }
    public double getProjectedMonthEndSpend() { return projectedMonthEndSpend; }
    public double getDailyRunRate() { return dailyRunRate; }
    public double getComparisonToLastMonthPct() { return comparisonToLastMonthPct; }
    public String getForecastStatus() { return forecastStatus; }
    public String getSummary() { return summary; }
}
