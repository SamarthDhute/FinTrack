package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class AIGoalPlanRequest {
    @SerializedName("target_amount")
    private double targetAmount;

    @SerializedName("target_months")
    private int targetMonths;

    public AIGoalPlanRequest(double targetAmount, int targetMonths) {
        this.targetAmount = targetAmount;
        this.targetMonths = targetMonths;
    }

    public double getTargetAmount() { return targetAmount; }
    public int getTargetMonths() { return targetMonths; }
}
