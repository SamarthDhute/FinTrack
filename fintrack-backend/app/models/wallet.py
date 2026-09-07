from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Numeric, Date, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.expense import Expense


class Wallet(Base):
    """
    Represents a monetary account / wallet (e.g. Bank Account, Cash in Hand, UPI Wallet, Credit Card, Savings).
    """
    __tablename__ = "wallets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    wallet_type: Mapped[str] = mapped_column(String(30), nullable=False, default="BANK", index=True)  # 'BANK', 'CASH', 'WALLET', 'CREDIT_CARD', 'SAVINGS', 'OTHER'
    balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="INR")
    color: Mapped[str] = mapped_column(String(30), nullable=False, default="#10B981")
    icon: Mapped[str] = mapped_column(String(50), nullable=False, default="Wallet")
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="wallets")
    transactions: Mapped[List["WalletTransaction"]] = relationship(
        "WalletTransaction",
        foreign_keys="WalletTransaction.wallet_id",
        back_populates="wallet",
        cascade="all, delete-orphan",
        order_by="desc(WalletTransaction.transaction_date), desc(WalletTransaction.id)"
    )
    expenses: Mapped[List["Expense"]] = relationship("Expense", back_populates="wallet")


class WalletTransaction(Base):
    """
    Ledger record for wallet deposits, withdrawals, transfers, and expense deductions.
    """
    __tablename__ = "wallet_transactions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    wallet_id: Mapped[int] = mapped_column(
        ForeignKey("wallets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    transaction_type: Mapped[str] = mapped_column(String(30), nullable=False)  # 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'EXPENSE'
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    destination_wallet_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("wallets.id", ondelete="SET NULL"),
        nullable=True
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    wallet: Mapped["Wallet"] = relationship("Wallet", foreign_keys=[wallet_id], back_populates="transactions")
    destination_wallet: Mapped[Optional["Wallet"]] = relationship("Wallet", foreign_keys=[destination_wallet_id])
