from typing import Optional
from fastapi import APIRouter, Query
from app.schemas.intelligence import WaterIntelligenceCombinedResponse
from app.services.water_service import WaterService

router = APIRouter()


@router.get(
    "/water",
    response_model=WaterIntelligenceCombinedResponse,
    summary="Get Combined Water Resources & Irrigation Demand Intelligence",
    description="Synthesizes surface water proximity, forecast precipitation, and ET₀ crop water deficit calculations.",
)
async def get_water_intelligence(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude in decimal degrees"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude in decimal degrees"),
    area_hectares: Optional[float] = Query(1.0, ge=0.01, description="Farm or field area in hectares"),
):
    """Retrieve synthesized water resources, accessibility rating, and crop water requirements."""
    return await WaterService.get_combined_water_intelligence(latitude, longitude, area_hectares)
