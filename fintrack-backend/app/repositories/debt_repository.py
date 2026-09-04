from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy import select, func, or_, and_, desc
from sqlalchemy.orm import Session, selectinload
from app.models.debt import Debt, DebtRepayment


class DebtRepository:
    @staticmethod
    def get_by_id(db: Session, debt_id: int, user_id: int) -> Optional[Debt]:
        stmt = (
            select(Debt)
            .options(selectinload(Debt.repayments))
            .where(and_(Debt.id == debt_id, Debt.user_id == user_id))
        )
        return db.scalar(stmt)

    @staticmethod
    def get_all(
        db: Session,
        user_id: int,
        status: Optional[str] = None,
        debt_type: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[Debt], int]:
        conditions = [Debt.user_id == user_id]

        if status:
            conditions.append(Debt.status == status.upper().strip())

        if debt_type:
            conditions.append(Debt.debt_type == debt_type.upper().strip())

        if search:
            search_pattern = f"%{search.strip()}%"
            conditions.append(
                or_(
                    Debt.person_name.ilike(search_pattern),
                    Debt.notes.ilike(search_pattern),
                )
            )

        # Count total
        count_stmt = select(func.count()).select_from(Debt).where(and_(*conditions))
        total_count = db.scalar(count_stmt) or 0

        # Query items
        stmt = (
            select(Debt)
            .options(selectinload(Debt.repayments))
            .where(and_(*conditions))
            .order_by(desc(Debt.created_at))
            .offset(skip)
            .limit(limit)
        )
        debts = list(db.scalars(stmt).all())
        return debts, total_count

    @staticmethod
    def create(db: Session, debt: Debt) -> Debt:
        db.add(debt)
        db.commit()
        db.refresh(debt)
        return debt

    @staticmethod
    def update(db: Session, debt: Debt) -> Debt:
        db.commit()
        db.refresh(debt)
        return debt

    @staticmethod
    def delete(db: Session, debt: Debt) -> None:
        db.delete(debt)
        db.commit()

    @staticmethod
    def create_repayment(db: Session, repayment: DebtRepayment) -> DebtRepayment:
        db.add(repayment)
        db.commit()
        db.refresh(repayment)
        return repayment

    @staticmethod
    def get_repayment_by_id(db: Session, repayment_id: int, user_id: int) -> Optional[DebtRepayment]:
        stmt = select(DebtRepayment).where(
            and_(DebtRepayment.id == repayment_id, DebtRepayment.user_id == user_id)
        )
        return db.scalar(stmt)

    @staticmethod
    def delete_repayment(db: Session, repayment: DebtRepayment) -> None:
        db.delete(repayment)
        db.commit()

    @staticmethod
    def get_summary(db: Session, user_id: int) -> dict:
        stmt = select(Debt).where(Debt.user_id == user_id)
        all_debts = list(db.scalars(stmt).all())

        total_lent_pending = Decimal("0.00")
        total_borrowed_pending = Decimal("0.00")
        total_lent_initial = Decimal("0.00")
        total_borrowed_initial = Decimal("0.00")
        active_count = 0
        settled_count = 0

        for d in all_debts:
            if d.debt_type == "LENT":
                total_lent_initial += Decimal(str(d.initial_amount))
                if d.status != "SETTLED":
                    total_lent_pending += Decimal(str(d.remaining_amount))
            elif d.debt_type == "BORROWED":
                total_borrowed_initial += Decimal(str(d.initial_amount))
                if d.status != "SETTLED":
                    total_borrowed_pending += Decimal(str(d.remaining_amount))

            if d.status == "SETTLED":
                settled_count += 1
            else:
                active_count += 1

        return {
            "total_lent_pending": total_lent_pending,
            "total_borrowed_pending": total_borrowed_pending,
            "total_lent_initial": total_lent_initial,
            "total_borrowed_initial": total_borrowed_initial,
            "active_count": active_count,
            "settled_count": settled_count,
            "total_debts_count": len(all_debts),
        }
