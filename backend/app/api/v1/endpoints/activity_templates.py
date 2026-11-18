from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.schemas.activity_template import ActivityTemplateResponse
from app.services.activity_template_service import ActivityTemplateService

router = APIRouter()


@router.get(
    "/",
    response_model=List[ActivityTemplateResponse],
    summary="List Agronomic Activity Templates",
)
def list_activity_templates(
    crop_name: Optional[str] = Query(None, description="Filter by crop name (e.g. Rice, Wheat, Tomato)"),
    category: Optional[str] = Query(None, description="Filter by activity category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve agronomic best-practice templates for crops and growth stages."""
    return ActivityTemplateService.get_templates(db=db, crop_name=crop_name, category=category)
