from fastapi import APIRouter, Query
from app.schemas.intelligence import WeatherResponse
from app.services.weather_service import WeatherService

router = APIRouter()


@router.get(
    "/weather",
    response_model=WeatherResponse,
    summary="Get Current Weather & 7-Day Agricultural Forecast",
    description="Retrieves live temperature, humidity, wind, precipitation, and 7-day daily forecast.",
)
async def get_weather(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude in decimal degrees"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude in decimal degrees"),
):
    """Retrieve meteorological conditions and weekly forecast."""
    return await WeatherService.get_weather(latitude, longitude)
