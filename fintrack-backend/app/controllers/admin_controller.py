from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User
from app.services.admin_service import AdminService
from app.schemas.admin_schema import (
    AdminStatsResponse,
    AdminUserListItem,
    AdminExpenseItem,
    AdminBudgetItem,
    AdminUserDetailResponse,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get(
    "/stats",
    response_model=AdminStatsResponse,
    summary="Get platform aggregated metrics (Admin only)",
)
def get_platform_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    return AdminService.get_dashboard_stats(db)


@router.get(
    "/users",
    response_model=List[AdminUserListItem],
    summary="List all registered users with summary statistics (Admin only)",
)
def list_users(
    search: Optional[str] = Query(None, description="Search by email or name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    return AdminService.list_users(db, search=search, skip=skip, limit=limit)


@router.get(
    "/users/{user_id}",
    response_model=AdminUserDetailResponse,
    summary="Get detailed user profile, expenses, budgets, wallets, and debts (Admin only)",
)
def get_user_details(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    return AdminService.get_user_details(db, user_id=user_id)


@router.get(
    "/expenses",
    response_model=List[AdminExpenseItem],
    summary="List all expenses across all registered users (Admin only)",
)
def list_all_expenses(
    search: Optional[str] = Query(None, description="Search by title or user email"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    return AdminService.list_all_expenses(db, search=search, skip=skip, limit=limit)


@router.get(
    "/budgets",
    response_model=List[AdminBudgetItem],
    summary="List all budgets across all registered users (Admin only)",
)
def list_all_budgets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    return AdminService.list_all_budgets(db, skip=skip, limit=limit)
