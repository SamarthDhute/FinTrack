from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class PaymentMethodResponse(BaseModel):
    id: int
    name: str = Field(..., description="Payment method name (Cash, Card, UPI, Net Banking, Wallet)")
    is_predefined: bool = Field(default=True, description="Predefined system flag")
    usage_count: Optional[int] = Field(default=0, description="Number of expenses linked to this payment method")

    model_config = ConfigDict(from_attributes=True)
