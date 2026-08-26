from datetime import date
from decimal import Decimal
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.category_repository import CategoryRepository
from app.repositories.payment_method_repository import PaymentMethodRepository
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
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        payment_method_id: Optional[int] = None,
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
            search=search,
            category_id=category_id,
            payment_method_id=payment_method_id,
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
    def get_expense_by_id(cls, db: Session, expense_id: int) -> ExpenseResponse:
        expense = ExpenseRepository.get_by_id(db, expense_id)
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Expense with ID {expense_id} not found"
            )
        return cls._to_response(expense)

    @classmethod
    def create_expense(cls, db: Session, data: ExpenseCreate) -> ExpenseResponse:
        # Validate category existence
        category = CategoryRepository.get_by_id(db, data.category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with ID {data.category_id} not found"
            )

        # Validate payment method existence
        method = PaymentMethodRepository.get_by_id(db, data.payment_method_id)
        if not method:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment method with ID {data.payment_method_id} not found"
            )

        # Validate date constraint
        if data.date > date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expense date cannot be in the future"
            )

        created = ExpenseRepository.create(
            db=db,
            title=data.title,
            category_id=data.category_id,
            payment_method_id=data.payment_method_id,
            amount=data.amount,
            date=data.date,
            notes=data.notes
        )
        return cls._to_response(created)

    @classmethod
    def update_expense(cls, db: Session, expense_id: int, data: ExpenseUpdate) -> ExpenseResponse:
        expense = ExpenseRepository.get_by_id(db, expense_id)
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Expense with ID {expense_id} not found"
            )

        if data.category_id is not None:
            category = CategoryRepository.get_by_id(db, data.category_id)
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

        if data.date is not None and data.date > date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expense date cannot be in the future"
            )

        updated = ExpenseRepository.update(
            db=db,
            expense=expense,
            title=data.title,
            category_id=data.category_id,
            payment_method_id=data.payment_method_id,
            amount=data.amount,
            date=data.date,
            notes=data.notes
        )
        return cls._to_response(updated)

    @staticmethod
    def delete_expense(db: Session, expense_id: int) -> dict:
        expense = ExpenseRepository.get_by_id(db, expense_id)
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Expense with ID {expense_id} not found"
            )

        ExpenseRepository.delete(db, expense)
        return {"message": "Expense deleted successfully"}
