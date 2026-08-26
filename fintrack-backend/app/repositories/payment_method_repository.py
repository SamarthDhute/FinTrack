from typing import List, Optional, Tuple
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models.payment_method import PaymentMethod
from app.models.expense import Expense


class PaymentMethodRepository:
    @staticmethod
    def get_all(db: Session) -> List[Tuple[PaymentMethod, int]]:
        """
        Returns all payment methods along with the count of linked expenses.
        """
        stmt = (
            select(PaymentMethod, func.count(Expense.id).label("usage_count"))
            .outerjoin(Expense, Expense.payment_method_id == PaymentMethod.id)
            .group_by(PaymentMethod.id)
            .order_by(PaymentMethod.id.asc())
        )
        return list(db.execute(stmt).all())

    @staticmethod
    def get_by_id(db: Session, payment_method_id: int) -> Optional[PaymentMethod]:
        stmt = select(PaymentMethod).where(PaymentMethod.id == payment_method_id)
        return db.scalar(stmt)

    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[PaymentMethod]:
        stmt = select(PaymentMethod).where(func.lower(PaymentMethod.name) == func.lower(name.strip()))
        return db.scalar(stmt)
