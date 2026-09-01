from datetime import date
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    return DashboardService.get_summary(db, user_id=current_user.id)


@router.get("/charts/category")
def get_category_breakdown(
    date_from: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    return DashboardService.get_category_chart(db, user_id=current_user.id, date_from=date_from, date_to=date_to)


@router.get("/charts/payment-method")
def get_payment_method_breakdown(
    date_from: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    return DashboardService.get_payment_method_chart(db, user_id=current_user.id, date_from=date_from, date_to=date_to)


@router.get("/charts/trend")
def get_spending_trend(
    days: int = Query(30, ge=7, le=90, description="Number of days for trend"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    return DashboardService.get_trend_chart(db, user_id=current_user.id, days=days)
