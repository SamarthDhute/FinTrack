from typing import List, Optional, Tuple
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session
from app.models.category import Category
from app.models.expense import Expense


class CategoryRepository:
    @staticmethod
    def get_all(db: Session, user_id: int) -> List[Tuple[Category, int]]:
        """
        Returns all categories for a specific user with their associated expense count.
        """
        stmt = (
            select(Category, func.count(Expense.id).label("expense_count"))
            .outerjoin(Expense, and_(Expense.category_id == Category.id, Expense.user_id == user_id))
            .where(Category.user_id == user_id)
            .group_by(Category.id)
            .order_by(Category.name.asc())
        )
        return list(db.execute(stmt).all())

    @staticmethod
    def get_by_id(db: Session, category_id: int, user_id: Optional[int] = None) -> Optional[Category]:
        """
        Fetch a category by ID. If user_id is provided, scope to that user.
        Pass user_id=None only from internal/migration code.
        """
        conditions = [Category.id == category_id]
        if user_id is not None:
            conditions.append(Category.user_id == user_id)
        stmt = select(Category).where(and_(*conditions))
        return db.scalar(stmt)

    @staticmethod
    def get_by_name(db: Session, name: str, user_id: int) -> Optional[Category]:
        """Check if a category with this name already exists for this user."""
        stmt = select(Category).where(
            and_(
                func.lower(Category.name) == func.lower(name.strip()),
                Category.user_id == user_id,
            )
        )
        return db.scalar(stmt)

    @staticmethod
    def create(db: Session, name: str, user_id: int) -> Category:
        category = Category(name=name.strip(), user_id=user_id)
        db.add(category)
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def update(db: Session, category: Category, name: str) -> Category:
        category.name = name.strip()
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def delete(db: Session, category: Category) -> None:
        db.delete(category)
        db.commit()

    @staticmethod
    def count_expenses(db: Session, category_id: int, user_id: int) -> int:
        stmt = select(func.count(Expense.id)).where(
            and_(Expense.category_id == category_id, Expense.user_id == user_id)
        )
        return db.scalar(stmt) or 0
