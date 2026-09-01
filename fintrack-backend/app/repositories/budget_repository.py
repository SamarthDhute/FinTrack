from datetime import date
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session, selectinload
from app.models.budget import Budget
from app.models.expense import Expense


class BudgetRepository:
    @staticmethod
    def get_all(db: Session, user_id: int, period: str = "monthly") -> List[Budget]:
        stmt = (
            select(Budget)
            .options(selectinload(Budget.category))
            .where(and_(Budget.user_id == user_id, Budget.period == period))
            .order_by(Budget.category_id.nullsfirst())
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_by_id(db: Session, budget_id: int, user_id: Optional[int] = None) -> Optional[Budget]:
        conditions = [Budget.id == budget_id]
        if user_id is not None:
            conditions.append(Budget.user_id == user_id)

        stmt = (
            select(Budget)
            .options(selectinload(Budget.category))
            .where(and_(*conditions))
        )
        return db.scalar(stmt)

    @staticmethod
    def get_by_category(db: Session, user_id: int, category_id: Optional[int], period: str = "monthly") -> Optional[Budget]:
        conditions = [Budget.user_id == user_id, Budget.period == period]
        if category_id is None:
            conditions.append(Budget.category_id.is_(None))
        else:
            conditions.append(Budget.category_id == category_id)

        stmt = select(Budget).where(and_(*conditions))
        return db.scalar(stmt)

    @staticmethod
    def create(db: Session, user_id: int, category_id: Optional[int], amount_limit: Decimal, period: str = "monthly") -> Budget:
        budget = Budget(user_id=user_id, category_id=category_id, amount_limit=amount_limit, period=period)
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
        user_id: int,
        start_date: date,
        end_date: date,
        category_id: Optional[int] = None
    ) -> Decimal:
        """
        Calculates the sum of expenses for a specific user between start_date and end_date.
        If category_id is specified, filters by category; otherwise calculates total spending.
        """
        conditions = [
            Expense.user_id == user_id,
            Expense.date >= start_date,
            Expense.date <= end_date
        ]
        if category_id is not None:
            conditions.append(Expense.category_id == category_id)

        stmt = select(func.coalesce(func.sum(Expense.amount), Decimal("0.00"))).where(and_(*conditions))
        total = db.scalar(stmt)
        return Decimal(str(total or 0.00))
