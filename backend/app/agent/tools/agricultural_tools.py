"""
Modular Agent Tools wrapping existing Phase 1–4 Backend, GIS, Soil, Weather, Terrain, and ML Services.
Does not duplicate business logic; reuses services directly.
"""
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.farm import Farm
from app.models.user import User
from app.services.gis_service import GISService
from app.services.soil_service import SoilService
from app.services.weather_service import WeatherService
from app.services.rainfall_service import RainfallService
from app.services.terrain_service import TerrainService
from app.services.water_service import WaterService

# ML Services from Phase 4
from app.services.ml.crop_recommendation_service import CropRecommendationService
from app.services.ml.fertilizer_recommendation_service import FertilizerRecommendationService
from app.services.ml.irrigation_recommendation_service import IrrigationRecommendationService
from app.services.ml.yield_prediction_service import YieldPredictionService
from app.services.ml.disease_detection_service import DiseaseDetectionService

from app.schemas.ml import (
    CropRecommendationRequest,
    FertilizerRecommendationRequest,
    IrrigationRecommendationRequest,
    YieldPredictionRequest,
)

logger = logging.getLogger(__name__)

# Singletons of backend service layers
gis_service = GISService()
soil_service = SoilService()
weather_service = WeatherService()
rainfall_service = RainfallService()
terrain_service = TerrainService()
water_service = WaterService()

crop_ml_service = CropRecommendationService()
fert_ml_service = FertilizerRecommendationService()
irrig_ml_service = IrrigationRecommendationService()
yield_ml_service = YieldPredictionService()
disease_ml_service = DiseaseDetectionService()


def tool_get_farm_location(farm_id: str, current_user: User, db: Session) -> Dict[str, Any]:
    """Retrieve GPS coordinates, location name, and boundary for a user's farm holding."""
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        return {"error": f"Farm with ID '{farm_id}' was not found in database."}
    if farm.user_id != current_user.id:
        return {"error": "Unauthorized: You do not have permission to access this farm holding."}

    lat = farm.latitude
    lng = farm.longitude

    # Centroid from boundary if latitude/longitude is unset
    if (lat is None or lng is None) and farm.boundary_geojson:
        centroid = gis_service.calculate_centroid(farm.boundary_geojson)
        if centroid:
            lat, lng = centroid

    return {
        "status": "success",
        "farm_id": farm.id,
        "farm_name": farm.name,
        "location_name": farm.location_name or "Unknown Location",
        "latitude": lat,
        "longitude": lng,
        "has_polygon_boundary": bool(farm.boundary_geojson),
        "fields_count": len(farm.fields),
        "fields": [{"id": f.id, "name": f.name, "area_ha": f.area_hectares, "crops": [c.name for c in f.crops]} for f in farm.fields]
    }


def tool_get_farm_area(farm_id: str, current_user: User, db: Session) -> Dict[str, Any]:
    """Retrieve verified land area in hectares and acres for a user's farm."""
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        return {"error": f"Farm with ID '{farm_id}' was not found."}
    if farm.user_id != current_user.id:
        return {"error": "Unauthorized access to farm data."}

    area_ha = farm.total_area_hectares
    if (area_ha is None or area_ha <= 0) and farm.boundary_geojson:
        geo_calc = gis_service.calculate_polygon_area(farm.boundary_geojson)
        area_ha = geo_calc.get("area_hectares", 1.0)

    area_ha = area_ha or 1.0
    area_acres = round(area_ha * 2.47105, 2)

    return {
        "status": "success",
        "farm_name": farm.name,
        "area_hectares": round(area_ha, 2),
        "area_acres": area_acres,
        "source": "PostGIS Geodesic Polygon Area" if farm.boundary_geojson else "Farm Profile Stored Area"
    }


async def tool_analyze_soil(latitude: float, longitude: float) -> Dict[str, Any]:
    """Fetch location-based soil profile: pH, NPK, organic carbon, texture, and CEC."""
    try:
        profile = await soil_service.get_soil_profile(latitude, longitude)
        return {
            "status": "success",
            "soil_type": profile.soil_type,
            "ph": profile.ph.value,
            "ph_interpretation": profile.ph.interpretation,
            "nitrogen_kg_ha": profile.nitrogen_n.value,
            "organic_carbon_pct": profile.organic_carbon.value,
            "phosphorus_kg_ha": profile.phosphorus_p.value,
            "potassium_kg_ha": profile.potassium_k.value,
            "texture": profile.texture_class,
            "data_source": profile.data_source,
        }
    except Exception as e:
        logger.warning(f"Error in tool_analyze_soil: {e}")
        return {"status": "degraded", "error": str(e), "message": "Using regional soil estimates."}


async def tool_get_weather(latitude: float, longitude: float) -> Dict[str, Any]:
    """Fetch live meteorological conditions and 7-day agricultural forecast."""
    try:
        w = await weather_service.get_weather(latitude, longitude)
        return {
            "status": "success",
            "temperature_c": w.current.temperature_c,
            "apparent_temperature_c": w.current.feels_like_c,
            "relative_humidity_pct": w.current.humidity_percent,
            "wind_speed_kmh": w.current.wind_speed_kmh,
            "weather_condition": w.current.condition,
            "forecast_7d_summary": [
                {
                    "date": f.date,
                    "condition": f.condition,
                    "temp_max": f.temp_max_c,
                    "temp_min": f.temp_min_c,
                    "rainfall_mm": f.precipitation_sum_mm
                } for f in w.forecast_7_day[:7]
            ]
        }
    except Exception as e:
        logger.warning(f"Error in tool_get_weather: {e}")
        return {"status": "degraded", "error": str(e)}


async def tool_get_rainfall(latitude: float, longitude: float) -> Dict[str, Any]:
    """Analyze historical rainfall (past 14 days), forecast rainfall, and trend status."""
    try:
        r = await rainfall_service.get_rainfall_intelligence(latitude, longitude)
        return {
            "status": "success",
            "past_7d_total_mm": r.recent_7_day_total_mm,
            "past_14d_total_mm": r.recent_14_day_total_mm,
            "past_30d_total_mm": r.recent_30_day_total_mm,
            "forecast_7d_total_mm": r.forecast_7_day_total_mm,
            "trend": r.rainfall_trend,
            "et0_reference_mm_day": r.evapotranspiration_et0_mm_day
        }
    except Exception as e:
        logger.warning(f"Error in tool_get_rainfall: {e}")
        return {"status": "degraded", "error": str(e)}


async def tool_get_terrain(latitude: float, longitude: float) -> Dict[str, Any]:
    """Retrieve digital elevation, slope gradient, aspect, and water runoff risk."""
    try:
        t = await terrain_service.get_terrain_analytics(latitude, longitude)
        return {
            "status": "success",
            "elevation_m_asl": t.elevation_m_asl,
            "slope_degrees": t.slope_degrees,
            "slope_percentage": t.slope_percentage,
            "slope_category": t.slope_category,
            "aspect_direction": t.aspect_direction,
            "erosion_risk": t.erosion_risk
        }
    except Exception as e:
        logger.warning(f"Error in tool_get_terrain: {e}")
        return {"status": "degraded", "error": str(e)}


async def tool_find_nearby_water_resources(latitude: float, longitude: float, area_ha: float = 1.0) -> Dict[str, Any]:
    """Scan natural surface water bodies (rivers, lakes, canals, reservoirs) within 10 km."""
    try:
        w = await water_service.get_water_intelligence(latitude, longitude, area_ha)
        return {
            "status": "success",
            "water_accessibility": w.water_accessibility_rating,
            "closest_water_body": {
                "name": w.closest_water_body.name if w.closest_water_body else "None within 10 km",
                "type": w.closest_water_body.water_type if w.closest_water_body else "N/A",
                "distance_km": w.closest_water_body.distance_km if w.closest_water_body else None
            },
            "nearby_bodies_count": len(w.nearby_water_bodies),
            "irrigation_status": w.irrigation_status
        }
    except Exception as e:
        logger.warning(f"Error in tool_find_nearby_water_resources: {e}")
        return {"status": "degraded", "error": str(e)}


def tool_recommend_crop(
    nitrogen: float,
    phosphorus: float,
    potassium: float,
    temperature: float,
    humidity: float,
    ph: float,
    rainfall: float
) -> Dict[str, Any]:
    """Execute Random Forest multi-crop classification model with explainable agronomic factor scores."""
    req = CropRecommendationRequest(
        nitrogen=nitrogen,
        phosphorus=phosphorus,
        potassium=potassium,
        temperature=temperature,
        humidity=humidity,
        ph=ph,
        rainfall=rainfall
    )
    res = crop_ml_service.recommend(req, top_k=3)
    return {
        "status": "success",
        "top_crops": [
            {
                "crop": c.crop,
                "confidence_pct": round(c.confidence_score * 100, 1),
                "suitability": c.suitability,
                "summary": c.summary
            } for c in res.top_recommendations
        ],
        "model_version": res.model_version
    }


def tool_recommend_fertilizer(
    crop: str,
    soil_n: float,
    soil_p: float,
    soil_k: float,
    ph: float = 6.5,
    organic_carbon_pct: float = 0.5,
    stage: str = "basal"
) -> Dict[str, Any]:
    """Calculate soil nutrient deficit and commercial fertilizer dosage formulas."""
    req = FertilizerRecommendationRequest(
        crop=crop,
        soil_nitrogen=soil_n,
        soil_phosphorus=soil_p,
        soil_potassium=soil_k,
        soil_ph=ph,
        organic_carbon_percent=organic_carbon_pct,
        growth_stage=stage
    )
    res = fert_ml_service.recommend(req)
    return {
        "status": "success",
        "crop": res.crop,
        "growth_stage": res.growth_stage,
        "deficits": [{"nutrient": d.nutrient, "deficit_kg_ha": d.deficit_kg_ha} for d in res.nutrient_deficits],
        "fertilizers": [
            {
                "name": f.fertilizer_name,
                "quantity_kg_ha": f.quantity_kg_ha,
                "timing": f.timing
            } for f in res.recommended_fertilizers
        ],
        "organic_amendments": res.organic_amendments[:2]
    }


def tool_calculate_irrigation(
    crop: str,
    growth_stage: str = "mid_season",
    area_ha: float = 1.0,
    soil_texture: str = "loam",
    temp_c: float = 28.0,
    humidity: float = 65.0,
    wind_kmh: float = 12.0,
    solar_rad_mj: float = 18.0,
    rainfall_7d_mm: float = 0.0
) -> Dict[str, Any]:
    """Calculate FAO-56 Penman-Monteith crop water demand (ETc = Kc * ET0) and 7-day volumetric deficit."""
    req = IrrigationRecommendationRequest(
        crop=crop,
        growth_stage=growth_stage,
        area_ha=area_ha,
        soil_texture=soil_texture,
        temperature_c=temp_c,
        humidity_percent=humidity,
        wind_speed_kmh=wind_kmh,
        solar_radiation_mj=solar_rad_mj,
        forecast_rainfall_7d_mm=rainfall_7d_mm
    )
    res = irrig_ml_service.recommend(req)
    return {
        "status": "success",
        "crop": res.crop,
        "daily_etc_mm": res.crop_evapotranspiration_etc_mm_day,
        "net_irrigation_demand_mm": res.net_irrigation_requirement_mm,
        "net_irrigation_volume_m3": res.net_irrigation_volume_m3,
        "drip_run_hours_daily": res.recommended_run_time_hours_per_day,
        "schedule": res.suggested_watering_schedule
    }


def tool_predict_yield(
    crop: str,
    area_ha: float = 1.0,
    annual_rainfall_mm: float = 800.0,
    fertilizer_kg_ha: float = 150.0,
    avg_temp_c: float = 24.0,
    soil_ph: float = 6.5,
    is_irrigated: bool = True
) -> Dict[str, Any]:
    """Execute Random Forest crop yield regression model."""
    req = YieldPredictionRequest(
        crop=crop,
        area_ha=area_ha,
        annual_rainfall_mm=annual_rainfall_mm,
        fertilizer_kg_ha=fertilizer_kg_ha,
        avg_temperature_c=avg_temp_c,
        soil_ph=soil_ph,
        is_irrigated=is_irrigated
    )
    res = yield_ml_service.predict(req)
    return {
        "status": "success",
        "crop": res.crop,
        "predicted_yield_mt_ha": res.predicted_yield_tonnes_per_ha,
        "predicted_total_tonnes": res.predicted_total_production_tonnes,
        "confidence_interval_90": res.confidence_interval_90_tonnes_per_ha,
        "key_drivers": res.key_drivers[:2],
        "limiting_factors": res.limiting_factors[:2]
    }


def tool_detect_crop_disease(image_bytes: bytes, crop_hint: Optional[str] = None) -> Dict[str, Any]:
    """Execute Computer Vision foliar pathology classifier."""
    res = disease_ml_service.detect(image_bytes, crop_hint=crop_hint)
    return {
        "status": "success",
        "crop": res.detected_crop,
        "condition": res.condition,
        "is_healthy": res.is_healthy,
        "confidence_pct": round(res.confidence_score * 100, 1),
        "severity": res.severity,
        "chemical_treatment": res.chemical_treatment,
        "organic_remedy": res.organic_remedy
    }
