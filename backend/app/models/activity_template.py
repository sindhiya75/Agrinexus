import uuid
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, func
from app.db.session import Base


class ActivityTemplate(Base):
    """Activity template for agronomic activity scheduling and growth-stage suggestions."""
    __tablename__ = "activity_templates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String(200), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=True)
    crop_name = Column(String(100), nullable=False, index=True)  # e.g. "Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Tomato", "General"
    growth_stage = Column(String(100), nullable=False)  # e.g. "Land Preparation", "Sowing / Transplanting", "Vegetative", "Flowering", "Maturity / Harvest"
    days_after_sowing = Column(Integer, nullable=False, default=0)
    default_priority = Column(String(20), nullable=False, default="medium")
    is_weather_sensitive = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
