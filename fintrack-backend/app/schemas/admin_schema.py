from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, ConfigDict


class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    verified_users: int
    google_users: int
    total_expenses_count: int
    total_spend_amount: Decimal
    total_budgets_count: int
    total_wallets_count: int
    total_debts_count: int
    total_lent_amount: Decimal
    total_borrowed_amount: Decimal


class AdminUserListItem(BaseModel):
    id: int
    email: str
    display_name: Optional[str] = None
    is_verified: bool
    is_admin: bool
    is_active: bool
    google_id: Optional[str] = None
    created_at: datetime
    
    # Aggregates
    expense_count: int = 0
    total_spent: Decimal = Decimal("0.00")
    wallet_count: int = 0
    budget_count: int = 0
    debt_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class AdminExpenseItem(BaseModel):
    id: int
    user_id: int
    user_email: str
    title: str
    amount: Decimal
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    category_color: Optional[str] = None
    payment_method_id: Optional[int] = None
    payment_method_name: Optional[str] = None
    wallet_id: Optional[int] = None
    wallet_name: Optional[str] = None
    date: date
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminBudgetItem(BaseModel):
    id: int
    user_id: int
    user_email: str
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    category_color: Optional[str] = None
    amount_limit: Decimal
    period: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminWalletItem(BaseModel):
    id: int
    user_id: int
    name: str
    wallet_type: str
    balance: Decimal
    currency: str
    color: str
    icon: str
    is_default: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminDebtItem(BaseModel):
    id: int
    user_id: int
    person_name: str
    debt_type: str  # LENT | BORROWED
    initial_amount: Decimal
    remaining_amount: Decimal
    due_date: Optional[date] = None
    status: str  # PENDING | PARTIALLY_PAID | SETTLED | OVERDUE
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminUserDetailResponse(BaseModel):
    user: AdminUserListItem
    expenses: List[AdminExpenseItem]
    budgets: List[AdminBudgetItem]
    wallets: List[AdminWalletItem]
    debts: List[AdminDebtItem]

