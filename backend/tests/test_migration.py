import os
import pytest
from alembic.config import Config
from alembic import command
from alembic.script import ScriptDirectory


def test_alembic_migration_chain_and_sql_generation(capsys):
    """Verify that the migration chain reaches 0004_calendar_tasks_and_templates and generates valid DDL."""
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    ini_path = os.path.join(backend_dir, "alembic.ini")

    alembic_cfg = Config(ini_path)
    alembic_cfg.set_main_option("script_location", os.path.join(backend_dir, "alembic"))

    # Verify head revision is now 0004_calendar_tasks_and_templates
    script = ScriptDirectory.from_config(alembic_cfg)
    head_rev = script.get_current_head()
    assert head_rev == "0004_calendar_tasks_and_templates"

    # Verify revision sequence
    rev_0004 = script.get_revision("0004_calendar_tasks_and_templates")
    assert rev_0004.down_revision == "0003_create_farm_tasks"
    rev_0003 = script.get_revision("0003_create_farm_tasks")
    assert rev_0003.down_revision == "0002_add_boundary_geojson"
    rev_0002 = script.get_revision("0002_add_boundary_geojson")
    assert rev_0002.down_revision == "0001_create_core_tables"

    # Test offline SQL generation for upgrade from 0003 to 0004
    command.upgrade(alembic_cfg, "0003_create_farm_tasks:0004_calendar_tasks_and_templates", sql=True)
    captured_up = capsys.readouterr().out

    assert "ALTER TABLE farm_tasks ADD COLUMN field_id VARCHAR(36)" in captured_up
    assert "ALTER TABLE farm_tasks ADD COLUMN crop_id VARCHAR(36)" in captured_up
    assert "ALTER TABLE farm_tasks ADD COLUMN description TEXT" in captured_up
    assert "ALTER TABLE farm_tasks ADD COLUMN status VARCHAR(32)" in captured_up
    assert "ALTER TABLE farm_tasks ADD COLUMN is_weather_sensitive BOOLEAN" in captured_up
    assert "CREATE TABLE activity_templates" in captured_up
    assert "growth_stage VARCHAR(100) NOT NULL" in captured_up
    assert "days_after_sowing INTEGER" in captured_up
    assert "CREATE INDEX ix_activity_templates_crop_name ON activity_templates (crop_name)" in captured_up

    # Test offline SQL generation for downgrade from 0004 to 0003
    command.downgrade(alembic_cfg, "0004_calendar_tasks_and_templates:0003_create_farm_tasks", sql=True)
    captured_down = capsys.readouterr().out

    assert "DROP TABLE activity_templates" in captured_down
    assert "ALTER TABLE farm_tasks DROP COLUMN field_id" in captured_down
    assert "ALTER TABLE farm_tasks DROP COLUMN crop_id" in captured_down
    assert "ALTER TABLE farm_tasks DROP COLUMN status" in captured_down
