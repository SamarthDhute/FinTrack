package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;
import java.util.ArrayList;
import java.util.List;

public class DebtsResponse {
    @SerializedName("items")
    private List<Debt> items;

    @SerializedName("total_count")
    private int totalCount;

    @SerializedName("skip")
    private int skip;

    @SerializedName("limit")
    private int limit;

    public List<Debt> getItems() {
        return items != null ? items : new ArrayList<>();
    }

    public int getTotalCount() {
        return totalCount;
    }

    public int getSkip() {
        return skip;
    }

    public int getLimit() {
        return limit;
    }
}
