import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.db.session import Base
from app.models.user import User
from app.models.farm import Farm
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate
from app.api.v1.endpoints.tasks import (
    list_tasks,
    create_task,
    toggle_task,
    update_task,
    delete_task,
)


def test_task_crud_and_tenancy_isolation():
    """Verify task creation, toggle, editing, deletion, and cross-user data isolation."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    # 1. Setup two users
    user1 = User(email="farmer1@agrinexus.ai", hashed_password="pw1", full_name="Farmer One", is_active=True)
    user2 = User(email="farmer2@agrinexus.ai", hashed_password="pw2", full_name="Farmer Two", is_active=True)
    db.add_all([user1, user2])
    db.commit()
    db.refresh(user1)
    db.refresh(user2)

    # 2. Setup farm owned by User 1
    farm1 = Farm(name="Green Acres", latitude=11.0, longitude=77.0, total_area_hectares=2.5, user_id=user1.id)
    db.add(farm1)
    db.commit()
    db.refresh(farm1)

    # 3. User 1 creates task attached to the farm
    t1_in = TaskCreate(
        title="Check drip lines for leaks",
        due_date="Today, 07:00 AM",
        category="irrigation",
        priority="high",
        farm_id=farm1.id,
    )
    task1 = create_task(task_in=t1_in, db=db, current_user=user1)
    assert task1.id is not None
    assert task1.title == "Check drip lines for leaks"
    assert task1.completed is False
    assert task1.farm_id == farm1.id
    assert task1.user_id == user1.id
    task1_id = task1.id

    # 4. User 1 creates a general task without farm_id
    gen_in = TaskCreate(title="Order soil testing kit", due_date="Next Monday", category="general")
    task2 = create_task(task_in=gen_in, db=db, current_user=user1)
    assert task2.farm_id is None

    # 5. List tasks for User 1 vs User 2
    u1_tasks = list_tasks(farm_id=None, db=db, current_user=user1)
    assert len(u1_tasks) == 2

    # Filter by farm_id
    u1_farm_tasks = list_tasks(farm_id=farm1.id, db=db, current_user=user1)
    assert len(u1_farm_tasks) == 1
    assert u1_farm_tasks[0].id == task1_id

    # Strict multi-tenancy: user 2 sees 0 tasks
    u2_tasks = list_tasks(farm_id=None, db=db, current_user=user2)
    assert len(u2_tasks) == 0

    # 6. User 2 cannot attach task to User 1's farm
    with pytest.raises(HTTPException) as exc:
        create_task(
            task_in=TaskCreate(title="Unauthorized farm task", farm_id=farm1.id),
            db=db,
            current_user=user2,
        )
    assert exc.value.status_code == 404

    # 7. User 2 cannot toggle User 1's task
    with pytest.raises(HTTPException) as exc:
        toggle_task(task_id=task1_id, db=db, current_user=user2)
    assert exc.value.status_code == 404

    # 8. User 1 toggles task
    t1_toggled = toggle_task(task_id=task1_id, db=db, current_user=user1)
    assert t1_toggled.completed is True

    # 9. User 1 updates task
    t1_updated = update_task(
        task_id=task1_id,
        task_in=TaskUpdate(title="Check drip lines and flush filters", priority="medium"),
        db=db,
        current_user=user1,
    )
    assert t1_updated.title == "Check drip lines and flush filters"
    assert t1_updated.priority == "medium"

    # 10. User 2 cannot delete User 1's task
    with pytest.raises(HTTPException) as exc:
        delete_task(task_id=task1_id, db=db, current_user=user2)
    assert exc.value.status_code == 404

    # 11. User 1 deletes task
    delete_task(task_id=task1_id, db=db, current_user=user1)

    # 12. Confirm deleted - 1 task remains
    remaining = list_tasks(farm_id=None, db=db, current_user=user1)
    assert len(remaining) == 1
    assert remaining[0].id == task2.id

    # 13. User 1 deletes the remaining task - verify empty list
    delete_task(task_id=task2.id, db=db, current_user=user1)
    all_empty = list_tasks(farm_id=None, db=db, current_user=user1)
    assert isinstance(all_empty, list)
    assert len(all_empty) == 0

    # 14. Querying empty farm tasks returns empty list
    farm_empty = list_tasks(farm_id=farm1.id, db=db, current_user=user1)
    assert isinstance(farm_empty, list)
    assert len(farm_empty) == 0

    db.close()

