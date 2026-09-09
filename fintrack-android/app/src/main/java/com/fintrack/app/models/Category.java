package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class Category {
    @SerializedName("id")
    private int id;

    @SerializedName("name")
    private String name;

    @SerializedName("is_predefined")
    private boolean isPredefined;

    @SerializedName("expense_count")
    private int expenseCount;

    public int getId() { return id; }
    public String getName() { return name != null ? name : ""; }
    public boolean isPredefined() { return isPredefined; }
    public int getExpenseCount() { return expenseCount; }

    @Override
    public String toString() {
        return name != null ? name : "";
    }
}
