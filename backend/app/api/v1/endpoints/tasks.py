from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.farm import Farm
from app.models.field import Field
from app.models.crop import Crop
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.schemas.activity_template import (
    GenerateSuggestionsRequest,
    GenerateSuggestionsResponse,
)
from app.services.calendar_service import CalendarService

router = APIRouter()


def _validate_hierarchy(
    db: Session,
    user_id: str,
    farm_id: Optional[str],
    field_id: Optional[str],
    crop_id: Optional[str],
) -> tuple[Optional[str], Optional[str], Optional[str]]:
    """Validate that farm_id, field_id, and crop_id belong to the authenticated user and match hierarchy."""
    resolved_farm_id = farm_id
    resolved_field_id = field_id
    resolved_crop_id = crop_id

    if resolved_farm_id:
        farm = db.query(Farm).filter(Farm.id == resolved_farm_id, Farm.user_id == user_id).first()
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farm not found or you do not have permission to attach tasks to it.",
            )

    if resolved_field_id:
        field = (
            db.query(Field)
            .join(Farm, Field.farm_id == Farm.id)
            .filter(Field.id == resolved_field_id, Farm.user_id == user_id)
            .first()
        )
        if not field:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Field not found or you do not have permission to attach tasks to it.",
            )
        if resolved_farm_id and field.farm_id != resolved_farm_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Specified field does not belong to the specified farm.",
            )
        resolved_farm_id = field.farm_id

    if resolved_crop_id:
        crop = (
            db.query(Crop)
            .join(Field, Crop.field_id == Field.id)
            .join(Farm, Field.farm_id == Farm.id)
            .filter(Crop.id == resolved_crop_id, Farm.user_id == user_id)
            .first()
        )
        if not crop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Crop not found or you do not have permission to attach tasks to it.",
            )
        if resolved_field_id and crop.field_id != resolved_field_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Specified crop does not belong to the specified field.",
            )
        resolved_field_id = crop.field_id
        resolved_farm_id = crop.field.farm_id

    return resolved_farm_id, resolved_field_id, resolved_crop_id


@router.get(
    "/calendar/",
    response_model=List[TaskResponse],
    summary="List Calendar Activities with Range & Status Filters",
)
def get_calendar_activities(
    farm_id: Optional[str] = Query(None, description="Filter by farm ID"),
    field_id: Optional[str] = Query(None, description="Filter by field ID"),
    crop_id: Optional[str] = Query(None, description="Filter by crop ID"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (pending, in_progress, completed, cancelled)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve user calendar activities within date range and status filters."""
    return CalendarService.get_calendar_activities(
        db=db,
        user_id=current_user.id,
        farm_id=farm_id,
        field_id=field_id,
        crop_id=crop_id,
        start_date=start_date,
        end_date=end_date,
        activity_status=status_filter,
        category=category,
    )


@router.post(
    "/generate-suggestions/",
    response_model=GenerateSuggestionsResponse,
    summary="Generate Crop Growth Stage Activity Suggestions",
)
async def generate_crop_suggestions(
    req: GenerateSuggestionsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Calculate growth-stage activities for a planted crop based on Days After Sowing and forecast weather."""
    return await CalendarService.generate_crop_suggestions(
        db=db,
        user_id=current_user.id,
        farm_id=req.farm_id,
        crop_id=req.crop_id,
        field_id=req.field_id,
        planting_date_override=req.planting_date,
    )


@router.get(
    "/",
    response_model=List[TaskResponse],
    summary="List Authenticated User's Farm Tasks",
)
def list_tasks(
    farm_id: Optional[str] = Query(None, description="Filter tasks by farm ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve all farm tasks belonging to the current user, optionally filtered by farm."""
    query = db.query(Task).filter(Task.user_id == current_user.id)
    if farm_id:
        query = query.filter(Task.farm_id == farm_id)
    return query.order_by(Task.created_at.desc()).all()


@router.post(
    "/",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Farm Task / Calendar Activity",
)
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new task/activity tied to the user and optional farm/field/crop."""
    farm_id, field_id, crop_id = _validate_hierarchy(
        db, current_user.id, task_in.farm_id, task_in.field_id, task_in.crop_id
    )

    initial_status = task_in.status or ("completed" if task_in.completed else "pending")
    is_completed = bool(task_in.completed or initial_status == "completed")
    completed_time = datetime.now(timezone.utc) if is_completed else None

    task = Task(
        user_id=current_user.id,
        farm_id=farm_id,
        field_id=field_id,
        crop_id=crop_id,
        title=task_in.title,
        description=task_in.description,
        due_date=task_in.due_date or "Scheduled",
        category=task_in.category or "general",
        priority=task_in.priority or "medium",
        status=initial_status,
        completed=is_completed,
        start_time=task_in.start_time,
        end_time=task_in.end_time,
        completed_at=completed_time,
        source=task_in.source or "manual",
        is_weather_sensitive=bool(task_in.is_weather_sensitive),
        reminder_at=task_in.reminder_at,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch(
    "/{task_id}/toggle",
    response_model=TaskResponse,
    summary="Toggle Task Completed State",
)
def toggle_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Toggle the completed status of an owned task, synchronizing status and completed_at."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or you do not have permission to modify it.",
        )
    task.completed = not task.completed
    if task.completed:
        task.status = "completed"
        task.completed_at = datetime.now(timezone.utc)
    else:
        task.status = "pending"
        task.completed_at = None

    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Update Task Details",
)
def update_task(
    task_id: str,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update task details and validate ownership."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or you do not have permission to modify it.",
        )

    # Check hierarchy if changing relationships
    new_farm_id = task_in.farm_id if task_in.farm_id is not None else task.farm_id
    new_field_id = task_in.field_id if task_in.field_id is not None else task.field_id
    new_crop_id = task_in.crop_id if task_in.crop_id is not None else task.crop_id

    if (
        task_in.farm_id is not None
        or task_in.field_id is not None
        or task_in.crop_id is not None
    ):
        new_farm_id, new_field_id, new_crop_id = _validate_hierarchy(
            db, current_user.id, new_farm_id, new_field_id, new_crop_id
        )

    update_data = task_in.model_dump(exclude_unset=True)
    if "farm_id" in update_data:
        update_data["farm_id"] = new_farm_id
    if "field_id" in update_data:
        update_data["field_id"] = new_field_id
    if "crop_id" in update_data:
        update_data["crop_id"] = new_crop_id

    # Handle completion status sync
    if "completed" in update_data and "status" not in update_data:
        if update_data["completed"]:
            update_data["status"] = "completed"
            update_data["completed_at"] = datetime.now(timezone.utc)
        else:
            update_data["status"] = "pending"
            update_data["completed_at"] = None
    elif "status" in update_data:
        if update_data["status"] == "completed":
            update_data["completed"] = True
            update_data["completed_at"] = datetime.now(timezone.utc)
        elif update_data["status"] in ("pending", "in_progress", "cancelled"):
            update_data["completed"] = False
            update_data["completed_at"] = None

    for field, val in update_data.items():
        setattr(task, field, val)

    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Farm Task",
)
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete an owned farm task."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or you do not have permission to delete it.",
        )
    db.delete(task)
    db.commit()
    return None
