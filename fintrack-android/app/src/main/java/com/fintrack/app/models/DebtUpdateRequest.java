package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class DebtUpdateRequest {
    @SerializedName("person_name")
    private String personName;

    @SerializedName("debt_type")
    private String debtType;

    @SerializedName("initial_amount")
    private Double initialAmount;

    @SerializedName("due_date")
    private String dueDate;

    @SerializedName("notes")
    private String notes;

    public DebtUpdateRequest(String personName, String debtType, Double initialAmount, String dueDate, String notes) {
        this.personName = personName;
        this.debtType = debtType;
        this.initialAmount = initialAmount;
        this.dueDate = dueDate;
        this.notes = notes;
    }

    public String getPersonName() { return personName; }
    public String getDebtType() { return debtType; }
    public Double getInitialAmount() { return initialAmount; }
    public String getDueDate() { return dueDate; }
    public String getNotes() { return notes; }
}
