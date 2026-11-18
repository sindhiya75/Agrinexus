"""calendar tasks extensions and activity_templates

Revision ID: 0004_calendar_tasks
Revises: 0003_create_farm_tasks
Create Date: 2026-11-15 20:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0004_calendar_tasks"
down_revision: Union[str, None] = '0003_create_farm_tasks'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Extend farm_tasks with calendar fields
    op.add_column('farm_tasks', sa.Column('field_id', sa.String(length=36), nullable=True))
    op.add_column('farm_tasks', sa.Column('crop_id', sa.String(length=36), nullable=True))
    op.add_column('farm_tasks', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('farm_tasks', sa.Column('status', sa.String(length=32), server_default='pending', nullable=False))
    op.add_column('farm_tasks', sa.Column('start_time', sa.String(length=16), nullable=True))
    op.add_column('farm_tasks', sa.Column('end_time', sa.String(length=16), nullable=True))
    op.add_column('farm_tasks', sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('farm_tasks', sa.Column('source', sa.String(length=32), server_default='manual', nullable=False))
    op.add_column('farm_tasks', sa.Column('is_weather_sensitive', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('farm_tasks', sa.Column('reminder_at', sa.DateTime(timezone=True), nullable=True))

    op.create_foreign_key('fk_farm_tasks_field_id', 'farm_tasks', 'fields', ['field_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_farm_tasks_crop_id', 'farm_tasks', 'crops', ['crop_id'], ['id'], ondelete='CASCADE')

    op.create_index(op.f('ix_farm_tasks_field_id'), 'farm_tasks', ['field_id'], unique=False)
    op.create_index(op.f('ix_farm_tasks_crop_id'), 'farm_tasks', ['crop_id'], unique=False)
    op.create_index(op.f('ix_farm_tasks_status'), 'farm_tasks', ['status'], unique=False)

    # 2. Create activity_templates table
    op.create_table(
        'activity_templates',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('crop_name', sa.String(length=100), nullable=False),
        sa.Column('growth_stage', sa.String(length=100), nullable=False),
        sa.Column('days_after_sowing', sa.Integer(), server_default='0', nullable=False),
        sa.Column('default_priority', sa.String(length=20), server_default='medium', nullable=False),
        sa.Column('is_weather_sensitive', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_activity_templates_id'), 'activity_templates', ['id'], unique=False)
    op.create_index(op.f('ix_activity_templates_name'), 'activity_templates', ['name'], unique=False)
    op.create_index(op.f('ix_activity_templates_category'), 'activity_templates', ['category'], unique=False)
    op.create_index(op.f('ix_activity_templates_crop_name'), 'activity_templates', ['crop_name'], unique=False)


def downgrade() -> None:
    # 1. Drop activity_templates table
    op.drop_index(op.f('ix_activity_templates_crop_name'), table_name='activity_templates')
    op.drop_index(op.f('ix_activity_templates_category'), table_name='activity_templates')
    op.drop_index(op.f('ix_activity_templates_name'), table_name='activity_templates')
    op.drop_index(op.f('ix_activity_templates_id'), table_name='activity_templates')
    op.drop_table('activity_templates')

    # 2. Revert farm_tasks extensions
    op.drop_index(op.f('ix_farm_tasks_status'), table_name='farm_tasks')
    op.drop_index(op.f('ix_farm_tasks_crop_id'), table_name='farm_tasks')
    op.drop_index(op.f('ix_farm_tasks_field_id'), table_name='farm_tasks')
    op.drop_constraint('fk_farm_tasks_crop_id', 'farm_tasks', type_='foreignkey')
    op.drop_constraint('fk_farm_tasks_field_id', 'farm_tasks', type_='foreignkey')

    op.drop_column('farm_tasks', 'reminder_at')
    op.drop_column('farm_tasks', 'is_weather_sensitive')
    op.drop_column('farm_tasks', 'source')
    op.drop_column('farm_tasks', 'completed_at')
    op.drop_column('farm_tasks', 'end_time')
    op.drop_column('farm_tasks', 'start_time')
    op.drop_column('farm_tasks', 'status')
    op.drop_column('farm_tasks', 'description')
    op.drop_column('farm_tasks', 'crop_id')
    op.drop_column('farm_tasks', 'field_id')
