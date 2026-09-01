from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base

if TYPE_CHECKING:
    from app.models.expense import Expense
    from app.models.budget import Budget
    from app.models.user import User


class Category(Base):
    __tablename__ = "categories"
    __table_args__ = (
        # Category names are unique per user (not globally unique)
        UniqueConstraint("name", "user_id", name="uq_category_name_user"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="categories")
    expenses: Mapped[List["Expense"]] = relationship(back_populates="category", cascade="all, delete-orphan")
    budgets: Mapped[List["Budget"]] = relationship(back_populates="category", cascade="all, delete-orphan")
