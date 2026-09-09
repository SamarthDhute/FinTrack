package com.fintrack.app.ui;

import android.content.res.ColorStateList;
import android.graphics.Color;
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
import com.fintrack.app.adapters.DebtAdapter;
import com.fintrack.app.api.ApiClient;
import com.fintrack.app.models.Debt;
import com.fintrack.app.models.DebtSummary;
import com.fintrack.app.models.DebtsResponse;
import com.fintrack.app.utils.CurrencyFormatter;
import com.google.android.material.button.MaterialButton;
import java.util.ArrayList;
import java.util.List;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DebtsFragment extends Fragment implements DebtAdapter.OnDebtActionListener {

    private MaterialButton btnAddDebt;
    private TextView tvTotalLent, tvTotalBorrowed, tvNoDebts;
    private MaterialButton btnFilterAll, btnFilterLent, btnFilterBorrowed, btnFilterSettled;
    private RecyclerView rvDebts;
    private SwipeRefreshLayout swipeRefreshDebts;

    private DebtAdapter debtAdapter;
    private List<Debt> allDebtsList = new ArrayList<>();
    private String currentFilter = "ALL";

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_debts, container, false);
        initViews(view);
        setupRecyclerView();
        setupListeners();
        return view;
    }

    private void initViews(View view) {
        btnAddDebt = view.findViewById(R.id.btnAddDebt);
        tvTotalLent = view.findViewById(R.id.tvTotalLent);
        tvTotalBorrowed = view.findViewById(R.id.tvTotalBorrowed);
        tvNoDebts = view.findViewById(R.id.tvNoDebts);
        btnFilterAll = view.findViewById(R.id.btnFilterAll);
        btnFilterLent = view.findViewById(R.id.btnFilterLent);
        btnFilterBorrowed = view.findViewById(R.id.btnFilterBorrowed);
        btnFilterSettled = view.findViewById(R.id.btnFilterSettled);
        rvDebts = view.findViewById(R.id.rvDebts);
        swipeRefreshDebts = view.findViewById(R.id.swipeRefreshDebts);
    }

    private void setupRecyclerView() {
        debtAdapter = new DebtAdapter(this);
        rvDebts.setLayoutManager(new LinearLayoutManager(getContext()));
        rvDebts.setAdapter(debtAdapter);
    }

    private void setupListeners() {
        swipeRefreshDebts.setOnRefreshListener(this::loadData);

        btnAddDebt.setOnClickListener(v -> {
            if (getContext() == null) return;
            new AddDebtDialog(getContext(), this::loadData).show();
        });

        btnFilterAll.setOnClickListener(v -> setFilter("ALL"));
        btnFilterLent.setOnClickListener(v -> setFilter("LENT"));
        btnFilterBorrowed.setOnClickListener(v -> setFilter("BORROWED"));
        btnFilterSettled.setOnClickListener(v -> setFilter("SETTLED"));
    }

    private void setFilter(String filter) {
        currentFilter = filter;
        updateFilterButtonStyles();
        applyFilter();
    }

    private void updateFilterButtonStyles() {
        if (getContext() == null) return;
        int activeColor = androidx.core.content.ContextCompat.getColor(requireContext(), R.color.primary);
        int inactiveText = androidx.core.content.ContextCompat.getColor(requireContext(), R.color.text_secondary);
        int transparent = Color.TRANSPARENT;

        btnFilterAll.setBackgroundTintList(ColorStateList.valueOf("ALL".equals(currentFilter) ? activeColor : transparent));
        btnFilterAll.setTextColor("ALL".equals(currentFilter) ? Color.WHITE : inactiveText);

        btnFilterLent.setBackgroundTintList(ColorStateList.valueOf("LENT".equals(currentFilter) ? activeColor : transparent));
        btnFilterLent.setTextColor("LENT".equals(currentFilter) ? Color.WHITE : inactiveText);

        btnFilterBorrowed.setBackgroundTintList(ColorStateList.valueOf("BORROWED".equals(currentFilter) ? activeColor : transparent));
        btnFilterBorrowed.setTextColor("BORROWED".equals(currentFilter) ? Color.WHITE : inactiveText);

        btnFilterSettled.setBackgroundTintList(ColorStateList.valueOf("SETTLED".equals(currentFilter) ? activeColor : transparent));
        btnFilterSettled.setTextColor("SETTLED".equals(currentFilter) ? Color.WHITE : inactiveText);
    }

    private void applyFilter() {
        List<Debt> filtered = new ArrayList<>();
        for (Debt d : allDebtsList) {
            if ("ALL".equals(currentFilter)) {
                filtered.add(d);
            } else if ("LENT".equals(currentFilter) && d.isLent()) {
                filtered.add(d);
            } else if ("BORROWED".equals(currentFilter) && !d.isLent()) {
                filtered.add(d);
            } else if ("SETTLED".equals(currentFilter) && d.isSettled()) {
                filtered.add(d);
            }
        }
        debtAdapter.setDebts(filtered);
        tvNoDebts.setVisibility(filtered.isEmpty() ? View.VISIBLE : View.GONE);
    }

    @Override
    public void onResume() {
        super.onResume();
        loadData();
    }

    public void loadData() {
        if (getContext() == null) return;
        swipeRefreshDebts.setRefreshing(true);

        // 1. Fetch Debt Summary
        ApiClient.getService(getContext()).getDebtSummary().enqueue(new Callback<DebtSummary>() {
            @Override
            public void onResponse(Call<DebtSummary> call, Response<DebtSummary> response) {
                if (response.code() == 401 && getActivity() instanceof DashboardActivity) {
                    ((DashboardActivity) getActivity()).handleSessionExpired();
                    return;
                }
                if (response.isSuccessful() && response.body() != null) {
                    DebtSummary summary = response.body();
                    tvTotalLent.setText(CurrencyFormatter.formatINR(summary.getTotalLent()));
                    tvTotalBorrowed.setText(CurrencyFormatter.formatINR(summary.getTotalBorrowed()));
                }
            }

            @Override
            public void onFailure(Call<DebtSummary> call, Throwable t) {}
        });

        // 2. Fetch Debts List
        ApiClient.getService(getContext()).getDebts().enqueue(new Callback<DebtsResponse>() {
            @Override
            public void onResponse(Call<DebtsResponse> call, Response<DebtsResponse> response) {
                swipeRefreshDebts.setRefreshing(false);
                if (response.isSuccessful() && response.body() != null) {
                    allDebtsList = response.body().getItems();
                    applyFilter();
                }
            }

            @Override
            public void onFailure(Call<DebtsResponse> call, Throwable t) {
                swipeRefreshDebts.setRefreshing(false);
            }
        });
    }

    @Override
    public void onRecordRepayment(Debt debt) {
        if (getContext() == null || debt == null) return;
        new DebtRepaymentDialog(getContext(), debt, this::loadData).show();
    }

    @Override
    public void onEditDebt(Debt debt) {
        if (getContext() == null || debt == null) return;
        new EditDebtDialog(getContext(), debt, this::loadData).show();
    }

    @Override
    public void onDeleteDebt(Debt debt) {
        if (getContext() == null) return;

        new AlertDialog.Builder(getContext(), R.style.Theme_FinTrack_Dialog)
                .setTitle("Delete Debt Record")
                .setMessage("Are you sure you want to delete debt record for '" + debt.getPersonName() + "' ("
                        + CurrencyFormatter.formatINR(debt.getRemainingAmount()) + ")?")
                .setPositiveButton("Delete", (dialog, which) -> {
                    ApiClient.getService(getContext()).deleteDebt(debt.getId()).enqueue(new Callback<ResponseBody>() {
                        @Override
                        public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                            if (response.isSuccessful()) {
                                Toast.makeText(getContext(), "Debt record deleted", Toast.LENGTH_SHORT).show();
                                loadData();
                            }
                        }

                        @Override
                        public void onFailure(Call<ResponseBody> call, Throwable t) {
                            Toast.makeText(getContext(), "Failed to delete debt", Toast.LENGTH_SHORT).show();
                        }
                    });
                })
                .setNegativeButton("Cancel", null)
                .show();
    }
}
