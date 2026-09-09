package com.fintrack.app.ui;

import android.app.Dialog;
import android.content.Context;
import android.os.Bundle;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import com.fintrack.app.R;
import com.fintrack.app.api.ApiClient;
import com.fintrack.app.models.Debt;
import com.fintrack.app.models.DebtRepaymentRequest;
import com.fintrack.app.utils.CurrencyFormatter;
import com.google.android.material.button.MaterialButton;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DebtRepaymentDialog extends Dialog {

    public interface OnRepaymentSuccessListener {
        void onRepaymentSuccess();
    }

    private final Debt debt;
    private final OnRepaymentSuccessListener listener;
    private TextView tvRepaymentTarget;
    private EditText etRepayAmount, etRepayNotes;
    private MaterialButton btnConfirmRepay, btnCancelRepay;

    public DebtRepaymentDialog(@NonNull Context context, Debt debt, OnRepaymentSuccessListener listener) {
        super(context);
        this.debt = debt;
        this.listener = listener;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.dialog_debt_repayment);

        if (getWindow() != null) {
            getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }

        initViews();
        setupListeners();
    }

    private void initViews() {
        tvRepaymentTarget = findViewById(R.id.tvRepaymentTarget);
        etRepayAmount = findViewById(R.id.etRepayAmount);
        etRepayNotes = findViewById(R.id.etRepayNotes);
        btnConfirmRepay = findViewById(R.id.btnConfirmRepay);
        btnCancelRepay = findViewById(R.id.btnCancelRepay);

        tvRepaymentTarget.setText("Target: " + debt.getPersonName() + " • Pending: " + CurrencyFormatter.formatINR(debt.getRemainingAmount()));
        etRepayAmount.setText(String.valueOf((int) debt.getRemainingAmount()));
    }

    private void setupListeners() {
        btnCancelRepay.setOnClickListener(v -> dismiss());
        btnConfirmRepay.setOnClickListener(v -> performRepay());
    }

    private void performRepay() {
        String amountStr = etRepayAmount.getText().toString().trim();
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

        String notes = etRepayNotes.getText().toString().trim();
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());

        btnConfirmRepay.setEnabled(false);
        btnConfirmRepay.setText("Saving...");

        DebtRepaymentRequest request = new DebtRepaymentRequest(amount, today, "UPI", notes);
        ApiClient.getService(getContext()).recordRepayment(debt.getId(), request).enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                btnConfirmRepay.setEnabled(true);
                btnConfirmRepay.setText("Record Return");

                if (response.isSuccessful()) {
                    Toast.makeText(getContext(), "✅ Repayment recorded!", Toast.LENGTH_SHORT).show();
                    if (listener != null) {
                        listener.onRepaymentSuccess();
                    }
                    dismiss();
                } else {
                    String errorMsg = "Failed: " + response.code();
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
                btnConfirmRepay.setEnabled(true);
                btnConfirmRepay.setText("Record Return");
                Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }
}
