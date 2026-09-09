package com.fintrack.app.ui;

import android.app.Dialog;
import android.content.Context;
import android.os.Bundle;
import android.widget.EditText;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import com.fintrack.app.R;
import com.fintrack.app.api.ApiClient;
import com.fintrack.app.models.ForgotPasswordRequest;
import com.google.android.material.button.MaterialButton;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ForgotPasswordDialog extends Dialog {

    private final String initialEmail;
    private EditText etForgotEmail;
    private MaterialButton btnSendResetLink, btnHaveToken, btnCancelForgot;

    public ForgotPasswordDialog(@NonNull Context context, String initialEmail) {
        super(context);
        this.initialEmail = initialEmail;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.dialog_forgot_password);

        if (getWindow() != null) {
            getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }

        initViews();
        setupListeners();
    }

    private void initViews() {
        etForgotEmail = findViewById(R.id.etForgotEmail);
        btnSendResetLink = findViewById(R.id.btnSendResetLink);
        btnHaveToken = findViewById(R.id.btnHaveToken);
        btnCancelForgot = findViewById(R.id.btnCancelForgot);

        if (initialEmail != null && !initialEmail.isEmpty()) {
            etForgotEmail.setText(initialEmail);
        }
    }

    private void setupListeners() {
        btnCancelForgot.setOnClickListener(v -> dismiss());

        btnHaveToken.setOnClickListener(v -> {
            dismiss();
            new ResetPasswordDialog(getContext(), null, null).show();
        });

        btnSendResetLink.setOnClickListener(v -> sendResetRequest());
    }

    private void sendResetRequest() {
        String email = etForgotEmail.getText().toString().trim();

        if (email.isEmpty() || !email.contains("@")) {
            Toast.makeText(getContext(), "Please enter a valid email address", Toast.LENGTH_SHORT).show();
            return;
        }

        btnSendResetLink.setEnabled(false);
        btnSendResetLink.setText("Sending Link...");

        ApiClient.getService(getContext()).forgotPassword(new ForgotPasswordRequest(email))
                .enqueue(new Callback<ResponseBody>() {
                    @Override
                    public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                        btnSendResetLink.setEnabled(true);
                        btnSendResetLink.setText("Send Reset Link ➔");

                        dismiss();

                        new AlertDialog.Builder(getContext(), R.style.Theme_FinTrack_Dialog)
                                .setTitle("Check Your Email")
                                .setMessage("A password reset link has been dispatched to:\n" + email +
                                        "\n\nPlease check your inbox (and spam folder). You can click the link in your email or paste the reset token into the app.")
                                .setPositiveButton("Enter Token Now", (dialog, which) -> {
                                    new ResetPasswordDialog(getContext(), null, null).show();
                                })
                                .setNegativeButton("Done", null)
                                .show();
                    }

                    @Override
                    public void onFailure(Call<ResponseBody> call, Throwable t) {
                        btnSendResetLink.setEnabled(true);
                        btnSendResetLink.setText("Send Reset Link ➔");
                        Toast.makeText(getContext(), "Network error while sending reset link", Toast.LENGTH_SHORT).show();
                    }
                });
    }
}
