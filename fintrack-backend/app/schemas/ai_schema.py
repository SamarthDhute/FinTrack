from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class AIInsightItem(BaseModel):
    title: str = Field(..., description="Short catchy title for the insight")
    description: str = Field(..., description="Detailed explanation of the insight")
    category: Optional[str] = Field(None, description="Category name if applicable")
    impact_type: str = Field(..., description="Type: 'saving', 'warning', 'tip', or 'praise'")
    estimated_savings: Optional[float] = Field(None, description="Estimated monthly potential savings in INR")


class AIBudgetRecommendation(BaseModel):
    category_name: str = Field(..., description="Category name")
    current_spending: float = Field(..., description="Current average monthly spend")
    suggested_budget: float = Field(..., description="Suggested monthly budget limit")
    reasoning: str = Field(..., description="Why this budget is recommended")


class AIFinancialHealthScore(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Score between 0 and 100")
    status: str = Field(..., description="'Excellent', 'Good', 'Needs Attention', or 'Critical'")
    summary: str = Field(..., description="Brief one-line verdict on financial health")


class AIInsightsResponse(BaseModel):
    health_score: AIFinancialHealthScore
    key_insights: List[AIInsightItem] = Field(default_factory=list)
    budget_recommendations: List[AIBudgetRecommendation] = Field(default_factory=list)
    top_spending_category: Optional[str] = None
    total_analyzed_spend: float = 0.0
    generated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    provider_used: str = "rules"


# ── Smart Auto-Categorization ──────────────────────────────────────────────────
class AICategorizeRequest(BaseModel):
    title: str = Field(..., min_length=1, description="Expense description or merchant name")
    amount: Optional[float] = Field(None, description="Optional transaction amount")
    notes: Optional[str] = Field(None, description="Optional additional notes")


class AICategorizeResponse(BaseModel):
    suggested_category_id: Optional[int] = None
    category_name: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    suggested_payment_method: Optional[str] = None
    provider_used: str = "rules"


# ── AI Financial Chat Assistant ────────────────────────────────────────────────
class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User's natural language question")
    history: Optional[List[Dict[str, Any]]] = Field(default_factory=list)


class AIChatResponse(BaseModel):
    reply: str
    quick_followups: List[str] = Field(default_factory=list)
    provider_used: str = "rules"


# ── Receipt / Bill OCR Scanner ─────────────────────────────────────────────────
class AIScanReceiptRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded image string")
    mime_type: str = Field(default="image/jpeg", description="MIME type e.g. image/jpeg, image/png")


class AIScanReceiptResponse(BaseModel):
    title: str = "Receipt Expense"
    amount: Optional[float] = None
    date: Optional[str] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    merchant_name: Optional[str] = None
    payment_method_hint: Optional[str] = None
    confidence: float = 0.8
    provider_used: str = "rules"


# ── Subscription & Recurring Detector ──────────────────────────────────────────
class AISubscriptionItem(BaseModel):
    name: str
    category_name: str
    average_amount: float
    cadence: str = "monthly"  # monthly, weekly, yearly
    last_payment_date: str
    next_predicted_date: str
    transaction_count: int
    status: str = "active"  # active, irregular, potential_duplicate


class AISubscriptionsResponse(BaseModel):
    subscriptions: List[AISubscriptionItem] = Field(default_factory=list)
    total_monthly_burn: float = 0.0
    count: int = 0
    provider_used: str = "rules"


# ── Predictive Forecasting ────────────────────────────────────────────────────
class AIForecastResponse(BaseModel):
    current_month_spend_to_date: float
    days_elapsed: int
    days_remaining: int
    projected_month_end_spend: float
    daily_run_rate: float
    comparison_to_last_month_pct: float
    forecast_status: str  # on_track, warning_overspending, under_budget
    summary: str


# ── Goal-Based Savings Planner ─────────────────────────────────────────────────
class AIGoalPlanRequest(BaseModel):
    target_amount: float = Field(..., gt=0, description="Amount to save in INR")
    target_months: int = Field(..., ge=1, le=120, description="Target timeline in months")


class CategoryCutback(BaseModel):
    category_name: str
    current_avg_spend: float
    suggested_cutback_amount: float
    suggested_new_limit: float
    savings_tip: str


class AIGoalPlanResponse(BaseModel):
    target_amount: float
    target_months: int
    monthly_savings_required: float
    feasibility: str  # easy, moderate, aggressive, unrealistic
    total_current_monthly_spend: float
    category_cutbacks: List[CategoryCutback] = Field(default_factory=list)
    strategy_summary: str
