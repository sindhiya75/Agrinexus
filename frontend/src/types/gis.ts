export interface CentroidCoordinates {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  min_longitude: number;
  min_latitude: number;
  max_longitude: number;
  max_latitude: number;
}

export interface PolygonAreaResponse {
  area_sq_meters: number;
  area_hectares: number;
  area_acres: number;
  perimeter_meters: number;
  perimeter_km: number;
  centroid: CentroidCoordinates;
  bounding_box: BoundingBox;
  geometry_type: string;
}

export interface WaterBodyFeature {
  name: string;
  type: string;
  distance_meters: number;
  distance_km: number;
  coordinates: CentroidCoordinates;
  osm_id?: number | null;
}

export interface WaterAccessibilityInfo {
  rating: string;
  summary: string;
  closest_feature?: WaterBodyFeature | null;
}

export interface WaterAvailabilityInfo {
  summary: string;
  disclaimer: string;
}

export interface WaterRequirementInfo {
  general_baseline_mm: string;
  recommendation: string;
}

export interface WaterIntelligenceResponse {
  farm_coordinates: CentroidCoordinates;
  search_radius_meters: number;
  data_source: string;
  water_bodies_found_count: number;
  water_bodies: WaterBodyFeature[];
  water_accessibility: WaterAccessibilityInfo;
  water_availability: WaterAvailabilityInfo;
  water_requirement_guidance: WaterRequirementInfo;
}

export interface NominatimLocationResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}
