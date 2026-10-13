"""create core tables: users, farms, fields, crops

Revision ID: 0001_create_core_tables
Revises: 
Create Date: 2026-09-30 18:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0001_create_core_tables'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=150), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('is_superuser', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. Farms table
    op.create_table(
        'farms',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('location_name', sa.String(length=255), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('total_area_hectares', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_farms_id'), 'farms', ['id'], unique=False)
    op.create_index(op.f('ix_farms_user_id'), 'farms', ['user_id'], unique=False)
    op.create_index(op.f('ix_farms_name'), 'farms', ['name'], unique=False)

    # 3. Fields table
    op.create_table(
        'fields',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('farm_id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('field_type', sa.String(length=100), nullable=True),
        sa.Column('area_hectares', sa.Float(), nullable=True),
        sa.Column('soil_type', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_fields_id'), 'fields', ['id'], unique=False)
    op.create_index(op.f('ix_fields_farm_id'), 'fields', ['farm_id'], unique=False)
    op.create_index(op.f('ix_fields_name'), 'fields', ['name'], unique=False)

    # 4. Crops table
    op.create_table(
        'crops',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('field_id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('variety', sa.String(length=150), nullable=True),
        sa.Column('planting_date', sa.Date(), nullable=True),
        sa.Column('expected_harvest_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='planted', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['field_id'], ['fields.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_crops_id'), 'crops', ['id'], unique=False)
    op.create_index(op.f('ix_crops_field_id'), 'crops', ['field_id'], unique=False)
    op.create_index(op.f('ix_crops_name'), 'crops', ['name'], unique=False)


def downgrade() -> None:
    op.drop_table('crops')
    op.drop_table('fields')
    op.drop_table('farms')
    op.drop_table('users')
