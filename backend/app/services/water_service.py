import logging
from typing import Any, Dict, Optional
from app.services.gis_service import GISService
from app.services.rainfall_service import RainfallService
from app.schemas.intelligence import WaterIntelligenceCombinedResponse
from app.schemas.gis import CentroidCoordinates, WaterBodyFeature

logger = logging.getLogger(__name__)


class WaterService:
    """Water intelligence service synthesizing GIS resources with meteorological water balance."""

    @staticmethod
    async def get_combined_water_intelligence(
        latitude: float,
        longitude: float,
        area_hectares: Optional[float] = 1.0,
    ) -> WaterIntelligenceCombinedResponse:
        """Combine GIS hydrological proximity with 7-day rainfall and ET₀ crop demand."""
        # 1. GIS surface water survey
        gis_water = await GISService.fetch_nearby_water_resources(latitude, longitude, radius_meters=10000)
        water_bodies_raw = gis_water.get("water_bodies", [])
        
        water_bodies = [
            WaterBodyFeature(
                name=b["name"],
                type=b["type"],
                distance_meters=b["distance_meters"],
                distance_km=b["distance_km"],
                coordinates=CentroidCoordinates(
                    latitude=b["coordinates"]["latitude"],
                    longitude=b["coordinates"]["longitude"],
                ),
                osm_id=b.get("osm_id"),
            ) for b in water_bodies_raw
        ]

        closest = water_bodies[0] if water_bodies else None

        # 2. Rainfall & ET0
        rainfall_data = await RainfallService.get_rainfall_intelligence(latitude, longitude)
        et0 = rainfall_data.evapotranspiration_et0_mm_day
        forecast_7_rain = rainfall_data.forecast_7_day_total_mm

        # 3. Crop water requirements calculation
        # Standard average crop coefficient Kc ~ 1.05
        kc = 1.05
        daily_crop_water_mm = round(et0 * kc, 2)
        weekly_crop_water_mm = round(daily_crop_water_mm * 7.0, 2)

        # 1 mm over 1 hectare = 10 cubic meters (m³)
        effective_hectares = area_hectares if area_hectares and area_hectares > 0 else 1.0
        weekly_m3_per_ha = round(weekly_crop_water_mm * 10.0, 1)

        # Effective rainfall (approx 75% of total forecast rainfall)
        effective_rain_7_mm = round(forecast_7_rain * 0.75, 2)
        net_deficit_mm = round(max(0.0, weekly_crop_water_mm - effective_rain_7_mm), 2)

        # Accessibility score (0 - 100)
        closest_dist = closest.distance_meters if closest else 10000
        if closest_dist <= 1000:
            score = 90
            rating = "High Accessibility"
        elif closest_dist <= 3000:
            score = 75
            rating = "Moderate Accessibility"
        elif closest_dist <= 6000:
            score = 55
            rating = "Moderate-Low Accessibility"
        else:
            score = 35
            rating = "Low / Groundwater Dependent"

        # Irrigation status & recommendation
        if net_deficit_mm == 0.0:
            status = "Sufficient Rainfall"
            recommendation = f"Forecast rainfall ({forecast_7_rain} mm) will fulfill crop water requirements this week. Ensure field drainage channels are clear to prevent waterlogging."
        elif net_deficit_mm < 15.0:
            status = "Mild Deficit - Supplemental Irrigation Recommended"
            recommendation = f"Minor water deficit ({net_deficit_mm} mm / ~{round(net_deficit_mm * 10)} m³/ha). Schedule 1 light drip irrigation cycle (1.5-2 hours) mid-week."
        else:
            status = "High Deficit - Active Irrigation Required"
            recommendation = f"Significant water deficit of {net_deficit_mm} mm (~{round(net_deficit_mm * 10)} m³/ha). Active irrigation required (3-4 drip cycles of 2 hours each). Monitor soil moisture."

        return WaterIntelligenceCombinedResponse(
            farm_coordinates=CentroidCoordinates(latitude=latitude, longitude=longitude),
            nearby_water_bodies=water_bodies[:8],
            closest_water_body=closest,
            water_accessibility_score=score,
            water_accessibility_rating=rating,
            daily_crop_water_requirement_mm=daily_crop_water_mm,
            weekly_water_requirement_m3_per_ha=weekly_m3_per_ha,
            weekly_rainfall_forecast_mm=forecast_7_rain,
            net_irrigation_deficit_mm=net_deficit_mm,
            irrigation_status=status,
            irrigation_recommendation=recommendation,
            availability_disclaimer="Surface water proximity is based on geospatial mapping. Live dam water release schedules, canal rotations, and groundwater aquifer yields vary seasonally and require local irrigation department verification.",
        )
