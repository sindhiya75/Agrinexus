from fastapi import APIRouter, Query
from app.schemas.intelligence import TerrainResponse
from app.services.terrain_service import TerrainService

router = APIRouter()


@router.get(
    "/terrain",
    response_model=TerrainResponse,
    summary="Get Digital Elevation & Slope Terrain Intelligence",
    description="Calculates elevation (m), slope percentage and degrees, aspect, drainage capacity, and erosion risk.",
)
async def get_terrain_profile(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude in decimal degrees"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude in decimal degrees"),
):
    """Retrieve digital elevation model and topographical metrics."""
    return await TerrainService.get_terrain_profile(latitude, longitude)
