package com.fintrack.app.ui;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.text.method.HideReturnsTransformationMethod;
import android.text.method.PasswordTransformationMethod;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import com.fintrack.app.R;
import com.fintrack.app.api.ApiClient;
import com.fintrack.app.api.Constants;
import com.fintrack.app.api.SessionManager;
import com.fintrack.app.models.AuthResponse;
import com.fintrack.app.models.GoogleMobileAuthRequest;
import com.fintrack.app.models.LoginRequest;
import com.fintrack.app.models.RegisterRequest;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;
import com.google.android.material.button.MaterialButton;
import java.util.concurrent.Executor;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {

    private boolean isRegisterMode = false;
    private boolean isPasswordVisible = false;

    private TextView tabSignIn, tabRegister, tvAuthSubtitle, tvForgotPassword, tvGoogleBtnText;
    private LinearLayout layoutRegisterName, btnGoogleSignIn;
    private EditText etRegisterName, etEmail, etPassword;
    private ImageView ivTogglePassword;
    private MaterialButton btnLogin, btnBiometric;
    private SessionManager sessionManager;
    private GoogleSignInClient googleSignInClient;
    private ActivityResultLauncher<Intent> googleSignInLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        sessionManager = new SessionManager(this);

        // Auto-login check
        if (sessionManager.isLoggedIn()) {
            goToDashboard();
            return;
        }

        setContentView(R.layout.activity_login);
        initViews();
        setupListeners();
        setupGoogleSignIn();
    }

    private void initViews() {
        tabSignIn = findViewById(R.id.tabSignIn);
        tabRegister = findViewById(R.id.tabRegister);
        tvAuthSubtitle = findViewById(R.id.tvAuthSubtitle);
        tvForgotPassword = findViewById(R.id.tvForgotPassword);
        tvGoogleBtnText = findViewById(R.id.tvGoogleBtnText);

        layoutRegisterName = findViewById(R.id.layoutRegisterName);
        etRegisterName = findViewById(R.id.etRegisterName);
        etEmail = findViewById(R.id.etLoginEmail);
        etPassword = findViewById(R.id.etLoginPassword);
        ivTogglePassword = findViewById(R.id.ivTogglePassword);

        btnLogin = findViewById(R.id.btnLogin);
        btnGoogleSignIn = findViewById(R.id.btnGoogleSignIn);
        btnBiometric = findViewById(R.id.btnBiometric);

        TextView tvServerConfig = findViewById(R.id.tvServerConfig);
        if (tvServerConfig != null) {
            tvServerConfig.setOnClickListener(v -> showServerConfigDialog());
        }

        if (!sessionManager.isBiometricEnabled() || !sessionManager.isLoggedIn()) {
            btnBiometric.setVisibility(View.GONE);
        }
    }

    private void setupListeners() {
        // Pill Switcher listeners
        tabSignIn.setOnClickListener(v -> setAuthMode(false));
        tabRegister.setOnClickListener(v -> setAuthMode(true));

        // Submit button
        btnLogin.setOnClickListener(v -> {
            if (isRegisterMode) {
                performRegister();
            } else {
                performLogin();
            }
        });

        // Google Sign In
        btnGoogleSignIn.setOnClickListener(v -> performGoogleSignIn());

        // Forgot password
        if (tvForgotPassword != null) {
            tvForgotPassword.setOnClickListener(v -> {
                String currentEmail = etEmail.getText().toString().trim();
                new ForgotPasswordDialog(LoginActivity.this, currentEmail).show();
            });
        }

        // Biometric login
        btnBiometric.setOnClickListener(v -> triggerBiometricAuth());

        // Deep link token support
        if (getIntent() != null && getIntent().getData() != null) {
            String token = getIntent().getData().getQueryParameter("token");
            if (token != null && !token.isEmpty()) {
                new ResetPasswordDialog(this, token, null).show();
            }
        }
    }

    private void setAuthMode(boolean register) {
        this.isRegisterMode = register;
        if (register) {
            tabSignIn.setBackgroundResource(R.drawable.btn_pill_inactive);
            tabSignIn.setTextColor(ContextCompat.getColor(this, R.color.text_secondary));

            tabRegister.setBackgroundResource(R.drawable.btn_pill_active);
            tabRegister.setTextColor(ContextCompat.getColor(this, R.color.white));

            layoutRegisterName.setVisibility(View.VISIBLE);
            tvForgotPassword.setVisibility(View.GONE);
            btnLogin.setText("Create Account ➔");
            tvAuthSubtitle.setText("Create an account to start tracking your wealth");
            tvGoogleBtnText.setText("Sign up with Google");
        } else {
            tabSignIn.setBackgroundResource(R.drawable.btn_pill_active);
            tabSignIn.setTextColor(ContextCompat.getColor(this, R.color.white));

            tabRegister.setBackgroundResource(R.drawable.btn_pill_inactive);
            tabRegister.setTextColor(ContextCompat.getColor(this, R.color.text_secondary));

            layoutRegisterName.setVisibility(View.GONE);
            tvForgotPassword.setVisibility(View.VISIBLE);
            btnLogin.setText("Sign In ➔");
            tvAuthSubtitle.setText("Sign in to access your personal finance dashboard");
            tvGoogleBtnText.setText("Sign in with Google");
        }
    }

    private void performLogin() {
        String email = etEmail.getText().toString().trim();
        String password = etPassword.getText().toString().trim();

        if (email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please enter email and password", Toast.LENGTH_SHORT).show();
            return;
        }

        btnLogin.setEnabled(false);
        btnLogin.setText("Signing In...");

        LoginRequest request = new LoginRequest(email, password);
        ApiClient.getService(this).login(request).enqueue(new Callback<AuthResponse>() {
            @Override
            public void onResponse(Call<AuthResponse> call, Response<AuthResponse> response) {
                btnLogin.setEnabled(true);
                btnLogin.setText("Sign In ➔");

                if (response.isSuccessful() && response.body() != null) {
                    AuthResponse auth = response.body();
                    sessionManager.saveAuthToken(auth.getAccessToken());
                    if (auth.getUser() != null) {
                        sessionManager.saveUserDetails(auth.getUser().getEmail(), auth.getUser().getFullName());
                    }
                    sessionManager.setBiometricEnabled(true);
                    Toast.makeText(LoginActivity.this, "Welcome to FinTrack!", Toast.LENGTH_SHORT).show();
                    goToDashboard();
                } else {
                    Toast.makeText(LoginActivity.this, "Login failed: Invalid credentials or unverified email", Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<AuthResponse> call, Throwable t) {
                btnLogin.setEnabled(true);
                btnLogin.setText("Sign In ➔");
                Toast.makeText(LoginActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void performRegister() {
        String name = etRegisterName.getText().toString().trim();
        String email = etEmail.getText().toString().trim();
        String password = etPassword.getText().toString().trim();

        if (name.isEmpty()) {
            Toast.makeText(this, "Please enter your full name", Toast.LENGTH_SHORT).show();
            return;
        }
        if (email.isEmpty() || !email.contains("@")) {
            Toast.makeText(this, "Please enter a valid email", Toast.LENGTH_SHORT).show();
            return;
        }
        if (password.length() < 8) {
            Toast.makeText(this, "Password must be at least 8 characters", Toast.LENGTH_SHORT).show();
            return;
        }

        btnLogin.setEnabled(false);
        btnLogin.setText("Creating Account...");

        RegisterRequest request = new RegisterRequest(email, password, name);
        ApiClient.getService(this).register(request).enqueue(new Callback<AuthResponse>() {
            @Override
            public void onResponse(Call<AuthResponse> call, Response<AuthResponse> response) {
                btnLogin.setEnabled(true);
                btnLogin.setText("Create Account ➔");

                if (response.isSuccessful() && response.body() != null) {
                    AuthResponse auth = response.body();
                    sessionManager.saveAuthToken(auth.getAccessToken());
                    if (auth.getUser() != null) {
                        sessionManager.saveUserDetails(auth.getUser().getEmail(), auth.getUser().getFullName());
                    }
                    sessionManager.setBiometricEnabled(true);
                    Toast.makeText(LoginActivity.this, "Account created! Welcome to FinTrack!", Toast.LENGTH_SHORT).show();
                    goToDashboard();
                } else {
                    Toast.makeText(LoginActivity.this, "Registration failed. An account with this email may already exist.", Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<AuthResponse> call, Throwable t) {
                btnLogin.setEnabled(true);
                btnLogin.setText("Create Account ➔");
                Toast.makeText(LoginActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void setupGoogleSignIn() {
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(Constants.GOOGLE_SERVER_CLIENT_ID)
                .requestEmail()
                .build();

        googleSignInClient = GoogleSignIn.getClient(this, gso);

        googleSignInLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(result.getData());
                        handleGoogleSignInResult(task);
                    } else {
                        // User dismissed or back pressed
                    }
                }
        );
    }

    private void performGoogleSignIn() {
        if (googleSignInClient == null) {
            setupGoogleSignIn();
        }
        // Sign out first to ensure the account chooser is always displayed
        googleSignInClient.signOut().addOnCompleteListener(this, task -> {
            Intent signInIntent = googleSignInClient.getSignInIntent();
            googleSignInLauncher.launch(signInIntent);
        });
    }

    private void handleGoogleSignInResult(Task<GoogleSignInAccount> completedTask) {
        try {
            GoogleSignInAccount account = completedTask.getResult(ApiException.class);
            if (account != null && account.getIdToken() != null) {
                String idToken = account.getIdToken();
                sendGoogleTokenToBackend(idToken);
            } else {
                Toast.makeText(this, "Could not obtain Google ID token. Please try again.", Toast.LENGTH_LONG).show();
            }
        } catch (ApiException e) {
            int statusCode = e.getStatusCode();
            String errorMsg = "Google Sign-In failed (Code " + statusCode + "): " + e.getMessage();
            if (statusCode == 10) { // DEVELOPER_ERROR
                errorMsg = "Configuration Error (Code 10): Ensure debug SHA-1 fingerprint is registered in Google Cloud Console.";
            } else if (statusCode == 7) { // NETWORK_ERROR
                errorMsg = "Network error connecting to Google. Check internet connection.";
            } else if (statusCode == 12501) { // SIGN_IN_CANCELLED
                return;
            }
            Toast.makeText(this, errorMsg, Toast.LENGTH_LONG).show();
        }
    }

    private void sendGoogleTokenToBackend(String idToken) {
        Toast.makeText(this, "Authenticating with FinTrack...", Toast.LENGTH_SHORT).show();

        GoogleMobileAuthRequest request = new GoogleMobileAuthRequest(idToken);
        ApiClient.getService(this).googleLoginMobile(request).enqueue(new Callback<AuthResponse>() {
            @Override
            public void onResponse(Call<AuthResponse> call, Response<AuthResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    AuthResponse auth = response.body();
                    sessionManager.saveAuthToken(auth.getAccessToken());
                    if (auth.getUser() != null) {
                        sessionManager.saveUserDetails(auth.getUser().getEmail(), auth.getUser().getFullName());
                    }
                    sessionManager.setBiometricEnabled(true);
                    Toast.makeText(LoginActivity.this, "Welcome to FinTrack!", Toast.LENGTH_SHORT).show();
                    goToDashboard();
                } else {
                    String err = "Google login failed on server (HTTP " + response.code() + ")";
                    try {
                        if (response.errorBody() != null) {
                            err += ": " + response.errorBody().string();
                        }
                    } catch (Exception ignored) {}
                    Toast.makeText(LoginActivity.this, err, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<AuthResponse> call, Throwable t) {
                Toast.makeText(LoginActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void triggerBiometricAuth() {
        Executor executor = ContextCompat.getMainExecutor(this);
        BiometricPrompt biometricPrompt = new BiometricPrompt(LoginActivity.this, executor, new BiometricPrompt.AuthenticationCallback() {
            @Override
            public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                super.onAuthenticationSucceeded(result);
                goToDashboard();
            }

            @Override
            public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                super.onAuthenticationError(errorCode, errString);
                Toast.makeText(LoginActivity.this, "Biometric Auth Error: " + errString, Toast.LENGTH_SHORT).show();
            }
        });

        BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                .setTitle("FinTrack Biometric Login")
                .setSubtitle("Use your fingerprint or face to sign in")
                .setNegativeButtonText("Cancel")
                .build();

        biometricPrompt.authenticate(promptInfo);
    }

    private void showServerConfigDialog() {
        android.widget.EditText input = new android.widget.EditText(this);
        input.setText(sessionManager.getServerUrl());
        input.setTextColor(ContextCompat.getColor(this, R.color.text_primary));
        input.setBackgroundResource(R.drawable.bg_input_light);
        input.setPadding(32, 24, 32, 24);

        android.widget.FrameLayout container = new android.widget.FrameLayout(this);
        container.setPadding(40, 20, 40, 20);
        container.addView(input);

        new AlertDialog.Builder(this, R.style.Theme_FinTrack_Dialog)
                .setTitle("FinTrack Server Settings")
                .setMessage("Presets:\n• Render Cloud: https://fintrack-5wdf.onrender.com/api/v1/\n• USB: http://127.0.0.1:8000/api/v1/\n• Wi-Fi: http://192.168.1.62:8000/api/v1/")
                .setView(container)
                .setPositiveButton("Save", (dialog, which) -> {
                    String newUrl = input.getText().toString().trim();
                    if (!newUrl.isEmpty()) {
                        ApiClient.updateBaseUrl(LoginActivity.this, newUrl);
                        Toast.makeText(LoginActivity.this, "Server updated to: " + newUrl, Toast.LENGTH_LONG).show();
                    }
                })
                .setNeutralButton("Use Render Cloud", (dialog, which) -> {
                    ApiClient.updateBaseUrl(LoginActivity.this, "https://fintrack-5wdf.onrender.com/api/v1/");
                    Toast.makeText(LoginActivity.this, "Connected to Render Cloud", Toast.LENGTH_SHORT).show();
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void goToDashboard() {
        Intent intent = new Intent(LoginActivity.this, DashboardActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
