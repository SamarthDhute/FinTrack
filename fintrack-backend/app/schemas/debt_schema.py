from datetime import date as dt_date, datetime as dt_datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator


class DebtRepaymentBase(BaseModel):
    amount: Decimal = Field(..., gt=0, decimal_places=2, description="Repayment return amount in INR (must be positive)")
    payment_date: dt_date = Field(default_factory=dt_date.today, description="Date of repayment (cannot be in the future)")
    payment_method: Optional[str] = Field(None, max_length=50, description="Payment method e.g. UPI, Cash, Bank Transfer")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes")

    @field_validator("payment_date")
    @classmethod
    def validate_date_not_future(cls, v: dt_date) -> dt_date:
        if v > dt_date.today():
            raise ValueError("Repayment date cannot be in the future")
        return v


class DebtRepaymentCreate(DebtRepaymentBase):
    pass


class DebtRepaymentResponse(DebtRepaymentBase):
    id: int
    debt_id: int
    created_at: dt_datetime

    model_config = ConfigDict(from_attributes=True)


class DebtBase(BaseModel):
    person_name: str = Field(..., min_length=1, max_length=100, description="Person name who borrowed or lent")
    debt_type: str = Field(..., description="'LENT' (Maine diye - they owe you) or 'BORROWED' (Maine liye - you owe them)")
    initial_amount: Decimal = Field(..., gt=0, decimal_places=2, description="Total initial amount (must be > 0)")
    due_date: Optional[dt_date] = Field(None, description="Optional expected settlement due date")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes/reason")

    @field_validator("debt_type")
    @classmethod
    def validate_debt_type(cls, v: str) -> str:
        v_upper = v.upper().strip()
        if v_upper not in ("LENT", "BORROWED"):
            raise ValueError("debt_type must be either 'LENT' or 'BORROWED'")
        return v_upper


class DebtCreate(DebtBase):
    pass


class DebtUpdate(BaseModel):
    person_name: Optional[str] = Field(None, min_length=1, max_length=100)
    debt_type: Optional[str] = None
    initial_amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    due_date: Optional[dt_date] = None
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("debt_type")
    @classmethod
    def validate_debt_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_upper = v.upper().strip()
            if v_upper not in ("LENT", "BORROWED"):
                raise ValueError("debt_type must be either 'LENT' or 'BORROWED'")
            return v_upper
        return v


class DebtResponse(BaseModel):
    id: int
    person_name: str
    debt_type: str
    initial_amount: Decimal
    remaining_amount: Decimal
    total_repaid: Decimal = Decimal("0.00")
    due_date: Optional[dt_date] = None
    notes: Optional[str] = None
    status: str  # 'PENDING', 'PARTIALLY_PAID', 'SETTLED'
    created_at: dt_datetime
    updated_at: dt_datetime
    repayments: List[DebtRepaymentResponse] = []

    model_config = ConfigDict(from_attributes=True)


class DebtSummaryResponse(BaseModel):
    total_lent_pending: Decimal = Decimal("0.00")      # You are owed (pending to receive)
    total_borrowed_pending: Decimal = Decimal("0.00")  # You owe (pending to pay)
    total_lent_initial: Decimal = Decimal("0.00")
    total_borrowed_initial: Decimal = Decimal("0.00")
    active_count: int = 0
    settled_count: int = 0
    total_debts_count: int = 0
