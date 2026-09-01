from datetime import date
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy import select, func, or_, and_, desc, asc
from sqlalchemy.orm import Session, selectinload
from app.models.expense import Expense
from app.models.category import Category
from app.models.payment_method import PaymentMethod


class ExpenseRepository:
    @staticmethod
    def get_by_id(db: Session, expense_id: int, user_id: Optional[int] = None) -> Optional[Expense]:
        conditions = [Expense.id == expense_id]
        if user_id is not None:
            conditions.append(Expense.user_id == user_id)

        stmt = (
            select(Expense)
            .options(
                selectinload(Expense.category),
                selectinload(Expense.payment_method)
            )
            .where(and_(*conditions))
        )
        return db.scalar(stmt)

    @staticmethod
    def get_all(
        db: Session,
        user_id: int,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        payment_method_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        amount_min: Optional[Decimal] = None,
        amount_max: Optional[Decimal] = None,
        sort_by: Optional[str] = "date_desc",
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[Expense], int]:
        conditions = [Expense.user_id == user_id]

        if search:
            search_pattern = f"%{search.strip()}%"
            conditions.append(
                or_(
                    Expense.title.ilike(search_pattern),
                    Expense.notes.ilike(search_pattern)
                )
            )

        if category_id is not None:
            conditions.append(Expense.category_id == category_id)

        if payment_method_id is not None:
            conditions.append(Expense.payment_method_id == payment_method_id)

        if date_from is not None:
            conditions.append(Expense.date >= date_from)

        if date_to is not None:
            conditions.append(Expense.date <= date_to)

        if amount_min is not None:
            conditions.append(Expense.amount >= amount_min)

        if amount_max is not None:
            conditions.append(Expense.amount <= amount_max)

        where_clause = and_(*conditions)

        # Total count query
        count_stmt = select(func.count(Expense.id)).where(where_clause)
        total_count = db.scalar(count_stmt) or 0

        # Query with eager-loaded relations
        stmt = (
            select(Expense)
            .options(
                selectinload(Expense.category),
                selectinload(Expense.payment_method)
            )
            .where(where_clause)
        )

        # Sorting logic
        if sort_by == "date_asc":
            stmt = stmt.order_by(Expense.date.asc(), Expense.id.asc())
        elif sort_by == "amount_desc":
            stmt = stmt.order_by(Expense.amount.desc(), Expense.id.desc())
        elif sort_by == "amount_asc":
            stmt = stmt.order_by(Expense.amount.asc(), Expense.id.asc())
        elif sort_by == "title_asc":
            stmt = stmt.order_by(Expense.title.asc())
        elif sort_by == "title_desc":
            stmt = stmt.order_by(Expense.title.desc())
        else:  # default: date_desc
            stmt = stmt.order_by(Expense.date.desc(), Expense.id.desc())

        # Pagination
        stmt = stmt.offset(skip).limit(limit)
        items = list(db.scalars(stmt).all())

        return items, total_count

    @staticmethod
    def create(
        db: Session,
        user_id: int,
        title: str,
        category_id: int,
        payment_method_id: int,
        amount: Decimal,
        date: date,
        notes: Optional[str] = None
    ) -> Expense:
        expense = Expense(
            user_id=user_id,
            title=title.strip(),
            category_id=category_id,
            payment_method_id=payment_method_id,
            amount=amount,
            date=date,
            notes=notes.strip() if notes else None
        )
        db.add(expense)
        db.commit()
        db.refresh(expense)
        # Eager load relationships before returning
        return ExpenseRepository.get_by_id(db, expense.id, user_id=user_id) or expense

    @staticmethod
    def update(
        db: Session,
        expense: Expense,
        title: Optional[str] = None,
        category_id: Optional[int] = None,
        payment_method_id: Optional[int] = None,
        amount: Optional[Decimal] = None,
        date: Optional[date] = None,
        notes: Optional[str] = None
    ) -> Expense:
        if title is not None:
            expense.title = title.strip()
        if category_id is not None:
            expense.category_id = category_id
        if payment_method_id is not None:
            expense.payment_method_id = payment_method_id
        if amount is not None:
            expense.amount = amount
        if date is not None:
            expense.date = date
        if notes is not None:
            expense.notes = notes.strip() if notes else None

        db.commit()
        db.refresh(expense)
        return ExpenseRepository.get_by_id(db, expense.id, user_id=expense.user_id) or expense

    @staticmethod
    def delete(db: Session, expense: Expense) -> None:
        db.delete(expense)
        db.commit()

    @staticmethod
    def get_spending_by_category(db: Session, user_id: int, date_from: Optional[date] = None, date_to: Optional[date] = None):
        conditions = [Expense.user_id == user_id]
        if date_from:
            conditions.append(Expense.date >= date_from)
        if date_to:
            conditions.append(Expense.date <= date_to)

        stmt = (
            select(
                Category.id.label("category_id"),
                Category.name.label("category_name"),
                func.sum(Expense.amount).label("total_amount")
            )
            .join(Category, Category.id == Expense.category_id)
            .where(and_(*conditions))
            .group_by(Category.id, Category.name)
            .order_by(func.sum(Expense.amount).desc())
        )
        return db.execute(stmt).all()

    @staticmethod
    def get_spending_by_payment_method(db: Session, user_id: int, date_from: Optional[date] = None, date_to: Optional[date] = None):
        conditions = [Expense.user_id == user_id]
        if date_from:
            conditions.append(Expense.date >= date_from)
        if date_to:
            conditions.append(Expense.date <= date_to)

        stmt = (
            select(
                PaymentMethod.id.label("payment_method_id"),
                PaymentMethod.name.label("payment_method_name"),
                func.sum(Expense.amount).label("total_amount"),
                func.count(Expense.id).label("transaction_count")
            )
            .join(PaymentMethod, PaymentMethod.id == Expense.payment_method_id)
            .where(and_(*conditions))
            .group_by(PaymentMethod.id, PaymentMethod.name)
            .order_by(func.sum(Expense.amount).desc())
        )
        return db.execute(stmt).all()

    @staticmethod
    def get_daily_spending_trend(db: Session, user_id: int, date_from: date, date_to: date):
        stmt = (
            select(
                Expense.date.label("date"),
                func.sum(Expense.amount).label("total_amount"),
                func.count(Expense.id).label("count")
            )
            .where(
                and_(
                    Expense.user_id == user_id,
                    Expense.date >= date_from,
                    Expense.date <= date_to
                )
            )
            .group_by(Expense.date)
            .order_by(Expense.date.asc())
        )
        return db.execute(stmt).all()
