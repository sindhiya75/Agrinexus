"""add boundary_geojson to farms and fields

Revision ID: 0002_add_boundary_geojson
Revises: 0001_create_core_tables
Create Date: 2026-09-30 18:39:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0002_add_boundary_geojson'
down_revision: Union[str, None] = '0001_create_core_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('farms', sa.Column('boundary_geojson', sa.JSON(), nullable=True))
    op.add_column('fields', sa.Column('boundary_geojson', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('fields', 'boundary_geojson')
    op.drop_column('farms', 'boundary_geojson')
