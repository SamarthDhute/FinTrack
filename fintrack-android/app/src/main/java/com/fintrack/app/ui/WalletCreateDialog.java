package com.fintrack.app.ui;

import android.app.Dialog;
import android.content.Context;
import android.os.Bundle;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.Toast;
import androidx.annotation.NonNull;
import com.fintrack.app.R;
import com.fintrack.app.api.ApiClient;
import com.fintrack.app.models.Wallet;
import com.fintrack.app.models.WalletCreateRequest;
import com.google.android.material.button.MaterialButton;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class WalletCreateDialog extends Dialog {

    public interface OnWalletCreatedListener {
        void onWalletCreated();
    }

    private final OnWalletCreatedListener listener;
    private EditText etNewWalletName, etNewWalletBalance;
    private Spinner spNewWalletType;
    private MaterialButton btnConfirmCreateWallet, btnCancelCreateWallet;

    private static final String[] ACCOUNT_TYPES = {"BANK", "CASH", "WALLET", "CREDIT_CARD", "SAVINGS", "OTHER"};

    public WalletCreateDialog(@NonNull Context context, OnWalletCreatedListener listener) {
        super(context);
        this.listener = listener;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.dialog_create_wallet);

        if (getWindow() != null) {
            getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }

        initViews();
        setupSpinner();
        setupListeners();
    }

    private void initViews() {
        etNewWalletName = findViewById(R.id.etNewWalletName);
        etNewWalletBalance = findViewById(R.id.etNewWalletBalance);
        spNewWalletType = findViewById(R.id.spNewWalletType);
        btnConfirmCreateWallet = findViewById(R.id.btnConfirmCreateWallet);
        btnCancelCreateWallet = findViewById(R.id.btnCancelCreateWallet);
    }

    private void setupSpinner() {
        ArrayAdapter<String> adapter = new ArrayAdapter<>(getContext(),
                android.R.layout.simple_spinner_dropdown_item, ACCOUNT_TYPES);
        spNewWalletType.setAdapter(adapter);
    }

    private void setupListeners() {
        btnCancelCreateWallet.setOnClickListener(v -> dismiss());
        btnConfirmCreateWallet.setOnClickListener(v -> performCreate());
    }

    private void performCreate() {
        String name = etNewWalletName.getText().toString().trim();
        if (name.isEmpty()) {
            Toast.makeText(getContext(), "Please enter an account name", Toast.LENGTH_SHORT).show();
            return;
        }

        String balanceStr = etNewWalletBalance.getText().toString().trim();
        double balance = 0;
        if (!balanceStr.isEmpty()) {
            try {
                balance = Double.parseDouble(balanceStr);
            } catch (NumberFormatException e) {
                Toast.makeText(getContext(), "Invalid balance", Toast.LENGTH_SHORT).show();
                return;
            }
        }

        String type = ACCOUNT_TYPES[spNewWalletType.getSelectedItemPosition()];
        String color = "#3B82F6";
        String icon = "Building2";
        if ("CASH".equals(type)) { color = "#10B981"; icon = "Banknote"; }
        else if ("WALLET".equals(type)) { color = "#8B5CF6"; icon = "Smartphone"; }
        else if ("CREDIT_CARD".equals(type)) { color = "#F59E0B"; icon = "CreditCard"; }
        else if ("SAVINGS".equals(type)) { color = "#06B6D4"; icon = "PiggyBank"; }

        btnConfirmCreateWallet.setEnabled(false);
        btnConfirmCreateWallet.setText("Creating...");

        WalletCreateRequest request = new WalletCreateRequest(name, type, balance, color, icon);
        ApiClient.getService(getContext()).createWallet(request).enqueue(new Callback<Wallet>() {
            @Override
            public void onResponse(Call<Wallet> call, Response<Wallet> response) {
                btnConfirmCreateWallet.setEnabled(true);
                btnConfirmCreateWallet.setText("Create Account");

                if (response.isSuccessful()) {
                    Toast.makeText(getContext(), "✅ Account created successfully!", Toast.LENGTH_SHORT).show();
                    if (listener != null) {
                        listener.onWalletCreated();
                    }
                    dismiss();
                } else {
                    String errorMsg = "Failed to create: " + response.code();
                    try {
                        if (response.errorBody() != null) {
                            errorMsg = response.errorBody().string();
                        }
                    } catch (Exception ignored) {}
                    Toast.makeText(getContext(), errorMsg, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<Wallet> call, Throwable t) {
                btnConfirmCreateWallet.setEnabled(true);
                btnConfirmCreateWallet.setText("Create Account");
                Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }
}
