from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query, status, Response
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.debt_schema import (
    DebtCreate,
    DebtUpdate,
    DebtResponse,
    DebtSummaryResponse,
    DebtRepaymentCreate,
)
from app.services.debt_service import DebtService

router = APIRouter(prefix="/debts", tags=["Debts & Udhaar"])


@router.get("/summary", response_model=DebtSummaryResponse)
def get_debt_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns high-level statistics for debts: total pending to receive (LENT),
    total pending to pay (BORROWED), total settled, and active count.
    """
    return DebtService.get_summary(db=db, user_id=current_user.id)


@router.get("")
def get_debts(
    status: Optional[str] = Query(None, description="Filter by status: PENDING, PARTIALLY_PAID, SETTLED"),
    debt_type: Optional[str] = Query(None, description="Filter by debt_type: LENT, BORROWED"),
    search: Optional[str] = Query(None, description="Search by person name or notes"),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(100, ge=1, le=200, description="Limit per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    List debts for the authenticated user with optional filtering by status, type, and search query.
    """
    items, total_count = DebtService.list_debts(
        db=db,
        user_id=current_user.id,
        status_filter=status,
        debt_type=debt_type,
        search=search,
        skip=skip,
        limit=limit,
    )
    return {
        "items": [item.model_dump() for item in items],
        "total_count": total_count,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{debt_id}", response_model=DebtResponse)
def get_debt(
    debt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch a single debt along with its complete list of partial repayments.
    """
    return DebtService.get_by_id(db=db, debt_id=debt_id, user_id=current_user.id)


@router.post("", response_model=DebtResponse, status_code=status.HTTP_201_CREATED)
def create_debt(
    payload: DebtCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new debt entry (LENT / BORROWED).
    """
    return DebtService.create_debt(db=db, user_id=current_user.id, data=payload)


@router.put("/{debt_id}", response_model=DebtResponse)
def update_debt(
    debt_id: int,
    payload: DebtUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update debt details (e.g. person name, due date, notes, or initial amount).
    """
    return DebtService.update_debt(db=db, user_id=current_user.id, debt_id=debt_id, data=payload)


@router.delete("/{debt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_debt(
    debt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a debt and all its associated repayment history.
    """
    DebtService.delete_debt(db=db, user_id=current_user.id, debt_id=debt_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{debt_id}/repayments", response_model=DebtResponse, status_code=status.HTTP_201_CREATED)
def add_debt_repayment(
    debt_id: int,
    payload: DebtRepaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Log a partial or full repayment/return entry against a debt.
    Automatically recalculates remaining balance and updates settlement status.
    """
    return DebtService.add_repayment(
        db=db,
        user_id=current_user.id,
        debt_id=debt_id,
        data=payload,
    )


@router.delete("/{debt_id}/repayments/{repayment_id}", response_model=DebtResponse)
def delete_debt_repayment(
    debt_id: int,
    repayment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a repayment entry. Automatically updates remaining balance and status.
    """
    return DebtService.delete_repayment(
        db=db,
        user_id=current_user.id,
        debt_id=debt_id,
        repayment_id=repayment_id,
    )
