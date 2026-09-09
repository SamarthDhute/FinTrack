package com.fintrack.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.fintrack.app.R;
import com.fintrack.app.models.Category;
import java.util.ArrayList;
import java.util.List;

public class CategoryAdapter extends RecyclerView.Adapter<CategoryAdapter.CategoryViewHolder> {

    public interface OnCategoryActionListener {
        void onEditCategory(Category category);
        void onDeleteCategory(Category category);
    }

    private List<Category> categories = new ArrayList<>();
    private final OnCategoryActionListener listener;

    public CategoryAdapter(OnCategoryActionListener listener) {
        this.listener = listener;
    }

    public void setCategories(List<Category> categories) {
        this.categories = (categories != null) ? categories : new ArrayList<>();
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public CategoryViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_category_row, parent, false);
        return new CategoryViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull CategoryViewHolder holder, int position) {
        Category category = categories.get(position);
        holder.tvCategoryName.setText(category.getName());

        int count = category.getExpenseCount();
        if (category.isPredefined()) {
            holder.tvCategorySubtitle.setText(count > 0 ? count + " expenses • Default" : "Default Category");
        } else {
            holder.tvCategorySubtitle.setText(count > 0 ? count + " expenses logged" : "Custom Category");
        }

        holder.btnEditCategory.setOnClickListener(v -> {
            if (listener != null) {
                listener.onEditCategory(category);
            }
        });

        holder.btnDeleteCategory.setOnClickListener(v -> {
            if (listener != null) {
                listener.onDeleteCategory(category);
            }
        });
    }

    @Override
    public int getItemCount() {
        return categories.size();
    }

    static class CategoryViewHolder extends RecyclerView.ViewHolder {
        TextView tvCategoryName, tvCategorySubtitle;
        ImageButton btnEditCategory, btnDeleteCategory;

        public CategoryViewHolder(@NonNull View itemView) {
            super(itemView);
            tvCategoryName = itemView.findViewById(R.id.tvCategoryName);
            tvCategorySubtitle = itemView.findViewById(R.id.tvCategorySubtitle);
            btnEditCategory = itemView.findViewById(R.id.btnEditCategory);
            btnDeleteCategory = itemView.findViewById(R.id.btnDeleteCategory);
        }
    }
}
