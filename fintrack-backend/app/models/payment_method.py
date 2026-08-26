from typing import List, TYPE_CHECKING
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base

if TYPE_CHECKING:
    from app.models.expense import Expense


class PaymentMethod(Base):
    __tablename__ = "payment_methods"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    is_predefined: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    expenses: Mapped[List["Expense"]] = relationship(back_populates="payment_method")
