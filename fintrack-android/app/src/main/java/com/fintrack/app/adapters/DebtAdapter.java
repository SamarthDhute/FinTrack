package com.fintrack.app.adapters;

import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.fintrack.app.R;
import com.fintrack.app.models.Debt;
import com.fintrack.app.utils.CurrencyFormatter;
import com.google.android.material.button.MaterialButton;
import java.util.ArrayList;
import java.util.List;

public class DebtAdapter extends RecyclerView.Adapter<DebtAdapter.DebtViewHolder> {

    public interface OnDebtActionListener {
        void onRecordRepayment(Debt debt);
        void onEditDebt(Debt debt);
        void onDeleteDebt(Debt debt);
    }

    private List<Debt> debtList = new ArrayList<>();
    private final OnDebtActionListener listener;

    public DebtAdapter(OnDebtActionListener listener) {
        this.listener = listener;
    }

    public void setDebts(List<Debt> debts) {
        this.debtList = (debts != null) ? debts : new ArrayList<>();
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public DebtViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_debt_card, parent, false);
        return new DebtViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull DebtViewHolder holder, int position) {
        Debt debt = debtList.get(position);
        holder.tvDebtPerson.setText(debt.getPersonName());

        // Type tag
        if (debt.isLent()) {
            holder.tvDebtTypeTag.setText("LENT (RECEIVABLE)");
            holder.tvDebtTypeTag.setTextColor(Color.parseColor("#10B981")); // green
        } else {
            holder.tvDebtTypeTag.setText("BORROWED (PAYABLE)");
            holder.tvDebtTypeTag.setTextColor(Color.parseColor("#F59E0B")); // amber
        }

        holder.tvDebtRemaining.setText(CurrencyFormatter.formatINR(debt.getRemainingAmount()));
        holder.tvDebtInitial.setText("Initial: " + CurrencyFormatter.formatINR(debt.getInitialAmount())
                + " • Repaid: " + CurrencyFormatter.formatINR(debt.getTotalRepaid()));

        // Status badge
        holder.tvDebtStatus.setText(debt.getStatus().replace("_", " "));
        if (debt.isSettled()) {
            holder.tvDebtStatus.setTextColor(Color.parseColor("#10B981"));
            holder.btnRecordRepayment.setVisibility(View.GONE);
        } else {
            holder.tvDebtStatus.setTextColor(Color.parseColor("#94A3B8"));
            holder.btnRecordRepayment.setVisibility(View.VISIBLE);
        }

        if (debt.getNotes() != null && !debt.getNotes().isEmpty()) {
            holder.tvDebtNotes.setVisibility(View.VISIBLE);
            holder.tvDebtNotes.setText("Notes: " + debt.getNotes());
        } else {
            holder.tvDebtNotes.setVisibility(View.GONE);
        }

        holder.btnRecordRepayment.setOnClickListener(v -> {
            if (listener != null) {
                listener.onRecordRepayment(debt);
            }
        });

        holder.btnEditDebt.setOnClickListener(v -> {
            if (listener != null) {
                listener.onEditDebt(debt);
            }
        });

        holder.btnDeleteDebt.setOnClickListener(v -> {
            if (listener != null) {
                listener.onDeleteDebt(debt);
            }
        });
    }

    @Override
    public int getItemCount() {
        return debtList.size();
    }

    static class DebtViewHolder extends RecyclerView.ViewHolder {
        TextView tvDebtPerson, tvDebtTypeTag, tvDebtRemaining, tvDebtInitial, tvDebtStatus, tvDebtNotes;
        ImageButton btnEditDebt, btnDeleteDebt;
        MaterialButton btnRecordRepayment;

        public DebtViewHolder(@NonNull View itemView) {
            super(itemView);
            tvDebtPerson = itemView.findViewById(R.id.tvDebtPerson);
            tvDebtTypeTag = itemView.findViewById(R.id.tvDebtTypeTag);
            tvDebtRemaining = itemView.findViewById(R.id.tvDebtRemaining);
            tvDebtInitial = itemView.findViewById(R.id.tvDebtInitial);
            tvDebtStatus = itemView.findViewById(R.id.tvDebtStatus);
            tvDebtNotes = itemView.findViewById(R.id.tvDebtNotes);
            btnEditDebt = itemView.findViewById(R.id.btnEditDebt);
            btnDeleteDebt = itemView.findViewById(R.id.btnDeleteDebt);
            btnRecordRepayment = itemView.findViewById(R.id.btnRecordRepayment);
        }
    }
}
