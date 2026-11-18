from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Task title or description")
    due_date: Optional[str] = Field("Scheduled", description="Due date string (e.g. 'YYYY-MM-DD', 'Today', 'Tomorrow')")
    category: Optional[str] = Field("general", description="'irrigation', 'fertilizer', 'scouting', 'general', 'land_preparation', 'sowing', 'crop_protection', 'harvest', 'maintenance'")
    priority: Optional[str] = Field("medium", description="'high', 'medium', 'low'")
    farm_id: Optional[str] = Field(None, description="Optional associated farm holding ID")
    field_id: Optional[str] = Field(None, description="Optional associated field ID")
    crop_id: Optional[str] = Field(None, description="Optional associated planted crop ID")
    description: Optional[str] = Field(None, description="Detailed activity instructions or agronomic notes")
    status: Optional[str] = Field("pending", description="'pending', 'in_progress', 'completed', 'cancelled'")
    start_time: Optional[str] = Field(None, description="Start time (e.g. '08:00')")
    end_time: Optional[str] = Field(None, description="End time (e.g. '11:30')")
    source: Optional[str] = Field("manual", description="'manual', 'suggested', 'weather_alert'")
    is_weather_sensitive: Optional[bool] = Field(False, description="Flag for rain/wind/heat sensitive operations")
    reminder_at: Optional[datetime] = Field(None, description="Optional reminder timestamp")


class TaskCreate(TaskBase):
    completed: Optional[bool] = False


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    due_date: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    completed: Optional[bool] = None
    status: Optional[str] = None
    farm_id: Optional[str] = None
    field_id: Optional[str] = None
    crop_id: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    source: Optional[str] = None
    is_weather_sensitive: Optional[bool] = None
    reminder_at: Optional[datetime] = None


class TaskResponse(BaseModel):
    id: str
    user_id: str
    farm_id: Optional[str] = None
    field_id: Optional[str] = None
    crop_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    due_date: str
    category: str
    priority: str
    status: str
    completed: bool
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    completed_at: Optional[datetime] = None
    source: str
    is_weather_sensitive: bool
    reminder_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Associated names if joined or loaded
    farm_name: Optional[str] = None
    field_name: Optional[str] = None
    crop_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
