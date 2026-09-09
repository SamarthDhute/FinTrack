package com.fintrack.app.ui;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.fintrack.app.R;
import com.fintrack.app.adapters.AllExpensesAdapter;
import com.fintrack.app.api.ApiClient;
import com.fintrack.app.models.Category;
import com.fintrack.app.models.Expense;
import com.fintrack.app.models.ExpensesResponse;
import com.fintrack.app.utils.CurrencyFormatter;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import java.util.ArrayList;
import java.util.List;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ExpensesFragment extends Fragment {

    private EditText etSearchExpenses;
    private Spinner spFilterCategory;
    private com.google.android.material.button.MaterialButton btnManageCategories;
    private RecyclerView rvAllExpenses;
    private FloatingActionButton fabAddExpense;
    private SwipeRefreshLayout swipeRefreshExpenses;

    private AllExpensesAdapter expensesAdapter;
    private List<Category> categoriesList = new ArrayList<>();
    private Integer selectedCategoryId = null;
    private String currentSearchQuery = null;

    private Handler searchHandler = new Handler(Looper.getMainLooper());
    private Runnable searchRunnable;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_expenses, container, false);
        initViews(view);
        setupRecyclerView();
        setupListeners();
        loadCategories();
        return view;
    }

    private void initViews(View view) {
        etSearchExpenses = view.findViewById(R.id.etSearchExpenses);
        spFilterCategory = view.findViewById(R.id.spFilterCategory);
        btnManageCategories = view.findViewById(R.id.btnManageCategories);
        rvAllExpenses = view.findViewById(R.id.rvAllExpenses);
        fabAddExpense = view.findViewById(R.id.fabAddExpense);
        swipeRefreshExpenses = view.findViewById(R.id.swipeRefreshExpenses);
    }

    private void setupRecyclerView() {
        expensesAdapter = new AllExpensesAdapter(this::openEditExpense, this::confirmDeleteExpense);
        rvAllExpenses.setLayoutManager(new LinearLayoutManager(getContext()));
        rvAllExpenses.setAdapter(expensesAdapter);
    }

    private void setupListeners() {
        swipeRefreshExpenses.setOnRefreshListener(this::loadExpenses);

        btnManageCategories.setOnClickListener(v -> {
            if (getContext() != null) {
                new ManageCategoriesDialog(getContext(), this::loadCategories).show();
            }
        });

        fabAddExpense.setOnClickListener(v -> {
            startActivity(new Intent(getActivity(), AddExpenseActivity.class));
        });

        // Live Search with Debounce
        etSearchExpenses.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (searchRunnable != null) {
                    searchHandler.removeCallbacks(searchRunnable);
                }
                searchRunnable = () -> {
                    currentSearchQuery = s.toString().trim().isEmpty() ? null : s.toString().trim();
                    loadExpenses();
                };
                searchHandler.postDelayed(searchRunnable, 350);
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });

        spFilterCategory.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                if (position == 0) {
                    selectedCategoryId = null;
                } else if (position - 1 < categoriesList.size()) {
                    selectedCategoryId = categoriesList.get(position - 1).getId();
                }
                loadExpenses();
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        loadExpenses();
    }

    private void loadCategories() {
        if (getContext() == null) return;
        ApiClient.getService(getContext()).getCategories().enqueue(new Callback<List<Category>>() {
            @Override
            public void onResponse(Call<List<Category>> call, Response<List<Category>> response) {
                if (response.isSuccessful() && response.body() != null && getContext() != null) {
                    categoriesList = response.body();
                    List<String> names = new ArrayList<>();
                    names.add("All Categories");
                    for (Category c : categoriesList) {
                        names.add(c.getName());
                    }
                    ArrayAdapter<String> adapter = new ArrayAdapter<>(
                            getContext(),
                            android.R.layout.simple_spinner_dropdown_item,
                            names
                    );
                    spFilterCategory.setAdapter(adapter);
                }
            }

            @Override
            public void onFailure(Call<List<Category>> call, Throwable t) {}
        });
    }

    public void loadExpenses() {
        if (getContext() == null) return;
        swipeRefreshExpenses.setRefreshing(true);

        ApiClient.getService(getContext()).getExpenses(
                currentSearchQuery,
                selectedCategoryId,
                0,
                100
        ).enqueue(new Callback<ExpensesResponse>() {
            @Override
            public void onResponse(Call<ExpensesResponse> call, Response<ExpensesResponse> response) {
                swipeRefreshExpenses.setRefreshing(false);
                if (response.code() == 401 && getActivity() instanceof DashboardActivity) {
                    ((DashboardActivity) getActivity()).handleSessionExpired();
                    return;
                }
                if (response.isSuccessful() && response.body() != null) {
                    expensesAdapter.setExpenses(response.body().getItems());
                }
            }

            @Override
            public void onFailure(Call<ExpensesResponse> call, Throwable t) {
                swipeRefreshExpenses.setRefreshing(false);
            }
        });
    }

    private void confirmDeleteExpense(Expense expense) {
        if (getContext() == null) return;

        new AlertDialog.Builder(getContext(), R.style.Theme_FinTrack_Dialog)
                .setTitle("Delete Expense")
                .setMessage("Are you sure you want to delete '" + expense.getTitle() + "' ("
                        + CurrencyFormatter.formatINR(expense.getAmount()) + ")?\n\nThe amount will be refunded to your wallet.")
                .setPositiveButton("Delete & Refund", (dialog, which) -> {
                    deleteExpense(expense.getId());
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void deleteExpense(int expenseId) {
        if (getContext() == null) return;
        ApiClient.getService(getContext()).deleteExpense(expenseId).enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(getContext(), "Expense deleted & refunded to wallet", Toast.LENGTH_SHORT).show();
                    loadExpenses();
                } else {
                    Toast.makeText(getContext(), "Failed to delete expense", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                Toast.makeText(getContext(), "Network error while deleting", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void openEditExpense(Expense expense) {
        if (getActivity() == null || expense == null) return;
        Intent intent = new Intent(getActivity(), AddExpenseActivity.class);
        intent.putExtra(AddExpenseActivity.EXTRA_EXPENSE_ID, expense.getId());
        intent.putExtra(AddExpenseActivity.EXTRA_EXPENSE_AMOUNT, expense.getAmount());
        intent.putExtra(AddExpenseActivity.EXTRA_EXPENSE_TITLE, expense.getTitle());
        intent.putExtra(AddExpenseActivity.EXTRA_EXPENSE_DATE, expense.getDate());
        if (expense.getCategoryId() != null) {
            intent.putExtra(AddExpenseActivity.EXTRA_EXPENSE_CATEGORY_ID, expense.getCategoryId());
        }
        if (expense.getPaymentMethodId() != null) {
            intent.putExtra(AddExpenseActivity.EXTRA_EXPENSE_PAYMENT_METHOD_ID, expense.getPaymentMethodId());
        }
        if (expense.getWalletId() != null) {
            intent.putExtra(AddExpenseActivity.EXTRA_EXPENSE_WALLET_ID, expense.getWalletId());
        }
        if (expense.getNotes() != null) {
            intent.putExtra(AddExpenseActivity.EXTRA_EXPENSE_NOTES, expense.getNotes());
        }
        startActivity(intent);
    }
}
