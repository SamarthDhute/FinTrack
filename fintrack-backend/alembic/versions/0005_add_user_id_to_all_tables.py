"""0005_add_user_id_to_all_tables

Revision ID: 0005_add_user_id_to_all_tables
Revises: 0004_add_users_and_refresh_tokens
Create Date: 2026-08-31 19:49:00.000000

Adds user_id foreign keys to categories, budgets, and expenses.
Backfills existing rows with default user ID.
Updates category unique constraint to (name, user_id).
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0005_add_user_id_to_all_tables"
down_revision: Union[str, None] = "0004_add_users_and_refresh_tokens"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    # Fetch default user id
    default_user = conn.execute(
        sa.text("SELECT id FROM users WHERE email = 'default@fintrack.local'")
    ).fetchone()
    default_user_id = default_user[0] if default_user else 1

    # 1. Categories
    op.add_column("categories", sa.Column("user_id", sa.Integer(), nullable=True))
    conn.execute(
        sa.text("UPDATE categories SET user_id = :uid WHERE user_id IS NULL"),
        {"uid": default_user_id},
    )
    op.alter_column("categories", "user_id", nullable=False)
    op.create_foreign_key(
        "fk_categories_user_id_users",
        "categories",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_categories_user_id", "categories", ["user_id"], unique=False)

    # Drop old global unique constraint / index on name if present
    try:
        op.drop_index("ix_categories_name", table_name="categories")
    except Exception:
        pass
    try:
        op.drop_constraint("categories_name_key", "categories", type_="unique")
    except Exception:
        pass

    op.create_unique_constraint(
        "uq_category_name_user", "categories", ["name", "user_id"]
    )
    op.create_index("ix_categories_name", "categories", ["name"], unique=False)

    # 2. Budgets
    op.add_column("budgets", sa.Column("user_id", sa.Integer(), nullable=True))
    conn.execute(
        sa.text("UPDATE budgets SET user_id = :uid WHERE user_id IS NULL"),
        {"uid": default_user_id},
    )
    op.alter_column("budgets", "user_id", nullable=False)
    op.create_foreign_key(
        "fk_budgets_user_id_users",
        "budgets",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_budgets_user_id", "budgets", ["user_id"], unique=False)

    # 3. Expenses
    op.add_column("expenses", sa.Column("user_id", sa.Integer(), nullable=True))
    conn.execute(
        sa.text("UPDATE expenses SET user_id = :uid WHERE user_id IS NULL"),
        {"uid": default_user_id},
    )
    op.alter_column("expenses", "user_id", nullable=False)
    op.create_foreign_key(
        "fk_expenses_user_id_users",
        "expenses",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_expenses_user_id", "expenses", ["user_id"], unique=False)


def downgrade() -> None:
    # Expenses
    op.drop_index("ix_expenses_user_id", table_name="expenses")
    op.drop_constraint("fk_expenses_user_id_users", "expenses", type_="foreignkey")
    op.drop_column("expenses", "user_id")

    # Budgets
    op.drop_index("ix_budgets_user_id", table_name="budgets")
    op.drop_constraint("fk_budgets_user_id_users", "budgets", type_="foreignkey")
    op.drop_column("budgets", "user_id")

    # Categories
    op.drop_constraint("uq_category_name_user", "categories", type_="unique")
    op.drop_index("ix_categories_user_id", table_name="categories")
    op.drop_constraint("fk_categories_user_id_users", "categories", type_="foreignkey")
    op.drop_column("categories", "user_id")
    op.create_unique_constraint("categories_name_key", "categories", ["name"])
