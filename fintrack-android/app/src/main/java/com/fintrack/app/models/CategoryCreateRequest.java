package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class CategoryCreateRequest {
    @SerializedName("name")
    private String name;

    public CategoryCreateRequest(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
