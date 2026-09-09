package com.fintrack.app.ui;

import android.app.Dialog;
import android.content.Context;
import android.os.Bundle;
import android.widget.EditText;
import android.widget.Toast;
import androidx.annotation.NonNull;
import com.fintrack.app.R;
import com.fintrack.app.api.ApiClient;
import com.fintrack.app.models.ResetPasswordRequest;
import com.google.android.material.button.MaterialButton;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ResetPasswordDialog extends Dialog {

    public interface OnPasswordResetSuccessListener {
        void onPasswordResetSuccess();
    }

    private final String initialToken;
    private final OnPasswordResetSuccessListener listener;

    private EditText etResetToken, etResetNewPassword, etResetConfirmPassword;
    private MaterialButton btnConfirmResetPassword, btnCancelReset;

    public ResetPasswordDialog(@NonNull Context context, String initialToken, OnPasswordResetSuccessListener listener) {
        super(context);
        this.initialToken = initialToken;
        this.listener = listener;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.dialog_reset_password);

        if (getWindow() != null) {
            getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }

        initViews();
        setupListeners();
    }

    private void initViews() {
        etResetToken = findViewById(R.id.etResetToken);
        etResetNewPassword = findViewById(R.id.etResetNewPassword);
        etResetConfirmPassword = findViewById(R.id.etResetConfirmPassword);
        btnConfirmResetPassword = findViewById(R.id.btnConfirmResetPassword);
        btnCancelReset = findViewById(R.id.btnCancelReset);

        if (initialToken != null && !initialToken.isEmpty()) {
            etResetToken.setText(initialToken);
        }
    }

    private void setupListeners() {
        btnCancelReset.setOnClickListener(v -> dismiss());

        btnConfirmResetPassword.setOnClickListener(v -> performReset());
    }

    private void performReset() {
        String token = etResetToken.getText().toString().trim();
        String newPassword = etResetNewPassword.getText().toString().trim();
        String confirmPassword = etResetConfirmPassword.getText().toString().trim();

        if (token.isEmpty()) {
            Toast.makeText(getContext(), "Please enter the reset token from your email", Toast.LENGTH_SHORT).show();
            return;
        }

        if (newPassword.length() < 8) {
            Toast.makeText(getContext(), "Password must be at least 8 characters long", Toast.LENGTH_SHORT).show();
            return;
        }

        if (!newPassword.equals(confirmPassword)) {
            Toast.makeText(getContext(), "Passwords do not match", Toast.LENGTH_SHORT).show();
            return;
        }

        btnConfirmResetPassword.setEnabled(false);
        btnConfirmResetPassword.setText("Updating...");

        ApiClient.getService(getContext()).resetPassword(new ResetPasswordRequest(token, newPassword))
                .enqueue(new Callback<ResponseBody>() {
                    @Override
                    public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                        btnConfirmResetPassword.setEnabled(true);
                        btnConfirmResetPassword.setText("Update Password");

                        if (response.isSuccessful()) {
                            Toast.makeText(getContext(), "Password updated successfully! Please sign in.", Toast.LENGTH_LONG).show();
                            dismiss();
                            if (listener != null) {
                                listener.onPasswordResetSuccess();
                            }
                        } else {
                            Toast.makeText(getContext(), "Invalid or expired reset token.", Toast.LENGTH_LONG).show();
                        }
                    }

                    @Override
                    public void onFailure(Call<ResponseBody> call, Throwable t) {
                        btnConfirmResetPassword.setEnabled(true);
                        btnConfirmResetPassword.setText("Update Password");
                        Toast.makeText(getContext(), "Network error while resetting password", Toast.LENGTH_SHORT).show();
                    }
                });
    }
}
