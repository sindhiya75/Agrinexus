from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class CentroidCoordinates(BaseModel):
    latitude: float
    longitude: float


class BoundingBox(BaseModel):
    min_longitude: float
    min_latitude: float
    max_longitude: float
    max_latitude: float


class PolygonAreaRequest(BaseModel):
    boundary_geojson: Dict[str, Any] = Field(..., description="GeoJSON Polygon or MultiPolygon object")


class PolygonAreaResponse(BaseModel):
    area_sq_meters: float
    area_hectares: float
    area_acres: float
    perimeter_meters: float
    perimeter_km: float
    centroid: CentroidCoordinates
    bounding_box: BoundingBox
    geometry_type: str

    model_config = ConfigDict(from_attributes=True)


class WaterIntelligenceRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_meters: Optional[int] = Field(10000, ge=500, le=50000)


class WaterBodyFeature(BaseModel):
    name: str
    type: str
    distance_meters: float
    distance_km: float
    coordinates: CentroidCoordinates
    osm_id: Optional[int] = None


class WaterAccessibilityInfo(BaseModel):
    rating: str
    summary: str
    closest_feature: Optional[WaterBodyFeature] = None


class WaterAvailabilityInfo(BaseModel):
    summary: str
    disclaimer: str


class WaterRequirementInfo(BaseModel):
    general_baseline_mm: str
    recommendation: str


class WaterIntelligenceResponse(BaseModel):
    farm_coordinates: CentroidCoordinates
    search_radius_meters: int
    data_source: str
    water_bodies_found_count: int
    water_bodies: List[WaterBodyFeature]
    water_accessibility: WaterAccessibilityInfo
    water_availability: WaterAvailabilityInfo
    water_requirement_guidance: WaterRequirementInfo

    model_config = ConfigDict(from_attributes=True)


class SaveBoundaryRequest(BaseModel):
    boundary_geojson: Dict[str, Any] = Field(..., description="Valid GeoJSON Polygon for the farm/field")
