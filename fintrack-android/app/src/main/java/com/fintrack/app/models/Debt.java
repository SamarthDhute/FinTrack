package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class Debt {
    @SerializedName("id")
    private int id;

    @SerializedName("person_name")
    private String personName;

    @SerializedName("debt_type")
    private String debtType; // "LENT" or "BORROWED"

    @SerializedName("initial_amount")
    private double initialAmount;

    @SerializedName("remaining_amount")
    private double remainingAmount;

    @SerializedName("total_repaid")
    private double totalRepaid;

    @SerializedName("due_date")
    private String dueDate;

    @SerializedName("notes")
    private String notes;

    @SerializedName("status")
    private String status; // "PENDING", "PARTIALLY_PAID", "SETTLED"

    @SerializedName("created_at")
    private String createdAt;

    public int getId() { return id; }
    public String getPersonName() { return personName != null ? personName : "Unknown"; }
    public String getDebtType() { return debtType != null ? debtType : "LENT"; }
    public boolean isLent() { return "LENT".equalsIgnoreCase(debtType); }
    public double getInitialAmount() { return initialAmount; }
    public double getRemainingAmount() { return remainingAmount; }
    public double getTotalRepaid() { return totalRepaid; }
    public String getDueDate() { return dueDate != null ? dueDate : ""; }
    public String getNotes() { return notes != null ? notes : ""; }
    public String getStatus() { return status != null ? status : "PENDING"; }
    public boolean isSettled() { return "SETTLED".equalsIgnoreCase(status); }
}
