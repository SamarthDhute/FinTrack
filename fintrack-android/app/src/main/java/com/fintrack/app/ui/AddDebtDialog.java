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
import com.fintrack.app.models.Debt;
import com.fintrack.app.models.DebtCreateRequest;
import com.google.android.material.button.MaterialButton;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AddDebtDialog extends Dialog {

    public interface OnDebtCreatedListener {
        void onDebtCreated();
    }

    private final OnDebtCreatedListener listener;
    private EditText etDebtPersonName, etDebtAmount, etDebtNotes;
    private Spinner spDebtType;
    private MaterialButton btnConfirmDebt, btnCancelDebt;

    private static final String[] DEBT_TYPES = {"Lent (Maine Diye - They owe me)", "Borrowed (Maine Liye - I owe them)"};
    private static final String[] DEBT_TYPE_VALUES = {"LENT", "BORROWED"};

    public AddDebtDialog(@NonNull Context context, OnDebtCreatedListener listener) {
        super(context);
        this.listener = listener;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.dialog_add_debt);

        if (getWindow() != null) {
            getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }

        initViews();
        setupSpinner();
        setupListeners();
    }

    private void initViews() {
        etDebtPersonName = findViewById(R.id.etDebtPersonName);
        etDebtAmount = findViewById(R.id.etDebtAmount);
        etDebtNotes = findViewById(R.id.etDebtNotes);
        spDebtType = findViewById(R.id.spDebtType);
        btnConfirmDebt = findViewById(R.id.btnConfirmDebt);
        btnCancelDebt = findViewById(R.id.btnCancelDebt);
    }

    private void setupSpinner() {
        ArrayAdapter<String> adapter = new ArrayAdapter<>(getContext(),
                android.R.layout.simple_spinner_dropdown_item, DEBT_TYPES);
        spDebtType.setAdapter(adapter);
    }

    private void setupListeners() {
        btnCancelDebt.setOnClickListener(v -> dismiss());
        btnConfirmDebt.setOnClickListener(v -> performAdd());
    }

    private void performAdd() {
        String name = etDebtPersonName.getText().toString().trim();
        if (name.isEmpty()) {
            Toast.makeText(getContext(), "Please enter person's name", Toast.LENGTH_SHORT).show();
            return;
        }

        String amountStr = etDebtAmount.getText().toString().trim();
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

        String debtType = DEBT_TYPE_VALUES[spDebtType.getSelectedItemPosition()];
        String notes = etDebtNotes.getText().toString().trim();

        btnConfirmDebt.setEnabled(false);
        btnConfirmDebt.setText("Adding...");

        DebtCreateRequest request = new DebtCreateRequest(name, debtType, amount, null, notes);
        ApiClient.getService(getContext()).createDebt(request).enqueue(new Callback<Debt>() {
            @Override
            public void onResponse(Call<Debt> call, Response<Debt> response) {
                btnConfirmDebt.setEnabled(true);
                btnConfirmDebt.setText("Add Debt");

                if (response.isSuccessful()) {
                    Toast.makeText(getContext(), "✅ Debt record added!", Toast.LENGTH_SHORT).show();
                    if (listener != null) {
                        listener.onDebtCreated();
                    }
                    dismiss();
                } else {
                    String errorMsg = "Failed to add debt: " + response.code();
                    try {
                        if (response.errorBody() != null) {
                            errorMsg = response.errorBody().string();
                        }
                    } catch (Exception ignored) {}
                    Toast.makeText(getContext(), errorMsg, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<Debt> call, Throwable t) {
                btnConfirmDebt.setEnabled(true);
                btnConfirmDebt.setText("Add Debt");
                Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }
}
