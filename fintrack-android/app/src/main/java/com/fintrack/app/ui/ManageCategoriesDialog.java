package com.fintrack.app.ui;

import android.app.Dialog;
import android.content.Context;
import android.os.Bundle;
import android.view.View;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.fintrack.app.R;
import com.fintrack.app.adapters.CategoryAdapter;
import com.fintrack.app.api.ApiClient;
import com.fintrack.app.models.Category;
import com.fintrack.app.models.CategoryCreateRequest;
import com.fintrack.app.models.CategoryUpdateRequest;
import com.google.android.material.button.MaterialButton;
import java.util.ArrayList;
import java.util.List;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ManageCategoriesDialog extends Dialog implements CategoryAdapter.OnCategoryActionListener {

    public interface OnCategoriesChangedListener {
        void onCategoriesChanged();
    }

    private final OnCategoriesChangedListener listener;
    private ImageButton btnCloseDialog;
    private MaterialButton btnAddCategory;
    private ProgressBar pbCategoriesLoading;
    private TextView tvEmptyCategories;
    private RecyclerView rvCategories;
    private CategoryAdapter categoryAdapter;

    public ManageCategoriesDialog(@NonNull Context context, OnCategoriesChangedListener listener) {
        super(context);
        this.listener = listener;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.dialog_manage_categories);

        if (getWindow() != null) {
            getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }

        initViews();
        setupRecyclerView();
        setupListeners();
        loadCategories();
    }

    private void initViews() {
        btnCloseDialog = findViewById(R.id.btnCloseDialog);
        btnAddCategory = findViewById(R.id.btnAddCategory);
        pbCategoriesLoading = findViewById(R.id.pbCategoriesLoading);
        tvEmptyCategories = findViewById(R.id.tvEmptyCategories);
        rvCategories = findViewById(R.id.rvCategories);
    }

    private void setupRecyclerView() {
        categoryAdapter = new CategoryAdapter(this);
        rvCategories.setLayoutManager(new LinearLayoutManager(getContext()));
        rvCategories.setAdapter(categoryAdapter);
    }

    private void setupListeners() {
        btnCloseDialog.setOnClickListener(v -> dismiss());
        btnAddCategory.setOnClickListener(v -> showAddCategoryDialog());
    }

    public void loadCategories() {
        pbCategoriesLoading.setVisibility(View.VISIBLE);
        tvEmptyCategories.setVisibility(View.GONE);

        ApiClient.getService(getContext()).getCategories().enqueue(new Callback<List<Category>>() {
            @Override
            public void onResponse(Call<List<Category>> call, Response<List<Category>> response) {
                pbCategoriesLoading.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null) {
                    List<Category> list = response.body();
                    categoryAdapter.setCategories(list);
                    tvEmptyCategories.setVisibility(list.isEmpty() ? View.VISIBLE : View.GONE);
                } else {
                    tvEmptyCategories.setVisibility(View.VISIBLE);
                    tvEmptyCategories.setText("Failed to load categories.");
                }
            }

            @Override
            public void onFailure(Call<List<Category>> call, Throwable t) {
                pbCategoriesLoading.setVisibility(View.GONE);
                tvEmptyCategories.setVisibility(View.VISIBLE);
                tvEmptyCategories.setText("Network error: " + t.getMessage());
            }
        });
    }

    private void showAddCategoryDialog() {
        EditText input = new EditText(getContext());
        input.setHint("Category name (e.g. Travel, Gym, Gifts)");
        input.setTextColor(getContext().getResources().getColor(R.color.text_primary));
        input.setBackgroundResource(R.drawable.bg_input_field);
        input.setPadding(36, 28, 36, 28);

        FrameLayout container = new FrameLayout(getContext());
        container.setPadding(40, 20, 40, 20);
        container.addView(input);

        new AlertDialog.Builder(getContext(), R.style.Theme_FinTrack_Dialog)
                .setTitle("Add New Category")
                .setView(container)
                .setPositiveButton("Create", (dialog, which) -> {
                    String name = input.getText().toString().trim();
                    if (name.isEmpty()) {
                        Toast.makeText(getContext(), "Category name cannot be empty", Toast.LENGTH_SHORT).show();
                        return;
                    }
                    createCategory(name);
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void createCategory(String name) {
        ApiClient.getService(getContext()).createCategory(new CategoryCreateRequest(name)).enqueue(new Callback<Category>() {
            @Override
            public void onResponse(Call<Category> call, Response<Category> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(getContext(), "✅ Category '" + name + "' created!", Toast.LENGTH_SHORT).show();
                    loadCategories();
                    if (listener != null) {
                        listener.onCategoriesChanged();
                    }
                } else {
                    String error = "Failed to create category";
                    try {
                        if (response.errorBody() != null) {
                            error = response.errorBody().string();
                        }
                    } catch (Exception ignored) {}
                    Toast.makeText(getContext(), error, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<Category> call, Throwable t) {
                Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    @Override
    public void onEditCategory(Category category) {
        EditText input = new EditText(getContext());
        input.setText(category.getName());
        input.setSelection(category.getName().length());
        input.setTextColor(getContext().getResources().getColor(R.color.text_primary));
        input.setBackgroundResource(R.drawable.bg_input_field);
        input.setPadding(36, 28, 36, 28);

        FrameLayout container = new FrameLayout(getContext());
        container.setPadding(40, 20, 40, 20);
        container.addView(input);

        new AlertDialog.Builder(getContext(), R.style.Theme_FinTrack_Dialog)
                .setTitle("Rename Category")
                .setView(container)
                .setPositiveButton("Update", (dialog, which) -> {
                    String newName = input.getText().toString().trim();
                    if (newName.isEmpty()) {
                        Toast.makeText(getContext(), "Category name cannot be empty", Toast.LENGTH_SHORT).show();
                        return;
                    }
                    updateCategory(category.getId(), newName);
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void updateCategory(int categoryId, String newName) {
        ApiClient.getService(getContext()).updateCategory(categoryId, new CategoryUpdateRequest(newName)).enqueue(new Callback<Category>() {
            @Override
            public void onResponse(Call<Category> call, Response<Category> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(getContext(), "✅ Category updated!", Toast.LENGTH_SHORT).show();
                    loadCategories();
                    if (listener != null) {
                        listener.onCategoriesChanged();
                    }
                } else {
                    String error = "Failed to update category";
                    try {
                        if (response.errorBody() != null) {
                            error = response.errorBody().string();
                        }
                    } catch (Exception ignored) {}
                    Toast.makeText(getContext(), error, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<Category> call, Throwable t) {
                Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    @Override
    public void onDeleteCategory(Category category) {
        new AlertDialog.Builder(getContext(), R.style.Theme_FinTrack_Dialog)
                .setTitle("Delete Category")
                .setMessage("Are you sure you want to delete '" + category.getName() + "'?\n\nNote: Expenses logged under this category will have category unassigned.")
                .setPositiveButton("Delete", (dialog, which) -> {
                    ApiClient.getService(getContext()).deleteCategory(category.getId()).enqueue(new Callback<ResponseBody>() {
                        @Override
                        public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                            if (response.isSuccessful()) {
                                Toast.makeText(getContext(), "Category deleted", Toast.LENGTH_SHORT).show();
                                loadCategories();
                                if (listener != null) {
                                    listener.onCategoriesChanged();
                                }
                            } else {
                                Toast.makeText(getContext(), "Failed to delete category", Toast.LENGTH_SHORT).show();
                            }
                        }

                        @Override
                        public void onFailure(Call<ResponseBody> call, Throwable t) {
                            Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
                        }
                    });
                })
                .setNegativeButton("Cancel", null)
                .show();
    }
}
