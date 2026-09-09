package com.fintrack.app.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.fintrack.app.R;
import com.fintrack.app.adapters.WalletAdapter;
import com.fintrack.app.adapters.WalletTransactionAdapter;
import com.fintrack.app.api.ApiClient;
import com.fintrack.app.models.Wallet;
import com.fintrack.app.models.WalletTransaction;
import com.google.android.material.button.MaterialButton;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class WalletsFragment extends Fragment implements WalletAdapter.OnWalletActionListener {

    private MaterialButton btnCreateWallet, btnTopUpWallet, btnTransferWallet;
    private RecyclerView rvWalletsList, rvWalletTransactions;
    private SwipeRefreshLayout swipeRefreshWallets;

    private WalletAdapter walletAdapter;
    private WalletTransactionAdapter txAdapter;
    private List<Wallet> userWallets = new ArrayList<>();

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_wallets, container, false);
        initViews(view);
        setupRecyclerViews();
        setupListeners();
        return view;
    }

    private void initViews(View view) {
        btnCreateWallet = view.findViewById(R.id.btnCreateWallet);
        btnTopUpWallet = view.findViewById(R.id.btnTopUpWallet);
        btnTransferWallet = view.findViewById(R.id.btnTransferWallet);
        rvWalletsList = view.findViewById(R.id.rvWalletsList);
        rvWalletTransactions = view.findViewById(R.id.rvWalletTransactions);
        swipeRefreshWallets = view.findViewById(R.id.swipeRefreshWallets);
    }

    private void setupRecyclerViews() {
        walletAdapter = new WalletAdapter(this);
        rvWalletsList.setLayoutManager(new LinearLayoutManager(getContext(), LinearLayoutManager.HORIZONTAL, false));
        rvWalletsList.setAdapter(walletAdapter);

        txAdapter = new WalletTransactionAdapter();
        rvWalletTransactions.setLayoutManager(new LinearLayoutManager(getContext()));
        rvWalletTransactions.setAdapter(txAdapter);
    }

    private void setupListeners() {
        swipeRefreshWallets.setOnRefreshListener(this::loadData);

        btnCreateWallet.setOnClickListener(v -> {
            if (getContext() == null) return;
            new WalletCreateDialog(getContext(), this::loadData).show();
        });

        btnTopUpWallet.setOnClickListener(v -> {
            if (!userWallets.isEmpty()) {
                showDepositDialog(userWallets.get(0));
            } else {
                Toast.makeText(getContext(), "Please add an account first", Toast.LENGTH_SHORT).show();
            }
        });

        btnTransferWallet.setOnClickListener(v -> {
            if (userWallets.size() < 2) {
                Toast.makeText(getContext(), "You need at least 2 accounts to make a transfer", Toast.LENGTH_LONG).show();
                return;
            }
            new WalletTransferDialog(getContext(), userWallets, this::loadData).show();
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        loadData();
    }

    public void loadData() {
        if (getContext() == null) return;
        swipeRefreshWallets.setRefreshing(true);

        // 1. Fetch Wallets
        ApiClient.getService(getContext()).getWallets().enqueue(new Callback<List<Wallet>>() {
            @Override
            public void onResponse(Call<List<Wallet>> call, Response<List<Wallet>> response) {
                if (response.code() == 401 && getActivity() instanceof DashboardActivity) {
                    ((DashboardActivity) getActivity()).handleSessionExpired();
                    return;
                }
                if (response.isSuccessful() && response.body() != null) {
                    userWallets = response.body();
                    walletAdapter.setWallets(userWallets);
                }
            }

            @Override
            public void onFailure(Call<List<Wallet>> call, Throwable t) {}
        });

        // 2. Fetch Global Ledger Transactions
        ApiClient.getService(getContext()).getAllTransactions().enqueue(new Callback<List<WalletTransaction>>() {
            @Override
            public void onResponse(Call<List<WalletTransaction>> call, Response<List<WalletTransaction>> response) {
                swipeRefreshWallets.setRefreshing(false);
                if (response.isSuccessful() && response.body() != null) {
                    txAdapter.setTransactions(response.body());
                }
            }

            @Override
            public void onFailure(Call<List<WalletTransaction>> call, Throwable t) {
                swipeRefreshWallets.setRefreshing(false);
            }
        });
    }

    @Override
    public void onTopUpClick(Wallet wallet) {
        showDepositDialog(wallet);
    }

    private void showDepositDialog(Wallet wallet) {
        if (getContext() == null) return;
        new WalletDepositDialog(getContext(), wallet, updatedWallet -> loadData()).show();
    }
}
