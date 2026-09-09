package com.fintrack.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.fintrack.app.R;
import com.fintrack.app.models.ChatMessage;
import java.util.ArrayList;
import java.util.List;

public class ChatMessageAdapter extends RecyclerView.Adapter<ChatMessageAdapter.ChatViewHolder> {

    private final List<ChatMessage> messages = new ArrayList<>();

    public void addMessage(ChatMessage message) {
        messages.add(message);
        notifyItemInserted(messages.size() - 1);
    }

    public void replaceLastMessage(ChatMessage message) {
        if (!messages.isEmpty()) {
            int pos = messages.size() - 1;
            messages.set(pos, message);
            notifyItemChanged(pos);
        } else {
            addMessage(message);
        }
    }

    public List<ChatMessage> getMessages() {
        return messages;
    }

    @NonNull
    @Override
    public ChatViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_chat_message, parent, false);
        return new ChatViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ChatViewHolder holder, int position) {
        ChatMessage msg = messages.get(position);
        if (msg.isUser()) {
            holder.layoutUserMsg.setVisibility(View.VISIBLE);
            holder.layoutAiMsg.setVisibility(View.GONE);
            holder.tvUserMsg.setText(msg.getContent());
        } else {
            holder.layoutUserMsg.setVisibility(View.GONE);
            holder.layoutAiMsg.setVisibility(View.VISIBLE);
            holder.tvAiMsg.setText(msg.getContent());
        }
    }

    @Override
    public int getItemCount() {
        return messages.size();
    }

    static class ChatViewHolder extends RecyclerView.ViewHolder {
        LinearLayout layoutUserMsg, layoutAiMsg;
        TextView tvUserMsg, tvAiMsg;

        public ChatViewHolder(@NonNull View itemView) {
            super(itemView);
            layoutUserMsg = itemView.findViewById(R.id.layoutUserMsg);
            layoutAiMsg = itemView.findViewById(R.id.layoutAiMsg);
            tvUserMsg = itemView.findViewById(R.id.tvUserMsg);
            tvAiMsg = itemView.findViewById(R.id.tvAiMsg);
        }
    }
}
