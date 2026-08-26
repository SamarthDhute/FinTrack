from datetime import date
from decimal import Decimal
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.schemas.expense_schema import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.services.expense_service import ExpenseService

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.get("")
def get_expenses(
    search: Optional[str] = Query(None, description="Search in title or notes"),
    category_id: Optional[int] = Query(None, description="Filter by Category ID"),
    payment_method_id: Optional[int] = Query(None, description="Filter by Payment Method ID"),
    date_from: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    amount_min: Optional[Decimal] = Query(None, description="Minimum amount"),
    amount_max: Optional[Decimal] = Query(None, description="Maximum amount"),
    sort_by: Optional[str] = Query(
        "date_desc",
        description="Sort by: date_desc, date_asc, amount_desc, amount_asc, title_asc, title_desc"
    ),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(50, ge=1, le=100, description="Limit per page"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    return ExpenseService.get_expenses(
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


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    return ExpenseService.get_expense_by_id(db, expense_id)


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db)):
    return ExpenseService.create_expense(db, payload)


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, payload: ExpenseUpdate, db: Session = Depends(get_db)):
    return ExpenseService.update_expense(db, expense_id, payload)


@router.delete("/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    return ExpenseService.delete_expense(db, expense_id)
