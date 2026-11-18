import uuid
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import relationship
from app.db.session import Base


class Task(Base):
    """Task model representing agricultural tasks, farm schedules, and calendar activities."""
    __tablename__ = "farm_tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=True, index=True)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="CASCADE"), nullable=True, index=True)
    crop_id = Column(String(36), ForeignKey("crops.id", ondelete="CASCADE"), nullable=True, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(String(64), default="Scheduled", nullable=False)
    category = Column(String(32), default="general", nullable=False)  # 'irrigation', 'fertilizer', 'scouting', 'general', 'land_preparation', 'sowing', 'crop_protection', 'harvest', 'maintenance'
    priority = Column(String(16), default="medium", nullable=False)   # 'high', 'medium', 'low'
    status = Column(String(32), default="pending", nullable=False, index=True)  # 'pending', 'in_progress', 'completed', 'cancelled'
    completed = Column(Boolean, default=False, nullable=False)

    start_time = Column(String(16), nullable=True)  # e.g. "08:00"
    end_time = Column(String(16), nullable=True)    # e.g. "11:30"
    completed_at = Column(DateTime(timezone=True), nullable=True)
    source = Column(String(32), default="manual", nullable=False)  # 'manual', 'suggested', 'weather_alert'
    is_weather_sensitive = Column(Boolean, default=False, nullable=False)
    reminder_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", backref="tasks")
    farm = relationship("Farm", backref="tasks")
    field = relationship("Field", backref="tasks")
    crop = relationship("Crop", backref="tasks")
