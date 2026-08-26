from datetime import date as dt_date, datetime as dt_datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class ExpenseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=50, description="Short title/description for the expense")
    category_id: int = Field(..., description="Foreign key to Category")
    payment_method_id: int = Field(..., description="Foreign key to PaymentMethod (Required)")
    amount: Decimal = Field(..., gt=0, decimal_places=2, description="Expense amount in INR (must be positive)")
    date: dt_date = Field(default_factory=dt_date.today, description="Expense transaction date (cannot be in the future)")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes or details")

    @field_validator("date")
    @classmethod
    def validate_date_not_future(cls, v: dt_date) -> dt_date:
        if v > dt_date.today():
            raise ValueError("Expense date cannot be in the future")
        return v


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=50)
    category_id: Optional[int] = None
    payment_method_id: Optional[int] = None
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    date: Optional[dt_date] = None
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("date")
    @classmethod
    def validate_date_not_future(cls, v: Optional[dt_date]) -> Optional[dt_date]:
        if v is not None and v > dt_date.today():
            raise ValueError("Expense date cannot be in the future")
        return v


class ExpenseResponse(ExpenseBase):
    id: int
    category_name: Optional[str] = Field(None, description="Name of category")
    payment_method_name: Optional[str] = Field(None, description="Name of payment method")
    created_at: dt_datetime
    updated_at: dt_datetime

    model_config = ConfigDict(from_attributes=True)
