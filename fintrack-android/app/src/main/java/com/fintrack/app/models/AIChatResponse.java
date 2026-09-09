package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class AIChatResponse {
    @SerializedName("reply")
    private String reply;

    @SerializedName("model_used")
    private String modelUsed;

    @SerializedName("engine")
    private String engine;

    public String getReply() { return reply != null ? reply : ""; }
    public String getModelUsed() { return modelUsed != null ? modelUsed : ""; }
    public String getEngine() { return engine != null ? engine : ""; }
}
