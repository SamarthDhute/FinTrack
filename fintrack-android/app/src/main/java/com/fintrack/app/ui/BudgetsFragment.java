package com.fintrack.app.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.fintrack.app.R;
import com.fintrack.app.adapters.BudgetAdapter;
import com.fintrack.app.api.ApiClient;
import com.fintrack.app.models.Budget;
import com.fintrack.app.models.Category;
import com.fintrack.app.utils.CurrencyFormatter;
import com.google.android.material.button.MaterialButton;
import java.util.ArrayList;
import java.util.List;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class BudgetsFragment extends Fragment implements BudgetAdapter.OnBudgetActionListener {

    private MaterialButton btnSetBudget;
    private RecyclerView rvBudgets;
    private TextView tvNoBudgets;
    private SwipeRefreshLayout swipeRefreshBudgets;
    private com.google.android.material.chip.ChipGroup chipGroupBudgetPeriod;

    private BudgetAdapter budgetAdapter;
    private List<Category> categoriesList = new ArrayList<>();
    private String selectedPeriod = null; // null fetches ALL budgets (both Daily and Monthly)

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_budgets, container, false);
        initViews(view);
        setupRecyclerView();
        setupListeners();
        loadCategories();
        return view;
    }

    private void initViews(View view) {
        btnSetBudget = view.findViewById(R.id.btnSetBudget);
        rvBudgets = view.findViewById(R.id.rvBudgets);
        tvNoBudgets = view.findViewById(R.id.tvNoBudgets);
        swipeRefreshBudgets = view.findViewById(R.id.swipeRefreshBudgets);
        chipGroupBudgetPeriod = view.findViewById(R.id.chipGroupBudgetPeriod);
    }

    private void setupRecyclerView() {
        budgetAdapter = new BudgetAdapter(this);
        rvBudgets.setLayoutManager(new LinearLayoutManager(getContext()));
        rvBudgets.setAdapter(budgetAdapter);
    }

    private void setupListeners() {
        swipeRefreshBudgets.setOnRefreshListener(this::loadBudgets);

        btnSetBudget.setOnClickListener(v -> {
            if (getContext() == null) return;
            new SetBudgetDialog(getContext(), categoriesList, this::loadBudgets).show();
        });

        if (chipGroupBudgetPeriod != null) {
            chipGroupBudgetPeriod.setOnCheckedStateChangeListener((group, checkedIds) -> {
                if (checkedIds.isEmpty()) return;
                int checkedId = checkedIds.get(0);
                if (checkedId == R.id.chipBudgetFilterDaily) {
                    selectedPeriod = "daily";
                } else if (checkedId == R.id.chipBudgetFilterMonthly) {
                    selectedPeriod = "monthly";
                } else {
                    selectedPeriod = null; // All budgets
                }
                loadBudgets();
            });
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        loadBudgets();
    }

    private void loadCategories() {
        if (getContext() == null) return;
        ApiClient.getService(getContext()).getCategories().enqueue(new Callback<List<Category>>() {
            @Override
            public void onResponse(Call<List<Category>> call, Response<List<Category>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    categoriesList = response.body();
                }
            }

            @Override
            public void onFailure(Call<List<Category>> call, Throwable t) {}
        });
    }

    public void loadBudgets() {
        if (getContext() == null) return;
        swipeRefreshBudgets.setRefreshing(true);

        ApiClient.getService(getContext()).getBudgets(selectedPeriod).enqueue(new Callback<List<Budget>>() {
            @Override
            public void onResponse(Call<List<Budget>> call, Response<List<Budget>> response) {
                swipeRefreshBudgets.setRefreshing(false);
                if (response.code() == 401 && getActivity() instanceof DashboardActivity) {
                    ((DashboardActivity) getActivity()).handleSessionExpired();
                    return;
                }
                if (response.isSuccessful() && response.body() != null) {
                    List<Budget> budgets = response.body();
                    budgetAdapter.setBudgets(budgets);
                    tvNoBudgets.setVisibility(budgets.isEmpty() ? View.VISIBLE : View.GONE);
                }
            }

            @Override
            public void onFailure(Call<List<Budget>> call, Throwable t) {
                swipeRefreshBudgets.setRefreshing(false);
                Toast.makeText(getContext(), "Failed to load budgets: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    public void onEditBudget(Budget budget) {
        if (getContext() == null) return;
        new SetBudgetDialog(getContext(), categoriesList, budget, this::loadBudgets).show();
    }

    @Override
    public void onDeleteBudget(Budget budget) {
        if (getContext() == null) return;

        new AlertDialog.Builder(getContext(), R.style.Theme_FinTrack_Dialog)
                .setTitle("Delete Budget")
                .setMessage("Remove budget for '" + budget.getCategoryName() + "' ("
                        + CurrencyFormatter.formatINR(budget.getAmountLimit()) + ")?")
                .setPositiveButton("Delete", (dialog, which) -> {
                    ApiClient.getService(getContext()).deleteBudget(budget.getId()).enqueue(new Callback<ResponseBody>() {
                        @Override
                        public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                            if (response.isSuccessful()) {
                                Toast.makeText(getContext(), "Budget removed", Toast.LENGTH_SHORT).show();
                                loadBudgets();
                            }
                        }

                        @Override
                        public void onFailure(Call<ResponseBody> call, Throwable t) {
                            Toast.makeText(getContext(), "Failed to delete budget", Toast.LENGTH_SHORT).show();
                        }
                    });
                })
                .setNegativeButton("Cancel", null)
                .show();
    }
}
