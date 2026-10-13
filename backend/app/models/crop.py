import uuid
from sqlalchemy import Column, Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import relationship
from app.db.session import Base


class Crop(Base):
    """Crop entity representing planted crop cycles within a specific field."""
    __tablename__ = "crops"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String(150), nullable=False, index=True)
    variety = Column(String(150), nullable=True)
    planting_date = Column(Date, nullable=True)
    expected_harvest_date = Column(Date, nullable=True)
    status = Column(String(50), nullable=False, default="planted")  # planted, growing, flowering, harvested
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    field = relationship("Field", back_populates="crops")
