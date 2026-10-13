import { CentroidCoordinates, WaterBodyFeature } from './gis';

export interface SoilProperty {
  value: number | null;
  unit: string;
  status: 'measured' | 'estimated' | 'unavailable';
  interpretation?: string | null;
}

export interface SoilProfileResponse {
  location: CentroidCoordinates;
  soil_type: string;
  ph: SoilProperty;
  nitrogen_n: SoilProperty;
  phosphorus_p: SoilProperty;
  potassium_k: SoilProperty;
  organic_carbon: SoilProperty;
  electrical_conductivity: SoilProperty;
  texture_class: string;
  moisture_retention: string;
  data_source: string;
  disclaimer: string;
}

export interface WeatherCurrent {
  temperature_c: number;
  feels_like_c: number;
  humidity_percent: number;
  precipitation_mm: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  cloud_cover_percent: number;
  condition: string;
  icon_code: string;
}

export interface WeatherDailyForecast {
  date: string;
  temp_max_c: number;
  temp_min_c: number;
  precipitation_sum_mm: number;
  precipitation_probability_percent: number;
  uv_index_max?: number | null;
  condition: string;
}

export interface WeatherResponse {
  coordinates: CentroidCoordinates;
  elevation_m: number;
  current: WeatherCurrent;
  forecast_7_day: WeatherDailyForecast[];
  source: string;
}

export interface DailyRainfallRecord {
  date: string;
  rainfall_mm: number;
  is_forecast: boolean;
}

export interface RainfallResponse {
  coordinates: CentroidCoordinates;
  recent_7_day_total_mm: number;
  recent_14_day_total_mm: number;
  recent_30_day_total_mm: number;
  forecast_24h_mm: number;
  forecast_7_day_total_mm: number;
  rainfall_trend: string;
  evapotranspiration_et0_mm_day: number;
  daily_records: DailyRainfallRecord[];
  data_source: string;
}

export interface TerrainResponse {
  coordinates: CentroidCoordinates;
  elevation_meters: number;
  slope_degrees: number;
  slope_percent: number;
  aspect: string;
  terrain_classification: string;
  drainage_capacity: string;
  soil_erosion_risk: string;
  farming_suitability: string;
  data_source: string;
}

export interface WaterIntelligenceCombinedResponse {
  farm_coordinates: CentroidCoordinates;
  nearby_water_bodies: WaterBodyFeature[];
  closest_water_body?: WaterBodyFeature | null;
  water_accessibility_score: number;
  water_accessibility_rating: string;
  daily_crop_water_requirement_mm: number;
  weekly_water_requirement_m3_per_ha: number;
  weekly_rainfall_forecast_mm: number;
  net_irrigation_deficit_mm: number;
  irrigation_status: string;
  irrigation_recommendation: string;
  availability_disclaimer: string;
}

export interface UnifiedFarmAnalysisResponse {
  farm_id?: string | null;
  farm_name?: string | null;
  area_hectares?: number | null;
  coordinates: CentroidCoordinates;
  analyzed_at: string;
  soil: SoilProfileResponse;
  weather: WeatherResponse;
  rainfall: RainfallResponse;
  terrain: TerrainResponse;
  water: WaterIntelligenceCombinedResponse;
  agro_climatic_summary: string;
}
