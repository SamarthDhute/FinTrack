from typing import List, Optional, Tuple, Dict, Any
from decimal import Decimal
from sqlalchemy import select, func, or_, desc
from sqlalchemy.orm import Session, joinedload

from app.models.user import User
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.wallet import Wallet
from app.models.debt import Debt
from app.models.category import Category
from app.models.payment_method import PaymentMethod


class AdminRepository:
    @staticmethod
    def get_platform_stats(db: Session) -> Dict[str, Any]:
        """
        Aggregate top-level platform statistics for superadmin overview.
        """
        # 1. User counts
        total_users = db.scalar(select(func.count(User.id))) or 0
        active_users = db.scalar(select(func.count(User.id)).where(User.is_active.is_(True))) or 0
        verified_users = db.scalar(select(func.count(User.id)).where(User.is_verified.is_(True))) or 0
        google_users = db.scalar(select(func.count(User.id)).where(User.google_id.is_not(None))) or 0

        # 2. Expense stats
        total_expenses = db.scalar(select(func.count(Expense.id))) or 0
        total_spend = db.scalar(select(func.coalesce(func.sum(Expense.amount), Decimal("0.00")))) or Decimal("0.00")

        # 3. Budgets & Wallets
        total_budgets = db.scalar(select(func.count(Budget.id))) or 0
        total_wallets = db.scalar(select(func.count(Wallet.id))) or 0

        # 4. Debts stats
        total_debts = db.scalar(select(func.count(Debt.id))) or 0
        total_lent = db.scalar(
            select(func.coalesce(func.sum(Debt.initial_amount), Decimal("0.00")))
            .where(Debt.debt_type == "LENT")
        ) or Decimal("0.00")
        total_borrowed = db.scalar(
            select(func.coalesce(func.sum(Debt.initial_amount), Decimal("0.00")))
            .where(Debt.debt_type == "BORROWED")
        ) or Decimal("0.00")

        return {
            "total_users": total_users,
            "active_users": active_users,
            "verified_users": verified_users,
            "google_users": google_users,
            "total_expenses_count": total_expenses,
            "total_spend_amount": total_spend,
            "total_budgets_count": total_budgets,
            "total_wallets_count": total_wallets,
            "total_debts_count": total_debts,
            "total_lent_amount": total_lent,
            "total_borrowed_amount": total_borrowed,
        }

    @staticmethod
    def list_users(
        db: Session,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Tuple[User, int, Decimal, int, int, int]]:
        """
        Returns list of users matching optional search query, ordered by creation date descending,
        along with expense_count, total_spent, wallet_count, budget_count, and debt_count.
        """
        query = select(User)
        if search:
            pattern = f"%{search.strip().lower()}%"
            query = query.where(
                or_(
                    func.lower(User.email).like(pattern),
                    func.lower(User.display_name).like(pattern),
                )
            )

        query = query.order_by(desc(User.created_at)).offset(skip).limit(limit)
        users = list(db.scalars(query).all())

        results = []
        for u in users:
            exp_count = db.scalar(select(func.count(Expense.id)).where(Expense.user_id == u.id)) or 0
            total_spent = db.scalar(
                select(func.coalesce(func.sum(Expense.amount), Decimal("0.00"))).where(Expense.user_id == u.id)
            ) or Decimal("0.00")
            w_count = db.scalar(select(func.count(Wallet.id)).where(Wallet.user_id == u.id)) or 0
            b_count = db.scalar(select(func.count(Budget.id)).where(Budget.user_id == u.id)) or 0
            d_count = db.scalar(select(func.count(Debt.id)).where(Debt.user_id == u.id)) or 0

            results.append((u, exp_count, total_spent, w_count, b_count, d_count))

        return results

    @staticmethod
    def get_user_details(db: Session, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Fetches full user profile, their complete expenses, budgets, wallets, and debts.
        """
        user = db.scalar(select(User).where(User.id == user_id))
        if not user:
            return None

        # 1. User aggregates
        exp_count = db.scalar(select(func.count(Expense.id)).where(Expense.user_id == user.id)) or 0
        total_spent = db.scalar(
            select(func.coalesce(func.sum(Expense.amount), Decimal("0.00"))).where(Expense.user_id == user.id)
        ) or Decimal("0.00")
        w_count = db.scalar(select(func.count(Wallet.id)).where(Wallet.user_id == user.id)) or 0
        b_count = db.scalar(select(func.count(Budget.id)).where(Budget.user_id == user.id)) or 0
        d_count = db.scalar(select(func.count(Debt.id)).where(Debt.user_id == user.id)) or 0

        # 2. User Expenses
        expenses = list(
            db.scalars(
                select(Expense)
                .options(
                    joinedload(Expense.category),
                    joinedload(Expense.payment_method),
                    joinedload(Expense.wallet),
                )
                .where(Expense.user_id == user_id)
                .order_by(desc(Expense.date), desc(Expense.id))
                .limit(200)
            ).all()
        )

        # 3. User Budgets
        budgets = list(
            db.scalars(
                select(Budget)
                .options(joinedload(Budget.category))
                .where(Budget.user_id == user_id)
                .order_by(desc(Budget.created_at))
            ).all()
        )

        # 4. User Wallets
        wallets = list(
            db.scalars(
                select(Wallet)
                .where(Wallet.user_id == user_id)
                .order_by(desc(Wallet.is_default), desc(Wallet.balance))
            ).all()
        )

        # 5. User Debts
        debts = list(
            db.scalars(
                select(Debt)
                .where(Debt.user_id == user_id)
                .order_by(desc(Debt.created_at))
            ).all()
        )

        return {
            "user": (user, exp_count, total_spent, w_count, b_count, d_count),
            "expenses": expenses,
            "budgets": budgets,
            "wallets": wallets,
            "debts": debts,
        }

    @staticmethod
    def list_all_expenses(
        db: Session,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Expense]:
        """
        List expenses across all users for platform audit log.
        """
        query = (
            select(Expense)
            .options(
                joinedload(Expense.user),
                joinedload(Expense.category),
                joinedload(Expense.payment_method),
                joinedload(Expense.wallet),
            )
        )
        if search:
            pattern = f"%{search.strip().lower()}%"
            query = query.join(Expense.user).where(
                or_(
                    func.lower(Expense.title).like(pattern),
                    func.lower(User.email).like(pattern),
                    func.lower(User.display_name).like(pattern),
                )
            )

        query = query.order_by(desc(Expense.created_at)).offset(skip).limit(limit)
        return list(db.scalars(query).all())

    @staticmethod
    def list_all_budgets(
        db: Session,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Budget]:
        """
        List budgets across all users.
        """
        query = (
            select(Budget)
            .options(
                joinedload(Budget.user),
                joinedload(Budget.category),
            )
            .order_by(desc(Budget.created_at))
            .offset(skip)
            .limit(limit)
        )
        return list(db.scalars(query).all())
