from typing import List, Optional, Tuple
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models.category import Category
from app.models.expense import Expense


class CategoryRepository:
    @staticmethod
    def get_all(db: Session) -> List[Tuple[Category, int]]:
        """
        Returns all categories with their associated expense count.
        """
        stmt = (
            select(Category, func.count(Expense.id).label("expense_count"))
            .outerjoin(Expense, Expense.category_id == Category.id)
            .group_by(Category.id)
            .order_by(Category.name.asc())
        )
        return list(db.execute(stmt).all())

    @staticmethod
    def get_by_id(db: Session, category_id: int) -> Optional[Category]:
        stmt = select(Category).where(Category.id == category_id)
        return db.scalar(stmt)

    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Category]:
        stmt = select(Category).where(func.lower(Category.name) == func.lower(name.strip()))
        return db.scalar(stmt)

    @staticmethod
    def create(db: Session, name: str) -> Category:
        category = Category(name=name.strip())
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
    def count_expenses(db: Session, category_id: int) -> int:
        stmt = select(func.count(Expense.id)).where(Expense.category_id == category_id)
        return db.scalar(stmt) or 0
