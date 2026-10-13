from fastapi import APIRouter, Query
from app.schemas.intelligence import SoilProfileResponse
from app.services.soil_service import SoilService

router = APIRouter()


@router.get(
    "/soil",
    response_model=SoilProfileResponse,
    summary="Get Soil Profile and Chemistry Intelligence",
    description="Retrieves soil classification, pH, NPK profile, and organic carbon for a given farm location.",
)
async def get_soil_profile(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude in decimal degrees"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude in decimal degrees"),
):
    """Retrieve soil classification and chemical nutrient properties for coordinates."""
    return await SoilService.get_soil_profile(latitude, longitude)
