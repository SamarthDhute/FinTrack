from datetime import date, timedelta
from typing import Dict, Any, List, Optional
from collections import defaultdict
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.category_repository import CategoryRepository
from app.repositories.budget_repository import BudgetRepository
from app.services.budget_service import BudgetService
from app.services.ai_provider import get_ai_provider
from app.schemas.ai_schema import (
    AIInsightsResponse,
    AICategorizeResponse,
    AIChatResponse,
    AIScanReceiptResponse,
    AISubscriptionsResponse,
    AISubscriptionItem,
    AIForecastResponse,
    AIGoalPlanResponse,
    CategoryCutback,
)


class AIService:

    @staticmethod
    def _build_user_financial_context(db: Session, user: User) -> Dict[str, Any]:
        """Aggregate comprehensive financial context for the user."""
        today = date.today()
        start_30d = today - timedelta(days=30)
        start_60d = today - timedelta(days=60)
        first_day_this_month = today.replace(day=1)

        # 1. 30d category spending
        cat_data_30d = ExpenseRepository.get_spending_by_category(db, user_id=user.id, date_from=start_30d, date_to=today)
        category_totals = {row.category_name: float(row.total_amount or 0) for row in cat_data_30d}

        # 2. 60d previous period spending
        cat_data_60d = ExpenseRepository.get_spending_by_category(db, user_id=user.id, date_from=start_60d, date_to=start_30d)
        prev_category_totals = {row.category_name: float(row.total_amount or 0) for row in cat_data_60d}

        # 3. Active budget statuses
        budget_statuses = BudgetService.get_all_budgets(db, user_id=user.id, period="monthly")
        formatted_budgets = []
        for b in budget_statuses:
            c_name = b.category_name or "Overall Monthly Budget"
            limit = float(b.amount_limit or 0)
            spent = float(b.spent_amount or 0)
            pct = (spent / limit * 100) if limit > 0 else 0
            is_over = b.status == "over_budget" or spent > limit
            is_near = b.status == "near_limit" or (pct >= 80 and not is_over)
            formatted_budgets.append({
                "category_name": c_name,
                "limit": limit,
                "spent": spent,
                "remaining": max(0.0, limit - spent),
                "percentage": round(pct, 1),
                "is_over_budget": is_over,
                "is_near_budget": is_near,
                "status": b.status,
            })

        # 4. Payment method spending distribution
        pm_data = ExpenseRepository.get_spending_by_payment_method(db, user_id=user.id, date_from=start_30d, date_to=today)
        pm_totals = {row.payment_method_name: float(row.total_amount or 0) for row in pm_data}

        # 5. Recent transactions and top highest expenses
        recent_expenses, total_count = ExpenseRepository.get_all(
            db, user_id=user.id, date_from=start_30d, date_to=today, limit=20
        )
        recent_samples = [
            {
                "title": exp.title,
                "category": exp.category.name if exp.category else "Other",
                "payment_method": exp.payment_method.name if exp.payment_method else "Cash",
                "amount": float(exp.amount),
                "date": str(exp.date),
            }
            for exp in recent_expenses
        ]

        sorted_by_amount = sorted(recent_samples, key=lambda x: x["amount"], reverse=True)
        top_expenses = sorted_by_amount[:5]

        # Pacing
        days_elapsed = max(1, today.day)
        total_30d = sum(category_totals.values())
        daily_avg = total_30d / 30.0

        user_name = getattr(user, "display_name", None) or (user.email.split("@")[0] if getattr(user, "email", None) else "there")

        return {
            "user_name": user_name,
            "currency": "INR (₹)",
            "period": "Last 30 Days",
            "total_spending_30d": round(total_30d, 2),
            "total_spending_prev_period": round(sum(prev_category_totals.values()), 2),
            "daily_average_spend": round(daily_avg, 2),
            "category_totals": category_totals,
            "prev_category_totals": prev_category_totals,
            "payment_method_totals": pm_totals,
            "budget_status": formatted_budgets,
            "top_highest_expenses": top_expenses,
            "recent_sample_transactions": recent_samples[:10],
            "transaction_count": total_count,
        }

    @staticmethod
    def generate_financial_insights(db: Session, user: User) -> AIInsightsResponse:
        context = AIService._build_user_financial_context(db, user)
        provider = get_ai_provider()
        return provider.generate_insights(context)

    @staticmethod
    def categorize_expense(db: Session, user: User, title: str, amount: Optional[float] = None) -> AICategorizeResponse:
        """Smartly auto-categorize an expense title using available user categories."""
        categories_data = CategoryRepository.get_all(db, user_id=user.id)
        categories_dict = []
        for item in categories_data:
            cat = item[0] if (isinstance(item, (tuple, list)) or hasattr(item, '__getitem__')) else item
            categories_dict.append({"id": cat.id, "name": cat.name})
        provider = get_ai_provider()
        return provider.categorize_expense(title=title, amount=amount, categories=categories_dict)

    @staticmethod
    def chat_with_advisor(db: Session, user: User, message: str, history: List[Dict[str, str]]) -> AIChatResponse:
        """Interactive conversational advisor with access to live user finance context."""
        context = AIService._build_user_financial_context(db, user)
        provider = get_ai_provider()
        return provider.chat_with_advisor(message=message, history=history, context=context)

    @staticmethod
    def scan_receipt(db: Session, user: User, image_base64: str, mime_type: str) -> AIScanReceiptResponse:
        """Extract structured expense information from receipt images using Vision AI."""
        categories_data = CategoryRepository.get_all(db, user_id=user.id)
        categories_dict = []
        for item in categories_data:
            cat = item[0] if (isinstance(item, (tuple, list)) or hasattr(item, '__getitem__')) else item
            categories_dict.append({"id": cat.id, "name": cat.name})
        provider = get_ai_provider()
        return provider.scan_receipt_image(image_base64=image_base64, mime_type=mime_type, categories=categories_dict)

    @staticmethod
    def detect_subscriptions(db: Session, user: User) -> AISubscriptionsResponse:
        """Identify recurring monthly / weekly payment patterns (subscriptions, rent, utilities)."""
        today = date.today()
        start_90d = today - timedelta(days=90)
        expenses, _ = ExpenseRepository.get_all(db, user_id=user.id, date_from=start_90d, date_to=today, limit=200)

        # Group by title / normalized merchant
        grouped = defaultdict(list)
        for exp in expenses:
            norm_title = re.sub(r"[^a-zA-Z0-9 ]", "", exp.title.lower()).strip()
            # Common subscription keywords
            sub_keywords = ["netflix", "spotify", "prime", "gym", "hotstar", "youtube", "rent", "wifi", "jio", "airtel", "apple", "google", "cloud", "broadband", "icici", "insurance", "sip", "cult"]
            is_sub_keyword = any(k in norm_title for k in sub_keywords)

            grouped[exp.title].append({
                "amount": float(exp.amount),
                "date": exp.date,
                "category": exp.category.name if exp.category else "Subscription",
                "is_keyword": is_sub_keyword,
            })

        subs = []
        total_monthly = 0.0

        for title, items in grouped.items():
            # If 2+ recurring occurrences OR matching subscription keyword
            if len(items) >= 2 or (len(items) >= 1 and items[0]["is_keyword"]):
                sorted_items = sorted(items, key=lambda x: x["date"], reverse=True)
                avg_amount = sum(x["amount"] for x in sorted_items) / len(sorted_items)
                last_date = sorted_items[0]["date"]
                next_date = last_date + timedelta(days=30)
                category_name = sorted_items[0]["category"]

                subs.append(
                    AISubscriptionItem(
                        name=title,
                        category_name=category_name,
                        average_amount=round(avg_amount, 2),
                        cadence="monthly",
                        last_payment_date=last_date.isoformat(),
                        next_predicted_date=next_date.isoformat(),
                        transaction_count=len(items),
                        status="active",
                    )
                )
                total_monthly += avg_amount

        return AISubscriptionsResponse(
            subscriptions=subs,
            total_monthly_burn=round(total_monthly, 2),
            count=len(subs),
            provider_used="rules (Subscription Engine)",
        )

    @staticmethod
    def calculate_forecast(db: Session, user: User) -> AIForecastResponse:
        """Forecast month-end spending based on run rate and days elapsed."""
        today = date.today()
        first_day_this_month = today.replace(day=1)
        first_day_prev_month = (first_day_this_month - timedelta(days=1)).replace(day=1)
        last_day_prev_month = first_day_this_month - timedelta(days=1)

        # Spend this month so far
        expenses_this_month, _ = ExpenseRepository.get_all(db, user_id=user.id, date_from=first_day_this_month, date_to=today, limit=500)
        current_spend = sum(float(e.amount) for e in expenses_this_month)

        # Spend last month total
        expenses_prev_month, _ = ExpenseRepository.get_all(db, user_id=user.id, date_from=first_day_prev_month, date_to=last_day_prev_month, limit=500)
        prev_month_spend = sum(float(e.amount) for e in expenses_prev_month)

        days_elapsed = max(1, today.day)
        # Approximate days in month
        days_in_month = 30
        days_remaining = max(0, days_in_month - days_elapsed)

        daily_run_rate = current_spend / days_elapsed
        projected_spend = current_spend + (daily_run_rate * days_remaining)

        diff_pct = ((projected_spend - prev_month_spend) / prev_month_spend * 100) if prev_month_spend > 0 else 0

        if diff_pct > 15:
            status = "warning_overspending"
            summary = f"At your current run-rate (₹{daily_run_rate:,.0f}/day), projected month-end spend is ₹{projected_spend:,.0f} ({abs(diff_pct):.1f}% higher than last month)."
        elif diff_pct < -10:
            status = "under_budget"
            summary = f"Great pacing! Projected spend is ₹{projected_spend:,.0f} ({abs(diff_pct):.1f}% lower than last month)."
        else:
            status = "on_track"
            summary = f"Spending is stable. Projected month-end total is ₹{projected_spend:,.0f} (₹{daily_run_rate:,.0f}/day)."

        return AIForecastResponse(
            current_month_spend_to_date=round(current_spend, 2),
            days_elapsed=days_elapsed,
            days_remaining=days_remaining,
            projected_month_end_spend=round(projected_spend, 2),
            daily_run_rate=round(daily_run_rate, 2),
            comparison_to_last_month_pct=round(diff_pct, 1),
            forecast_status=status,
            summary=summary,
        )

    @staticmethod
    def generate_goal_plan(db: Session, user: User, target_amount: float, target_months: int) -> AIGoalPlanResponse:
        """Create a realistic savings cutback strategy to achieve a financial goal."""
        today = date.today()
        start_30d = today - timedelta(days=30)
        cat_data = ExpenseRepository.get_spending_by_category(db, user_id=user.id, date_from=start_30d, date_to=today)

        total_spend = sum(float(row.total_amount or 0) for row in cat_data)
        monthly_savings_needed = target_amount / max(1, target_months)

        # Categorize feasibility
        if total_spend <= 0:
            feasibility = "moderate"
        elif monthly_savings_needed > total_spend * 0.5:
            feasibility = "unrealistic"
        elif monthly_savings_needed > total_spend * 0.3:
            feasibility = "aggressive"
        elif monthly_savings_needed > total_spend * 0.15:
            feasibility = "moderate"
        else:
            feasibility = "easy"

        # Allocate cutbacks from discretionary categories
        cutbacks = []
        remaining_cut = monthly_savings_needed

        # Sort categories with highest spend first
        sorted_cats = sorted(cat_data, key=lambda x: float(x.total_amount or 0), reverse=True)
        for cat in sorted_cats:
            c_name = cat.category_name
            c_amount = float(cat.total_amount or 0)
            if c_amount > 500 and remaining_cut > 0:
                cut_ratio = 0.25 if c_name in ["Food & Dining", "Shopping", "Entertainment", "Personal Care"] else 0.10
                suggested_cut = min(c_amount * cut_ratio, remaining_cut)
                if suggested_cut > 100:
                    cutbacks.append(
                        CategoryCutback(
                            category_name=c_name,
                            current_avg_spend=c_amount,
                            suggested_cutback_amount=round(suggested_cut, 0),
                            suggested_new_limit=round(c_amount - suggested_cut, 0),
                            savings_tip=f"Reduce non-essential {c_name} purchases to save ₹{suggested_cut:,.0f}/month.",
                        )
                    )
                    remaining_cut -= suggested_cut

        summary = (
            f"To reach your goal of ₹{target_amount:,.0f} in {target_months} months, "
            f"you need to save ₹{monthly_savings_needed:,.0f}/month. "
            f"This plan is rated '{feasibility.capitalize()}' based on your recent spending habits."
        )

        return AIGoalPlanResponse(
            target_amount=target_amount,
            target_months=target_months,
            monthly_savings_required=round(monthly_savings_needed, 2),
            feasibility=feasibility,
            total_current_monthly_spend=round(total_spend, 2),
            category_cutbacks=cutbacks,
            strategy_summary=summary,
        )
