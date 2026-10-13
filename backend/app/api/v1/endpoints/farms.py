from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.farm import Farm
from app.models.field import Field
from app.schemas.farm import FarmCreate, FarmUpdate, FarmResponse, FarmDetailResponse

router = APIRouter()


@router.get(
    "/",
    response_model=List[FarmResponse],
    summary="List Authenticated User's Farms",
)
def list_farms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve all farms belonging exclusively to the logged-in user."""
    farms = (
        db.query(Farm)
        .filter(Farm.user_id == current_user.id)
        .order_by(Farm.created_at.desc())
        .all()
    )
    # Populate field count
    results = []
    for farm in farms:
        field_count = db.query(Field).filter(Field.farm_id == farm.id).count()
        farm_resp = FarmResponse.model_validate(farm)
        farm_resp.field_count = field_count
        results.append(farm_resp)
    return results


@router.post(
    "/",
    response_model=FarmResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Farm",
)
def create_farm(
    farm_in: FarmCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new farm parcel tied to the authenticated user."""
    farm = Farm(
        user_id=current_user.id,
        name=farm_in.name,
        description=farm_in.description,
        location_name=farm_in.location_name,
        latitude=farm_in.latitude,
        longitude=farm_in.longitude,
        total_area_hectares=farm_in.total_area_hectares,
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    resp = FarmResponse.model_validate(farm)
    resp.field_count = 0
    return resp


@router.get(
    "/{farm_id}",
    response_model=FarmDetailResponse,
    summary="Get Farm Details with Fields and Crops",
)
def get_farm_detail(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve details, sub-fields, and planted crops for a specific farm owned by the user."""
    farm = (
        db.query(Farm)
        .options(joinedload(Farm.fields).joinedload(Field.crops))
        .filter(Farm.id == farm_id, Farm.user_id == current_user.id)
        .first()
    )
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found or you do not have permission to access it.",
        )
    return farm


@router.put(
    "/{farm_id}",
    response_model=FarmResponse,
    summary="Update Farm Details",
)
def update_farm(
    farm_id: str,
    farm_in: FarmUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update farm metadata for a farm owned by the user."""
    farm = (
        db.query(Farm)
        .filter(Farm.id == farm_id, Farm.user_id == current_user.id)
        .first()
    )
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found or you do not have permission to update it.",
        )

    update_data = farm_in.model_dump(exclude_unset=True)
    for field_name, val in update_data.items():
        setattr(farm, field_name, val)

    db.add(farm)
    db.commit()
    db.refresh(farm)
    
    field_count = db.query(Field).filter(Field.farm_id == farm.id).count()
    resp = FarmResponse.model_validate(farm)
    resp.field_count = field_count
    return resp


@router.delete(
    "/{farm_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Farm",
)
def delete_farm(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a farm and all its associated fields and crops."""
    farm = (
        db.query(Farm)
        .filter(Farm.id == farm_id, Farm.user_id == current_user.id)
        .first()
    )
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found or you do not have permission to delete it.",
        )

    db.delete(farm)
    db.commit()
    return None
