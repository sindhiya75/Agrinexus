from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.field import FieldDetailResponse


class FarmBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Farm name")
    description: Optional[str] = None
    location_name: Optional[str] = Field(None, description="Village, District or Region")
    latitude: Optional[float] = Field(None, ge=-90, le=90, description="Latitude in decimal degrees")
    longitude: Optional[float] = Field(None, ge=-180, le=180, description="Longitude in decimal degrees")
    total_area_hectares: Optional[float] = Field(None, ge=0, description="Total farm land area in hectares")
    boundary_geojson: Optional[Dict[str, Any]] = None


class FarmCreate(FarmBase):
    pass


class FarmUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    total_area_hectares: Optional[float] = Field(None, ge=0)
    boundary_geojson: Optional[Dict[str, Any]] = None


class FarmResponse(FarmBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    field_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class FarmDetailResponse(FarmBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    fields: List[FieldDetailResponse] = []

    model_config = ConfigDict(from_attributes=True)
