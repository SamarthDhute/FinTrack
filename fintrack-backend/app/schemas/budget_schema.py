from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class BudgetBase(BaseModel):
    category_id: Optional[int] = Field(None, description="Category ID. None represents overall monthly budget")
    amount_limit: Decimal = Field(..., gt=0, decimal_places=2, description="Budget spending limit (must be > 0)")
    period: str = Field(default="monthly", description="Budget cycle period (defaults to monthly)")


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount_limit: Optional[Decimal] = Field(None, gt=0, decimal_places=2, description="Updated budget spending limit")
    period: Optional[str] = Field(None, description="Budget cycle period")


class BudgetResponse(BudgetBase):
    id: int
    category_name: Optional[str] = Field(None, description="Category name if linked to a specific category")
    spent_amount: Decimal = Field(default=Decimal("0.00"), description="Spent amount in current period")
    remaining_amount: Decimal = Field(default=Decimal("0.00"), description="Remaining budget balance")
    status: str = Field(default="on_track", description="Budget health: on_track, near_limit, or over_budget")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
