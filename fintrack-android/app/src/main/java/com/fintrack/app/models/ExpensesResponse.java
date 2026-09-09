package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class ExpensesResponse {
    @SerializedName("items")
    private List<Expense> items;

    @SerializedName("total")
    private int total;

    @SerializedName("skip")
    private int skip;

    @SerializedName("limit")
    private int limit;

    public List<Expense> getItems() { return items; }
    public int getTotal() { return total; }
    public int getSkip() { return skip; }
    public int getLimit() { return limit; }
}
