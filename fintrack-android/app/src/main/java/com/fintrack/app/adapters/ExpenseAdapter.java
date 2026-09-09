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

public class ExpenseAdapter extends RecyclerView.Adapter<ExpenseAdapter.ExpenseViewHolder> {

    public interface OnExpenseClickListener {
        void onExpenseClick(Expense expense);
    }

    private List<Expense> expenses = new ArrayList<>();
    private final OnExpenseClickListener clickListener;

    public ExpenseAdapter() {
        this(null);
    }

    public ExpenseAdapter(OnExpenseClickListener clickListener) {
        this.clickListener = clickListener;
    }

    public void setExpenses(List<Expense> expenses) {
        this.expenses = (expenses != null) ? expenses : new ArrayList<>();
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ExpenseViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_expense_row, parent, false);
        return new ExpenseViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ExpenseViewHolder holder, int position) {
        Expense expense = expenses.get(position);
        holder.tvExpenseDesc.setText(expense.getDescription());
        holder.tvExpenseCategory.setText(expense.getCategoryName() != null ? expense.getCategoryName() : "General");
        holder.tvExpenseDate.setText(expense.getExpenseDate());
        holder.tvExpenseAmount.setText("-" + CurrencyFormatter.formatINR(expense.getAmount()));

        holder.itemView.setOnClickListener(v -> {
            if (clickListener != null) {
                clickListener.onExpenseClick(expense);
            }
        });
    }

    @Override
    public int getItemCount() {
        return expenses.size();
    }

    static class ExpenseViewHolder extends RecyclerView.ViewHolder {
        TextView tvExpenseDesc, tvExpenseCategory, tvExpenseDate, tvExpenseAmount;

        public ExpenseViewHolder(@NonNull View itemView) {
            super(itemView);
            tvExpenseDesc = itemView.findViewById(R.id.tvExpenseDesc);
            tvExpenseCategory = itemView.findViewById(R.id.tvExpenseCategory);
            tvExpenseDate = itemView.findViewById(R.id.tvExpenseDate);
            tvExpenseAmount = itemView.findViewById(R.id.tvExpenseAmount);
        }
    }
}
