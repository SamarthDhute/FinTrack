package com.fintrack.app.ui;

import android.app.DatePickerDialog;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Base64;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import com.fintrack.app.R;
import com.fintrack.app.api.ApiClient;
import com.fintrack.app.models.*;
import com.fintrack.app.utils.CurrencyFormatter;
import com.google.android.material.button.MaterialButton;
import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Environment;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AddExpenseActivity extends AppCompatActivity {

    public static final String EXTRA_EXPENSE_ID = "EXTRA_EXPENSE_ID";
    public static final String EXTRA_EXPENSE_AMOUNT = "EXTRA_EXPENSE_AMOUNT";
    public static final String EXTRA_EXPENSE_TITLE = "EXTRA_EXPENSE_TITLE";
    public static final String EXTRA_EXPENSE_DATE = "EXTRA_EXPENSE_DATE";
    public static final String EXTRA_EXPENSE_CATEGORY_ID = "EXTRA_EXPENSE_CATEGORY_ID";
    public static final String EXTRA_EXPENSE_PAYMENT_METHOD_ID = "EXTRA_EXPENSE_PAYMENT_METHOD_ID";
    public static final String EXTRA_EXPENSE_WALLET_ID = "EXTRA_EXPENSE_WALLET_ID";
    public static final String EXTRA_EXPENSE_NOTES = "EXTRA_EXPENSE_NOTES";

    private TextView tvAddExpenseTitle, tvAiCategorySuggestion;
    private EditText etExpenseAmount, etExpenseDesc, etExpenseDate, etExpenseNotes;
    private Spinner spCategory, spPaymentMethod, spWallet;
    private MaterialButton btnSaveExpense, btnCloseAddExpense, btnDeleteExpense, btnScanReceipt;
    private TextView btnQuickAddCategory;

    private List<Category> categoriesList = new ArrayList<>();
    private List<PaymentMethod> paymentMethodsList = new ArrayList<>();
    private List<Wallet> walletsList = new ArrayList<>();

    private boolean isEditMode = false;
    private int expenseId = -1;
    private Integer prefillCategoryId = null;
    private Integer prefillPaymentMethodId = null;
    private Integer prefillWalletId = null;

    private final Calendar calendar = Calendar.getInstance();
    private final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.US);

    private ActivityResultLauncher<String> galleryLauncher;
    private ActivityResultLauncher<Uri> takePictureLauncher;
    private ActivityResultLauncher<String> cameraPermissionLauncher;
    private Uri currentPhotoUri;
    private final Handler autoCategorizeHandler = new Handler(Looper.getMainLooper());
    private Runnable autoCategorizeRunnable;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_add_expense);

        initViews();
        setupDatePicker();
        setupAutoCategorization();
        setupReceiptScanner();
        checkEditMode();
        setupListeners();
        loadDropdownData();
    }

    private void initViews() {
        tvAddExpenseTitle = findViewById(R.id.tvAddExpenseTitle);
        tvAiCategorySuggestion = findViewById(R.id.tvAiCategorySuggestion);
        etExpenseAmount = findViewById(R.id.etExpenseAmount);
        etExpenseDesc = findViewById(R.id.etExpenseDesc);
        etExpenseDate = findViewById(R.id.etExpenseDate);
        etExpenseNotes = findViewById(R.id.etExpenseNotes);
        spCategory = findViewById(R.id.spCategory);
        spPaymentMethod = findViewById(R.id.spPaymentMethod);
        spWallet = findViewById(R.id.spWallet);
        btnSaveExpense = findViewById(R.id.btnSaveExpense);
        btnCloseAddExpense = findViewById(R.id.btnCloseAddExpense);
        btnDeleteExpense = findViewById(R.id.btnDeleteExpense);
        btnScanReceipt = findViewById(R.id.btnScanReceipt);
        btnQuickAddCategory = findViewById(R.id.btnQuickAddCategory);

        // Hide scan button in edit mode to avoid confusion
        if (getIntent().hasExtra(EXTRA_EXPENSE_ID)) {
            btnScanReceipt.setVisibility(View.GONE);
        }

        // Default to today's date
        etExpenseDate.setText(dateFormat.format(new Date()));
    }

    private void setupDatePicker() {
        DatePickerDialog.OnDateSetListener dateSetListener = (view, year, month, dayOfMonth) -> {
            calendar.set(Calendar.YEAR, year);
            calendar.set(Calendar.MONTH, month);
            calendar.set(Calendar.DAY_OF_MONTH, dayOfMonth);
            etExpenseDate.setText(dateFormat.format(calendar.getTime()));
        };

        etExpenseDate.setOnClickListener(v -> {
            new DatePickerDialog(
                    AddExpenseActivity.this,
                    R.style.Theme_FinTrack_Dialog,
                    dateSetListener,
                    calendar.get(Calendar.YEAR),
                    calendar.get(Calendar.MONTH),
                    calendar.get(Calendar.DAY_OF_MONTH)
            ).show();
        });
    }

    private void checkEditMode() {
        Intent intent = getIntent();
        if (intent != null && intent.hasExtra(EXTRA_EXPENSE_ID)) {
            isEditMode = true;
            expenseId = intent.getIntExtra(EXTRA_EXPENSE_ID, -1);

            tvAddExpenseTitle.setText("✏️ Edit Expense");
            btnSaveExpense.setText("Update Expense");
            btnDeleteExpense.setVisibility(View.VISIBLE);

            double amount = intent.getDoubleExtra(EXTRA_EXPENSE_AMOUNT, 0.0);
            if (amount > 0) {
                etExpenseAmount.setText(String.format(Locale.US, "%.2f", amount));
            }

            String title = intent.getStringExtra(EXTRA_EXPENSE_TITLE);
            if (title != null) {
                etExpenseDesc.setText(title);
            }

            String date = intent.getStringExtra(EXTRA_EXPENSE_DATE);
            if (date != null && !date.isEmpty()) {
                etExpenseDate.setText(date);
                try {
                    Date parsed = dateFormat.parse(date);
                    if (parsed != null) calendar.setTime(parsed);
                } catch (Exception ignored) {}
            }

            if (intent.hasExtra(EXTRA_EXPENSE_CATEGORY_ID)) {
                prefillCategoryId = intent.getIntExtra(EXTRA_EXPENSE_CATEGORY_ID, -1);
            }
            if (intent.hasExtra(EXTRA_EXPENSE_PAYMENT_METHOD_ID)) {
                prefillPaymentMethodId = intent.getIntExtra(EXTRA_EXPENSE_PAYMENT_METHOD_ID, -1);
            }
            if (intent.hasExtra(EXTRA_EXPENSE_WALLET_ID)) {
                prefillWalletId = intent.getIntExtra(EXTRA_EXPENSE_WALLET_ID, -1);
            }

            String notes = intent.getStringExtra(EXTRA_EXPENSE_NOTES);
            if (notes != null) {
                etExpenseNotes.setText(notes);
            }
        }
    }

    private void setupListeners() {
        btnCloseAddExpense.setOnClickListener(v -> finish());
        btnSaveExpense.setOnClickListener(v -> saveExpense());

        btnDeleteExpense.setOnClickListener(v -> confirmDeleteExpense());

        if (btnQuickAddCategory != null) {
            btnQuickAddCategory.setOnClickListener(v -> {
                new ManageCategoriesDialog(this, this::loadDropdownData).show();
            });
        }
    }

    private void setupAutoCategorization() {
        etExpenseDesc.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (isEditMode) return;
                autoCategorizeHandler.removeCallbacks(autoCategorizeRunnable);
                String title = s.toString().trim();
                if (title.length() >= 3) {
                    autoCategorizeRunnable = () -> performAutoCategorize(title);
                    autoCategorizeHandler.postDelayed(autoCategorizeRunnable, 600);
                } else {
                    tvAiCategorySuggestion.setVisibility(View.GONE);
                }
            }
            @Override public void afterTextChanged(Editable s) {}
        });
    }

    private void performAutoCategorize(String title) {
        Double amount = null;
        try {
            String amtStr = etExpenseAmount.getText().toString().trim();
            if (!amtStr.isEmpty()) amount = Double.parseDouble(amtStr);
        } catch (Exception ignored) {}

        AICategorizeRequest req = new AICategorizeRequest(title, amount);
        ApiClient.getService(this).autoCategorize(req).enqueue(new Callback<AICategorizeResponse>() {
            @Override
            public void onResponse(Call<AICategorizeResponse> call, Response<AICategorizeResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    AICategorizeResponse res = response.body();
                    selectMatchingCategory(res.getSuggestedCategoryId(), res.getCategoryName());
                }
            }
            @Override public void onFailure(Call<AICategorizeResponse> call, Throwable t) {}
        });
    }

    private void selectMatchingCategory(Integer catId, String catName) {
        if (categoriesList == null || categoriesList.isEmpty()) return;
        for (int i = 0; i < categoriesList.size(); i++) {
            Category cat = categoriesList.get(i);
            if ((catId != null && cat.getId() == catId) ||
                (catName != null && cat.getName().equalsIgnoreCase(catName))) {
                spCategory.setSelection(i);
                tvAiCategorySuggestion.setText("✨ AI matched: " + cat.getName());
                tvAiCategorySuggestion.setVisibility(View.VISIBLE);
                break;
            }
        }
    }

    private void setupReceiptScanner() {
        galleryLauncher = registerForActivityResult(new ActivityResultContracts.GetContent(), uri -> {
            if (uri != null) {
                processReceiptImageUri(uri);
            }
        });

        takePictureLauncher = registerForActivityResult(new ActivityResultContracts.TakePicture(), success -> {
            if (success && currentPhotoUri != null) {
                processReceiptImageUri(currentPhotoUri);
            }
        });

        cameraPermissionLauncher = registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
            if (isGranted) {
                launchCamera();
            } else {
                Toast.makeText(this, "Camera permission is required to take receipt photos", Toast.LENGTH_SHORT).show();
            }
        });

        btnScanReceipt.setOnClickListener(v -> {
            String[] options = {"📷 Take Photo with Camera", "🖼️ Choose from Gallery"};
            new AlertDialog.Builder(this, R.style.Theme_FinTrack_Dialog)
                    .setTitle("Scan Bill / Receipt with AI")
                    .setItems(options, (dialog, which) -> {
                        if (which == 0) {
                            checkCameraPermissionAndLaunch();
                        } else {
                            galleryLauncher.launch("image/*");
                        }
                    })
                    .setNegativeButton("Cancel", null)
                    .show();
        });
    }

    private void checkCameraPermissionAndLaunch() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            launchCamera();
        } else {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA);
        }
    }

    private void launchCamera() {
        try {
            File photoFile = createImageFile();
            if (photoFile != null) {
                currentPhotoUri = FileProvider.getUriForFile(
                        this,
                        getApplicationContext().getPackageName() + ".fileprovider",
                        photoFile
                );
                takePictureLauncher.launch(currentPhotoUri);
            }
        } catch (Exception e) {
            Toast.makeText(this, "Could not launch camera: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private File createImageFile() throws IOException {
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date());
        String imageFileName = "RECEIPT_" + timeStamp + "_";
        File storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES);
        if (storageDir == null) {
            storageDir = getCacheDir();
        }
        return File.createTempFile(imageFileName, ".jpg", storageDir);
    }

    private void processReceiptImageUri(Uri uri) {
        try {
            InputStream inputStream = getContentResolver().openInputStream(uri);
            Bitmap bitmap = BitmapFactory.decodeStream(inputStream);
            if (bitmap != null) {
                processReceiptBitmap(bitmap);
            }
        } catch (Exception e) {
            Toast.makeText(this, "Could not open image: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private void processReceiptBitmap(Bitmap bitmap) {
        Toast.makeText(this, "🔍 Scanning receipt with AI OCR...", Toast.LENGTH_SHORT).show();
        btnScanReceipt.setEnabled(false);
        btnScanReceipt.setText("Scanning Receipt...");

        // Downscale image to max 1024x1024 to keep payload fast and light
        int maxDim = 1024;
        int width = bitmap.getWidth();
        int height = bitmap.getHeight();
        if (width > maxDim || height > maxDim) {
            float ratio = Math.min((float) maxDim / width, (float) maxDim / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
            bitmap = Bitmap.createScaledBitmap(bitmap, width, height, true);
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.JPEG, 80, outputStream);
        byte[] byteArray = outputStream.toByteArray();
        String base64Image = Base64.encodeToString(byteArray, Base64.NO_WRAP);

        AIScanReceiptRequest request = new AIScanReceiptRequest(base64Image, "image/jpeg");
        ApiClient.getService(this).scanReceipt(request).enqueue(new Callback<AIScanReceiptResponse>() {
            @Override
            public void onResponse(Call<AIScanReceiptResponse> call, Response<AIScanReceiptResponse> response) {
                btnScanReceipt.setEnabled(true);
                btnScanReceipt.setText("📷 Scan Bill / Receipt with AI");

                if (response.isSuccessful() && response.body() != null) {
                    AIScanReceiptResponse res = response.body();
                    if (res.getAmount() != null) {
                        etExpenseAmount.setText(String.valueOf(res.getAmount()));
                    }
                    if (res.getTitle() != null && !res.getTitle().isEmpty()) {
                        etExpenseDesc.setText(res.getTitle());
                    }
                    if (res.getDate() != null && !res.getDate().isEmpty()) {
                        etExpenseDate.setText(res.getDate());
                    }
                    if (res.getMerchantName() != null && !res.getMerchantName().isEmpty()) {
                        String currentNotes = etExpenseNotes.getText().toString().trim();
                        String note = "Merchant: " + res.getMerchantName();
                        etExpenseNotes.setText(currentNotes.isEmpty() ? note : currentNotes + "\n" + note);
                    }
                    selectMatchingCategory(res.getCategoryId(), res.getCategoryName());
                    Toast.makeText(AddExpenseActivity.this, "✨ Receipt parsed successfully!", Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(AddExpenseActivity.this, "Could not extract receipt details. Please enter manually.", Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<AIScanReceiptResponse> call, Throwable t) {
                btnScanReceipt.setEnabled(true);
                btnScanReceipt.setText("📷 Scan Bill / Receipt with AI");
                Toast.makeText(AddExpenseActivity.this, "Scan failed: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void loadDropdownData() {
        // 1. Load Categories
        ApiClient.getService(this).getCategories().enqueue(new Callback<List<Category>>() {
            @Override
            public void onResponse(Call<List<Category>> call, Response<List<Category>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    categoriesList = response.body();
                    ArrayAdapter<Category> adapter = new ArrayAdapter<>(AddExpenseActivity.this,
                            android.R.layout.simple_spinner_dropdown_item, categoriesList);
                    spCategory.setAdapter(adapter);

                    if (prefillCategoryId != null && prefillCategoryId > 0) {
                        for (int i = 0; i < categoriesList.size(); i++) {
                            if (categoriesList.get(i).getId() == prefillCategoryId) {
                                spCategory.setSelection(i);
                                break;
                            }
                        }
                    }
                }
            }
            @Override
            public void onFailure(Call<List<Category>> call, Throwable t) {}
        });

        // 2. Load Payment Methods
        ApiClient.getService(this).getPaymentMethods().enqueue(new Callback<List<PaymentMethod>>() {
            @Override
            public void onResponse(Call<List<PaymentMethod>> call, Response<List<PaymentMethod>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    paymentMethodsList = response.body();
                    ArrayAdapter<PaymentMethod> adapter = new ArrayAdapter<>(AddExpenseActivity.this,
                            android.R.layout.simple_spinner_dropdown_item, paymentMethodsList);
                    spPaymentMethod.setAdapter(adapter);

                    if (prefillPaymentMethodId != null && prefillPaymentMethodId > 0) {
                        for (int i = 0; i < paymentMethodsList.size(); i++) {
                            if (paymentMethodsList.get(i).getId() == prefillPaymentMethodId) {
                                spPaymentMethod.setSelection(i);
                                break;
                            }
                        }
                    }
                }
            }
            @Override
            public void onFailure(Call<List<PaymentMethod>> call, Throwable t) {}
        });

        // 3. Load Wallets
        ApiClient.getService(this).getWallets().enqueue(new Callback<List<Wallet>>() {
            @Override
            public void onResponse(Call<List<Wallet>> call, Response<List<Wallet>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    walletsList = response.body();
                    List<String> walletNames = new ArrayList<>();
                    walletNames.add("No Wallet (Do not link)");
                    for (Wallet w : walletsList) {
                        walletNames.add(w.getName() + " (" + CurrencyFormatter.formatINR(w.getBalance()) + ")");
                    }
                    ArrayAdapter<String> adapter = new ArrayAdapter<>(AddExpenseActivity.this,
                            android.R.layout.simple_spinner_dropdown_item, walletNames);
                    spWallet.setAdapter(adapter);

                    if (prefillWalletId != null && prefillWalletId > 0) {
                        for (int i = 0; i < walletsList.size(); i++) {
                            if (walletsList.get(i).getId() == prefillWalletId) {
                                spWallet.setSelection(i + 1);
                                break;
                            }
                        }
                    } else if (!isEditMode && !walletsList.isEmpty()) {
                        spWallet.setSelection(1);
                    }
                }
            }
            @Override
            public void onFailure(Call<List<Wallet>> call, Throwable t) {}
        });
    }

    private void saveExpense() {
        String amountStr = etExpenseAmount.getText().toString().trim();
        String desc = etExpenseDesc.getText().toString().trim();
        String date = etExpenseDate.getText().toString().trim();
        String notes = etExpenseNotes.getText().toString().trim();

        if (amountStr.isEmpty() || desc.isEmpty()) {
            Toast.makeText(this, "Please enter amount and description", Toast.LENGTH_SHORT).show();
            return;
        }

        double amount;
        try {
            amount = Double.parseDouble(amountStr);
            if (amount <= 0) {
                Toast.makeText(this, "Amount must be greater than 0", Toast.LENGTH_SHORT).show();
                return;
            }
        } catch (NumberFormatException e) {
            Toast.makeText(this, "Invalid amount", Toast.LENGTH_SHORT).show();
            return;
        }

        if (date.isEmpty()) {
            date = dateFormat.format(new Date());
        }

        if (categoriesList.isEmpty() || spCategory.getSelectedItemPosition() < 0) {
            Toast.makeText(this, "Please wait for categories to load or select one", Toast.LENGTH_SHORT).show();
            return;
        }
        int categoryId = categoriesList.get(spCategory.getSelectedItemPosition()).getId();

        if (paymentMethodsList.isEmpty() || spPaymentMethod.getSelectedItemPosition() < 0) {
            Toast.makeText(this, "Please wait for payment methods to load or select one", Toast.LENGTH_SHORT).show();
            return;
        }
        int paymentMethodId = paymentMethodsList.get(spPaymentMethod.getSelectedItemPosition()).getId();

        Integer walletId = null;
        int selectedWalletPos = spWallet.getSelectedItemPosition();
        if (selectedWalletPos > 0 && (selectedWalletPos - 1) < walletsList.size()) {
            walletId = walletsList.get(selectedWalletPos - 1).getId();
        }

        btnSaveExpense.setEnabled(false);

        if (isEditMode) {
            btnSaveExpense.setText("Updating...");
            ExpenseUpdateRequest updateRequest = new ExpenseUpdateRequest(
                    amount, desc, date, categoryId, paymentMethodId, walletId, notes.isEmpty() ? null : notes
            );

            ApiClient.getService(this).updateExpense(expenseId, updateRequest).enqueue(new Callback<Expense>() {
                @Override
                public void onResponse(Call<Expense> call, Response<Expense> response) {
                    btnSaveExpense.setEnabled(true);
                    btnSaveExpense.setText("Update Expense");

                    if (response.isSuccessful() && response.body() != null) {
                        Toast.makeText(AddExpenseActivity.this, "✅ Expense updated successfully!", Toast.LENGTH_SHORT).show();
                        setResult(RESULT_OK);
                        finish();
                    } else {
                        String errorMsg = "Failed to update: " + response.code();
                        try {
                            if (response.errorBody() != null) {
                                errorMsg = response.errorBody().string();
                            }
                        } catch (Exception ignored) {}
                        Toast.makeText(AddExpenseActivity.this, errorMsg, Toast.LENGTH_LONG).show();
                    }
                }

                @Override
                public void onFailure(Call<Expense> call, Throwable t) {
                    btnSaveExpense.setEnabled(true);
                    btnSaveExpense.setText("Update Expense");
                    Toast.makeText(AddExpenseActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        } else {
            btnSaveExpense.setText("Saving...");
            ExpenseCreateRequest request = new ExpenseCreateRequest(
                    amount, desc, date, categoryId, paymentMethodId, walletId, notes.isEmpty() ? null : notes
            );

            ApiClient.getService(this).createExpense(request).enqueue(new Callback<Expense>() {
                @Override
                public void onResponse(Call<Expense> call, Response<Expense> response) {
                    btnSaveExpense.setEnabled(true);
                    btnSaveExpense.setText("Save Expense");

                    if (response.isSuccessful() && response.body() != null) {
                        Toast.makeText(AddExpenseActivity.this, "✅ Expense saved successfully!", Toast.LENGTH_SHORT).show();
                        setResult(RESULT_OK);
                        finish();
                    } else {
                        String errorMsg = "Failed to save: " + response.code();
                        try {
                            if (response.errorBody() != null) {
                                errorMsg = response.errorBody().string();
                            }
                        } catch (Exception ignored) {}
                        Toast.makeText(AddExpenseActivity.this, errorMsg, Toast.LENGTH_LONG).show();
                    }
                }

                @Override
                public void onFailure(Call<Expense> call, Throwable t) {
                    btnSaveExpense.setEnabled(true);
                    btnSaveExpense.setText("Save Expense");
                    Toast.makeText(AddExpenseActivity.this, "Error: " + t.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        }
    }

    private void confirmDeleteExpense() {
        new AlertDialog.Builder(this, R.style.Theme_FinTrack_Dialog)
                .setTitle("Delete Expense")
                .setMessage("Are you sure you want to delete this expense? The amount will be refunded to your linked wallet.")
                .setPositiveButton("Delete", (dialog, which) -> {
                    btnDeleteExpense.setEnabled(false);
                    ApiClient.getService(this).deleteExpense(expenseId).enqueue(new Callback<ResponseBody>() {
                        @Override
                        public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                            if (response.isSuccessful()) {
                                Toast.makeText(AddExpenseActivity.this, "Expense deleted", Toast.LENGTH_SHORT).show();
                                setResult(RESULT_OK);
                                finish();
                            } else {
                                btnDeleteExpense.setEnabled(true);
                                Toast.makeText(AddExpenseActivity.this, "Failed to delete: " + response.code(), Toast.LENGTH_LONG).show();
                            }
                        }

                        @Override
                        public void onFailure(Call<ResponseBody> call, Throwable t) {
                            btnDeleteExpense.setEnabled(true);
                            Toast.makeText(AddExpenseActivity.this, "Error: " + t.getMessage(), Toast.LENGTH_LONG).show();
                        }
                    });
                })
                .setNegativeButton("Cancel", null)
                .show();
    }
}
