package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class DebtCreateRequest {
    @SerializedName("person_name")
    private String personName;

    @SerializedName("debt_type")
    private String debtType; // "LENT" or "BORROWED"

    @SerializedName("initial_amount")
    private double initialAmount;

    @SerializedName("due_date")
    private String dueDate;

    @SerializedName("notes")
    private String notes;

    public DebtCreateRequest(String personName, String debtType, double initialAmount, String dueDate, String notes) {
        this.personName = personName;
        this.debtType = debtType;
        this.initialAmount = initialAmount;
        this.dueDate = (dueDate != null && !dueDate.isEmpty()) ? dueDate : null;
        this.notes = (notes != null && !notes.isEmpty()) ? notes : null;
    }

    public String getPersonName() { return personName; }
    public String getDebtType() { return debtType; }
    public double getInitialAmount() { return initialAmount; }
    public String getDueDate() { return dueDate; }
    public String getNotes() { return notes; }
}
