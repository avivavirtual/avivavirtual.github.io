"""Initial SQLModel schema for Avivavirtual.

Revision ID: 001_initial
Revises:
Create Date: 2026-06-01 00:00:00
"""

from alembic import op
from sqlalchemy import text

from models import SQLModel

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    bind.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    SQLModel.metadata.create_all(bind=bind)


def downgrade() -> None:
    bind = op.get_bind()
    SQLModel.metadata.drop_all(bind=bind)
