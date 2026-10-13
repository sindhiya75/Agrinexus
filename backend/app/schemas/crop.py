from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class CropBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150, description="Crop name (e.g. Paddy, Tomato)")
    variety: Optional[str] = Field(None, max_length=150, description="Crop variety/cultivar")
    planting_date: Optional[date] = None
    expected_harvest_date: Optional[date] = None
    status: Optional[str] = Field("planted", description="Current status: planted, growing, flowering, harvested")
    notes: Optional[str] = None


class CropCreate(CropBase):
    pass


class CropUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    variety: Optional[str] = None
    planting_date: Optional[date] = None
    expected_harvest_date: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class CropResponse(CropBase):
    id: str
    field_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
