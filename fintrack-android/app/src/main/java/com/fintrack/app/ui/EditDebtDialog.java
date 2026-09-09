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
import com.fintrack.app.models.DebtUpdateRequest;
import com.google.android.material.button.MaterialButton;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class EditDebtDialog extends Dialog {

    public interface OnDebtUpdatedListener {
        void onDebtUpdated();
    }

    private final Debt debt;
    private final OnDebtUpdatedListener listener;
    private EditText etEditDebtPersonName, etEditDebtAmount, etEditDebtNotes;
    private Spinner spEditDebtType;
    private MaterialButton btnConfirmEditDebt, btnCancelEditDebt;

    private static final String[] DEBT_TYPES = {"Lent (Maine Diye - They owe me)", "Borrowed (Maine Liye - I owe them)"};
    private static final String[] DEBT_TYPE_VALUES = {"LENT", "BORROWED"};

    public EditDebtDialog(@NonNull Context context, Debt debt, OnDebtUpdatedListener listener) {
        super(context);
        this.debt = debt;
        this.listener = listener;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.dialog_edit_debt);

        if (getWindow() != null) {
            getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }

        initViews();
        setupSpinner();
        populateExistingData();
        setupListeners();
    }

    private void initViews() {
        etEditDebtPersonName = findViewById(R.id.etEditDebtPersonName);
        etEditDebtAmount = findViewById(R.id.etEditDebtAmount);
        etEditDebtNotes = findViewById(R.id.etEditDebtNotes);
        spEditDebtType = findViewById(R.id.spEditDebtType);
        btnConfirmEditDebt = findViewById(R.id.btnConfirmEditDebt);
        btnCancelEditDebt = findViewById(R.id.btnCancelEditDebt);
    }

    private void setupSpinner() {
        ArrayAdapter<String> adapter = new ArrayAdapter<>(getContext(),
                android.R.layout.simple_spinner_dropdown_item, DEBT_TYPES);
        spEditDebtType.setAdapter(adapter);
    }

    private void populateExistingData() {
        if (debt == null) return;
        etEditDebtPersonName.setText(debt.getPersonName());

        if (debt.getInitialAmount() == (long) debt.getInitialAmount()) {
            etEditDebtAmount.setText(String.valueOf((long) debt.getInitialAmount()));
        } else {
            etEditDebtAmount.setText(String.valueOf(debt.getInitialAmount()));
        }

        if (debt.isLent()) {
            spEditDebtType.setSelection(0);
        } else {
            spEditDebtType.setSelection(1);
        }

        etEditDebtNotes.setText(debt.getNotes());
    }

    private void setupListeners() {
        btnCancelEditDebt.setOnClickListener(v -> dismiss());
        btnConfirmEditDebt.setOnClickListener(v -> performUpdate());
    }

    private void performUpdate() {
        String name = etEditDebtPersonName.getText().toString().trim();
        if (name.isEmpty()) {
            Toast.makeText(getContext(), "Please enter person's name", Toast.LENGTH_SHORT).show();
            return;
        }

        String amountStr = etEditDebtAmount.getText().toString().trim();
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

        String debtType = DEBT_TYPE_VALUES[spEditDebtType.getSelectedItemPosition()];
        String notes = etEditDebtNotes.getText().toString().trim();

        btnConfirmEditDebt.setEnabled(false);
        btnConfirmEditDebt.setText("Saving...");

        DebtUpdateRequest request = new DebtUpdateRequest(name, debtType, amount, null, notes);
        ApiClient.getService(getContext()).updateDebt(debt.getId(), request).enqueue(new Callback<Debt>() {
            @Override
            public void onResponse(Call<Debt> call, Response<Debt> response) {
                btnConfirmEditDebt.setEnabled(true);
                btnConfirmEditDebt.setText("Save Changes");

                if (response.isSuccessful()) {
                    Toast.makeText(getContext(), "✅ Debt record updated!", Toast.LENGTH_SHORT).show();
                    if (listener != null) {
                        listener.onDebtUpdated();
                    }
                    dismiss();
                } else {
                    String errorMsg = "Failed to update debt: " + response.code();
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
                btnConfirmEditDebt.setEnabled(true);
                btnConfirmEditDebt.setText("Save Changes");
                Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
}
