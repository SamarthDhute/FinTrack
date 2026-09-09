package com.fintrack.app.ui;

import android.app.Dialog;
import android.content.Context;
import android.os.Bundle;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.fintrack.app.R;
import com.fintrack.app.adapters.ChatMessageAdapter;
import com.fintrack.app.api.ApiClient;
import com.fintrack.app.models.AIChatRequest;
import com.fintrack.app.models.AIChatResponse;
import com.fintrack.app.models.ChatMessage;
import com.google.android.material.button.MaterialButton;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AIChatDialog extends Dialog {

    private RecyclerView rvChatMessages;
    private EditText etChatMessage;
    private MaterialButton btnSendMessage;
    private ImageButton btnCloseChat;

    private ChatMessageAdapter chatAdapter;

    public AIChatDialog(@NonNull Context context) {
        super(context);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.dialog_ai_chat);

        if (getWindow() != null) {
            getWindow().setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
            getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }

        initViews();
        setupRecyclerView();
        setupListeners();

        // Initial welcome message from AI
        chatAdapter.addMessage(new ChatMessage("assistant",
                "Namaste! 🙏 Main aapka FinTrack AI Financial Assistant hoon. Aap mujhse apne kharche, savings, budget ya kisi bhi wallet balance ke baare me pooch sakte hain!"));
    }

    private void initViews() {
        rvChatMessages = findViewById(R.id.rvChatMessages);
        etChatMessage = findViewById(R.id.etChatMessage);
        btnSendMessage = findViewById(R.id.btnSendMessage);
        btnCloseChat = findViewById(R.id.btnCloseChat);
    }

    private void setupRecyclerView() {
        chatAdapter = new ChatMessageAdapter();
        rvChatMessages.setLayoutManager(new LinearLayoutManager(getContext()));
        rvChatMessages.setAdapter(chatAdapter);
    }

    private void setupListeners() {
        btnCloseChat.setOnClickListener(v -> dismiss());
        btnSendMessage.setOnClickListener(v -> sendMessage());

        // Quick Prompt Chips (including Roast Mode)
        findViewById(R.id.chipRoastMode).setOnClickListener(v ->
                sendQuickPrompt("🔥 Roast my spending ruthlessly based on my latest expenses! Don't hold back!"));
        findViewById(R.id.chipSave5000).setOnClickListener(v ->
                sendQuickPrompt("💡 How can I realistically cut back and save ₹5,000 this month?"));
        findViewById(R.id.chipPredictMonth).setOnClickListener(v ->
                sendQuickPrompt("🔮 Predict my month-end spend and tell me if I am going to exceed my budget."));
        findViewById(R.id.chipSubscriptions).setOnClickListener(v ->
                sendQuickPrompt("🔄 What are my active recurring subscriptions and monthly fixed commitments?"));
        findViewById(R.id.chipFoodSpend).setOnClickListener(v ->
                sendQuickPrompt("🍔 How much have I spent on Food & Dining recently, and how can I optimize it?"));
    }

    private void sendQuickPrompt(String prompt) {
        etChatMessage.setText(prompt);
        sendMessage();
    }

    private void sendMessage() {
        String text = etChatMessage.getText().toString().trim();
        if (text.isEmpty()) return;

        // Snapshot history before adding the new message so message isn't duplicated
        java.util.List<ChatMessage> historySnapshot = new java.util.ArrayList<>(chatAdapter.getMessages());

        chatAdapter.addMessage(new ChatMessage("user", text));
        etChatMessage.setText("");

        // Show immediate thinking bubble
        chatAdapter.addMessage(new ChatMessage("assistant", "FinTrack AI soch raha hai... ⏳"));
        rvChatMessages.smoothScrollToPosition(chatAdapter.getItemCount() - 1);

        btnSendMessage.setEnabled(false);

        AIChatRequest request = new AIChatRequest(text, historySnapshot);
        ApiClient.getService(getContext()).chatWithAI(request).enqueue(new Callback<AIChatResponse>() {
            @Override
            public void onResponse(Call<AIChatResponse> call, Response<AIChatResponse> response) {
                btnSendMessage.setEnabled(true);
                if (response.isSuccessful() && response.body() != null) {
                    String reply = response.body().getReply();
                    if (reply != null && !reply.trim().isEmpty()) {
                        chatAdapter.replaceLastMessage(new ChatMessage("assistant", reply.trim()));
                    } else {
                        chatAdapter.replaceLastMessage(new ChatMessage("assistant",
                                "Mujhe khushi hogi aapke kharche ya budget me madad karne me! Kripya apna sawal poochhein."));
                    }
                } else {
                    chatAdapter.replaceLastMessage(new ChatMessage("assistant",
                            "Sorry, abhi response generate nahi ho pa raha hai. Kripya dobara try karein."));
                }
                rvChatMessages.smoothScrollToPosition(chatAdapter.getItemCount() - 1);
            }

            @Override
            public void onFailure(Call<AIChatResponse> call, Throwable t) {
                btnSendMessage.setEnabled(true);
                chatAdapter.replaceLastMessage(new ChatMessage("assistant",
                        "Network error: Server connect nahi ho paya (" + (t.getMessage() != null ? t.getMessage() : "Timeout") + ")"));
                rvChatMessages.smoothScrollToPosition(chatAdapter.getItemCount() - 1);
            }
        });
    }
}
