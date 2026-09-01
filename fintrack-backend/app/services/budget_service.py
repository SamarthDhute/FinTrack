from datetime import date
from decimal import Decimal
import calendar
from typing import List, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.budget_repository import BudgetRepository
from app.repositories.category_repository import CategoryRepository
from app.schemas.budget_schema import BudgetCreate, BudgetUpdate, BudgetResponse


class BudgetService:
    @staticmethod
    def _get_current_month_date_range() -> Tuple[date, date]:
        today = date.today()
        start_date = date(today.year, today.month, 1)
        _, last_day = calendar.monthrange(today.year, today.month)
        end_date = date(today.year, today.month, last_day)
        return start_date, end_date

    @classmethod
    def _enrich_budget_response(cls, db: Session, budget, user_id: int) -> BudgetResponse:
        start_date, end_date = cls._get_current_month_date_range()
        spent = BudgetRepository.get_spent_amount(
            db=db,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            category_id=budget.category_id
        )
        remaining = budget.amount_limit - spent

        # Determine budget health status
        if spent > budget.amount_limit:
            status_val = "over_budget"
        elif spent >= (budget.amount_limit * Decimal("0.85")):
            status_val = "near_limit"
        else:
            status_val = "on_track"

        category_name = budget.category.name if budget.category else "Overall Monthly Budget"

        return BudgetResponse(
            id=budget.id,
            category_id=budget.category_id,
            category_name=category_name,
            amount_limit=budget.amount_limit,
            period=budget.period,
            spent_amount=spent,
            remaining_amount=remaining,
            status=status_val,
            created_at=budget.created_at
        )

    @classmethod
    def get_all_budgets(cls, db: Session, user_id: int, period: str = "monthly") -> List[BudgetResponse]:
        budgets = BudgetRepository.get_all(db, user_id=user_id, period=period)
        return [cls._enrich_budget_response(db, b, user_id=user_id) for b in budgets]

    @classmethod
    def get_budget_by_id(cls, db: Session, budget_id: int, user_id: int) -> BudgetResponse:
        budget = BudgetRepository.get_by_id(db, budget_id)
        if not budget:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Budget with ID {budget_id} not found"
            )
        if budget.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this budget"
            )
        return cls._enrich_budget_response(db, budget, user_id=user_id)

    @classmethod
    def create_budget(cls, db: Session, data: BudgetCreate, user_id: int) -> BudgetResponse:
        if data.category_id is not None:
            category = CategoryRepository.get_by_id(db, data.category_id, user_id=user_id)
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Category with ID {data.category_id} not found"
                )

        existing = BudgetRepository.get_by_category(db, user_id=user_id, category_id=data.category_id, period=data.period)
        if existing:
            target = "Overall budget" if data.category_id is None else f"Budget for category ID {data.category_id}"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{target} for period '{data.period}' already exists. Update it instead."
            )

        created = BudgetRepository.create(
            db=db,
            user_id=user_id,
            category_id=data.category_id,
            amount_limit=data.amount_limit,
            period=data.period
        )
        return cls._enrich_budget_response(db, created, user_id=user_id)

    @classmethod
    def update_budget(cls, db: Session, budget_id: int, data: BudgetUpdate, user_id: int) -> BudgetResponse:
        budget = BudgetRepository.get_by_id(db, budget_id)
        if not budget:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Budget with ID {budget_id} not found"
            )
        if budget.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this budget"
            )

        updated = BudgetRepository.update(
            db=db,
            budget=budget,
            amount_limit=data.amount_limit,
            period=data.period
        )
        return cls._enrich_budget_response(db, updated, user_id=user_id)

    @staticmethod
    def delete_budget(db: Session, budget_id: int, user_id: int) -> dict:
        budget = BudgetRepository.get_by_id(db, budget_id)
        if not budget:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Budget with ID {budget_id} not found"
            )
        if budget.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this budget"
            )

        BudgetRepository.delete(db, budget)
        return {"message": "Budget deleted successfully"}
