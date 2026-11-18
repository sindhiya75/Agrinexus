from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ActivityTemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Template activity name")
    category: str = Field(..., description="Agricultural activity category")
    description: Optional[str] = Field(None, description="Agronomic guide or instruction")
    crop_name: str = Field(..., description="Crop name (e.g. 'Rice', 'Wheat', 'General')")
    growth_stage: str = Field(..., description="Crop growth stage")
    days_after_sowing: int = Field(0, ge=-30, le=365, description="Relative days from planting/sowing date")
    default_priority: str = Field("medium", description="'high', 'medium', 'low'")
    is_weather_sensitive: bool = Field(False, description="Whether activity depends on weather")
    is_active: bool = Field(True, description="Active status")


class ActivityTemplateCreate(ActivityTemplateBase):
    pass


class ActivityTemplateResponse(ActivityTemplateBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GenerateSuggestionsRequest(BaseModel):
    farm_id: str
    crop_id: str
    field_id: Optional[str] = None
    planting_date: Optional[date] = None  # Fallback if crop record lacks planting_date


class ActivitySuggestion(BaseModel):
    template_id: str
    title: str
    category: str
    description: Optional[str] = None
    growth_stage: str
    days_after_sowing: int
    suggested_date: str  # YYYY-MM-DD
    priority: str
    is_weather_sensitive: bool
    weather_warning: Optional[str] = None


class GenerateSuggestionsResponse(BaseModel):
    farm_id: str
    field_id: Optional[str] = None
    crop_id: str
    crop_name: str
    variety: Optional[str] = None
    planting_date: str
    days_since_planting: int
    current_growth_stage: str
    suggestions: List[ActivitySuggestion]
