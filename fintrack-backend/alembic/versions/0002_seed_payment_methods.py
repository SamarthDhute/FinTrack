"""0002_seed_payment_methods

Revision ID: 0002_seed_payment_methods
Revises: 0001_initial_schema
Create Date: 2026-08-26 17:15:30.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0002_seed_payment_methods"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Lightweight table definition for seeding without relying on ORM model
payment_methods_table = sa.table(
    "payment_methods",
    sa.column("id", sa.Integer),
    sa.column("name", sa.String),
    sa.column("is_predefined", sa.Boolean)
)

PREDEFINED_PAYMENT_METHODS = [
    {"name": "Cash", "is_predefined": True},
    {"name": "Card", "is_predefined": True},
    {"name": "UPI", "is_predefined": True},
    {"name": "Net Banking", "is_predefined": True},
    {"name": "Wallet", "is_predefined": True},
]


def upgrade() -> None:
    op.bulk_insert(payment_methods_table, PREDEFINED_PAYMENT_METHODS)


def downgrade() -> None:
    names = [method["name"] for method in PREDEFINED_PAYMENT_METHODS]
    op.execute(
        payment_methods_table.delete().where(
            payment_methods_table.c.name.in_(names)
        )
    )
