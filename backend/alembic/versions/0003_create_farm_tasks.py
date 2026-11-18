"""create farm_tasks table

Revision ID: 0003_create_farm_tasks
Revises: 0002_add_boundary_geojson
Create Date: 2026-11-15 20:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0003_create_farm_tasks'
down_revision: Union[str, None] = '0002_add_boundary_geojson'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'farm_tasks',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('farm_id', sa.String(length=36), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('due_date', sa.String(length=64), server_default='Scheduled', nullable=False),
        sa.Column('category', sa.String(length=32), server_default='general', nullable=False),
        sa.Column('priority', sa.String(length=16), server_default='medium', nullable=False),
        sa.Column('completed', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_farm_tasks_id'), 'farm_tasks', ['id'], unique=False)
    op.create_index(op.f('ix_farm_tasks_user_id'), 'farm_tasks', ['user_id'], unique=False)
    op.create_index(op.f('ix_farm_tasks_farm_id'), 'farm_tasks', ['farm_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_farm_tasks_farm_id'), table_name='farm_tasks')
    op.drop_index(op.f('ix_farm_tasks_user_id'), table_name='farm_tasks')
    op.drop_index(op.f('ix_farm_tasks_id'), table_name='farm_tasks')
    op.drop_table('farm_tasks')
