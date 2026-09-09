package com.fintrack.app.adapters;

import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.fintrack.app.R;
import com.fintrack.app.models.WalletTransaction;
import com.fintrack.app.utils.CurrencyFormatter;
import java.util.ArrayList;
import java.util.List;

public class WalletTransactionAdapter extends RecyclerView.Adapter<WalletTransactionAdapter.TxViewHolder> {

    private List<WalletTransaction> transactionList = new ArrayList<>();

    public void setTransactions(List<WalletTransaction> transactions) {
        this.transactionList = (transactions != null) ? transactions : new ArrayList<>();
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public TxViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_ledger_row, parent, false);
        return new TxViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull TxViewHolder holder, int position) {
        WalletTransaction tx = transactionList.get(position);
        holder.tvTxTypeBadge.setText(tx.getTransactionType());
        holder.tvTxDate.setText(tx.getTransactionDate());
        holder.tvTxDescription.setText(tx.getDescription().isEmpty() ? "Transaction" : tx.getDescription());

        if (tx.isPositive()) {
            holder.tvTxAmount.setText("+" + CurrencyFormatter.formatINR(tx.getAmount()));
            holder.tvTxAmount.setTextColor(Color.parseColor("#10B981")); // green
            holder.tvTxTypeBadge.setTextColor(Color.parseColor("#10B981"));
        } else {
            holder.tvTxAmount.setText("-" + CurrencyFormatter.formatINR(tx.getAmount()));
            holder.tvTxAmount.setTextColor(Color.parseColor("#EF4444")); // red
            holder.tvTxTypeBadge.setTextColor(Color.parseColor("#EF4444"));
        }
    }

    @Override
    public int getItemCount() {
        return transactionList.size();
    }

    static class TxViewHolder extends RecyclerView.ViewHolder {
        TextView tvTxTypeBadge, tvTxDate, tvTxDescription, tvTxAmount;

        public TxViewHolder(@NonNull View itemView) {
            super(itemView);
            tvTxTypeBadge = itemView.findViewById(R.id.tvTxTypeBadge);
            tvTxDate = itemView.findViewById(R.id.tvTxDate);
            tvTxDescription = itemView.findViewById(R.id.tvTxDescription);
            tvTxAmount = itemView.findViewById(R.id.tvTxAmount);
        }
    }
}
