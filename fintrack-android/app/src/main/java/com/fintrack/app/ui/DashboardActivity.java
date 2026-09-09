package com.fintrack.app.ui;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import com.fintrack.app.R;
import com.fintrack.app.api.ApiClient;
import com.fintrack.app.api.SessionManager;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.button.MaterialButton;

public class DashboardActivity extends AppCompatActivity {

    private TextView tvUserName;
    private MaterialButton btnAIAssistant, btnProfileMenu;
    private BottomNavigationView bottomNav;
    private SessionManager sessionManager;

    private final Fragment homeFragment = new HomeFragment();
    private final Fragment expensesFragment = new ExpensesFragment();
    private final Fragment walletsFragment = new WalletsFragment();
    private final Fragment budgetsFragment = new BudgetsFragment();
    private final Fragment debtsFragment = new DebtsFragment();
    private Fragment activeFragment;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        sessionManager = new SessionManager(this);

        if (!sessionManager.isLoggedIn()) {
            goToLogin();
            return;
        }

        setContentView(R.layout.activity_dashboard);
        initViews();
        setupNavigation();
        setupActions();
    }

    private void initViews() {
        tvUserName = findViewById(R.id.tvUserName);
        btnAIAssistant = findViewById(R.id.btnAIAssistant);
        btnProfileMenu = findViewById(R.id.btnProfileMenu);
        bottomNav = findViewById(R.id.bottomNav);

        String name = sessionManager.getUserName();
        if (name != null && !name.isEmpty()) {
            tvUserName.setText(name);
        } else {
            tvUserName.setText("FinTrack User");
        }
    }

    private void setupNavigation() {
        activeFragment = homeFragment;

        getSupportFragmentManager().beginTransaction()
                .add(R.id.fragmentContainer, debtsFragment, "DEBTS").hide(debtsFragment)
                .add(R.id.fragmentContainer, budgetsFragment, "BUDGETS").hide(budgetsFragment)
                .add(R.id.fragmentContainer, walletsFragment, "WALLETS").hide(walletsFragment)
                .add(R.id.fragmentContainer, expensesFragment, "EXPENSES").hide(expensesFragment)
                .add(R.id.fragmentContainer, homeFragment, "HOME")
                .commit();

        bottomNav.setOnItemSelectedListener(item -> {
            Fragment target = null;
            int itemId = item.getItemId();

            if (itemId == R.id.nav_home) {
                target = homeFragment;
            } else if (itemId == R.id.nav_expenses) {
                target = expensesFragment;
            } else if (itemId == R.id.nav_wallets) {
                target = walletsFragment;
            } else if (itemId == R.id.nav_budgets) {
                target = budgetsFragment;
            } else if (itemId == R.id.nav_debts) {
                target = debtsFragment;
            }

            if (target != null && target != activeFragment) {
                getSupportFragmentManager().beginTransaction().hide(activeFragment).show(target).commit();
                activeFragment = target;
                return true;
            }
            return true;
        });
    }

    private void setupActions() {
        // AI Assistant Modal
        btnAIAssistant.setOnClickListener(v -> {
            new AIChatDialog(DashboardActivity.this).show();
        });

        // Profile & Settings Menu
        btnProfileMenu.setOnClickListener(v -> showProfileOptions());
    }

    public void switchToTab(int navItemId) {
        bottomNav.setSelectedItemId(navItemId);
    }

    private void showProfileOptions() {
        CharSequence[] options = {"🧠 AI Intelligence Hub", "🏷️ Manage Categories", "🌐 Configure Server URL / IP", "🔐 Change Password", "🚪 Sign Out"};

        new AlertDialog.Builder(this, R.style.Theme_FinTrack_Dialog)
                .setTitle("Account & Settings")
                .setItems(options, (dialog, which) -> {
                    if (which == 0) {
                        startActivity(new Intent(DashboardActivity.this, AIHubActivity.class));
                    } else if (which == 1) {
                        new ManageCategoriesDialog(DashboardActivity.this, null).show();
                    } else if (which == 2) {
                        showServerConfigDialog();
                    } else if (which == 3) {
                        new ChangePasswordDialog(DashboardActivity.this).show();
                    } else if (which == 4) {
                        logoutUser();
                    }
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void showServerConfigDialog() {
        android.widget.EditText input = new android.widget.EditText(this);
        input.setText(sessionManager.getServerUrl());
        input.setTextColor(getResources().getColor(R.color.text_primary));
        input.setBackgroundResource(R.drawable.bg_input_field);
        input.setPadding(32, 24, 32, 24);

        android.widget.FrameLayout container = new android.widget.FrameLayout(this);
        container.setPadding(40, 20, 40, 20);
        container.addView(input);

        new AlertDialog.Builder(this, R.style.Theme_FinTrack_Dialog)
                .setTitle("FinTrack Server Settings")
                .setMessage("Presets:\n• USB: http://127.0.0.1:8000/api/v1/\n• Wi-Fi: http://192.168.1.62:8000/api/v1/")
                .setView(container)
                .setPositiveButton("Save", (dialog, which) -> {
                    String newUrl = input.getText().toString().trim();
                    if (!newUrl.isEmpty()) {
                        ApiClient.updateBaseUrl(DashboardActivity.this, newUrl);
                        Toast.makeText(DashboardActivity.this, "Server URL updated!", Toast.LENGTH_SHORT).show();
                        recreate();
                    }
                })
                .setNeutralButton("Use USB (127.0.0.1)", (dialog, which) -> {
                    ApiClient.updateBaseUrl(DashboardActivity.this, "http://127.0.0.1:8000/api/v1/");
                    Toast.makeText(DashboardActivity.this, "Using USB port 8000", Toast.LENGTH_SHORT).show();
                    recreate();
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    public void logoutUser() {
        sessionManager.clearSession();
        Toast.makeText(this, "Signed out successfully", Toast.LENGTH_SHORT).show();
        goToLogin();
    }

    public void handleSessionExpired() {
        sessionManager.clearSession();
        Toast.makeText(this, "Session expired. Please sign in again.", Toast.LENGTH_SHORT).show();
        goToLogin();
    }

    private void goToLogin() {
        Intent intent = new Intent(DashboardActivity.this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
