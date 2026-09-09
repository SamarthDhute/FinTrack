package com.fintrack.app.ui;

import android.app.Dialog;
import android.content.Context;
import android.os.Bundle;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import com.fintrack.app.R;
import com.fintrack.app.api.ApiClient;
import com.fintrack.app.models.Budget;
import com.fintrack.app.models.BudgetCreateRequest;
import com.fintrack.app.models.BudgetUpdateRequest;
import com.fintrack.app.models.Category;
import com.google.android.material.button.MaterialButton;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SetBudgetDialog extends Dialog {

    public interface OnBudgetSetListener {
        void onBudgetSet();
    }

    private final List<Category> categories;
    private final Budget budgetToEdit;
    private final OnBudgetSetListener listener;
    private TextView tvBudgetDialogTitle;
    private Spinner spBudgetPeriod, spBudgetCategory;
    private EditText etBudgetLimit;
    private MaterialButton btnConfirmBudget, btnCancelBudget;

    private static final String[] PERIOD_LABELS = {"Overall Monthly Budget", "Daily Spending Limit"};
    private static final String[] PERIOD_VALUES = {"monthly", "daily"};

    public SetBudgetDialog(@NonNull Context context, List<Category> categories, OnBudgetSetListener listener) {
        this(context, categories, null, listener);
    }

    public SetBudgetDialog(@NonNull Context context, List<Category> categories, Budget budgetToEdit, OnBudgetSetListener listener) {
        super(context);
        this.categories = (categories != null) ? categories : new ArrayList<>();
        this.budgetToEdit = budgetToEdit;
        this.listener = listener;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.dialog_set_budget);

        if (getWindow() != null) {
            getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }

        initViews();
        setupSpinners();
        setupListeners();
    }

    private void initViews() {
        tvBudgetDialogTitle = findViewById(R.id.tvBudgetDialogTitle);
        spBudgetPeriod = findViewById(R.id.spBudgetPeriod);
        spBudgetCategory = findViewById(R.id.spBudgetCategory);
        etBudgetLimit = findViewById(R.id.etBudgetLimit);
        btnConfirmBudget = findViewById(R.id.btnConfirmBudget);
        btnCancelBudget = findViewById(R.id.btnCancelBudget);

        if (budgetToEdit != null) {
            if (tvBudgetDialogTitle != null) {
                tvBudgetDialogTitle.setText("🎯 Edit Spending Limit");
            }
            btnConfirmBudget.setText("Update Limit");
            etBudgetLimit.setText(String.format(Locale.US, "%.0f", budgetToEdit.getAmountLimit()));
        }
    }

    private void setupSpinners() {
        ArrayAdapter<String> periodAdapter = new ArrayAdapter<>(getContext(),
                android.R.layout.simple_spinner_dropdown_item, PERIOD_LABELS);
        spBudgetPeriod.setAdapter(periodAdapter);

        List<String> catLabels = new ArrayList<>();
        catLabels.add("None (Overall Budget)");
        for (Category c : categories) {
            catLabels.add(c.getName());
        }

        ArrayAdapter<String> catAdapter = new ArrayAdapter<>(getContext(),
                android.R.layout.simple_spinner_dropdown_item, catLabels);
        spBudgetCategory.setAdapter(catAdapter);

        if (budgetToEdit != null) {
            // Select period
            if ("daily".equalsIgnoreCase(budgetToEdit.getPeriod())) {
                spBudgetPeriod.setSelection(1);
            } else {
                spBudgetPeriod.setSelection(0);
            }

            // Select category
            if (budgetToEdit.getCategoryId() != null) {
                for (int i = 0; i < categories.size(); i++) {
                    if (categories.get(i).getId() == budgetToEdit.getCategoryId()) {
                        spBudgetCategory.setSelection(i + 1);
                        break;
                    }
                }
            } else {
                spBudgetCategory.setSelection(0);
            }

            // Cannot change category of existing budget (backend schema constraint)
            spBudgetCategory.setEnabled(false);
        }
    }

    private void setupListeners() {
        btnCancelBudget.setOnClickListener(v -> dismiss());
        btnConfirmBudget.setOnClickListener(v -> performSave());
    }

    private void performSave() {
        String limitStr = etBudgetLimit.getText().toString().trim();
        if (limitStr.isEmpty()) {
            Toast.makeText(getContext(), "Please enter a budget limit", Toast.LENGTH_SHORT).show();
            return;
        }

        double limit;
        try {
            limit = Double.parseDouble(limitStr);
            if (limit <= 0) {
                Toast.makeText(getContext(), "Limit must be greater than 0", Toast.LENGTH_SHORT).show();
                return;
            }
        } catch (NumberFormatException e) {
            Toast.makeText(getContext(), "Invalid limit", Toast.LENGTH_SHORT).show();
            return;
        }

        String period = PERIOD_VALUES[spBudgetPeriod.getSelectedItemPosition()];

        btnConfirmBudget.setEnabled(false);
        btnConfirmBudget.setText("Saving...");

        if (budgetToEdit != null) {
            // Update existing budget
            BudgetUpdateRequest updateRequest = new BudgetUpdateRequest(limit, period);
            ApiClient.getService(getContext()).updateBudget(budgetToEdit.getId(), updateRequest).enqueue(new Callback<Budget>() {
                @Override
                public void onResponse(Call<Budget> call, Response<Budget> response) {
                    btnConfirmBudget.setEnabled(true);
                    btnConfirmBudget.setText("Update Limit");

                    if (response.isSuccessful()) {
                        Toast.makeText(getContext(), "✅ Budget limit updated!", Toast.LENGTH_SHORT).show();
                        if (listener != null) {
                            listener.onBudgetSet();
                        }
                        dismiss();
                    } else {
                        String errorMsg = "Failed to update: " + response.code();
                        try {
                            if (response.errorBody() != null) {
                                errorMsg = response.errorBody().string();
                            }
                        } catch (Exception ignored) {}
                        Toast.makeText(getContext(), errorMsg, Toast.LENGTH_LONG).show();
                    }
                }

                @Override
                public void onFailure(Call<Budget> call, Throwable t) {
                    btnConfirmBudget.setEnabled(true);
                    btnConfirmBudget.setText("Update Limit");
                    Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        } else {
            // Create new budget
            Integer categoryId = null;
            int catPos = spBudgetCategory.getSelectedItemPosition();
            if (catPos > 0 && (catPos - 1) < categories.size()) {
                categoryId = categories.get(catPos - 1).getId();
            }

            BudgetCreateRequest request = new BudgetCreateRequest(categoryId, limit, period);
            ApiClient.getService(getContext()).createBudget(request).enqueue(new Callback<Budget>() {
                @Override
                public void onResponse(Call<Budget> call, Response<Budget> response) {
                    btnConfirmBudget.setEnabled(true);
                    btnConfirmBudget.setText("Save Limit");

                    if (response.isSuccessful()) {
                        Toast.makeText(getContext(), "✅ Budget limit saved!", Toast.LENGTH_SHORT).show();
                        if (listener != null) {
                            listener.onBudgetSet();
                        }
                        dismiss();
                    } else {
                        String errorMsg = "Failed to save: " + response.code();
                        try {
                            if (response.errorBody() != null) {
                                errorMsg = response.errorBody().string();
                            }
                        } catch (Exception ignored) {}
                        Toast.makeText(getContext(), errorMsg, Toast.LENGTH_LONG).show();
                    }
                }

                @Override
                public void onFailure(Call<Budget> call, Throwable t) {
                    btnConfirmBudget.setEnabled(true);
                    btnConfirmBudget.setText("Save Limit");
                    Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        }
    }
}
