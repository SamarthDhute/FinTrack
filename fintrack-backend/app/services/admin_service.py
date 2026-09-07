from typing import List, Optional
from decimal import Decimal
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.admin_repository import AdminRepository
from app.schemas.admin_schema import (
    AdminStatsResponse,
    AdminUserListItem,
    AdminExpenseItem,
    AdminBudgetItem,
    AdminWalletItem,
    AdminDebtItem,
    AdminUserDetailResponse,
)


class AdminService:
    @staticmethod
    def get_dashboard_stats(db: Session) -> AdminStatsResponse:
        stats = AdminRepository.get_platform_stats(db)
        return AdminStatsResponse(**stats)

    @staticmethod
    def list_users(
        db: Session,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[AdminUserListItem]:
        raw_users = AdminRepository.list_users(db, search=search, skip=skip, limit=limit)
        items = []
        for user, exp_count, total_spent, w_count, b_count, d_count in raw_users:
            item = AdminUserListItem(
                id=user.id,
                email=user.email,
                display_name=user.display_name,
                is_verified=user.is_verified,
                is_admin=user.is_admin,
                is_active=user.is_active,
                google_id=user.google_id,
                created_at=user.created_at,
                expense_count=exp_count,
                total_spent=total_spent,
                wallet_count=w_count,
                budget_count=b_count,
                debt_count=d_count,
            )
            items.append(item)
        return items

    @staticmethod
    def get_user_details(db: Session, user_id: int) -> AdminUserDetailResponse:
        data = AdminRepository.get_user_details(db, user_id=user_id)
        if not data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found",
            )

        user, exp_count, total_spent, w_count, b_count, d_count = data["user"]
        user_item = AdminUserListItem(
            id=user.id,
            email=user.email,
            display_name=user.display_name,
            is_verified=user.is_verified,
            is_admin=user.is_admin,
            is_active=user.is_active,
            google_id=user.google_id,
            created_at=user.created_at,
            expense_count=exp_count,
            total_spent=total_spent,
            wallet_count=w_count,
            budget_count=b_count,
            debt_count=d_count,
        )

        expense_items = [
            AdminExpenseItem(
                id=exp.id,
                user_id=exp.user_id,
                user_email=user.email,
                title=exp.title,
                amount=exp.amount,
                category_id=exp.category_id,
                category_name=exp.category.name if exp.category else "Uncategorized",
                category_color=getattr(exp.category, "color", "#64748B") if exp.category else "#64748B",
                payment_method_id=exp.payment_method_id,
                payment_method_name=exp.payment_method.name if exp.payment_method else "Cash",
                wallet_id=exp.wallet_id,
                wallet_name=exp.wallet.name if exp.wallet else None,
                date=exp.date,
                notes=exp.notes,
                created_at=exp.created_at,
            )
            for exp in data["expenses"]
        ]

        budget_items = [
            AdminBudgetItem(
                id=b.id,
                user_id=b.user_id,
                user_email=user.email,
                category_id=b.category_id,
                category_name=b.category.name if b.category else "General",
                category_color=getattr(b.category, "color", "#3B82F6") if b.category else "#3B82F6",
                amount_limit=b.amount_limit,
                period=b.period,
                created_at=b.created_at,
            )
            for b in data["budgets"]
        ]

        wallet_items = [
            AdminWalletItem(
                id=w.id,
                user_id=w.user_id,
                name=w.name,
                wallet_type=w.wallet_type,
                balance=w.balance,
                currency=w.currency,
                color=w.color,
                icon=w.icon,
                is_default=w.is_default,
                created_at=w.created_at,
            )
            for w in data["wallets"]
        ]

        debt_items = [
            AdminDebtItem(
                id=d.id,
                user_id=d.user_id,
                person_name=d.person_name,
                debt_type=d.debt_type,
                initial_amount=d.initial_amount,
                remaining_amount=d.remaining_amount,
                due_date=d.due_date,
                status=d.status,
                notes=d.notes,
                created_at=d.created_at,
            )
            for d in data["debts"]
        ]

        return AdminUserDetailResponse(
            user=user_item,
            expenses=expense_items,
            budgets=budget_items,
            wallets=wallet_items,
            debts=debt_items,
        )

    @staticmethod
    def list_all_expenses(
        db: Session,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[AdminExpenseItem]:
        expenses = AdminRepository.list_all_expenses(db, search=search, skip=skip, limit=limit)
        return [
            AdminExpenseItem(
                id=exp.id,
                user_id=exp.user_id,
                user_email=exp.user.email if exp.user else f"user_{exp.user_id}",
                title=exp.title,
                amount=exp.amount,
                category_id=exp.category_id,
                category_name=exp.category.name if exp.category else "Uncategorized",
                category_color=getattr(exp.category, "color", "#64748B") if exp.category else "#64748B",
                payment_method_id=exp.payment_method_id,
                payment_method_name=exp.payment_method.name if exp.payment_method else "Cash",
                wallet_id=exp.wallet_id,
                wallet_name=exp.wallet.name if exp.wallet else None,
                date=exp.date,
                notes=exp.notes,
                created_at=exp.created_at,
            )
            for exp in expenses
        ]

    @staticmethod
    def list_all_budgets(
        db: Session,
        skip: int = 0,
        limit: int = 100,
    ) -> List[AdminBudgetItem]:
        budgets = AdminRepository.list_all_budgets(db, skip=skip, limit=limit)
        return [
            AdminBudgetItem(
                id=b.id,
                user_id=b.user_id,
                user_email=b.user.email if b.user else f"user_{b.user_id}",
                category_id=b.category_id,
                category_name=b.category.name if b.category else "General",
                category_color=getattr(b.category, "color", "#3B82F6") if b.category else "#3B82F6",
                amount_limit=b.amount_limit,
                period=b.period,
                created_at=b.created_at,
            )
            for b in budgets
        ]
