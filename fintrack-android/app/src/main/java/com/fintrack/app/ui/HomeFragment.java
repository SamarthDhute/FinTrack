package com.fintrack.app.ui;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.fintrack.app.R;
import com.fintrack.app.adapters.ExpenseAdapter;
import com.fintrack.app.adapters.WalletAdapter;
import com.fintrack.app.api.ApiClient;
import com.fintrack.app.models.*;
import com.fintrack.app.utils.CurrencyFormatter;
import com.google.android.material.button.MaterialButton;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class HomeFragment extends Fragment implements WalletAdapter.OnWalletActionListener {

    private TextView tvNetWorth, tvLiquidBalance, tvCreditDue;
    private TextView tvVibeStatus, tvVibeSubtitle, tvBurnRatePace, tvTodaySpend, tvDailyTarget, tvMonthSpendValue;
    private TextView tvMonthSpentHome, tvViewAllWallets;
    private MaterialButton btnVibeAdvice, btnQuickExpense, btnQuickDeposit;
    private View cardHeroVibe;
    private TextView tvRoastBurnBadge, tvRoastPunchline, tvRoastToggleDetails, tvRoastBody;
    private MaterialButton btnRoastMe, btnRoastChat;
    private RecyclerView rvWalletsHome, rvExpensesHome;
    private SwipeRefreshLayout swipeRefreshHome;

    private WalletAdapter walletAdapter;
    private ExpenseAdapter expenseAdapter;
    private List<Wallet> userWallets = new ArrayList<>();

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_home, container, false);
        initViews(view);
        setupRecyclerViews();
        setupListeners();
        return view;
    }

    private void initViews(View view) {
        tvNetWorth = view.findViewById(R.id.tvNetWorth);
        tvLiquidBalance = view.findViewById(R.id.tvLiquidBalance);
        tvCreditDue = view.findViewById(R.id.tvCreditDue);

        tvVibeStatus = view.findViewById(R.id.tvVibeStatus);
        tvVibeSubtitle = view.findViewById(R.id.tvVibeSubtitle);
        btnVibeAdvice = view.findViewById(R.id.btnVibeAdvice);
        cardHeroVibe = view.findViewById(R.id.cardHeroVibe);

        tvRoastBurnBadge = view.findViewById(R.id.tvRoastBurnBadge);
        tvRoastPunchline = view.findViewById(R.id.tvRoastPunchline);
        tvRoastToggleDetails = view.findViewById(R.id.tvRoastToggleDetails);
        tvRoastBody = view.findViewById(R.id.tvRoastBody);
        btnRoastMe = view.findViewById(R.id.btnRoastMe);
        btnRoastChat = view.findViewById(R.id.btnRoastChat);

        tvBurnRatePace = view.findViewById(R.id.tvBurnRatePace);
        tvTodaySpend = view.findViewById(R.id.tvTodaySpend);
        tvDailyTarget = view.findViewById(R.id.tvDailyTarget);
        tvMonthSpendValue = view.findViewById(R.id.tvMonthSpendValue);

        tvMonthSpentHome = view.findViewById(R.id.tvMonthSpentHome);
        tvViewAllWallets = view.findViewById(R.id.tvViewAllWallets);
        btnQuickExpense = view.findViewById(R.id.btnQuickExpense);
        btnQuickDeposit = view.findViewById(R.id.btnQuickDeposit);
        rvWalletsHome = view.findViewById(R.id.rvWalletsHome);
        rvExpensesHome = view.findViewById(R.id.rvExpensesHome);
        swipeRefreshHome = view.findViewById(R.id.swipeRefreshHome);
    }

    private void setupRecyclerViews() {
        walletAdapter = new WalletAdapter(this);
        rvWalletsHome.setLayoutManager(new LinearLayoutManager(getContext(), LinearLayoutManager.HORIZONTAL, false));
        rvWalletsHome.setAdapter(walletAdapter);

        expenseAdapter = new ExpenseAdapter(this::openEditExpense);
        rvExpensesHome.setLayoutManager(new LinearLayoutManager(getContext()));
        rvExpensesHome.setAdapter(expenseAdapter);
    }

    private void setupListeners() {
        swipeRefreshHome.setOnRefreshListener(this::loadData);

        cardHeroVibe.setOnClickListener(v -> {
            startActivity(new Intent(getActivity(), AIHubActivity.class));
        });

        btnVibeAdvice.setOnClickListener(v -> {
            startActivity(new Intent(getActivity(), AIHubActivity.class));
        });

        btnQuickExpense.setOnClickListener(v -> {
            startActivity(new Intent(getActivity(), AddExpenseActivity.class));
        });

        btnQuickDeposit.setOnClickListener(v -> {
            if (!userWallets.isEmpty()) {
                showDepositDialog(userWallets.get(0));
            } else {
                Toast.makeText(getContext(), "No wallets available. Please create one.", Toast.LENGTH_SHORT).show();
            }
        });

        tvViewAllWallets.setOnClickListener(v -> {
            if (getActivity() instanceof DashboardActivity) {
                ((DashboardActivity) getActivity()).switchToTab(R.id.nav_wallets);
            }
        });

        if (btnRoastMe != null) {
            btnRoastMe.setOnClickListener(v -> loadRoast());
        }
        if (btnRoastChat != null) {
            btnRoastChat.setOnClickListener(v -> {
                if (getContext() != null) {
                    new AIChatDialog(getContext()).show();
                }
            });
        }

        if (tvRoastToggleDetails != null) {
            tvRoastToggleDetails.setOnClickListener(v -> toggleRoastDetails());
        }
        if (tvRoastPunchline != null) {
            tvRoastPunchline.setOnClickListener(v -> toggleRoastDetails());
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        loadData();
    }

    public void loadData() {
        if (getContext() == null) return;
        swipeRefreshHome.setRefreshing(true);

        // Load AI Roast
        loadRoast();

        // 1. Fetch Wallet Summary (Net Worth)
        ApiClient.getService(getContext()).getWalletSummary().enqueue(new Callback<WalletSummary>() {
            @Override
            public void onResponse(Call<WalletSummary> call, Response<WalletSummary> response) {
                if (response.code() == 401 && getActivity() instanceof DashboardActivity) {
                    ((DashboardActivity) getActivity()).handleSessionExpired();
                    return;
                }
                if (response.isSuccessful() && response.body() != null) {
                    WalletSummary summary = response.body();
                    tvNetWorth.setText(CurrencyFormatter.formatINR(summary.getNetWorth()));
                    tvLiquidBalance.setText(CurrencyFormatter.formatINR(summary.getTotalLiquidBalance()));
                    tvCreditDue.setText(CurrencyFormatter.formatINR(summary.getTotalCreditDue()));
                }
            }

            @Override
            public void onFailure(Call<WalletSummary> call, Throwable t) {}
        });

        // 2. Fetch Wallets
        ApiClient.getService(getContext()).getWallets().enqueue(new Callback<List<Wallet>>() {
            @Override
            public void onResponse(Call<List<Wallet>> call, Response<List<Wallet>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    userWallets = response.body();
                    walletAdapter.setWallets(userWallets);
                }
            }

            @Override
            public void onFailure(Call<List<Wallet>> call, Throwable t) {}
        });

        // 3. Fetch Dashboard Summary (Daily Burn Rate & Hero Vibe)
        ApiClient.getService(getContext()).getDashboardSummary().enqueue(new Callback<DashboardSummary>() {
            @Override
            public void onResponse(Call<DashboardSummary> call, Response<DashboardSummary> response) {
                swipeRefreshHome.setRefreshing(false);
                if (response.isSuccessful() && response.body() != null) {
                    DashboardSummary dash = response.body();
                    double monthSpend = dash.getCurrentMonthSpend();
                    double todaySpend = dash.getTodaySpend();

                    tvMonthSpentHome.setText("Month: " + CurrencyFormatter.formatINR(monthSpend));
                    tvMonthSpendValue.setText(CurrencyFormatter.formatINR(monthSpend));
                    tvTodaySpend.setText(CurrencyFormatter.formatINR(todaySpend));
                    tvBurnRatePace.setText("Pace: " + CurrencyFormatter.formatINR(todaySpend) + "/day");

                    // Dynamic Hero Vibe Calculation matching HeroVibeCard.jsx
                    if (todaySpend <= 800.0) {
                        tvVibeStatus.setText("85% Health • Living Large");
                        tvVibeSubtitle.setText("Spending pace is well calibrated for this month.");
                    } else if (todaySpend <= 1500.0) {
                        tvVibeStatus.setText("65% Health • Moderate Pace");
                        tvVibeSubtitle.setText("Daily spend is slightly above target pace.");
                    } else {
                        tvVibeStatus.setText("40% Health • High Burn Rate");
                        tvVibeSubtitle.setText("Rapid spend alert! Consider tapping AI Advice.");
                    }

                    if (dash.getRecentExpenses() != null) {
                        expenseAdapter.setExpenses(dash.getRecentExpenses());
                    }
                }
            }

            @Override
            public void onFailure(Call<DashboardSummary> call, Throwable t) {
                swipeRefreshHome.setRefreshing(false);
            }
        });

        // 4. Fetch Real AI Financial Health Score for Hero Vibe Card
        ApiClient.getService(getContext()).getFinancialInsights().enqueue(new Callback<AIInsightsResponse>() {
            @Override
            public void onResponse(Call<AIInsightsResponse> call, Response<AIInsightsResponse> response) {
                if (response.isSuccessful() && response.body() != null && response.body().getHealthScore() != null) {
                    AIFinancialHealthScore hs = response.body().getHealthScore();
                    tvVibeStatus.setText(hs.getScore() + "% Health • " + hs.getStatus());
                    tvVibeSubtitle.setText(hs.getSummary());
                }
            }
            @Override public void onFailure(Call<AIInsightsResponse> call, Throwable t) {}
        });
    }

    private void loadRoast() {
        if (getContext() == null) return;
        if (btnRoastMe != null) {
            btnRoastMe.setEnabled(false);
            btnRoastMe.setText("Roasting... 🔥");
        }

        ApiClient.getService(getContext()).getSpendingRoast().enqueue(new Callback<AIRoastResponse>() {
            @Override
            public void onResponse(Call<AIRoastResponse> call, Response<AIRoastResponse> response) {
                if (btnRoastMe != null) {
                    btnRoastMe.setEnabled(true);
                    btnRoastMe.setText("🔥 Roast Again");
                }
                if (response.isSuccessful() && response.body() != null) {
                    AIRoastResponse roast = response.body();
                    if (roast.getBurnLevel() != null && tvRoastBurnBadge != null) {
                        tvRoastBurnBadge.setText(roast.getBurnLevel());
                    }
                    if (roast.getPunchline() != null && tvRoastPunchline != null) {
                        tvRoastPunchline.setText(roast.getPunchline());
                    }
                    if (roast.getRoast() != null && tvRoastBody != null) {
                        tvRoastBody.setText(roast.getRoast());
                        // Initially keep explanation collapsed (optional)
                        tvRoastBody.setVisibility(View.GONE);
                        if (tvRoastToggleDetails != null) {
                            tvRoastToggleDetails.setVisibility(View.VISIBLE);
                            tvRoastToggleDetails.setText("Why this roast? View explanation ▼");
                        }
                    }
                }
            }

            @Override
            public void onFailure(Call<AIRoastResponse> call, Throwable t) {
                if (btnRoastMe != null) {
                    btnRoastMe.setEnabled(true);
                    btnRoastMe.setText("🔥 Roast Me");
                }
            }
        });
    }

    private void toggleRoastDetails() {
        if (tvRoastBody == null || tvRoastToggleDetails == null) return;
        if (tvRoastBody.getVisibility() == View.VISIBLE) {
            tvRoastBody.setVisibility(View.GONE);
            tvRoastToggleDetails.setText("Why this roast? View explanation ▼");
        } else {
            tvRoastBody.setVisibility(View.VISIBLE);
            tvRoastToggleDetails.setText("Hide explanation ▲");
        }
    }

    @Override
    public void onTopUpClick(Wallet wallet) {
        showDepositDialog(wallet);
    }

    private void showDepositDialog(Wallet wallet) {
        if (getContext() == null) return;
        WalletDepositDialog dialog = new WalletDepositDialog(getContext(), wallet, updatedWallet -> {
            loadData();
        });
        dialog.show();
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
