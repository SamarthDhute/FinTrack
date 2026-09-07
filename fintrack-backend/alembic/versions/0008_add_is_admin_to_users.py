"""0008_add_is_admin_to_users

Revision ID: 0008_add_is_admin_to_users
Revises: 0007_add_wallets_and_wallet_transactions
Create Date: 2026-09-08 01:05:00.000000

Adds is_admin boolean column to users table and grants admin to dhutesamarth@gmail.com.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0008_add_is_admin_to_users"
down_revision: Union[str, None] = "0007_add_wallets_and_wallet_transactions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add is_admin column to users table
    op.add_column(
        "users",
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    
    # 2. Grant superadmin to dhutesamarth@gmail.com
    op.execute(
        sa.text("UPDATE users SET is_admin = true WHERE LOWER(email) = 'dhutesamarth@gmail.com'")
    )


def downgrade() -> None:
    op.drop_column("users", "is_admin")
