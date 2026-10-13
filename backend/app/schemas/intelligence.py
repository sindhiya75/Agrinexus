from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.gis import CentroidCoordinates, WaterBodyFeature


# ---------------------------------------------------------------------------
# Soil Intelligence Schemas
# ---------------------------------------------------------------------------
class SoilProperty(BaseModel):
    """Specific soil metric with measurement status (measured, estimated, unavailable)."""
    value: Optional[float] = None
    unit: str
    status: str = Field("estimated", description="Data status: 'measured', 'estimated', or 'unavailable'")
    interpretation: Optional[str] = None


class SoilProfileResponse(BaseModel):
    """Detailed soil classification, chemistry, and NPK profile."""
    location: CentroidCoordinates
    soil_type: str = Field(..., description="Soil classification/order (e.g. Alluvial Clay, Vertisols, Red Sandy Loam)")
    ph: SoilProperty
    nitrogen_n: SoilProperty
    phosphorus_p: SoilProperty
    potassium_k: SoilProperty
    organic_carbon: SoilProperty
    electrical_conductivity: SoilProperty
    texture_class: str
    moisture_retention: str
    data_source: str
    disclaimer: str

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Weather Intelligence Schemas
# ---------------------------------------------------------------------------
class WeatherCurrent(BaseModel):
    temperature_c: float
    feels_like_c: float
    humidity_percent: int
    precipitation_mm: float
    wind_speed_kmh: float
    wind_direction_deg: int
    cloud_cover_percent: int
    condition: str
    icon_code: str


class WeatherDailyForecast(BaseModel):
    date: str
    temp_max_c: float
    temp_min_c: float
    precipitation_sum_mm: float
    precipitation_probability_percent: int
    uv_index_max: Optional[float] = None
    condition: str


class WeatherResponse(BaseModel):
    coordinates: CentroidCoordinates
    elevation_m: float
    current: WeatherCurrent
    forecast_7_day: List[WeatherDailyForecast]
    source: str

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Rainfall Intelligence Schemas
# ---------------------------------------------------------------------------
class DailyRainfallRecord(BaseModel):
    date: str
    rainfall_mm: float
    is_forecast: bool


class RainfallResponse(BaseModel):
    coordinates: CentroidCoordinates
    recent_7_day_total_mm: float
    recent_14_day_total_mm: float
    recent_30_day_total_mm: float
    forecast_24h_mm: float
    forecast_7_day_total_mm: float
    rainfall_trend: str = Field(..., description="'Above Normal', 'Normal', 'Below Normal / Dry Spell'")
    evapotranspiration_et0_mm_day: float
    daily_records: List[DailyRainfallRecord]
    data_source: str

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Terrain Intelligence Schemas
# ---------------------------------------------------------------------------
class TerrainResponse(BaseModel):
    coordinates: CentroidCoordinates
    elevation_meters: float
    slope_degrees: float
    slope_percent: float
    aspect: str
    terrain_classification: str = Field(..., description="e.g. 'Flat Plain (0-2%)', 'Gently Undulating (2-5%)', 'Moderate Slope (5-10%)'")
    drainage_capacity: str
    soil_erosion_risk: str
    farming_suitability: str
    data_source: str

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Combined Water Intelligence Schemas
# ---------------------------------------------------------------------------
class WaterIntelligenceCombinedResponse(BaseModel):
    farm_coordinates: CentroidCoordinates
    nearby_water_bodies: List[WaterBodyFeature]
    closest_water_body: Optional[WaterBodyFeature] = None
    water_accessibility_score: int = Field(..., ge=0, le=100)
    water_accessibility_rating: str
    daily_crop_water_requirement_mm: float
    weekly_water_requirement_m3_per_ha: float
    weekly_rainfall_forecast_mm: float
    net_irrigation_deficit_mm: float
    irrigation_status: str = Field(..., description="'Sufficient Rainfall', 'Mild Deficit - Supplemental Irrigation Recommended', 'High Deficit - Active Irrigation Required'")
    irrigation_recommendation: str
    availability_disclaimer: str

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Unified Farm Analysis Response
# ---------------------------------------------------------------------------
class UnifiedFarmAnalysisResponse(BaseModel):
    farm_id: Optional[str] = None
    farm_name: Optional[str] = None
    area_hectares: Optional[float] = None
    coordinates: CentroidCoordinates
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)
    soil: SoilProfileResponse
    weather: WeatherResponse
    rainfall: RainfallResponse
    terrain: TerrainResponse
    water: WaterIntelligenceCombinedResponse
    agro_climatic_summary: str

    model_config = ConfigDict(from_attributes=True)
