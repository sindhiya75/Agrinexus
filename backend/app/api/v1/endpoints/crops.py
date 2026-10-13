from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.farm import Farm
from app.models.field import Field
from app.models.crop import Crop
from app.schemas.crop import CropCreate, CropUpdate, CropResponse

router = APIRouter()


def _get_user_crop(db: Session, crop_id: str, user_id: str) -> Crop:
    """Helper to fetch a crop ensuring the hierarchy Crop -> Field -> Farm belongs to the user."""
    crop = (
        db.query(Crop)
        .join(Field, Crop.field_id == Field.id)
        .join(Farm, Field.farm_id == Farm.id)
        .filter(Crop.id == crop_id, Farm.user_id == user_id)
        .first()
    )
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crop not found or you do not have permission to access it.",
        )
    return crop


@router.get(
    "/fields/{field_id}/crops",
    response_model=List[CropResponse],
    summary="List Crops in Field",
)
def list_crops_for_field(
    field_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve all crops planted in a specific field owned by the user."""
    field = (
        db.query(Field)
        .join(Farm, Field.farm_id == Farm.id)
        .filter(Field.id == field_id, Farm.user_id == current_user.id)
        .first()
    )
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found or you do not have permission to access it.",
        )

    return db.query(Crop).filter(Crop.field_id == field_id).order_by(Crop.created_at.desc()).all()


@router.post(
    "/fields/{field_id}/crops",
    response_model=CropResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Plant Crop in Field",
)
def create_crop_in_field(
    field_id: str,
    crop_in: CropCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Record a planted crop cycle in an owned field."""
    field = (
        db.query(Field)
        .join(Farm, Field.farm_id == Farm.id)
        .filter(Field.id == field_id, Farm.user_id == current_user.id)
        .first()
    )
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found or you do not have permission to add crops to it.",
        )

    crop = Crop(
        field_id=field.id,
        name=crop_in.name,
        variety=crop_in.variety,
        planting_date=crop_in.planting_date,
        expected_harvest_date=crop_in.expected_harvest_date,
        status=crop_in.status or "planted",
        notes=crop_in.notes,
    )
    db.add(crop)
    db.commit()
    db.refresh(crop)
    return crop


@router.get(
    "/crops/{crop_id}",
    response_model=CropResponse,
    summary="Get Crop Details",
)
def get_crop_detail(
    crop_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve details for a single crop."""
    return _get_user_crop(db, crop_id, current_user.id)


@router.put(
    "/crops/{crop_id}",
    response_model=CropResponse,
    summary="Update Crop Status or Information",
)
def update_crop(
    crop_id: str,
    crop_in: CropUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update crop data such as status, variety, harvest dates, or notes."""
    crop = _get_user_crop(db, crop_id, current_user.id)
    update_data = crop_in.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(crop, k, v)

    db.add(crop)
    db.commit()
    db.refresh(crop)
    return crop


@router.delete(
    "/crops/{crop_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Crop",
)
def delete_crop(
    crop_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Remove a crop record."""
    crop = _get_user_crop(db, crop_id, current_user.id)
    db.delete(crop)
    db.commit()
    return None
