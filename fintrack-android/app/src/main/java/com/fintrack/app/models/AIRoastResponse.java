package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class AIRoastResponse {
    @SerializedName("roast")
    private String roast;

    @SerializedName("burn_level")
    private String burnLevel;

    @SerializedName("punchline")
    private String punchline;

    @SerializedName("top_culprit")
    private String topCulprit;

    @SerializedName("provider_used")
    private String providerUsed;

    public String getRoast() { return roast; }
    public String getBurnLevel() { return burnLevel; }
    public String getPunchline() { return punchline; }
    public String getTopCulprit() { return topCulprit; }
    public String getProviderUsed() { return providerUsed; }
}
