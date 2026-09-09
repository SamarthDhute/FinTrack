package com.fintrack.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.fintrack.app.R;
import com.fintrack.app.models.Wallet;
import com.fintrack.app.utils.CurrencyFormatter;
import com.google.android.material.button.MaterialButton;
import java.util.ArrayList;
import java.util.List;

public class WalletAdapter extends RecyclerView.Adapter<WalletAdapter.WalletViewHolder> {

    public interface OnWalletActionListener {
        void onTopUpClick(Wallet wallet);
    }

    private List<Wallet> wallets = new ArrayList<>();
    private final OnWalletActionListener listener;

    public WalletAdapter(OnWalletActionListener listener) {
        this.listener = listener;
    }

    public void setWallets(List<Wallet> wallets) {
        this.wallets = (wallets != null) ? wallets : new ArrayList<>();
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public WalletViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_wallet_card, parent, false);
        return new WalletViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull WalletViewHolder holder, int position) {
        Wallet wallet = wallets.get(position);
        holder.tvWalletName.setText(wallet.getName());
        String accType = (wallet.getAccountType() != null) ? wallet.getAccountType().toUpperCase() : "WALLET";
        holder.tvAccountType.setText(accType);
        holder.tvWalletBalance.setText(CurrencyFormatter.formatINR(wallet.getBalance()));

        holder.btnCardTopUp.setOnClickListener(v -> {
            if (listener != null) {
                listener.onTopUpClick(wallet);
            }
        });
    }

    @Override
    public int getItemCount() {
        return wallets.size();
    }

    static class WalletViewHolder extends RecyclerView.ViewHolder {
        TextView tvWalletName, tvAccountType, tvWalletBalance;
        MaterialButton btnCardTopUp;

        public WalletViewHolder(@NonNull View itemView) {
            super(itemView);
            tvWalletName = itemView.findViewById(R.id.tvWalletName);
            tvAccountType = itemView.findViewById(R.id.tvAccountType);
            tvWalletBalance = itemView.findViewById(R.id.tvWalletBalance);
            btnCardTopUp = itemView.findViewById(R.id.btnCardTopUp);
        }
    }
}
