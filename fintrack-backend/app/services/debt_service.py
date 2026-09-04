from decimal import Decimal
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.debt import Debt, DebtRepayment
from app.schemas.debt_schema import (
    DebtCreate,
    DebtUpdate,
    DebtResponse,
    DebtSummaryResponse,
    DebtRepaymentCreate,
    DebtRepaymentResponse,
)
from app.repositories.debt_repository import DebtRepository


class DebtService:
    @staticmethod
    def _format_debt_response(debt: Debt) -> DebtResponse:
        total_repaid = sum((Decimal(str(r.amount)) for r in debt.repayments), Decimal("0.00"))
        repayment_responses = [
            DebtRepaymentResponse.model_validate(r) for r in debt.repayments
        ]
        return DebtResponse(
            id=debt.id,
            person_name=debt.person_name,
            debt_type=debt.debt_type,
            initial_amount=Decimal(str(debt.initial_amount)),
            remaining_amount=Decimal(str(debt.remaining_amount)),
            total_repaid=total_repaid,
            due_date=debt.due_date,
            notes=debt.notes,
            status=debt.status,
            created_at=debt.created_at,
            updated_at=debt.updated_at,
            repayments=repayment_responses,
        )

    @classmethod
    def get_by_id(cls, db: Session, debt_id: int, user_id: int) -> DebtResponse:
        debt = DebtRepository.get_by_id(db, debt_id, user_id)
        if not debt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Debt with ID {debt_id} not found",
            )
        return cls._format_debt_response(debt)

    @classmethod
    def list_debts(
        cls,
        db: Session,
        user_id: int,
        status_filter: Optional[str] = None,
        debt_type: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[DebtResponse], int]:
        debts, total_count = DebtRepository.get_all(
            db=db,
            user_id=user_id,
            status=status_filter,
            debt_type=debt_type,
            search=search,
            skip=skip,
            limit=limit,
        )
        items = [cls._format_debt_response(d) for d in debts]
        return items, total_count

    @classmethod
    def create_debt(cls, db: Session, user_id: int, data: DebtCreate) -> DebtResponse:
        debt = Debt(
            user_id=user_id,
            person_name=data.person_name.strip(),
            debt_type=data.debt_type.upper().strip(),
            initial_amount=data.initial_amount,
            remaining_amount=data.initial_amount,
            due_date=data.due_date,
            notes=data.notes.strip() if data.notes else None,
            status="PENDING",
        )
        saved_debt = DebtRepository.create(db, debt)
        return cls.get_by_id(db, saved_debt.id, user_id)

    @classmethod
    def update_debt(cls, db: Session, user_id: int, debt_id: int, data: DebtUpdate) -> DebtResponse:
        debt = DebtRepository.get_by_id(db, debt_id, user_id)
        if not debt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Debt with ID {debt_id} not found",
            )

        if data.person_name is not None:
            debt.person_name = data.person_name.strip()

        if data.debt_type is not None:
            debt.debt_type = data.debt_type.upper().strip()

        if data.due_date is not None:
            debt.due_date = data.due_date

        if data.notes is not None:
            debt.notes = data.notes.strip() if data.notes else None

        if data.initial_amount is not None:
            total_repaid = sum((Decimal(str(r.amount)) for r in debt.repayments), Decimal("0.00"))
            if data.initial_amount < total_repaid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"New initial amount (₹{data.initial_amount}) cannot be less than already repaid amount (₹{total_repaid})",
                )
            debt.initial_amount = data.initial_amount
            debt.remaining_amount = data.initial_amount - total_repaid
            if debt.remaining_amount == Decimal("0.00"):
                debt.status = "SETTLED"
            elif total_repaid > Decimal("0.00"):
                debt.status = "PARTIALLY_PAID"
            else:
                debt.status = "PENDING"

        saved_debt = DebtRepository.update(db, debt)
        return cls._format_debt_response(saved_debt)

    @classmethod
    def delete_debt(cls, db: Session, user_id: int, debt_id: int) -> None:
        debt = DebtRepository.get_by_id(db, debt_id, user_id)
        if not debt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Debt with ID {debt_id} not found",
            )
        DebtRepository.delete(db, debt)

    @classmethod
    def add_repayment(
        cls,
        db: Session,
        user_id: int,
        debt_id: int,
        data: DebtRepaymentCreate,
    ) -> DebtResponse:
        debt = DebtRepository.get_by_id(db, debt_id, user_id)
        if not debt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Debt with ID {debt_id} not found",
            )

        if debt.status == "SETTLED" or debt.remaining_amount <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This debt is already fully settled. No further repayments can be added.",
            )

        if data.amount > Decimal(str(debt.remaining_amount)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Repayment amount (₹{data.amount}) exceeds remaining balance (₹{debt.remaining_amount}).",
            )

        repayment = DebtRepayment(
            debt_id=debt.id,
            user_id=user_id,
            amount=data.amount,
            payment_date=data.payment_date,
            payment_method=data.payment_method.strip() if data.payment_method else None,
            notes=data.notes.strip() if data.notes else None,
        )
        DebtRepository.create_repayment(db, repayment)

        # Update remaining amount and status
        new_remaining = Decimal(str(debt.remaining_amount)) - data.amount
        debt.remaining_amount = max(new_remaining, Decimal("0.00"))
        if debt.remaining_amount == Decimal("0.00"):
            debt.status = "SETTLED"
        else:
            debt.status = "PARTIALLY_PAID"

        DebtRepository.update(db, debt)
        return cls.get_by_id(db, debt_id, user_id)

    @classmethod
    def delete_repayment(
        cls,
        db: Session,
        user_id: int,
        debt_id: int,
        repayment_id: int,
    ) -> DebtResponse:
        debt = DebtRepository.get_by_id(db, debt_id, user_id)
        if not debt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Debt with ID {debt_id} not found",
            )

        repayment = DebtRepository.get_repayment_by_id(db, repayment_id, user_id)
        if not repayment or repayment.debt_id != debt_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Repayment with ID {repayment_id} not found for this debt",
            )

        DebtRepository.delete_repayment(db, repayment)

        # Recalculate remaining amount and status from remaining repayments
        updated_debt = DebtRepository.get_by_id(db, debt_id, user_id)
        total_repaid = sum((Decimal(str(r.amount)) for r in updated_debt.repayments), Decimal("0.00"))
        updated_debt.remaining_amount = max(Decimal(str(updated_debt.initial_amount)) - total_repaid, Decimal("0.00"))

        if updated_debt.remaining_amount == Decimal("0.00"):
            updated_debt.status = "SETTLED"
        elif total_repaid > Decimal("0.00"):
            updated_debt.status = "PARTIALLY_PAID"
        else:
            updated_debt.status = "PENDING"

        DebtRepository.update(db, updated_debt)
        return cls._format_debt_response(updated_debt)

    @staticmethod
    def get_summary(db: Session, user_id: int) -> DebtSummaryResponse:
        data = DebtRepository.get_summary(db, user_id)
        return DebtSummaryResponse(**data)
