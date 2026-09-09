package com.fintrack.app.adapters;

import android.content.res.ColorStateList;
import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.fintrack.app.R;
import com.fintrack.app.models.Budget;
import com.fintrack.app.utils.CurrencyFormatter;
import com.google.android.material.progressindicator.LinearProgressIndicator;
import java.util.ArrayList;
import java.util.List;

public class BudgetAdapter extends RecyclerView.Adapter<BudgetAdapter.BudgetViewHolder> {

    public interface OnBudgetActionListener {
        void onDeleteBudget(Budget budget);
        void onEditBudget(Budget budget);
    }

    private List<Budget> budgets = new ArrayList<>();
    private final OnBudgetActionListener listener;

    public BudgetAdapter(OnBudgetActionListener listener) {
        this.listener = listener;
    }

    public void setBudgets(List<Budget> budgets) {
        this.budgets = (budgets != null) ? budgets : new ArrayList<>();
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public BudgetViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_budget_card, parent, false);
        return new BudgetViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull BudgetViewHolder holder, int position) {
        Budget budget = budgets.get(position);
        holder.tvBudgetName.setText(budget.getCategoryName());
        String periodLabel = "daily".equalsIgnoreCase(budget.getPeriod()) ? "⚡ DAILY LIMIT" : "📅 MONTHLY BUDGET";
        if (holder.tvBudgetPeriodBadge != null) {
            holder.tvBudgetPeriodBadge.setText(periodLabel);
        }

        // Status badge & indicator color
        String status = budget.getStatus();
        int color;
        String statusText;
        if ("over_budget".equalsIgnoreCase(status)) {
            color = Color.parseColor("#EF4444"); // red
            statusText = "OVER BUDGET";
        } else if ("near_limit".equalsIgnoreCase(status)) {
            color = Color.parseColor("#F59E0B"); // amber
            statusText = "NEAR LIMIT";
        } else {
            color = Color.parseColor("#10B981"); // emerald
            statusText = "ON TRACK";
        }

        holder.tvBudgetStatus.setText(statusText);
        holder.tvBudgetStatus.setTextColor(color);
        holder.progressBudget.setIndicatorColor(color);

        int pct = (int) Math.min(Math.max(budget.getPercentageSpent(), 0), 100);
        holder.progressBudget.setProgress(pct);

        holder.tvBudgetSpentVsLimit.setText("Spent: " + CurrencyFormatter.formatINR(budget.getSpentAmount())
                + " / " + CurrencyFormatter.formatINR(budget.getAmountLimit()));

        double rem = budget.getRemainingAmount();
        if (rem >= 0) {
            holder.tvBudgetRemaining.setText(CurrencyFormatter.formatINR(rem) + " left");
            holder.tvBudgetRemaining.setTextColor(color);
        } else {
            holder.tvBudgetRemaining.setText(CurrencyFormatter.formatINR(Math.abs(rem)) + " over!");
            holder.tvBudgetRemaining.setTextColor(Color.parseColor("#EF4444"));
        }

        holder.btnEditBudget.setOnClickListener(v -> {
            if (listener != null) {
                listener.onEditBudget(budget);
            }
        });

        holder.itemView.setOnClickListener(v -> {
            if (listener != null) {
                listener.onEditBudget(budget);
            }
        });

        holder.btnDeleteBudget.setOnClickListener(v -> {
            if (listener != null) {
                listener.onDeleteBudget(budget);
            }
        });
    }

    @Override
    public int getItemCount() {
        return budgets.size();
    }

    static class BudgetViewHolder extends RecyclerView.ViewHolder {
        TextView tvBudgetName, tvBudgetPeriodBadge, tvBudgetStatus, tvBudgetSpentVsLimit, tvBudgetRemaining;
        LinearProgressIndicator progressBudget;
        ImageButton btnEditBudget, btnDeleteBudget;

        public BudgetViewHolder(@NonNull View itemView) {
            super(itemView);
            tvBudgetName = itemView.findViewById(R.id.tvBudgetName);
            tvBudgetPeriodBadge = itemView.findViewById(R.id.tvBudgetPeriodBadge);
            tvBudgetStatus = itemView.findViewById(R.id.tvBudgetStatus);
            tvBudgetSpentVsLimit = itemView.findViewById(R.id.tvBudgetSpentVsLimit);
            tvBudgetRemaining = itemView.findViewById(R.id.tvBudgetRemaining);
            progressBudget = itemView.findViewById(R.id.progressBudget);
            btnEditBudget = itemView.findViewById(R.id.btnEditBudget);
            btnDeleteBudget = itemView.findViewById(R.id.btnDeleteBudget);
        }
    }
}
