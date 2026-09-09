package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class CategoryUpdateRequest {
    @SerializedName("name")
    private String name;

    public CategoryUpdateRequest(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
