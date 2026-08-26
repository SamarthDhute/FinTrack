from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.schemas.budget_schema import BudgetCreate, BudgetUpdate, BudgetResponse
from app.services.budget_service import BudgetService

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.get("", response_model=List[BudgetResponse])
def get_budgets(
    period: str = Query("monthly", description="Budget period (e.g. monthly)"),
    db: Session = Depends(get_db)
):
    return BudgetService.get_all_budgets(db, period=period)


@router.get("/{budget_id}", response_model=BudgetResponse)
def get_budget(budget_id: int, db: Session = Depends(get_db)):
    return BudgetService.get_budget_by_id(db, budget_id)


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(payload: BudgetCreate, db: Session = Depends(get_db)):
    return BudgetService.create_budget(db, payload)


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(budget_id: int, payload: BudgetUpdate, db: Session = Depends(get_db)):
    return BudgetService.update_budget(db, budget_id, payload)


@router.delete("/{budget_id}")
def delete_budget(budget_id: int, db: Session = Depends(get_db)):
    return BudgetService.delete_budget(db, budget_id)
