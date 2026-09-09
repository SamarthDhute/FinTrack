package com.fintrack.app.ui;

import android.app.Dialog;
import android.content.Context;
import android.os.Bundle;
import android.widget.EditText;
import android.widget.Toast;
import androidx.annotation.NonNull;
import com.fintrack.app.R;
import com.fintrack.app.api.ApiClient;
import com.fintrack.app.models.ChangePasswordRequest;
import com.google.android.material.button.MaterialButton;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ChangePasswordDialog extends Dialog {

    private EditText etCurrentPassword, etNewPassword, etConfirmNewPassword;
    private MaterialButton btnConfirmChangePass, btnCancelChangePass;

    public ChangePasswordDialog(@NonNull Context context) {
        super(context);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.dialog_change_password);

        if (getWindow() != null) {
            getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }

        initViews();
        setupListeners();
    }

    private void initViews() {
        etCurrentPassword = findViewById(R.id.etCurrentPassword);
        etNewPassword = findViewById(R.id.etNewPassword);
        etConfirmNewPassword = findViewById(R.id.etConfirmNewPassword);
        btnConfirmChangePass = findViewById(R.id.btnConfirmChangePass);
        btnCancelChangePass = findViewById(R.id.btnCancelChangePass);
    }

    private void setupListeners() {
        btnCancelChangePass.setOnClickListener(v -> dismiss());
        btnConfirmChangePass.setOnClickListener(v -> performChange());
    }

    private void performChange() {
        String current = etCurrentPassword.getText().toString().trim();
        String newPass = etNewPassword.getText().toString().trim();
        String confirm = etConfirmNewPassword.getText().toString().trim();

        if (current.isEmpty()) {
            Toast.makeText(getContext(), "Please enter your current password", Toast.LENGTH_SHORT).show();
            return;
        }

        if (newPass.length() < 8) {
            Toast.makeText(getContext(), "New password must be at least 8 characters", Toast.LENGTH_SHORT).show();
            return;
        }

        if (!newPass.equals(confirm)) {
            Toast.makeText(getContext(), "Passwords do not match", Toast.LENGTH_SHORT).show();
            return;
        }

        btnConfirmChangePass.setEnabled(false);
        btnConfirmChangePass.setText("Updating...");

        ChangePasswordRequest request = new ChangePasswordRequest(current, newPass);
        ApiClient.getService(getContext()).changePassword(request).enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                btnConfirmChangePass.setEnabled(true);
                btnConfirmChangePass.setText("Update Password");

                if (response.isSuccessful()) {
                    Toast.makeText(getContext(), "✅ Password updated successfully!", Toast.LENGTH_SHORT).show();
                    dismiss();
                } else {
                    String errorMsg = "Failed: " + response.code();
                    try {
                        if (response.errorBody() != null) {
                            errorMsg = response.errorBody().string();
                        }
                    } catch (Exception ignored) {}
                    Toast.makeText(getContext(), errorMsg, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                btnConfirmChangePass.setEnabled(true);
                btnConfirmChangePass.setText("Update Password");
                Toast.makeText(getContext(), "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }
}
