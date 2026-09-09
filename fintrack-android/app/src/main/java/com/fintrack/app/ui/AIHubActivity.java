package com.fintrack.app.ui;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import com.fintrack.app.R;
import com.fintrack.app.api.ApiClient;
import com.fintrack.app.models.*;
import com.fintrack.app.utils.CurrencyFormatter;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.card.MaterialCardView;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AIHubActivity extends AppCompatActivity {

    private ImageButton btnBackAiHub, btnRefreshAiHub;
    private TextView tvHealthStatusBadge, tvHealthScoreValue, tvHealthSummary;
    private TextView tvForecastStatusBadge, tvForecastCurrentSpend, tvForecastProjectedSpend, tvForecastDailyRate, tvForecastSummary;
    private LinearLayout layoutAiInsightsContainer, layoutAiBudgetsContainer, layoutAiSubscriptionsContainer;
    private TextView tvSubscriptionsBurn;

    // Goal Planner
    private EditText etGoalTargetAmount, etGoalTargetMonths;
    private MaterialButton btnCalculateGoalPlan;
    private LinearLayout layoutGoalResults, layoutCategoryCutbacks;
    private TextView tvGoalMonthlyReq, tvGoalFeasibilityBadge, tvGoalStrategySummary;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_ai_hub);

        initViews();
        setupListeners();
        loadAllAIData();
    }

    private void initViews() {
        btnBackAiHub = findViewById(R.id.btnBackAiHub);
        btnRefreshAiHub = findViewById(R.id.btnRefreshAiHub);

        tvHealthStatusBadge = findViewById(R.id.tvHealthStatusBadge);
        tvHealthScoreValue = findViewById(R.id.tvHealthScoreValue);
        tvHealthSummary = findViewById(R.id.tvHealthSummary);

        tvForecastStatusBadge = findViewById(R.id.tvForecastStatusBadge);
        tvForecastCurrentSpend = findViewById(R.id.tvForecastCurrentSpend);
        tvForecastProjectedSpend = findViewById(R.id.tvForecastProjectedSpend);
        tvForecastDailyRate = findViewById(R.id.tvForecastDailyRate);
        tvForecastSummary = findViewById(R.id.tvForecastSummary);

        layoutAiInsightsContainer = findViewById(R.id.layoutAiInsightsContainer);
        layoutAiBudgetsContainer = findViewById(R.id.layoutAiBudgetsContainer);
        layoutAiSubscriptionsContainer = findViewById(R.id.layoutAiSubscriptionsContainer);
        tvSubscriptionsBurn = findViewById(R.id.tvSubscriptionsBurn);

        etGoalTargetAmount = findViewById(R.id.etGoalTargetAmount);
        etGoalTargetMonths = findViewById(R.id.etGoalTargetMonths);
        btnCalculateGoalPlan = findViewById(R.id.btnCalculateGoalPlan);
        layoutGoalResults = findViewById(R.id.layoutGoalResults);
        layoutCategoryCutbacks = findViewById(R.id.layoutCategoryCutbacks);
        tvGoalMonthlyReq = findViewById(R.id.tvGoalMonthlyReq);
        tvGoalFeasibilityBadge = findViewById(R.id.tvGoalFeasibilityBadge);
        tvGoalStrategySummary = findViewById(R.id.tvGoalStrategySummary);
    }

    private void setupListeners() {
        btnBackAiHub.setOnClickListener(v -> finish());
        btnRefreshAiHub.setOnClickListener(v -> loadAllAIData());
        btnCalculateGoalPlan.setOnClickListener(v -> calculateGoalPlan());
    }

    private void loadAllAIData() {
        Toast.makeText(this, "Refreshing AI Intelligence...", Toast.LENGTH_SHORT).show();
        loadFinancialInsights();
        loadForecast();
        loadSubscriptions();
    }

    private void loadFinancialInsights() {
        ApiClient.getService(this).getFinancialInsights().enqueue(new Callback<AIInsightsResponse>() {
            @Override
            public void onResponse(Call<AIInsightsResponse> call, Response<AIInsightsResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    AIInsightsResponse insights = response.body();
                    displayHealthScore(insights.getHealthScore());
                    displayInsightsList(insights.getKeyInsights());
                    displayBudgetRecommendations(insights.getBudgetRecommendations());
                }
            }

            @Override
            public void onFailure(Call<AIInsightsResponse> call, Throwable t) {
                Toast.makeText(AIHubActivity.this, "Insights error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void displayHealthScore(AIFinancialHealthScore healthScore) {
        if (healthScore == null) return;
        tvHealthScoreValue.setText(String.valueOf(healthScore.getScore()));
        tvHealthSummary.setText(healthScore.getSummary());

        String status = healthScore.getStatus() != null ? healthScore.getStatus() : "Good";
        tvHealthStatusBadge.setText(status.toUpperCase());

        int score = healthScore.getScore();
        if (score >= 80) {
            tvHealthScoreValue.setTextColor(ContextCompat.getColor(this, R.color.success));
        } else if (score >= 60) {
            tvHealthScoreValue.setTextColor(ContextCompat.getColor(this, R.color.primary));
        } else if (score >= 40) {
            tvHealthScoreValue.setTextColor(ContextCompat.getColor(this, R.color.warning));
        } else {
            tvHealthScoreValue.setTextColor(ContextCompat.getColor(this, R.color.danger));
        }
    }

    private void displayInsightsList(List<AIInsightItem> items) {
        layoutAiInsightsContainer.removeAllViews();
        if (items == null || items.isEmpty()) {
            TextView empty = new TextView(this);
            empty.setText("No critical anomalies or overspending detected this month. Great job! 🎉");
            empty.setTextColor(ContextCompat.getColor(this, R.color.text_muted));
            empty.setPadding(12, 12, 12, 12);
            layoutAiInsightsContainer.addView(empty);
            return;
        }

        LayoutInflater inflater = LayoutInflater.from(this);
        for (AIInsightItem item : items) {
            MaterialCardView card = new MaterialCardView(this);
            card.setRadius(28);
            card.setCardBackgroundColor(ContextCompat.getColor(this, R.color.surface_card));
            card.setStrokeColor(ContextCompat.getColor(this, R.color.surface_card_border));
            card.setStrokeWidth(2);
            card.setCardElevation(0);

            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            lp.setMargins(0, 0, 0, 20);
            card.setLayoutParams(lp);

            LinearLayout layout = new LinearLayout(this);
            layout.setOrientation(LinearLayout.VERTICAL);
            layout.setPadding(32, 24, 32, 24);

            RelativeLayout header = new RelativeLayout(this);
            TextView title = new TextView(this);
            title.setText(item.getTitle());
            title.setTextColor(ContextCompat.getColor(this, R.color.text_primary));
            title.setTextSize(14);
            title.setTypeface(null, android.graphics.Typeface.BOLD);

            TextView tag = new TextView(this);
            tag.setText(item.getImpactType() != null ? item.getImpactType().toUpperCase() : "TIP");
            tag.setTextSize(10);
            tag.setTypeface(null, android.graphics.Typeface.BOLD);
            tag.setPadding(16, 4, 16, 4);
            tag.setBackgroundResource(R.drawable.bg_badge_ai);
            tag.setTextColor(ContextCompat.getColor(this, R.color.primary));

            RelativeLayout.LayoutParams tagLp = new RelativeLayout.LayoutParams(
                    RelativeLayout.LayoutParams.WRAP_CONTENT, RelativeLayout.LayoutParams.WRAP_CONTENT);
            tagLp.addRule(RelativeLayout.ALIGN_PARENT_END);
            tag.setLayoutParams(tagLp);

            header.addView(title);
            header.addView(tag);
            layout.addView(header);

            TextView desc = new TextView(this);
            desc.setText(item.getDescription());
            desc.setTextColor(ContextCompat.getColor(this, R.color.text_secondary));
            desc.setTextSize(12);
            desc.setPadding(0, 10, 0, 0);
            layout.addView(desc);

            if (item.getEstimatedSavings() != null && item.getEstimatedSavings() > 0) {
                TextView sav = new TextView(this);
                sav.setText("💡 Potential Monthly Savings: " + CurrencyFormatter.format(item.getEstimatedSavings()));
                sav.setTextColor(ContextCompat.getColor(this, R.color.success));
                sav.setTextSize(12);
                sav.setTypeface(null, android.graphics.Typeface.BOLD);
                sav.setPadding(0, 8, 0, 0);
                layout.addView(sav);
            }

            card.addView(layout);
            layoutAiInsightsContainer.addView(card);
        }
    }

    private void displayBudgetRecommendations(List<AIBudgetRecommendation> recs) {
        layoutAiBudgetsContainer.removeAllViews();
        if (recs == null || recs.isEmpty()) {
            TextView empty = new TextView(this);
            empty.setText("No specific budget adjustments needed at this time.");
            empty.setTextColor(ContextCompat.getColor(this, R.color.text_muted));
            empty.setPadding(12, 12, 12, 12);
            layoutAiBudgetsContainer.addView(empty);
            return;
        }

        for (AIBudgetRecommendation rec : recs) {
            MaterialCardView card = new MaterialCardView(this);
            card.setRadius(28);
            card.setCardBackgroundColor(ContextCompat.getColor(this, R.color.surface_card));
            card.setStrokeColor(ContextCompat.getColor(this, R.color.surface_card_border));
            card.setStrokeWidth(2);
            card.setCardElevation(0);

            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            lp.setMargins(0, 0, 0, 20);
            card.setLayoutParams(lp);

            LinearLayout layout = new LinearLayout(this);
            layout.setOrientation(LinearLayout.VERTICAL);
            layout.setPadding(32, 24, 32, 24);

            RelativeLayout top = new RelativeLayout(this);
            TextView cat = new TextView(this);
            cat.setText(rec.getCategoryName());
            cat.setTextColor(ContextCompat.getColor(this, R.color.text_primary));
            cat.setTextSize(15);
            cat.setTypeface(null, android.graphics.Typeface.BOLD);

            TextView sug = new TextView(this);
            sug.setText("Suggest: " + CurrencyFormatter.format(rec.getSuggestedBudget()));
            sug.setTextColor(ContextCompat.getColor(this, R.color.primary));
            sug.setTextSize(13);
            sug.setTypeface(null, android.graphics.Typeface.BOLD);

            RelativeLayout.LayoutParams sugLp = new RelativeLayout.LayoutParams(
                    RelativeLayout.LayoutParams.WRAP_CONTENT, RelativeLayout.LayoutParams.WRAP_CONTENT);
            sugLp.addRule(RelativeLayout.ALIGN_PARENT_END);
            sug.setLayoutParams(sugLp);

            top.addView(cat);
            top.addView(sug);
            layout.addView(top);

            TextView spend = new TextView(this);
            spend.setText("Current monthly average: " + CurrencyFormatter.format(rec.getCurrentSpending()));
            spend.setTextColor(ContextCompat.getColor(this, R.color.text_secondary));
            spend.setTextSize(12);
            spend.setPadding(0, 8, 0, 0);
            layout.addView(spend);

            TextView reason = new TextView(this);
            reason.setText(rec.getReasoning());
            reason.setTextColor(ContextCompat.getColor(this, R.color.text_muted));
            reason.setTextSize(11);
            reason.setPadding(0, 4, 0, 0);
            layout.addView(reason);

            card.addView(layout);
            layoutAiBudgetsContainer.addView(card);
        }
    }

    private void loadForecast() {
        ApiClient.getService(this).getForecast().enqueue(new Callback<AIForecastResponse>() {
            @Override
            public void onResponse(Call<AIForecastResponse> call, Response<AIForecastResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    AIForecastResponse f = response.body();
                    tvForecastCurrentSpend.setText(CurrencyFormatter.format(f.getCurrentMonthSpendToDate()));
                    tvForecastProjectedSpend.setText(CurrencyFormatter.format(f.getProjectedMonthEndSpend()));
                    tvForecastDailyRate.setText(CurrencyFormatter.format(f.getDailyRunRate()) + "/day");
                    tvForecastSummary.setText(f.getSummary());

                    String status = f.getForecastStatus() != null ? f.getForecastStatus().replace("_", " ") : "On Track";
                    tvForecastStatusBadge.setText(status.toUpperCase());
                }
            }

            @Override
            public void onFailure(Call<AIForecastResponse> call, Throwable t) {}
        });
    }

    private void loadSubscriptions() {
        ApiClient.getService(this).getSubscriptions().enqueue(new Callback<AISubscriptionsResponse>() {
            @Override
            public void onResponse(Call<AISubscriptionsResponse> call, Response<AISubscriptionsResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    AISubscriptionsResponse sub = response.body();
                    tvSubscriptionsBurn.setText("Burn: " + CurrencyFormatter.format(sub.getTotalMonthlyBurn()) + "/mo");
                    displaySubscriptionsList(sub.getSubscriptions());
                }
            }

            @Override
            public void onFailure(Call<AISubscriptionsResponse> call, Throwable t) {}
        });
    }

    private void displaySubscriptionsList(List<AISubscriptionItem> subs) {
        layoutAiSubscriptionsContainer.removeAllViews();
        if (subs == null || subs.isEmpty()) {
            TextView empty = new TextView(this);
            empty.setText("No recurring subscriptions detected in your transactions.");
            empty.setTextColor(ContextCompat.getColor(this, R.color.text_muted));
            empty.setPadding(12, 12, 12, 12);
            layoutAiSubscriptionsContainer.addView(empty);
            return;
        }

        for (AISubscriptionItem item : subs) {
            MaterialCardView card = new MaterialCardView(this);
            card.setRadius(24);
            card.setCardBackgroundColor(ContextCompat.getColor(this, R.color.surface_card));
            card.setStrokeColor(ContextCompat.getColor(this, R.color.surface_card_border));
            card.setStrokeWidth(2);
            card.setCardElevation(0);

            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            lp.setMargins(0, 0, 0, 16);
            card.setLayoutParams(lp);

            RelativeLayout layout = new RelativeLayout(this);
            layout.setPadding(32, 20, 32, 20);

            LinearLayout left = new LinearLayout(this);
            left.setOrientation(LinearLayout.VERTICAL);

            TextView name = new TextView(this);
            name.setText(item.getName());
            name.setTextColor(ContextCompat.getColor(this, R.color.text_primary));
            name.setTextSize(14);
            name.setTypeface(null, android.graphics.Typeface.BOLD);

            TextView subDetail = new TextView(this);
            subDetail.setText(item.getCategoryName() + " • " + item.getCadence().toUpperCase() + " • " + item.getTransactionCount() + " cycles");
            subDetail.setTextColor(ContextCompat.getColor(this, R.color.text_muted));
            subDetail.setTextSize(11);

            left.addView(name);
            left.addView(subDetail);

            TextView amt = new TextView(this);
            amt.setText(CurrencyFormatter.format(item.getAverageAmount()));
            amt.setTextColor(ContextCompat.getColor(this, R.color.expense));
            amt.setTextSize(14);
            amt.setTypeface(null, android.graphics.Typeface.BOLD);

            RelativeLayout.LayoutParams amtLp = new RelativeLayout.LayoutParams(
                    RelativeLayout.LayoutParams.WRAP_CONTENT, RelativeLayout.LayoutParams.WRAP_CONTENT);
            amtLp.addRule(RelativeLayout.ALIGN_PARENT_END);
            amtLp.addRule(RelativeLayout.CENTER_VERTICAL);
            amt.setLayoutParams(amtLp);

            layout.addView(left);
            layout.addView(amt);
            card.addView(layout);
            layoutAiSubscriptionsContainer.addView(card);
        }
    }

    private void calculateGoalPlan() {
        String amtStr = etGoalTargetAmount.getText().toString().trim();
        String monthsStr = etGoalTargetMonths.getText().toString().trim();

        if (amtStr.isEmpty() || monthsStr.isEmpty()) {
            Toast.makeText(this, "Please enter target amount and months", Toast.LENGTH_SHORT).show();
            return;
        }

        double amount = Double.parseDouble(amtStr);
        int months = Integer.parseInt(monthsStr);

        btnCalculateGoalPlan.setEnabled(false);
        btnCalculateGoalPlan.setText("Calculating Strategy...");

        AIGoalPlanRequest request = new AIGoalPlanRequest(amount, months);
        ApiClient.getService(this).generateGoalPlan(request).enqueue(new Callback<AIGoalPlanResponse>() {
            @Override
            public void onResponse(Call<AIGoalPlanResponse> call, Response<AIGoalPlanResponse> response) {
                btnCalculateGoalPlan.setEnabled(true);
                btnCalculateGoalPlan.setText("✨ Calculate Savings Strategy");

                if (response.isSuccessful() && response.body() != null) {
                    AIGoalPlanResponse plan = response.body();
                    layoutGoalResults.setVisibility(View.VISIBLE);
                    tvGoalMonthlyReq.setText("Required: " + CurrencyFormatter.format(plan.getMonthlySavingsRequired()) + "/mo");
                    tvGoalFeasibilityBadge.setText(plan.getFeasibility() != null ? plan.getFeasibility().toUpperCase() : "FEASIBLE");
                    tvGoalStrategySummary.setText(plan.getStrategySummary());

                    displayCutbacks(plan.getCategoryCutbacks());
                } else {
                    Toast.makeText(AIHubActivity.this, "Could not generate plan", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<AIGoalPlanResponse> call, Throwable t) {
                btnCalculateGoalPlan.setEnabled(true);
                btnCalculateGoalPlan.setText("✨ Calculate Savings Strategy");
                Toast.makeText(AIHubActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void displayCutbacks(List<CategoryCutback> cutbacks) {
        layoutCategoryCutbacks.removeAllViews();
        if (cutbacks == null || cutbacks.isEmpty()) return;

        for (CategoryCutback cb : cutbacks) {
            LinearLayout item = new LinearLayout(this);
            item.setOrientation(LinearLayout.VERTICAL);
            item.setPadding(0, 12, 0, 12);

            RelativeLayout top = new RelativeLayout(this);
            TextView cat = new TextView(this);
            cat.setText(cb.getCategoryName());
            cat.setTextColor(ContextCompat.getColor(this, R.color.text_primary));
            cat.setTextSize(13);
            cat.setTypeface(null, android.graphics.Typeface.BOLD);

            TextView cut = new TextView(this);
            cut.setText("Cut -" + CurrencyFormatter.format(cb.getSuggestedCutbackAmount()));
            cut.setTextColor(ContextCompat.getColor(this, R.color.success));
            cut.setTextSize(12);
            cut.setTypeface(null, android.graphics.Typeface.BOLD);

            RelativeLayout.LayoutParams cutLp = new RelativeLayout.LayoutParams(
                    RelativeLayout.LayoutParams.WRAP_CONTENT, RelativeLayout.LayoutParams.WRAP_CONTENT);
            cutLp.addRule(RelativeLayout.ALIGN_PARENT_END);
            cut.setLayoutParams(cutLp);

            top.addView(cat);
            top.addView(cut);
            item.addView(top);

            TextView tip = new TextView(this);
            tip.setText(cb.getSavingsTip());
            tip.setTextColor(ContextCompat.getColor(this, R.color.text_secondary));
            tip.setTextSize(11);
            tip.setPadding(0, 4, 0, 0);
            item.addView(tip);

            layoutCategoryCutbacks.addView(item);
        }
    }
}
