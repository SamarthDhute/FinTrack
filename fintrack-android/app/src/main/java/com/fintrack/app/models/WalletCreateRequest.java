package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class WalletCreateRequest {
    @SerializedName("name")
    private String name;

    @SerializedName("wallet_type")
    private String walletType;

    @SerializedName("balance")
    private double balance;

    @SerializedName("currency")
    private String currency;

    @SerializedName("color")
    private String color;

    @SerializedName("icon")
    private String icon;

    public WalletCreateRequest(String name, String walletType, double balance, String color, String icon) {
        this.name = name;
        this.walletType = walletType;
        this.balance = balance;
        this.currency = "INR";
        this.color = (color != null && !color.isEmpty()) ? color : "#3B82F6";
        this.icon = (icon != null && !icon.isEmpty()) ? icon : "Building2";
    }

    public String getName() { return name; }
    public String getWalletType() { return walletType; }
    public double getBalance() { return balance; }
    public String getCurrency() { return currency; }
    public String getColor() { return color; }
    public String getIcon() { return icon; }
}
