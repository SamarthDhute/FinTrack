from datetime import date as dt_date, datetime as dt_datetime, timedelta
from decimal import Decimal
from typing import Optional, List, Dict
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class WalletBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, description="Wallet / Account name (e.g. HDFC Salary, Cash in Hand)")
    wallet_type: str = Field(default="BANK", description="'BANK', 'CASH', 'WALLET', 'CREDIT_CARD', 'SAVINGS', or 'OTHER'")
    balance: Decimal = Field(default=Decimal("0.00"), decimal_places=2, description="Current balance amount in INR")
    currency: str = Field(default="INR", max_length=10, description="Currency code")
    color: str = Field(default="#10B981", max_length=30, description="Hex color token for UI display")
    icon: str = Field(default="Wallet", max_length=50, description="Icon name identifier")
    is_default: bool = Field(default=False, description="Whether this is the primary wallet")

    @field_validator("wallet_type")
    @classmethod
    def validate_wallet_type(cls, v: str) -> str:
        valid_types = {"BANK", "CASH", "WALLET", "CREDIT_CARD", "SAVINGS", "OTHER"}
        upper = v.upper().strip()
        if upper not in valid_types:
            raise ValueError(f"wallet_type must be one of: {', '.join(sorted(valid_types))}")
        return upper


class WalletCreate(WalletBase):
    pass


class WalletUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    wallet_type: Optional[str] = None
    balance: Optional[Decimal] = Field(None, decimal_places=2)
    currency: Optional[str] = Field(None, max_length=10)
    color: Optional[str] = Field(None, max_length=30)
    icon: Optional[str] = Field(None, max_length=50)
    is_default: Optional[bool] = None

    @field_validator("wallet_type")
    @classmethod
    def validate_wallet_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid_types = {"BANK", "CASH", "WALLET", "CREDIT_CARD", "SAVINGS", "OTHER"}
        upper = v.upper().strip()
        if upper not in valid_types:
            raise ValueError(f"wallet_type must be one of: {', '.join(sorted(valid_types))}")
        return upper


class WalletResponse(WalletBase):
    id: int
    user_id: int
    created_at: dt_datetime
    updated_at: dt_datetime

    model_config = ConfigDict(from_attributes=True)


class WalletTransferCreate(BaseModel):
    from_wallet_id: int = Field(..., description="Source wallet to withdraw from")
    to_wallet_id: int = Field(..., description="Target wallet to deposit into")
    amount: Decimal = Field(..., gt=0, decimal_places=2, description="Transfer amount (must be positive)")
    transfer_date: dt_date = Field(default_factory=dt_date.today, description="Date of transfer")
    notes: Optional[str] = Field(None, max_length=500, description="Optional description/notes for the transfer")

    @model_validator(mode="before")
    @classmethod
    def handle_description_alias(cls, data):
        if isinstance(data, dict):
            if "notes" not in data and "description" in data:
                data["notes"] = data["description"]
        return data

    @field_validator("transfer_date")
    @classmethod
    def validate_date_not_future(cls, v: dt_date) -> dt_date:
        if v > dt_date.today() + timedelta(days=1):
            raise ValueError("Transfer date cannot be in the future")
        return v

    @field_validator("to_wallet_id")
    @classmethod
    def validate_different_wallets(cls, v: int, info) -> int:
        if "from_wallet_id" in info.data and v == info.data["from_wallet_id"]:
            raise ValueError("Source and destination wallets cannot be the same")
        return v


class WalletDepositCreate(BaseModel):
    amount: Decimal = Field(..., gt=0, decimal_places=2, description="Deposit/Top-up amount (must be positive)")
    deposit_date: dt_date = Field(default_factory=dt_date.today, description="Date of deposit")
    notes: Optional[str] = Field(None, max_length=500, description="Optional note/reason for adding money (e.g. Salary, Cashback, Top-up)")

    @model_validator(mode="before")
    @classmethod
    def handle_reason_alias(cls, data):
        if isinstance(data, dict):
            if "notes" not in data and "reason" in data:
                data["notes"] = data["reason"]
        return data

    @field_validator("deposit_date")
    @classmethod
    def validate_date_not_future(cls, v: dt_date) -> dt_date:
        if v > dt_date.today() + timedelta(days=1):
            raise ValueError("Deposit date cannot be in the future")
        return v


class WalletTransactionResponse(BaseModel):
    id: int
    wallet_id: int
    transaction_type: str
    amount: Decimal
    destination_wallet_id: Optional[int] = None
    description: Optional[str] = None
    transaction_date: dt_date
    created_at: dt_datetime

    model_config = ConfigDict(from_attributes=True)


class WalletSummaryResponse(BaseModel):
    total_liquid_balance: Decimal
    total_credit_debt: Decimal
    net_worth: Decimal
    wallets_count: int
    wallets: List[WalletResponse]
