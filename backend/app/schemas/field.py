from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.crop import CropResponse


class FieldBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Field or parcel name")
    field_type: Optional[str] = Field("open_field", description="Type: open_field, greenhouse, orchard, etc.")
    area_hectares: Optional[float] = Field(None, ge=0, description="Field area in hectares")
    soil_type: Optional[str] = Field(None, description="Soil classification: clay, loam, sandy, etc.")
    boundary_geojson: Optional[Dict[str, Any]] = None


class FieldCreate(FieldBase):
    pass


class FieldUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    field_type: Optional[str] = None
    area_hectares: Optional[float] = Field(None, ge=0)
    soil_type: Optional[str] = None
    boundary_geojson: Optional[Dict[str, Any]] = None


class FieldResponse(FieldBase):
    id: str
    farm_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FieldDetailResponse(FieldResponse):
    crops: List[CropResponse] = []
