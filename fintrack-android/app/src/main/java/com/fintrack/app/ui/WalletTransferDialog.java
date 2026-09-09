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
import com.fintrack.app.models.TransferRequest;
import com.fintrack.app.models.Wallet;
import com.fintrack.app.utils.CurrencyFormatter;
import com.google.android.material.button.MaterialButton;
import java.util.ArrayList;
import java.util.List;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class WalletTransferDialog extends Dialog {

    public interface OnTransferSuccessListener {
        void onTransferSuccess();
    }

    private final List<Wallet> wallets;
    private final OnTransferSuccessListener listener;
    private Spinner spFromWallet, spToWallet;
    private EditText etTransferAmount, etTransferNotes;
    private MaterialButton btnConfirmTransfer, btnCancelTransfer;

    public WalletTransferDialog(@NonNull Context context, List<Wallet> wallets, OnTransferSuccessListener listener) {
        super(context);
        this.wallets = (wallets != null) ? wallets : new ArrayList<>();
        this.listener = listener;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.dialog_transfer);

        if (getWindow() != null) {
            getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }

        initViews();
        setupSpinners();
        setupListeners();
    }

    private void initViews() {
        spFromWallet = findViewById(R.id.spFromWallet);
        spToWallet = findViewById(R.id.spToWallet);
        etTransferAmount = findViewById(R.id.etTransferAmount);
        etTransferNotes = findViewById(R.id.etTransferNotes);
        btnConfirmTransfer = findViewById(R.id.btnConfirmTransfer);
        btnCancelTransfer = findViewById(R.id.btnCancelTransfer);
    }

    private void setupSpinners() {
        List<String> walletLabels = new ArrayList<>();
        for (Wallet w : wallets) {
            walletLabels.add(w.getName() + " (" + CurrencyFormatter.formatINR(w.getBalance()) + ")");
        }

        ArrayAdapter<String> adapter = new ArrayAdapter<>(getContext(),
                android.R.layout.simple_spinner_dropdown_item, walletLabels);
        spFromWallet.setAdapter(adapter);
        spToWallet.setAdapter(adapter);

        if (wallets.size() > 1) {
            spToWallet.setSelection(1);
        }
    }

    private void setupListeners() {
        btnCancelTransfer.setOnClickListener(v -> dismiss());
        btnConfirmTransfer.setOnClickListener(v -> performTransfer());
    }

    private void performTransfer() {
        int fromPos = spFromWallet.getSelectedItemPosition();
        int toPos = spToWallet.getSelectedItemPosition();

        if (fromPos < 0 || toPos < 0 || fromPos >= wallets.size() || toPos >= wallets.size()) {
            Toast.makeText(getContext(), "Please select valid wallets", Toast.LENGTH_SHORT).show();
            return;
        }

        if (fromPos == toPos) {
            Toast.makeText(getContext(), "Source and destination wallets must be different", Toast.LENGTH_SHORT).show();
            return;
        }

        String amountStr = etTransferAmount.getText().toString().trim();
        if (amountStr.isEmpty()) {
            Toast.makeText(getContext(), "Please enter an amount", Toast.LENGTH_SHORT).show();
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

        Wallet fromWallet = wallets.get(fromPos);
        Wallet toWallet = wallets.get(toPos);

        if (fromWallet.getBalance() < amount && !"CREDIT_CARD".equalsIgnoreCase(fromWallet.getAccountType())) {
            Toast.makeText(getContext(), "Insufficient balance in " + fromWallet.getName(), Toast.LENGTH_SHORT).show();
            return;
        }

        String notes = etTransferNotes.getText().toString().trim();
        if (notes.isEmpty()) {
            notes = "Transfer from " + fromWallet.getName() + " to " + toWallet.getName();
        }

        btnConfirmTransfer.setEnabled(false);
        btnConfirmTransfer.setText("Transferring...");

        TransferRequest request = new TransferRequest(fromWallet.getId(), toWallet.getId(), amount, notes);
        ApiClient.getService(getContext()).transferFunds(request).enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                btnConfirmTransfer.setEnabled(true);
                btnConfirmTransfer.setText("Transfer Funds");

                if (response.isSuccessful()) {
                    Toast.makeText(getContext(), "✅ Transferred " + CurrencyFormatter.formatINR(amount) + " successfully!", Toast.LENGTH_SHORT).show();
                    if (listener != null) {
                        listener.onTransferSuccess();
                    }
                    dismiss();
                } else {
                    String errorMsg = "Transfer failed: " + response.code();
                    try {
                        if (response.errorBody() != null) {
                            errorMsg = response.errorBody().string();
                        }
                    } catch (Exception ignored) {}
                    Toast.makeText(getContext(), errorMsg, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                btnConfirmTransfer.setEnabled(true);
                btnConfirmTransfer.setText("Transfer Funds");
                Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }
}
