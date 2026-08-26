"""0003_seed_default_categories

Revision ID: 0003_seed_default_categories
Revises: 0002_seed_payment_methods
Create Date: 2026-08-26 18:58:00.000000

Seeds a set of common starter categories so the app is not empty on first use.
Satisfies PRD FR-10 (P2) — default categories for new users.

Downgrade removes only these seeded rows, leaving any user-created categories intact.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from datetime import datetime, timezone

# revision identifiers, used by Alembic.
revision: str = "0003_seed_default_categories"
down_revision: Union[str, None] = "0002_seed_payment_methods"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Lightweight table definition — never import ORM model directly in migrations
categories_table = sa.table(
    "categories",
    sa.column("name", sa.String),
    sa.column("created_at", sa.DateTime),
)

# Default starter categories (FR-10)
SEED_TIMESTAMP = datetime(2026, 8, 26, 13, 28, 0, tzinfo=timezone.utc)

DEFAULT_CATEGORIES = [
    {"name": "Food & Dining",    "created_at": SEED_TIMESTAMP},
    {"name": "Transport",        "created_at": SEED_TIMESTAMP},
    {"name": "Rent & Housing",   "created_at": SEED_TIMESTAMP},
    {"name": "Groceries",        "created_at": SEED_TIMESTAMP},
    {"name": "Healthcare",       "created_at": SEED_TIMESTAMP},
    {"name": "Entertainment",    "created_at": SEED_TIMESTAMP},
    {"name": "Shopping",         "created_at": SEED_TIMESTAMP},
    {"name": "Education",        "created_at": SEED_TIMESTAMP},
    {"name": "Utilities",        "created_at": SEED_TIMESTAMP},
    {"name": "Others",           "created_at": SEED_TIMESTAMP},
]

SEEDED_NAMES = [c["name"] for c in DEFAULT_CATEGORIES]


def upgrade() -> None:
    """Insert default starter categories, skipping any that already exist."""
    # Use INSERT ... WHERE NOT EXISTS pattern to be idempotent
    conn = op.get_bind()
    existing = conn.execute(
        sa.text("SELECT name FROM categories WHERE name = ANY(:names)"),
        {"names": SEEDED_NAMES}
    ).fetchall()
    existing_names = {row[0] for row in existing}

    rows_to_insert = [c for c in DEFAULT_CATEGORIES if c["name"] not in existing_names]
    if rows_to_insert:
        op.bulk_insert(categories_table, rows_to_insert)


def downgrade() -> None:
    """Remove only the seeded default categories, leaving user-created ones intact."""
    op.execute(
        categories_table.delete().where(
            categories_table.c.name.in_(SEEDED_NAMES)
        )
    )
