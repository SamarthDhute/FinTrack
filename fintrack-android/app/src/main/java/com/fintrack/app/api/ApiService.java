package com.fintrack.app.api;

import com.fintrack.app.models.*;
import java.util.List;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.*;

public interface ApiService {

    // === AUTHENTICATION ===
    @POST("auth/login")
    Call<AuthResponse> login(@Body LoginRequest request);

    @POST("auth/register")
    Call<AuthResponse> register(@Body RegisterRequest request);

    @POST("auth/google/mobile")
    Call<AuthResponse> googleLoginMobile(@Body GoogleMobileAuthRequest request);

    @GET("auth/me")
    Call<User> getCurrentUser();

    @POST("auth/change-password")
    Call<ResponseBody> changePassword(@Body ChangePasswordRequest request);

    @POST("auth/forgot-password")
    Call<ResponseBody> forgotPassword(@Body ForgotPasswordRequest request);

    @POST("auth/reset-password")
    Call<ResponseBody> resetPassword(@Body ResetPasswordRequest request);

    // === WALLETS & ACCOUNTS ===
    @GET("wallets/summary")
    Call<WalletSummary> getWalletSummary();

    @GET("wallets")
    Call<List<Wallet>> getWallets();

    @POST("wallets")
    Call<Wallet> createWallet(@Body WalletCreateRequest request);

    @POST("wallets/{id}/deposit")
    Call<ResponseBody> depositFunds(
            @Path("id") int walletId,
            @Body DepositRequest request
    );

    @POST("wallets/transfer")
    Call<ResponseBody> transferFunds(@Body TransferRequest request);

    @GET("wallets/transactions/all")
    Call<List<WalletTransaction>> getAllTransactions();

    // === EXPENSES ===
    @GET("expenses")
    Call<ExpensesResponse> getExpenses(
            @Query("search") String search,
            @Query("category_id") Integer categoryId,
            @Query("skip") Integer skip,
            @Query("limit") Integer limit
    );

    @POST("expenses")
    Call<Expense> createExpense(@Body ExpenseCreateRequest request);

    @GET("expenses/{id}")
    Call<Expense> getExpenseDetails(@Path("id") int expenseId);

    @PUT("expenses/{id}")
    Call<Expense> updateExpense(
            @Path("id") int expenseId,
            @Body ExpenseUpdateRequest request
    );

    @DELETE("expenses/{id}")
    Call<ResponseBody> deleteExpense(@Path("id") int expenseId);

    // === CATEGORIES & PAYMENT METHODS ===
    @GET("categories")
    Call<List<Category>> getCategories();

    @POST("categories")
    Call<Category> createCategory(@Body CategoryCreateRequest request);

    @PUT("categories/{id}")
    Call<Category> updateCategory(@Path("id") int categoryId, @Body CategoryUpdateRequest request);

    @DELETE("categories/{id}")
    Call<ResponseBody> deleteCategory(@Path("id") int categoryId);

    @GET("payment-methods")
    Call<List<PaymentMethod>> getPaymentMethods();

    // === DASHBOARD ===
    @GET("dashboard/summary")
    Call<DashboardSummary> getDashboardSummary();

    // === BUDGETS ===
    @GET("budgets")
    Call<List<Budget>> getBudgets(@Query("period") String period);

    @POST("budgets")
    Call<Budget> createBudget(@Body BudgetCreateRequest request);

    @PUT("budgets/{id}")
    Call<Budget> updateBudget(@Path("id") int budgetId, @Body BudgetUpdateRequest request);

    @DELETE("budgets/{id}")
    Call<ResponseBody> deleteBudget(@Path("id") int budgetId);

    // === DEBTS & UDHAAR ===
    @GET("debts/summary")
    Call<DebtSummary> getDebtSummary();

    @GET("debts")
    Call<DebtsResponse> getDebts();

    @GET("debts/{id}")
    Call<Debt> getDebtById(@Path("id") int debtId);

    @POST("debts")
    Call<Debt> createDebt(@Body DebtCreateRequest request);

    @PUT("debts/{id}")
    Call<Debt> updateDebt(
            @Path("id") int debtId,
            @Body DebtUpdateRequest request
    );

    @POST("debts/{id}/repayments")
    Call<ResponseBody> recordRepayment(
            @Path("id") int debtId,
            @Body DebtRepaymentRequest request
    );

    @DELETE("debts/{id}")
    Call<ResponseBody> deleteDebt(@Path("id") int debtId);

    // === AI INTELLIGENCE ===
    @POST("ai/chat")
    Call<AIChatResponse> chatWithAI(@Body AIChatRequest request);

    @POST("ai/categorize")
    Call<AICategorizeResponse> autoCategorize(@Body AICategorizeRequest request);

    @POST("ai/scan-receipt")
    Call<AIScanReceiptResponse> scanReceipt(@Body AIScanReceiptRequest request);

    @POST("ai/insights")
    Call<AIInsightsResponse> getFinancialInsights();

    @GET("ai/forecast")
    Call<AIForecastResponse> getForecast();

    @GET("ai/subscriptions")
    Call<AISubscriptionsResponse> getSubscriptions();

    @POST("ai/goal-plan")
    Call<AIGoalPlanResponse> generateGoalPlan(@Body AIGoalPlanRequest request);

    @POST("ai/roast")
    Call<AIRoastResponse> getSpendingRoast();
}
