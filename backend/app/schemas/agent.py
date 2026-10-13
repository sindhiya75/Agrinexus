from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class AgentChatRequest(BaseModel):
    message: str = Field(..., description="Farmer's natural-language inquiry")
    farm_id: Optional[str] = Field(None, description="Optional UUID of the user's farm holding")
    latitude: Optional[float] = Field(None, ge=-90, le=90, description="Optional manual GPS latitude")
    longitude: Optional[float] = Field(None, ge=-180, le=180, description="Optional manual GPS longitude")
    area_hectares: Optional[float] = Field(1.0, gt=0, description="Optional manual land area")
    crop_name: Optional[str] = Field(None, description="Optional crop hint")
    session_id: Optional[str] = Field(None, description="Optional conversation session identifier")

class DataCitation(BaseModel):
    source: str
    data_type: str = Field(..., description="'Retrieved Data', 'Calculated Value', 'Model Prediction'")
    metric: str
    details: str

class AgentChatResponse(BaseModel):
    session_id: str
    reply: str
    detected_intent: str
    tools_executed: List[str]
    reasoning_steps: List[str]
    data_citations: List[DataCitation]
    farm_context: Optional[Dict[str, Any]] = None
