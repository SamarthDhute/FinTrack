from datetime import date, timedelta
from decimal import Decimal
import calendar
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.budget_repository import BudgetRepository
from app.services.expense_service import ExpenseService


class DashboardService:
    @staticmethod
    def _get_month_range(year: int, month: int):
        start_date = date(year, month, 1)
        _, last_day = calendar.monthrange(year, month)
        end_date = date(year, month, last_day)
        return start_date, end_date

    @classmethod
    def get_summary(cls, db: Session) -> Dict[str, Any]:
        today = date.today()
        current_start, current_end = cls._get_month_range(today.year, today.month)

        # Calculate previous month range
        if today.month == 1:
            prev_year = today.year - 1
            prev_month = 12
        else:
            prev_year = today.year
            prev_month = today.month - 1
        prev_start, prev_end = cls._get_month_range(prev_year, prev_month)

        # 1. Total all-time spend
        all_time_spend = BudgetRepository.get_spent_amount(db, date(2000, 1, 1), today)

        # 2. Current month spend
        current_month_spend = BudgetRepository.get_spent_amount(db, current_start, current_end)

        # 3. Previous month spend & % change
        prev_month_spend = BudgetRepository.get_spent_amount(db, prev_start, prev_end)
        if prev_month_spend > Decimal("0.00"):
            pct_change = round(((current_month_spend - prev_month_spend) / prev_month_spend) * 100, 2)
        else:
            pct_change = Decimal("0.00")

        # 4. Recent 5 expenses
        recent_expenses, _ = ExpenseRepository.get_all(db, sort_by="date_desc", skip=0, limit=5)
        recent_list = [ExpenseService._to_response(e) for e in recent_expenses]

        # 5. Overall budget info
        overall_budget = BudgetRepository.get_by_category(db, category_id=None, period="monthly")
        budget_summary = None
        if overall_budget:
            spent = current_month_spend
            remaining = overall_budget.amount_limit - spent
            if spent > overall_budget.amount_limit:
                b_status = "over_budget"
            elif spent >= (overall_budget.amount_limit * Decimal("0.85")):
                b_status = "near_limit"
            else:
                b_status = "on_track"

            budget_summary = {
                "limit": overall_budget.amount_limit,
                "spent": spent,
                "remaining": remaining,
                "status": b_status
            }

        return {
            "total_spend": all_time_spend,
            "all_time_spend": all_time_spend,
            "current_month_spend": current_month_spend,
            "previous_month_spend": prev_month_spend,
            "month_over_month_change_pct": pct_change,
            "recent_expenses": recent_list,
            "overall_budget": budget_summary
        }

    @classmethod
    def get_category_chart(cls, db: Session, date_from: Optional[date] = None, date_to: Optional[date] = None) -> List[Dict[str, Any]]:
        today = date.today()
        if not date_from or not date_to:
            date_from, date_to = cls._get_month_range(today.year, today.month)

        rows = ExpenseRepository.get_spending_by_category(db, date_from, date_to)
        total_sum = sum((Decimal(str(r.total_amount or 0)) for r in rows), Decimal("0.00"))

        chart_data = []
        for r in rows:
            amount = Decimal(str(r.total_amount or 0))
            pct = round((amount / total_sum * 100), 2) if total_sum > 0 else Decimal("0.00")
            chart_data.append({
                "category_id": r.category_id,
                "category_name": r.category_name,
                "total_amount": amount,
                "percentage": pct
            })
        return chart_data

    @classmethod
    def get_payment_method_chart(cls, db: Session, date_from: Optional[date] = None, date_to: Optional[date] = None) -> List[Dict[str, Any]]:
        today = date.today()
        if not date_from or not date_to:
            date_from, date_to = cls._get_month_range(today.year, today.month)

        rows = ExpenseRepository.get_spending_by_payment_method(db, date_from, date_to)
        total_sum = sum((Decimal(str(r.total_amount or 0)) for r in rows), Decimal("0.00"))

        chart_data = []
        for r in rows:
            amount = Decimal(str(r.total_amount or 0))
            pct = round((amount / total_sum * 100), 2) if total_sum > 0 else Decimal("0.00")
            chart_data.append({
                "payment_method_id": r.payment_method_id,
                "payment_method_name": r.payment_method_name,
                "total_amount": amount,
                "transaction_count": r.transaction_count,
                "percentage": pct
            })
        return chart_data

    @classmethod
    def get_trend_chart(cls, db: Session, days: int = 30) -> List[Dict[str, Any]]:
        today = date.today()
        start_date = today - timedelta(days=days - 1)
        rows = ExpenseRepository.get_daily_spending_trend(db, start_date, today)

        # Build a continuous dictionary of dates
        date_map = {r.date.isoformat(): Decimal(str(r.total_amount or 0)) for r in rows}
        result = []
        cur = start_date
        while cur <= today:
            key = cur.isoformat()
            result.append({
                "date": key,
                "total_amount": date_map.get(key, Decimal("0.00"))
            })
            cur += timedelta(days=1)

        return result
