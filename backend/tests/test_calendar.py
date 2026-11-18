from datetime import date, timedelta
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.db.session import Base
from app.models.user import User
from app.models.farm import Farm
from app.models.field import Field
from app.models.crop import Crop
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate
from app.schemas.activity_template import GenerateSuggestionsRequest
from app.api.v1.endpoints.tasks import (
    get_calendar_activities,
    generate_crop_suggestions,
    create_task,
    toggle_task,
    update_task,
)
from app.api.v1.endpoints.activity_templates import list_activity_templates
from app.services.calendar_service import CalendarService
from app.services.activity_template_service import ActivityTemplateService


@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    yield db
    db.close()


@pytest.fixture
def seed_data(test_db):
    user1 = User(email="farmer_cal1@agrinexus.ai", hashed_password="pw1", full_name="Cal Farmer One", is_active=True)
    user2 = User(email="farmer_cal2@agrinexus.ai", hashed_password="pw2", full_name="Cal Farmer Two", is_active=True)
    test_db.add_all([user1, user2])
    test_db.commit()

    farm1 = Farm(name="Valley Farm", latitude=11.1, longitude=77.2, total_area_hectares=4.0, user_id=user1.id)
    farm2 = Farm(name="Hill Farm", latitude=12.0, longitude=78.0, total_area_hectares=2.0, user_id=user2.id)
    test_db.add_all([farm1, farm2])
    test_db.commit()

    field1 = Field(farm_id=farm1.id, name="North Paddock", area_hectares=1.5, soil_type="Clay Loam")
    field2 = Field(farm_id=farm2.id, name="South Ridge", area_hectares=2.0, soil_type="Sandy Loam")
    test_db.add_all([field1, field2])
    test_db.commit()

    planting = date.today() - timedelta(days=25)
    crop1 = Crop(field_id=field1.id, name="Rice", variety="Basmati 370", planting_date=planting, status="growing")
    crop2 = Crop(field_id=field2.id, name="Wheat", variety="HD 2967", planting_date=planting, status="growing")
    test_db.add_all([crop1, crop2])
    test_db.commit()

    # Preseed activity templates
    ActivityTemplateService.ensure_templates_seeded(test_db)

    return {
        "user1": user1,
        "user2": user2,
        "farm1": farm1,
        "farm2": farm2,
        "field1": field1,
        "field2": field2,
        "crop1": crop1,
        "crop2": crop2,
    }


def test_activity_templates_list(test_db, seed_data):
    """Verify listing activity templates with crop and category filters."""
    user = seed_data["user1"]

    all_templates = list_activity_templates(crop_name=None, category=None, db=test_db, current_user=user)
    assert len(all_templates) >= 20

    rice_templates = list_activity_templates(crop_name="Rice", category=None, db=test_db, current_user=user)
    assert len(rice_templates) > 0
    assert all("rice" in t.crop_name.lower() or t.crop_name.lower() == "general" for t in rice_templates)

    irrig_templates = list_activity_templates(crop_name=None, category="irrigation", db=test_db, current_user=user)
    assert len(irrig_templates) > 0
    assert all(t.category == "irrigation" for t in irrig_templates)


def test_calendar_activity_creation_and_hierarchy_validation(test_db, seed_data):
    """Verify task creation with field/crop associations and strict hierarchy checks."""
    u1 = seed_data["user1"]
    u2 = seed_data["user2"]
    f1 = seed_data["farm1"]
    fld1 = seed_data["field1"]
    c1 = seed_data["crop1"]

    # 1. Valid creation with full hierarchy
    today_iso = date.today().strftime("%Y-%m-%d")
    task_in = TaskCreate(
        title="Apply Urea Top Dressing",
        description="Broadcast 50kg Urea per ha during active tillering",
        due_date=today_iso,
        category="fertilizer",
        priority="high",
        farm_id=f1.id,
        field_id=fld1.id,
        crop_id=c1.id,
        start_time="07:00",
        end_time="09:00",
        status="pending",
        source="suggested",
        is_weather_sensitive=True,
    )
    task = create_task(task_in=task_in, db=test_db, current_user=u1)
    assert task.id is not None
    assert task.farm_id == f1.id
    assert task.field_id == fld1.id
    assert task.crop_id == c1.id
    assert task.start_time == "07:00"
    assert task.status == "pending"
    assert task.is_weather_sensitive is True

    # 2. Cross-user violation: User 2 tries to attach to User 1's field
    with pytest.raises(HTTPException) as exc:
        create_task(
            task_in=TaskCreate(title="Hacked Task", field_id=fld1.id),
            db=test_db,
            current_user=u2,
        )
    assert exc.value.status_code == 404

    # 3. Hierarchy mismatch: User 1 passes User 1's farm but User 2's field
    fld2 = seed_data["field2"]
    with pytest.raises(HTTPException) as exc:
        create_task(
            task_in=TaskCreate(title="Mismatched Field", farm_id=f1.id, field_id=fld2.id),
            db=test_db,
            current_user=u1,
        )
    assert exc.value.status_code == 404


def test_calendar_filtering_and_status_sync(test_db, seed_data):
    """Verify calendar activities retrieval with date filtering and completion synchronization."""
    u1 = seed_data["user1"]
    f1 = seed_data["farm1"]

    today = date.today()
    d1 = (today + timedelta(days=1)).strftime("%Y-%m-%d")
    d2 = (today + timedelta(days=10)).strftime("%Y-%m-%d")

    t1 = create_task(
        task_in=TaskCreate(title="Inspect Leaf Folder", due_date=d1, category="scouting", farm_id=f1.id),
        db=test_db,
        current_user=u1,
    )
    t2 = create_task(
        task_in=TaskCreate(title="Clean irrigation pump", due_date=d2, category="maintenance", farm_id=f1.id),
        db=test_db,
        current_user=u1,
    )

    # 1. Date range filter
    range_tasks = get_calendar_activities(
        farm_id=f1.id,
        start_date=d1,
        end_date=d1,
        db=test_db,
        current_user=u1,
    )
    assert len(range_tasks) == 1
    assert range_tasks[0].id == t1.id

    # 2. Toggle status synchronization
    toggled = toggle_task(task_id=t1.id, db=test_db, current_user=u1)
    assert toggled.completed is True
    assert toggled.status == "completed"
    assert toggled.completed_at is not None

    # Toggle back
    untoggled = toggle_task(task_id=t1.id, db=test_db, current_user=u1)
    assert untoggled.completed is False
    assert untoggled.status == "pending"
    assert untoggled.completed_at is None

    # 3. Explicit status update via PUT
    updated = update_task(
        task_id=t1.id,
        task_in=TaskUpdate(status="in_progress"),
        db=test_db,
        current_user=u1,
    )
    assert updated.status == "in_progress"
    assert updated.completed is False


@pytest.mark.asyncio
async def test_growth_stage_suggestions_generation(test_db, seed_data):
    """Verify intelligent crop growth stage calculation and suggestions response."""
    u1 = seed_data["user1"]
    f1 = seed_data["farm1"]
    fld1 = seed_data["field1"]
    c1 = seed_data["crop1"]

    # Crop 1 is Rice planted 25 days ago
    req = GenerateSuggestionsRequest(
        farm_id=f1.id,
        field_id=fld1.id,
        crop_id=c1.id,
    )

    res = await generate_crop_suggestions(req=req, db=test_db, current_user=u1)
    assert res.crop_name == "Rice"
    assert res.days_since_planting == 25
    assert res.current_growth_stage == "Active Tillering"
    assert len(res.suggestions) > 0

    # Ensure suggestions have valid suggested dates and categories
    for sug in res.suggestions:
        assert sug.title is not None
        assert sug.category in ("land_preparation", "sowing", "irrigation", "fertilizer", "scouting", "crop_protection", "harvest", "maintenance", "general")
        assert len(sug.suggested_date) == 10
