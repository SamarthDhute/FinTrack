package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class Wallet {
    @SerializedName("id")
    private int id;

    @SerializedName("name")
    private String name;

    @SerializedName(value = "wallet_type", alternate = {"account_type"})
    private String accountType;

    @SerializedName("balance")
    private double balance;

    @SerializedName("currency")
    private String currency;

    @SerializedName("color")
    private String color;

    @SerializedName("icon")
    private String icon;

    @SerializedName("is_default")
    private boolean isDefault;

    @SerializedName("credit_limit")
    private Double creditLimit;

    public int getId() { return id; }
    public String getName() { return name != null ? name : "Wallet"; }
    public String getAccountType() { return accountType != null ? accountType : "WALLET"; }
    public double getBalance() { return balance; }
    public String getCurrency() { return currency != null ? currency : "INR"; }
    public String getColor() { return color != null ? color : "#10B981"; }
    public String getIcon() { return icon != null ? icon : "Wallet"; }
    public boolean isDefault() { return isDefault; }
    public Double getCreditLimit() { return creditLimit; }
}
