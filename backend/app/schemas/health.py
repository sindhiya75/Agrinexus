from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class DatabaseHealth(BaseModel):
    """Database connectivity and PostGIS inspection details."""
    connected: bool = Field(..., description="PostgreSQL connection state")
    postgis_installed: bool = Field(..., description="PostGIS extension state")
    postgis_version: Optional[str] = Field(None, description="Detailed PostGIS version string")
    database_name: str = Field(..., description="Target database name")
    latency_ms: Optional[float] = Field(None, description="Database ping roundtrip latency in milliseconds")
    error: Optional[str] = Field(None, description="Error message if connection failed")


class HealthResponse(BaseModel):
    """Comprehensive system health status response."""
    status: str = Field(
        ...,
        json_schema_extra={"example": "healthy"},
        description="Overall health status ('healthy' | 'degraded' | 'unhealthy')",
    )
    service: str = Field(
        ...,
        json_schema_extra={"example": "AgriNexus AI Backend API"},
    )
    version: str = Field(
        ...,
        json_schema_extra={"example": "0.1.0"},
    )
    environment: str = Field(
        ...,
        json_schema_extra={"example": "development"},
    )
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of the health check",
    )
    database: DatabaseHealth
    details: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Additional environment/metadata details",
    )
