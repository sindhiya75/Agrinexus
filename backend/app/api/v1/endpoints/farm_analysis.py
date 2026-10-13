from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.farm import Farm
from app.schemas.intelligence import UnifiedFarmAnalysisResponse
from app.services.farm_analysis_service import FarmAnalysisService

router = APIRouter()


@router.get(
    "/farm-analysis",
    response_model=UnifiedFarmAnalysisResponse,
    summary="Unified Farm Intelligence Analysis by Coordinates",
    description="Combines Soil, Weather, Rainfall, Terrain, and Water layers into a single comprehensive diagnostic.",
)
async def analyze_farm_coordinates(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude in decimal degrees"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude in decimal degrees"),
    area_hectares: Optional[float] = Query(1.0, ge=0.01, description="Farm area in hectares"),
    farm_name: Optional[str] = Query(None, description="Optional farm title"),
):
    """Generate comprehensive multi-layer agro-ecological report for coordinates."""
    return await FarmAnalysisService.analyze_farm(
        latitude=latitude,
        longitude=longitude,
        area_hectares=area_hectares,
        farm_name=farm_name,
    )


@router.get(
    "/farm-analysis/{farm_id}",
    response_model=UnifiedFarmAnalysisResponse,
    summary="Unified Farm Intelligence Analysis for Saved Farm",
    description="Loads farm coordinates and boundary, running multi-layer analysis on the user's farm.",
)
async def analyze_saved_farm(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Run comprehensive intelligence analysis directly on an authenticated user's farm."""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found or you do not have permission to access it.",
        )

    if not farm.latitude or not farm.longitude:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Farm does not have GPS coordinates or boundary set. Please set a location on the Smart Farm Map first.",
        )

    return await FarmAnalysisService.analyze_farm(
        latitude=farm.latitude,
        longitude=farm.longitude,
        area_hectares=farm.total_area_hectares or 1.0,
        farm_id=farm.id,
        farm_name=farm.name,
    )
