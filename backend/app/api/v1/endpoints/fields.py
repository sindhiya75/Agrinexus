from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.farm import Farm
from app.models.field import Field
from app.schemas.field import FieldCreate, FieldUpdate, FieldResponse, FieldDetailResponse

router = APIRouter()


def _get_user_field(db: Session, field_id: str, user_id: str) -> Field:
    """Helper to retrieve a field ensuring its parent farm belongs to the user."""
    field = (
        db.query(Field)
        .join(Farm, Field.farm_id == Farm.id)
        .options(joinedload(Field.crops))
        .filter(Field.id == field_id, Farm.user_id == user_id)
        .first()
    )
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found or you do not have permission to access it.",
        )
    return field


@router.get(
    "/farms/{farm_id}/fields",
    response_model=List[FieldDetailResponse],
    summary="List Fields in Farm",
)
def list_fields_for_farm(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve all fields inside a specific farm owned by the user."""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found or you do not have permission to access it.",
        )

    fields = (
        db.query(Field)
        .options(joinedload(Field.crops))
        .filter(Field.farm_id == farm_id)
        .order_by(Field.created_at.asc())
        .all()
    )
    return fields


@router.post(
    "/farms/{farm_id}/fields",
    response_model=FieldResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Field in Farm",
)
def create_field_for_farm(
    farm_id: str,
    field_in: FieldCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Add a new field or plot inside an owned farm."""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found or you do not have permission to add fields to it.",
        )

    field = Field(
        farm_id=farm.id,
        name=field_in.name,
        field_type=field_in.field_type,
        area_hectares=field_in.area_hectares,
        soil_type=field_in.soil_type,
    )
    db.add(field)
    db.commit()
    db.refresh(field)
    return field


@router.get(
    "/fields/{field_id}",
    response_model=FieldDetailResponse,
    summary="Get Field Details and Planted Crops",
)
def get_field_detail(
    field_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get single field details with planted crops."""
    return _get_user_field(db, field_id, current_user.id)


@router.put(
    "/fields/{field_id}",
    response_model=FieldResponse,
    summary="Update Field",
)
def update_field(
    field_id: str,
    field_in: FieldUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update field properties."""
    field = _get_user_field(db, field_id, current_user.id)
    update_data = field_in.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(field, k, v)

    db.add(field)
    db.commit()
    db.refresh(field)
    return field


@router.delete(
    "/fields/{field_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Field",
)
def delete_field(
    field_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a field and its crops."""
    field = _get_user_field(db, field_id, current_user.id)
    db.delete(field)
    db.commit()
    return None
