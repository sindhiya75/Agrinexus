import uuid
from sqlalchemy import Column, DateTime, Float, ForeignKey, JSON, String, func
from sqlalchemy.orm import relationship
from app.db.session import Base


class Field(Base):
    """Field entity representing a specific sub-plot or parcel within a Farm."""
    __tablename__ = "fields"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String(200), nullable=False, index=True)
    field_type = Column(String(100), nullable=True, default="open_field")
    area_hectares = Column(Float, nullable=True)
    soil_type = Column(String(100), nullable=True)

    # PostGIS GeoJSON Spatial Boundary
    boundary_geojson = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    farm = relationship("Farm", back_populates="fields")
    crops = relationship("Crop", back_populates="field", cascade="all, delete-orphan")
