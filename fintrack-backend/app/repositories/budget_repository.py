from datetime import date
from decimal import Decimal
from typing import List, Optional
# pyrefly: ignore [missing-import]
from sqlalchemy import select, func, and_
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session, selectinload
from app.models.budget import Budget
from app.models.expense import Expense


class BudgetRepository:
    @staticmethod
    def get_all(db: Session, period: str = "monthly") -> List[Budget]:
        stmt = (
            select(Budget)
            .options(selectinload(Budget.category))
            .where(Budget.period == period)
            .order_by(Budget.category_id.nullsfirst())
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_by_id(db: Session, budget_id: int) -> Optional[Budget]:
        stmt = (
            select(Budget)
            .options(selectinload(Budget.category))
            .where(Budget.id == budget_id)
        )
        return db.scalar(stmt)

    @staticmethod
    def get_by_category(db: Session, category_id: Optional[int], period: str = "monthly") -> Optional[Budget]:
        if category_id is None:
            stmt = select(Budget).where(and_(Budget.category_id.is_(None), Budget.period == period))
        else:
            stmt = select(Budget).where(and_(Budget.category_id == category_id, Budget.period == period))
        return db.scalar(stmt)

    @staticmethod
    def create(db: Session, category_id: Optional[int], amount_limit: Decimal, period: str = "monthly") -> Budget:
        budget = Budget(category_id=category_id, amount_limit=amount_limit, period=period)
        db.add(budget)
        db.commit()
        db.refresh(budget)
        return budget

    @staticmethod
    def update(db: Session, budget: Budget, amount_limit: Optional[Decimal] = None, period: Optional[str] = None) -> Budget:
        if amount_limit is not None:
            budget.amount_limit = amount_limit
        if period is not None:
            budget.period = period
        db.commit()
        db.refresh(budget)
        return budget

    @staticmethod
    def delete(db: Session, budget: Budget) -> None:
        db.delete(budget)
        db.commit()

    @staticmethod
    def get_spent_amount(
        db: Session,
        start_date: date,
        end_date: date,
        category_id: Optional[int] = None
    ) -> Decimal:
        """
        Calculates the sum of expenses between start_date and end_date.
        If category_id is specified, filters by category; otherwise calculates total spending.
        """
        conditions = [Expense.date >= start_date, Expense.date <= end_date]
        if category_id is not None:
            conditions.append(Expense.category_id == category_id)

        stmt = select(func.coalesce(func.sum(Expense.amount), Decimal("0.00"))).where(and_(*conditions))
        total = db.scalar(stmt)
        return Decimal(str(total or 0.00))
