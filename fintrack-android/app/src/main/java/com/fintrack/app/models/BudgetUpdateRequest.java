package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class BudgetUpdateRequest {
    @SerializedName("amount_limit")
    private Double amountLimit;

    @SerializedName("period")
    private String period;

    public BudgetUpdateRequest(Double amountLimit, String period) {
        this.amountLimit = amountLimit;
        this.period = period;
    }

    public Double getAmountLimit() {
        return amountLimit;
    }

    public void setAmountLimit(Double amountLimit) {
        this.amountLimit = amountLimit;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }
}
