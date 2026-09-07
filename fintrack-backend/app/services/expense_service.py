from datetime import date, timedelta
from decimal import Decimal
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.category_repository import CategoryRepository
from app.repositories.payment_method_repository import PaymentMethodRepository
from app.repositories.wallet_repository import WalletRepository
from app.schemas.expense_schema import ExpenseCreate, ExpenseUpdate, ExpenseResponse


class ExpenseService:
    @staticmethod
    def _to_response(expense) -> ExpenseResponse:
        return ExpenseResponse(
            id=expense.id,
            title=expense.title,
            category_id=expense.category_id,
            category_name=expense.category.name if expense.category else None,
            payment_method_id=expense.payment_method_id,
            payment_method_name=expense.payment_method.name if expense.payment_method else None,
            wallet_id=expense.wallet_id,
            wallet_name=expense.wallet.name if expense.wallet else None,
            amount=expense.amount,
            date=expense.date,
            notes=expense.notes,
            created_at=expense.created_at,
            updated_at=expense.updated_at
        )

    @classmethod
    def get_expenses(
        cls,
        db: Session,
        user_id: int,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        payment_method_id: Optional[int] = None,
        wallet_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        amount_min: Optional[Decimal] = None,
        amount_max: Optional[Decimal] = None,
        sort_by: Optional[str] = "date_desc",
        skip: int = 0,
        limit: int = 50
    ) -> Dict[str, Any]:
        items, total = ExpenseRepository.get_all(
            db=db,
            user_id=user_id,
            search=search,
            category_id=category_id,
            payment_method_id=payment_method_id,
            wallet_id=wallet_id,
            date_from=date_from,
            date_to=date_to,
            amount_min=amount_min,
            amount_max=amount_max,
            sort_by=sort_by,
            skip=skip,
            limit=limit
        )
        return {
            "items": [cls._to_response(e) for e in items],
            "total": total,
            "skip": skip,
            "limit": limit
        }

    @classmethod
    def get_expense_by_id(cls, db: Session, expense_id: int, user_id: int) -> ExpenseResponse:
        expense = ExpenseRepository.get_by_id(db, expense_id)
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Expense with ID {expense_id} not found"
            )
        if expense.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this expense"
            )
        return cls._to_response(expense)

    @classmethod
    def create_expense(cls, db: Session, data: ExpenseCreate, user_id: int) -> ExpenseResponse:
        # Validate category existence (scoped to user)
        category = CategoryRepository.get_by_id(db, data.category_id, user_id=user_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with ID {data.category_id} not found"
            )

        # Validate payment method existence (global)
        method = PaymentMethodRepository.get_by_id(db, data.payment_method_id)
        if not method:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment method with ID {data.payment_method_id} not found"
            )

        # Validate wallet if provided
        wallet = None
        if data.wallet_id is not None:
            wallet = WalletRepository.get_by_id(db, data.wallet_id, user_id=user_id)
            if not wallet:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Wallet with ID {data.wallet_id} not found"
                )

        # Validate date constraint (allowing +1 day for international timezone differences)
        if data.date > date.today() + timedelta(days=1):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expense date cannot be in the future"
            )

        created = ExpenseRepository.create(
            db=db,
            user_id=user_id,
            title=data.title,
            category_id=data.category_id,
            payment_method_id=data.payment_method_id,
            wallet_id=data.wallet_id,
            amount=data.amount,
            date=data.date,
            notes=data.notes
        )

        # If linked to a wallet, deduct balance and log ledger transaction
        if wallet is not None:
            WalletRepository.adjust_balance(db, wallet, -data.amount)
            WalletRepository.create_transaction(
                db=db,
                wallet_id=wallet.id,
                user_id=user_id,
                transaction_type="EXPENSE",
                amount=data.amount,
                description=f"Expense: {data.title}",
                transaction_date=data.date,
            )

        return cls._to_response(created)

    @classmethod
    def update_expense(cls, db: Session, expense_id: int, data: ExpenseUpdate, user_id: int) -> ExpenseResponse:
        expense = ExpenseRepository.get_by_id(db, expense_id)
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Expense with ID {expense_id} not found"
            )
        if expense.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this expense"
            )

        if data.category_id is not None:
            category = CategoryRepository.get_by_id(db, data.category_id, user_id=user_id)
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Category with ID {data.category_id} not found"
                )

        if data.payment_method_id is not None:
            method = PaymentMethodRepository.get_by_id(db, data.payment_method_id)
            if not method:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Payment method with ID {data.payment_method_id} not found"
                )

        if data.date is not None and data.date > date.today() + timedelta(days=1):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expense date cannot be in the future"
            )

        # Handle wallet adjustment if amount or wallet changed
        old_wallet_id = expense.wallet_id
        old_amount = expense.amount
        new_wallet_id = data.wallet_id if data.wallet_id is not None else old_wallet_id
        new_amount = data.amount if data.amount is not None else old_amount

        # Revert old wallet deduction if it was attached
        if old_wallet_id is not None:
            old_wallet = WalletRepository.get_by_id(db, old_wallet_id, user_id=user_id)
            if old_wallet:
                WalletRepository.adjust_balance(db, old_wallet, old_amount)

        # Apply new wallet deduction if new wallet attached
        if new_wallet_id is not None:
            new_wallet = WalletRepository.get_by_id(db, new_wallet_id, user_id=user_id)
            if new_wallet:
                WalletRepository.adjust_balance(db, new_wallet, -new_amount)

        updated = ExpenseRepository.update(
            db=db,
            expense=expense,
            title=data.title,
            category_id=data.category_id,
            payment_method_id=data.payment_method_id,
            wallet_id=data.wallet_id,
            amount=data.amount,
            date=data.date,
            notes=data.notes
        )
        return cls._to_response(updated)

    @staticmethod
    def delete_expense(db: Session, expense_id: int, user_id: int) -> dict:
        expense = ExpenseRepository.get_by_id(db, expense_id)
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Expense with ID {expense_id} not found"
            )
        if expense.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this expense"
            )

        # Refund wallet balance if attached
        if expense.wallet_id is not None:
            wallet = WalletRepository.get_by_id(db, expense.wallet_id, user_id=user_id)
            if wallet:
                WalletRepository.adjust_balance(db, wallet, expense.amount)

        ExpenseRepository.delete(db, expense)
        return {"message": "Expense deleted successfully"}
