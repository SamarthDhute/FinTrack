package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class AIFinancialHealthScore {
    @SerializedName("score")
    private int score;

    @SerializedName("status")
    private String status;

    @SerializedName("summary")
    private String summary;

    public int getScore() { return score; }
    public String getStatus() { return status; }
    public String getSummary() { return summary; }
}
