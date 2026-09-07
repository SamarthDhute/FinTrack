"""0007_add_wallets_and_wallet_transactions

Revision ID: 0007_add_wallets_and_wallet_transactions
Revises: 0006_add_debts_and_repayments
Create Date: 2026-09-08 00:48:00.000000

Adds wallets and wallet_transactions tables, and adds optional wallet_id to expenses table.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0007_add_wallets"
down_revision: Union[str, None] = "0006_add_debts_and_repayments"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create wallets table
    op.create_table(
        "wallets",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("wallet_type", sa.String(length=30), nullable=False, server_default="BANK"),
        sa.Column("balance", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0.00"),
        sa.Column("currency", sa.String(length=10), nullable=False, server_default="INR"),
        sa.Column("color", sa.String(length=30), nullable=False, server_default="#10B981"),
        sa.Column("icon", sa.String(length=50), nullable=False, server_default="Wallet"),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_wallets_user_id"), "wallets", ["user_id"], unique=False)
    op.create_index(op.f("ix_wallets_name"), "wallets", ["name"], unique=False)
    op.create_index(op.f("ix_wallets_wallet_type"), "wallets", ["wallet_type"], unique=False)

    # 2. Create wallet_transactions table
    op.create_table(
        "wallet_transactions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("wallet_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("transaction_type", sa.String(length=30), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("destination_wallet_id", sa.Integer(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("transaction_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["wallet_id"], ["wallets.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["destination_wallet_id"], ["wallets.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_wallet_transactions_wallet_id"), "wallet_transactions", ["wallet_id"], unique=False)
    op.create_index(op.f("ix_wallet_transactions_user_id"), "wallet_transactions", ["user_id"], unique=False)
    op.create_index(op.f("ix_wallet_transactions_transaction_date"), "wallet_transactions", ["transaction_date"], unique=False)

    # 3. Add wallet_id column to expenses table
    op.add_column("expenses", sa.Column("wallet_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_expenses_wallet_id", "expenses", "wallets", ["wallet_id"], ["id"], ondelete="SET NULL")
    op.create_index(op.f("ix_expenses_wallet_id"), "expenses", ["wallet_id"], unique=False)


def downgrade() -> None:
    # 3. Drop wallet_id from expenses table
    op.drop_index(op.f("ix_expenses_wallet_id"), table_name="expenses")
    op.drop_constraint("fk_expenses_wallet_id", "expenses", type_="foreignkey")
    op.drop_column("expenses", "wallet_id")

    # 2. Drop wallet_transactions table
    op.drop_index(op.f("ix_wallet_transactions_transaction_date"), table_name="wallet_transactions")
    op.drop_index(op.f("ix_wallet_transactions_user_id"), table_name="wallet_transactions")
    op.drop_index(op.f("ix_wallet_transactions_wallet_id"), table_name="wallet_transactions")
    op.drop_table("wallet_transactions")

    # 1. Drop wallets table
    op.drop_index(op.f("ix_wallets_wallet_type"), table_name="wallets")
    op.drop_index(op.f("ix_wallets_name"), table_name="wallets")
    op.drop_index(op.f("ix_wallets_user_id"), table_name="wallets")
    op.drop_table("wallets")
