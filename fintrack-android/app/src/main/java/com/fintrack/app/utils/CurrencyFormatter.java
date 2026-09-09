package com.fintrack.app.utils;

import java.text.NumberFormat;
import java.util.Locale;

public class CurrencyFormatter {
    private static final NumberFormat indianFormat = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));

    public static String formatINR(double amount) {
        try {
            return indianFormat.format(amount).replace("INR", "₹").trim();
        } catch (Exception e) {
            return "₹" + String.format(Locale.getDefault(), "%.2f", amount);
        }
    }

    public static String format(double amount) {
        return formatINR(amount);
    }
}
