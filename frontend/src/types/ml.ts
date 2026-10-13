// ==========================================
// 1. CROP RECOMMENDATION INTERFACES
// ==========================================

export interface CropFactorScore {
  status: 'Optimal' | 'Moderate' | 'Deficient' | 'Excess';
  farmer_val: number;
  optimal_range: [number, number];
  explanation: string;
}

export interface RecommendedCrop {
  crop: string;
  confidence_score: number;
  suitability: 'Highly Recommended' | 'Recommended' | 'Moderately Suitable';
  agronomic_factors: Record<string, CropFactorScore>;
  summary: string;
}

export interface CropRecommendationRequest {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
}

export interface CropRecommendationResponse {
  top_recommendations: RecommendedCrop[];
  analyzed_features: Record<string, number>;
  model_version: string;
  dataset_source: string;
  limitations: string;
}

// ==========================================
// 2. FERTILIZER RECOMMENDATION INTERFACES
// ==========================================

export interface NutrientDeficit {
  nutrient: string;
  current_kg_ha: number;
  target_kg_ha: number;
  deficit_kg_ha: number;
  status: string;
}

export interface FertilizerDosage {
  fertilizer_name: string;
  quantity_kg_ha: number;
  nutrient_supplied: string;
  timing: string;
  application_method: string;
}

export interface FertilizerRecommendationRequest {
  crop: string;
  soil_nitrogen: number;
  soil_phosphorus: number;
  soil_potassium: number;
  soil_ph?: number;
  organic_carbon_percent?: number;
  growth_stage?: 'basal' | 'vegetative' | 'flowering_fruiting';
}

export interface FertilizerRecommendationResponse {
  crop: string;
  growth_stage: string;
  nutrient_deficits: NutrientDeficit[];
  recommended_fertilizers: FertilizerDosage[];
  organic_amendments: string[];
  bio_fertilizers: string[];
  cautions_and_tips: string[];
  disclaimer: string;
}

// ==========================================
// 3. IRRIGATION RECOMMENDATION INTERFACES
// ==========================================

export interface IrrigationRecommendationRequest {
  crop: string;
  growth_stage: 'initial' | 'crop_development' | 'mid_season' | 'late_season';
  area_ha: number;
  soil_texture?: 'sandy' | 'loam' | 'clay' | 'clay_loam' | 'sandy_loam';
  temperature_c?: number;
  humidity_percent?: number;
  wind_speed_kmh?: number;
  solar_radiation_mj?: number;
  forecast_rainfall_7d_mm?: number;
  et0_mm_day?: number;
}

export interface IrrigationRecommendationResponse {
  crop: string;
  growth_stage: string;
  crop_coefficient_kc: number;
  et0_mm_day: number;
  crop_evapotranspiration_etc_mm_day: number;
  seven_day_crop_water_need_mm: number;
  effective_rainfall_7d_mm: number;
  net_irrigation_requirement_mm: number;
  net_irrigation_volume_m3: number;
  gross_irrigation_volume_m3: number;
  recommended_run_time_hours_per_day: number;
  irrigation_method_assumed: string;
  suggested_watering_schedule: string;
  water_saving_tips: string[];
  disclaimer: string;
}

// ==========================================
// 4. YIELD PREDICTION INTERFACES
// ==========================================

export interface YieldPredictionRequest {
  crop: string;
  area_ha: number;
  annual_rainfall_mm: number;
  fertilizer_kg_ha: number;
  avg_temperature_c: number;
  soil_ph: number;
  is_irrigated: boolean;
}

export interface YieldPredictionResponse {
  crop: string;
  area_ha: number;
  predicted_yield_tonnes_per_ha: number;
  predicted_total_production_tonnes: number;
  confidence_interval_90_tonnes_per_ha: [number, number];
  r2_score_reference: number;
  mae_reference_mt_ha: number;
  key_drivers: string[];
  limiting_factors: string[];
  model_version: string;
  dataset_source: string;
  limitations: string;
}

// ==========================================
// 5. DISEASE DETECTION INTERFACES
// ==========================================

export interface DiseaseDetectionResponse {
  detected_crop: string;
  condition: string;
  is_healthy: boolean;
  confidence_score: number;
  severity: 'None' | 'Mild' | 'Moderate' | 'Severe';
  symptoms_observed: string;
  chemical_treatment: string;
  organic_remedy: string;
  preventive_measures: string[];
  extracted_features_summary: Record<string, number>;
  model_version: string;
  limitations: string;
}

// ==========================================
// 6. ALL MODELS METADATA INTERFACES
// ==========================================

export interface ModelInfo {
  model_name: string;
  algorithm: string;
  version: string;
  metrics: Record<string, any>;
  features_count: number;
  dataset_source: string;
  limitations: string;
}

export interface AllModelsMetadataResponse {
  services_count: number;
  models: Record<string, ModelInfo>;
}
