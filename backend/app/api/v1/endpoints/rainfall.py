from fastapi import APIRouter, Query
from app.schemas.intelligence import RainfallResponse
from app.services.rainfall_service import RainfallService

router = APIRouter()


@router.get(
    "/rainfall",
    response_model=RainfallResponse,
    summary="Get Rainfall Accruals, Forecasts & ET₀ Intelligence",
    description="Calculates recent rainfall (7, 14, 30 days), forecast precipitation, anomaly trends, and ET₀.",
)
async def get_rainfall_intelligence(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude in decimal degrees"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude in decimal degrees"),
):
    """Retrieve past and forecast rainfall analytics with ET₀."""
    return await RainfallService.get_rainfall_intelligence(latitude, longitude)
