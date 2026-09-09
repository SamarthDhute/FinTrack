package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class AIChatRequest {
    @SerializedName("message")
    private String message;

    @SerializedName("history")
    private List<ChatMessage> history;

    public AIChatRequest(String message, List<ChatMessage> history) {
        this.message = message;
        this.history = history;
    }

    public String getMessage() { return message; }
    public List<ChatMessage> getHistory() { return history; }
}
