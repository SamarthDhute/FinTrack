"""0006_add_debts_and_repayments_tables

Revision ID: 0006_add_debts_and_repayments
Revises: 0005_add_user_id_to_tables
Create Date: 2026-09-04 14:07:00.000000

Adds debts and debt_repayments tables for tracking money lent and borrowed with partial repayments.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0006_add_debts_and_repayments"
down_revision: Union[str, None] = "0005_add_user_id_to_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create debts table
    op.create_table(
        "debts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("person_name", sa.String(length=100), nullable=False),
        sa.Column("debt_type", sa.String(length=20), nullable=False),
        sa.Column("initial_amount", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("remaining_amount", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="PENDING"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_debts_user_id"), "debts", ["user_id"], unique=False)
    op.create_index(op.f("ix_debts_person_name"), "debts", ["person_name"], unique=False)
    op.create_index(op.f("ix_debts_debt_type"), "debts", ["debt_type"], unique=False)
    op.create_index(op.f("ix_debts_status"), "debts", ["status"], unique=False)

    # 2. Create debt_repayments table
    op.create_table(
        "debt_repayments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("debt_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("payment_date", sa.Date(), nullable=False),
        sa.Column("payment_method", sa.String(length=50), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["debt_id"], ["debts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_debt_repayments_debt_id"), "debt_repayments", ["debt_id"], unique=False)
    op.create_index(op.f("ix_debt_repayments_user_id"), "debt_repayments", ["user_id"], unique=False)
    op.create_index(op.f("ix_debt_repayments_payment_date"), "debt_repayments", ["payment_date"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_debt_repayments_payment_date"), table_name="debt_repayments")
    op.drop_index(op.f("ix_debt_repayments_user_id"), table_name="debt_repayments")
    op.drop_index(op.f("ix_debt_repayments_debt_id"), table_name="debt_repayments")
    op.drop_table("debt_repayments")

    op.drop_index(op.f("ix_debts_status"), table_name="debts")
    op.drop_index(op.f("ix_debts_debt_type"), table_name="debts")
    op.drop_index(op.f("ix_debts_person_name"), table_name="debts")
    op.drop_index(op.f("ix_debts_user_id"), table_name="debts")
    op.drop_table("debts")
