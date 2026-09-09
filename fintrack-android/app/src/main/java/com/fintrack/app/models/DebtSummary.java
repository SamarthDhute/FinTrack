package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class DebtSummary {
    @SerializedName("total_lent_pending")
    private double totalLentPending;

    @SerializedName("total_borrowed_pending")
    private double totalBorrowedPending;

    @SerializedName("active_count")
    private int activeCount;

    @SerializedName("settled_count")
    private int settledCount;

    @SerializedName("total_debts_count")
    private int totalDebtsCount;

    public double getTotalLentPending() { return totalLentPending; }
    public double getTotalBorrowedPending() { return totalBorrowedPending; }
    public double getTotalLent() { return totalLentPending; }
    public double getTotalBorrowed() { return totalBorrowedPending; }
    public int getActiveCount() { return activeCount; }
    public int getSettledCount() { return settledCount; }
    public int getTotalDebtsCount() { return totalDebtsCount; }
}
