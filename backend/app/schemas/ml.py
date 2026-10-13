from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# ==========================================
# 1. CROP RECOMMENDATION SCHEMAS
# ==========================================

class CropRecommendationRequest(BaseModel):
    nitrogen: float = Field(..., ge=0, le=300, description="Soil Nitrogen content (N) in kg/ha or mg/kg")
    phosphorus: float = Field(..., ge=0, le=300, description="Soil Phosphorus content (P) in kg/ha or mg/kg")
    potassium: float = Field(..., ge=0, le=400, description="Soil Potassium content (K) in kg/ha or mg/kg")
    temperature: float = Field(..., ge=-10, le=60, description="Ambient Temperature in °C")
    humidity: float = Field(..., ge=0, le=100, description="Relative Humidity in %")
    ph: float = Field(..., ge=3.0, le=12.0, description="Soil pH value (0-14 scale)")
    rainfall: float = Field(..., ge=0, le=4000, description="Seasonal / Annual Rainfall in mm")

class CropFactorScore(BaseModel):
    status: str = Field(..., description="'Optimal', 'Moderate', 'Deficient', 'Excess'")
    farmer_val: float
    optimal_range: List[float]
    explanation: str

class RecommendedCrop(BaseModel):
    crop: str
    confidence_score: float = Field(..., description="Model predicted probability (0 to 1)")
    suitability: str = Field(..., description="'Highly Recommended', 'Recommended', 'Moderately Suitable'")
    agronomic_factors: Dict[str, CropFactorScore]
    summary: str

class CropRecommendationResponse(BaseModel):
    top_recommendations: List[RecommendedCrop]
    analyzed_features: Dict[str, float]
    model_version: str
    dataset_source: str
    limitations: str

# ==========================================
# 2. FERTILIZER RECOMMENDATION SCHEMAS
# ==========================================

class FertilizerRecommendationRequest(BaseModel):
    crop: str = Field(..., description="Target crop (e.g., 'rice', 'wheat', 'maize', 'cotton', 'tomato')")
    soil_nitrogen: float = Field(..., ge=0, le=300, description="Current soil Nitrogen in kg/ha")
    soil_phosphorus: float = Field(..., ge=0, le=300, description="Current soil Phosphorus in kg/ha")
    soil_potassium: float = Field(..., ge=0, le=400, description="Current soil Potassium in kg/ha")
    soil_ph: Optional[float] = Field(6.5, ge=3.0, le=12.0, description="Soil pH")
    organic_carbon_percent: Optional[float] = Field(0.5, ge=0.0, le=10.0, description="Soil Organic Carbon %")
    growth_stage: Optional[str] = Field("basal", description="'basal', 'vegetative', 'flowering_fruiting'")

class FertilizerDosage(BaseModel):
    fertilizer_name: str
    quantity_kg_ha: float
    nutrient_supplied: str
    timing: str
    application_method: str

class NutrientDeficit(BaseModel):
    nutrient: str
    current_kg_ha: float
    target_kg_ha: float
    deficit_kg_ha: float
    status: str

class FertilizerRecommendationResponse(BaseModel):
    crop: str
    growth_stage: str
    nutrient_deficits: List[NutrientDeficit]
    recommended_fertilizers: List[FertilizerDosage]
    organic_amendments: List[str]
    bio_fertilizers: List[str]
    cautions_and_tips: List[str]
    disclaimer: str

# ==========================================
# 3. IRRIGATION RECOMMENDATION SCHEMAS
# ==========================================

class IrrigationRecommendationRequest(BaseModel):
    crop: str = Field(..., description="Cultivated crop name")
    growth_stage: str = Field("mid_season", description="'initial', 'crop_development', 'mid_season', 'late_season'")
    area_ha: float = Field(1.0, gt=0, le=5000, description="Field surface area in hectares")
    soil_texture: Optional[str] = Field("loam", description="'sandy', 'loam', 'clay', 'clay_loam', 'sandy_loam'")
    temperature_c: Optional[float] = Field(28.0, ge=-10, le=60)
    humidity_percent: Optional[float] = Field(65.0, ge=5, le=100)
    wind_speed_kmh: Optional[float] = Field(12.0, ge=0)
    solar_radiation_mj: Optional[float] = Field(18.0, ge=0)
    forecast_rainfall_7d_mm: Optional[float] = Field(10.0, ge=0)
    et0_mm_day: Optional[float] = Field(None, description="Reference ET0 if pre-calculated, else calculated from weather")

class IrrigationRecommendationResponse(BaseModel):
    crop: str
    growth_stage: str
    crop_coefficient_kc: float
    et0_mm_day: float
    crop_evapotranspiration_etc_mm_day: float
    seven_day_crop_water_need_mm: float
    effective_rainfall_7d_mm: float
    net_irrigation_requirement_mm: float
    net_irrigation_volume_m3: float
    gross_irrigation_volume_m3: float
    recommended_run_time_hours_per_day: float
    irrigation_method_assumed: str
    suggested_watering_schedule: str
    water_saving_tips: List[str]
    disclaimer: str

# ==========================================
# 4. YIELD PREDICTION SCHEMAS
# ==========================================

class YieldPredictionRequest(BaseModel):
    crop: str = Field(..., description="Crop type (e.g., 'rice', 'wheat', 'maize', 'cotton', 'tomato')")
    area_ha: float = Field(1.0, gt=0, le=5000, description="Cultivated area in hectares")
    annual_rainfall_mm: float = Field(..., ge=100, le=4000, description="Total expected/historical seasonal rainfall in mm")
    fertilizer_kg_ha: float = Field(150.0, ge=0, le=800, description="Total NPK fertilizer applied in kg/ha")
    avg_temperature_c: float = Field(..., ge=5, le=50, description="Average growing season temperature in °C")
    soil_ph: float = Field(6.5, ge=3.5, le=10.0, description="Soil pH value")
    is_irrigated: bool = Field(True, description="Whether supplemental irrigation is applied")

class YieldPredictionResponse(BaseModel):
    crop: str
    area_ha: float
    predicted_yield_tonnes_per_ha: float
    predicted_total_production_tonnes: float
    confidence_interval_90_tonnes_per_ha: List[float]
    r2_score_reference: float
    mae_reference_mt_ha: float
    key_drivers: List[str]
    limiting_factors: List[str]
    model_version: str
    dataset_source: str
    limitations: str

# ==========================================
# 5. DISEASE DETECTION SCHEMAS
# ==========================================

class DiseaseDetectionResponse(BaseModel):
    detected_crop: str
    condition: str
    is_healthy: bool
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    severity: str = Field(..., description="'None', 'Mild', 'Moderate', 'Severe'")
    symptoms_observed: str
    chemical_treatment: str
    organic_remedy: str
    preventive_measures: List[str]
    extracted_features_summary: Dict[str, float]
    model_version: str
    limitations: str

# ==========================================
# 6. MODEL METADATA SUMMARY SCHEMAS
# ==========================================

class ModelInfo(BaseModel):
    model_name: str
    algorithm: str
    version: str
    metrics: Dict[str, Any]
    features_count: int
    dataset_source: str
    limitations: str

class AllModelsMetadataResponse(BaseModel):
    services_count: int
    models: Dict[str, ModelInfo]
