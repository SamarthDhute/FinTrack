package com.fintrack.app.ui;

import android.app.Dialog;
import android.content.Context;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import com.fintrack.app.R;
import com.fintrack.app.api.ApiClient;
import com.fintrack.app.models.DepositRequest;
import com.fintrack.app.models.Wallet;
import com.fintrack.app.utils.CurrencyFormatter;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.chip.Chip;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class WalletDepositDialog extends Dialog {

    public interface OnDepositSuccessListener {
        void onDepositSuccess(Wallet updatedWallet);
    }

    private final Wallet wallet;
    private final OnDepositSuccessListener listener;
    private EditText etDepositAmount, etDepositReason;
    private TextView tvDialogWalletName, tvNewBalancePreview;
    private MaterialButton btnConfirmDeposit, btnCancelDeposit;

    public WalletDepositDialog(@NonNull Context context, Wallet wallet, OnDepositSuccessListener listener) {
        super(context);
        this.wallet = wallet;
        this.listener = listener;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.dialog_deposit);

        if (getWindow() != null) {
            getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }

        initViews();
        setupListeners();
    }

    private void initViews() {
        tvDialogWalletName = findViewById(R.id.tvDialogWalletName);
        tvNewBalancePreview = findViewById(R.id.tvNewBalancePreview);
        etDepositAmount = findViewById(R.id.etDepositAmount);
        etDepositReason = findViewById(R.id.etDepositReason);
        btnConfirmDeposit = findViewById(R.id.btnConfirmDeposit);
        btnCancelDeposit = findViewById(R.id.btnCancelDeposit);

        tvDialogWalletName.setText("Target: " + wallet.getName() + " (Current: " + CurrencyFormatter.formatINR(wallet.getBalance()) + ")");
        updateBalancePreview(0);
    }

    private void setupListeners() {
        // Quick amount chips
        setChipListener(R.id.chip500, 500);
        setChipListener(R.id.chip1000, 1000);
        setChipListener(R.id.chip2000, 2000);
        setChipListener(R.id.chip5000, 5000);
        setChipListener(R.id.chip10000, 10000);
        setChipListener(R.id.chip25000, 25000);

        // TextWatcher for live preview
        etDepositAmount.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                try {
                    double amount = Double.parseDouble(s.toString().trim());
                    updateBalancePreview(amount);
                } catch (Exception e) {
                    updateBalancePreview(0);
                }
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });

        btnCancelDeposit.setOnClickListener(v -> dismiss());
        btnConfirmDeposit.setOnClickListener(v -> performDeposit());
    }

    private void setChipListener(int chipId, double amount) {
        Chip chip = findViewById(chipId);
        if (chip != null) {
            chip.setOnClickListener(v -> etDepositAmount.setText(String.valueOf((int) amount)));
        }
    }

    private void updateBalancePreview(double topUpAmount) {
        double newBalance = wallet.getBalance() + topUpAmount;
        tvNewBalancePreview.setText(CurrencyFormatter.formatINR(newBalance));
    }

    private void performDeposit() {
        String amountStr = etDepositAmount.getText().toString().trim();
        if (amountStr.isEmpty()) {
            Toast.makeText(getContext(), "Please enter a valid amount", Toast.LENGTH_SHORT).show();
            return;
        }

        double amount;
        try {
            amount = Double.parseDouble(amountStr);
            if (amount <= 0) {
                Toast.makeText(getContext(), "Amount must be greater than 0", Toast.LENGTH_SHORT).show();
                return;
            }
        } catch (NumberFormatException e) {
            Toast.makeText(getContext(), "Invalid amount", Toast.LENGTH_SHORT).show();
            return;
        }

        String reason = etDepositReason.getText().toString().trim();
        if (reason.isEmpty()) {
            reason = "Wallet Top-up";
        }

        btnConfirmDeposit.setEnabled(false);
        btnConfirmDeposit.setText("Adding...");

        DepositRequest request = new DepositRequest(amount, reason);
        ApiClient.getService(getContext()).depositFunds(wallet.getId(), request).enqueue(new Callback<okhttp3.ResponseBody>() {
            @Override
            public void onResponse(Call<okhttp3.ResponseBody> call, Response<okhttp3.ResponseBody> response) {
                btnConfirmDeposit.setEnabled(true);
                btnConfirmDeposit.setText("Add Funds");

                if (response.isSuccessful()) {
                    Toast.makeText(getContext(), "✅ Added " + CurrencyFormatter.formatINR(amount) + " successfully!", Toast.LENGTH_SHORT).show();
                    if (listener != null) {
                        listener.onDepositSuccess(wallet);
                    }
                    dismiss();
                } else {
                    String errorMsg = "Failed to add funds: " + response.code();
                    try {
                        if (response.errorBody() != null) {
                            errorMsg = response.errorBody().string();
                        }
                    } catch (Exception ignored) {}
                    Toast.makeText(getContext(), errorMsg, Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<okhttp3.ResponseBody> call, Throwable t) {
                btnConfirmDeposit.setEnabled(true);
                btnConfirmDeposit.setText("Add Funds");
                Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }
}
