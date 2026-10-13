import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from app.models.farm import Farm
from app.services.soil_service import SoilService
from app.services.weather_service import WeatherService
from app.services.rainfall_service import RainfallService
from app.services.terrain_service import TerrainService
from app.services.water_service import WaterService
from app.schemas.intelligence import UnifiedFarmAnalysisResponse
from app.schemas.gis import CentroidCoordinates

logger = logging.getLogger(__name__)


class FarmAnalysisService:
    """Unified farm analysis service aggregating Soil, Weather, Rainfall, Terrain, and Water layers."""

    @staticmethod
    async def analyze_farm(
        latitude: float,
        longitude: float,
        area_hectares: Optional[float] = 1.0,
        farm_id: Optional[str] = None,
        farm_name: Optional[str] = None,
    ) -> UnifiedFarmAnalysisResponse:
        """Run concurrent multi-layer farm intelligence analysis."""
        # Execute intelligence service calls concurrently
        soil_task = SoilService.get_soil_profile(latitude, longitude)
        weather_task = WeatherService.get_weather(latitude, longitude)
        rainfall_task = RainfallService.get_rainfall_intelligence(latitude, longitude)
        terrain_task = TerrainService.get_terrain_profile(latitude, longitude)
        water_task = WaterService.get_combined_water_intelligence(latitude, longitude, area_hectares)

        results = await asyncio.gather(
            soil_task,
            weather_task,
            rainfall_task,
            terrain_task,
            water_task,
            return_exceptions=True,
        )

        soil_res = results[0] if not isinstance(results[0], Exception) else await SoilService.get_soil_profile(latitude, longitude)
        weather_res = results[1] if not isinstance(results[1], Exception) else await WeatherService.get_weather(latitude, longitude)
        rainfall_res = results[2] if not isinstance(results[2], Exception) else await RainfallService.get_rainfall_intelligence(latitude, longitude)
        terrain_res = results[3] if not isinstance(results[3], Exception) else await TerrainService.get_terrain_profile(latitude, longitude)
        water_res = results[4] if not isinstance(results[4], Exception) else await WaterService.get_combined_water_intelligence(latitude, longitude, area_hectares)

        # Generate Executive Agro-Climatic Summary
        summary = (
            f"Farm located at {round(latitude, 4)}°N, {round(longitude, 4)}°E features {soil_res.soil_type} "
            f"(pH {soil_res.ph.value}) on {terrain_res.terrain_classification.lower()} (elevation {terrain_res.elevation_meters}m). "
            f"Current temperature is {weather_res.current.temperature_c}°C with {weather_res.current.condition.lower()}. "
            f"Forecast 7-day precipitation is {rainfall_res.forecast_7_day_total_mm} mm with an evapotranspiration rate of "
            f"{rainfall_res.evapotranspiration_et0_mm_day} mm/day. {water_res.irrigation_status}."
        )

        return UnifiedFarmAnalysisResponse(
            farm_id=farm_id,
            farm_name=farm_name,
            area_hectares=area_hectares,
            coordinates=CentroidCoordinates(latitude=latitude, longitude=longitude),
            analyzed_at=datetime.now(timezone.utc),
            soil=soil_res,
            weather=weather_res,
            rainfall=rainfall_res,
            terrain=terrain_res,
            water=water_res,
            agro_climatic_summary=summary,
        )
