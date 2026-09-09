package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class ChatMessage {
    @SerializedName("role")
    private String role; // "user" or "assistant"

    @SerializedName("content")
    private String content;

    public ChatMessage(String role, String content) {
        this.role = role;
        this.content = content;
    }

    public String getRole() { return role; }
    public String getContent() { return content; }
    public boolean isUser() { return "user".equalsIgnoreCase(role); }
}
