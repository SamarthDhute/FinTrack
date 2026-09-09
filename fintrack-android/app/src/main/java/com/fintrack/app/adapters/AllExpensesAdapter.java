package com.fintrack.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.fintrack.app.R;
import com.fintrack.app.models.Expense;
import com.fintrack.app.utils.CurrencyFormatter;
import java.util.ArrayList;
import java.util.List;

public class AllExpensesAdapter extends RecyclerView.Adapter<AllExpensesAdapter.ViewHolder> {

    public interface OnExpenseClickListener {
        void onExpenseClick(Expense expense);
    }

    public interface OnExpenseDeleteListener {
        void onExpenseDelete(Expense expense);
    }

    private List<Expense> expensesList = new ArrayList<>();
    private final OnExpenseClickListener clickListener;
    private final OnExpenseDeleteListener deleteListener;

    public AllExpensesAdapter(OnExpenseClickListener clickListener, OnExpenseDeleteListener deleteListener) {
        this.clickListener = clickListener;
        this.deleteListener = deleteListener;
    }

    public AllExpensesAdapter(OnExpenseDeleteListener deleteListener) {
        this(null, deleteListener);
    }

    public void setExpenses(List<Expense> expenses) {
        this.expensesList = (expenses != null) ? expenses : new ArrayList<>();
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_expense_row, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Expense expense = expensesList.get(position);
        holder.tvExpenseDesc.setText(expense.getTitle());

        String meta = expense.getCategoryName();
        if (expense.getWalletName() != null && !expense.getWalletName().isEmpty()) {
            meta += " • " + expense.getWalletName();
        }
        holder.tvExpenseCategory.setText(meta);
        holder.tvExpenseDate.setText(expense.getDate());
        holder.tvExpenseAmount.setText("-" + CurrencyFormatter.formatINR(expense.getAmount()));

        holder.itemView.setOnClickListener(v -> {
            if (clickListener != null) {
                clickListener.onExpenseClick(expense);
            }
        });

        holder.itemView.setOnLongClickListener(v -> {
            if (deleteListener != null) {
                deleteListener.onExpenseDelete(expense);
            }
            return true;
        });
    }

    @Override
    public int getItemCount() {
        return expensesList.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvExpenseDesc, tvExpenseCategory, tvExpenseDate, tvExpenseAmount;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvExpenseDesc = itemView.findViewById(R.id.tvExpenseDesc);
            tvExpenseCategory = itemView.findViewById(R.id.tvExpenseCategory);
            tvExpenseDate = itemView.findViewById(R.id.tvExpenseDate);
            tvExpenseAmount = itemView.findViewById(R.id.tvExpenseAmount);
        }
    }
}
