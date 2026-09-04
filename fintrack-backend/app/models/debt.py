from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Numeric, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base

if TYPE_CHECKING:
    from app.models.user import User


class Debt(Base):
    """
    Represents money lent to someone (LENT) or borrowed from someone (BORROWED).
    Tracks initial amount, current remaining amount, and settlement status.
    """
    __tablename__ = "debts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    person_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    debt_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # 'LENT' or 'BORROWED'
    initial_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    remaining_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False, index=True)  # 'PENDING', 'PARTIALLY_PAID', 'SETTLED'
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="debts")
    repayments: Mapped[List["DebtRepayment"]] = relationship(
        "DebtRepayment",
        back_populates="debt",
        cascade="all, delete-orphan",
        order_by="desc(DebtRepayment.payment_date)"
    )


class DebtRepayment(Base):
    """
    Represents a partial or full repayment/return entry against a Debt.
    """
    __tablename__ = "debt_repayments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    debt_id: Mapped[int] = mapped_column(
        ForeignKey("debts.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    payment_method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # e.g. 'UPI', 'Cash', 'Bank Transfer'
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    debt: Mapped["Debt"] = relationship("Debt", back_populates="repayments")
    user: Mapped["User"] = relationship("User")
