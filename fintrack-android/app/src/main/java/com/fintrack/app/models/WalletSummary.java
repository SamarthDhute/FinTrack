package com.fintrack.app.models;

import com.google.gson.annotations.SerializedName;

public class WalletSummary {
    @SerializedName("total_liquid_balance")
    private double totalLiquidBalance;

    @SerializedName(value = "total_credit_debt", alternate = {"total_credit_due"})
    private double totalCreditDue;

    @SerializedName("net_worth")
    private double netWorth;

    @SerializedName(value = "wallets_count", alternate = {"total_accounts"})
    private int totalAccounts;

    public double getTotalLiquidBalance() { return totalLiquidBalance; }
    public double getTotalCreditDue() { return totalCreditDue; }
    public double getNetWorth() { return netWorth; }
    public int getTotalAccounts() { return totalAccounts; }
}
