import logging
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.task import Task
from app.models.farm import Farm
from app.models.field import Field
from app.models.crop import Crop
from app.schemas.activity_template import (
    ActivitySuggestion,
    GenerateSuggestionsResponse,
)
from app.schemas.task import TaskResponse
from app.services.activity_template_service import ActivityTemplateService
from app.services.weather_service import WeatherService

logger = logging.getLogger(__name__)


class CalendarService:
    """Core domain service for farm calendar operations, activities, and intelligent scheduling."""

    @staticmethod
    def get_calendar_activities(
        db: Session,
        user_id: str,
        farm_id: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        field_id: Optional[str] = None,
        crop_id: Optional[str] = None,
        activity_status: Optional[str] = None,
        category: Optional[str] = None,
    ) -> List[TaskResponse]:
        """Retrieve calendar activities with multi-tenant isolation and flexible date/status filtering."""
        query = db.query(Task).filter(Task.user_id == user_id)

        if farm_id and isinstance(farm_id, str):
            query = query.filter(Task.farm_id == farm_id)
        if field_id and isinstance(field_id, str):
            query = query.filter(Task.field_id == field_id)
        if crop_id and isinstance(crop_id, str):
            query = query.filter(Task.crop_id == crop_id)
        if activity_status and isinstance(activity_status, str):
            query = query.filter(Task.status == activity_status.lower().strip())
        if category and isinstance(category, str):
            query = query.filter(Task.category == category.lower().strip())

        tasks = query.order_by(Task.due_date.asc(), Task.created_at.desc()).all()

        # Date range filtering (supports YYYY-MM-DD format as well as relative dates)
        filtered_tasks = []
        for t in tasks:
            task_date_str = CalendarService._normalize_task_date(t.due_date, t.created_at)
            if start_date and isinstance(start_date, str) and task_date_str and task_date_str < start_date:
                continue
            if end_date and isinstance(end_date, str) and task_date_str and task_date_str > end_date:
                continue

            # Populate names if associated
            farm_name = t.farm.name if t.farm else None
            field_name = t.field.name if t.field else None
            crop_name = t.crop.name if t.crop else None

            # Map to response schema
            resp = TaskResponse(
                id=t.id,
                user_id=t.user_id,
                farm_id=t.farm_id,
                field_id=t.field_id,
                crop_id=t.crop_id,
                title=t.title,
                description=t.description,
                due_date=t.due_date,
                category=t.category,
                priority=t.priority,
                status=t.status,
                completed=t.completed,
                start_time=t.start_time,
                end_time=t.end_time,
                completed_at=t.completed_at,
                source=t.source,
                is_weather_sensitive=t.is_weather_sensitive,
                reminder_at=t.reminder_at,
                created_at=t.created_at,
                updated_at=t.updated_at,
                farm_name=farm_name,
                field_name=field_name,
                crop_name=crop_name,
            )
            filtered_tasks.append(resp)

        return filtered_tasks

    @staticmethod
    def _normalize_task_date(due_date_str: str, created_at: datetime) -> Optional[str]:
        """Convert a task due_date to ISO YYYY-MM-DD for comparison and calendar grids."""
        if not due_date_str:
            return created_at.strftime("%Y-%m-%d") if created_at else None

        # Check if already ISO format YYYY-MM-DD
        clean = due_date_str.strip()
        if len(clean) >= 10 and clean[4] == "-" and clean[7] == "-":
            return clean[:10]

        # Handle common labels relative to task creation date or today
        ref = created_at.date() if created_at else date.today()
        lower = clean.lower()
        if "today" in lower:
            return ref.strftime("%Y-%m-%d")
        elif "tomorrow" in lower:
            return (ref + timedelta(days=1)).strftime("%Y-%m-%d")
        elif "in 2 days" in lower:
            return (ref + timedelta(days=2)).strftime("%Y-%m-%d")
        elif "weekend" in lower or "next week" in lower:
            return (ref + timedelta(days=5)).strftime("%Y-%m-%d")

        return ref.strftime("%Y-%m-%d")

    @staticmethod
    def determine_growth_stage(planting_date: date, current_date: date, crop_name: str) -> Tuple[int, str]:
        """Determine Days After Sowing (DAS) and agronomic growth stage."""
        das = (current_date - planting_date).days
        name_lower = crop_name.lower()

        if "rice" in name_lower or "paddy" in name_lower:
            if das < 0:
                stage = "Land Preparation & Puddling"
            elif das <= 15:
                stage = "Nursery & Seedling Establishment"
            elif das <= 40:
                stage = "Active Tillering"
            elif das <= 65:
                stage = "Panicle Initiation & Booting"
            elif das <= 85:
                stage = "Flowering & Heading"
            elif das <= 110:
                stage = "Milking & Dough (Grain Filling)"
            else:
                stage = "Maturity & Ripening"
        elif "wheat" in name_lower:
            if das < 0:
                stage = "Seedbed Preparation"
            elif das <= 25:
                stage = "Crown Root Initiation (CRI)"
            elif das <= 50:
                stage = "Tillering & Jointing"
            elif das <= 75:
                stage = "Booting & Heading"
            elif das <= 100:
                stage = "Grain Development"
            else:
                stage = "Ripening & Maturity"
        elif "maize" in name_lower or "corn" in name_lower:
            if das < 0:
                stage = "Tillage & Ridge Preparation"
            elif das <= 15:
                stage = "Emergence & Early Vegetative (V2-V4)"
            elif das <= 45:
                stage = "Knee-High Rapid Growth (V6-V10)"
            elif das <= 65:
                stage = "Tasseling & Silking"
            elif das <= 90:
                stage = "Cob Development & Blister"
            else:
                stage = "Black Layer Physiological Maturity"
        elif "tomato" in name_lower:
            if das < 0:
                stage = "Nursery Solarization & Bed Prep"
            elif das <= 20:
                stage = "Transplanting & Establishment"
            elif das <= 40:
                stage = "Vegetative Branching & Staking"
            elif das <= 60:
                stage = "Flowering & Early Fruit Set"
            elif das <= 80:
                stage = "Fruit Enlargement"
            else:
                stage = "Ripening & Harvesting"
        else:
            # Generic agronomic stage breakdown
            if das < 0:
                stage = "Pre-Planting / Land Prep"
            elif das <= 20:
                stage = "Early Vegetative"
            elif das <= 50:
                stage = "Vegetative & Branching"
            elif das <= 80:
                stage = "Flowering & Reproductive"
            else:
                stage = "Maturity & Harvest"

        return das, stage

    @staticmethod
    async def generate_crop_suggestions(
        db: Session,
        user_id: str,
        farm_id: str,
        crop_id: str,
        field_id: Optional[str] = None,
        planting_date_override: Optional[date] = None,
    ) -> GenerateSuggestionsResponse:
        """Calculate growth-stage activity suggestions using templates, verified against farm ownership."""
        # 1. Verify Farm Ownership
        farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == user_id).first()
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farm not found or you do not have permission to access it.",
            )

        # 2. Verify Crop Ownership in Field Hierarchy
        crop = (
            db.query(Crop)
            .join(Field, Crop.field_id == Field.id)
            .filter(Crop.id == crop_id, Field.farm_id == farm.id)
            .first()
        )
        if not crop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Crop not found within this farm holding.",
            )

        # 3. Determine Planting Date
        actual_planting_date = crop.planting_date or planting_date_override
        if not actual_planting_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Crop '{crop.name}' does not have a recorded planting date. Please provide a planting date to generate growth-stage suggestions.",
            )

        today = date.today()
        das, current_stage = CalendarService.determine_growth_stage(
            planting_date=actual_planting_date,
            current_date=today,
            crop_name=crop.name,
        )

        # 4. Fetch matching activity templates
        templates = ActivityTemplateService.get_templates(db, crop_name=crop.name)

        # 5. Fetch weather context if coordinates available
        daily_weather_forecast = []
        if farm.latitude and farm.longitude:
            try:
                weather_res = await WeatherService.get_weather(farm.latitude, farm.longitude)
                if weather_res and weather_res.forecast_7_day:
                    daily_weather_forecast = weather_res.forecast_7_day
            except Exception as e:
                logger.warning(f"Could not load weather context for suggestions: {e}")

        # 6. Calculate suggested dates and associate weather warnings
        suggestions: List[ActivitySuggestion] = []
        for tmpl in templates:
            calc_date = actual_planting_date + timedelta(days=tmpl.days_after_sowing)
            calc_date_str = calc_date.strftime("%Y-%m-%d")

            # Check weather warning if within 7-day forecast horizon
            weather_warning = None
            for w in daily_weather_forecast:
                if w.date == calc_date_str:
                    if tmpl.category in ("irrigation", "fertilizer") and w.precipitation_sum_mm > 5.0:
                        weather_warning = f"Rain forecast ({w.precipitation_sum_mm:.1f} mm, {w.precipitation_probability_percent}% prob). Consider deferring {tmpl.category}."
                    elif tmpl.is_weather_sensitive and w.temp_max_c > 35.0:
                        weather_warning = f"High heat ({w.temp_max_c:.1f}°C). Execute in early morning."
                    elif tmpl.is_weather_sensitive and w.precipitation_sum_mm > 10.0:
                        weather_warning = f"Heavy rainfall forecast ({w.precipitation_sum_mm:.1f} mm). Field operations likely impeded."
                    break

            suggestions.append(
                ActivitySuggestion(
                    template_id=tmpl.id,
                    title=tmpl.name,
                    category=tmpl.category,
                    description=tmpl.description,
                    growth_stage=tmpl.growth_stage,
                    days_after_sowing=tmpl.days_after_sowing,
                    suggested_date=calc_date_str,
                    priority=tmpl.default_priority,
                    is_weather_sensitive=tmpl.is_weather_sensitive,
                    weather_warning=weather_warning,
                )
            )

        return GenerateSuggestionsResponse(
            farm_id=farm.id,
            field_id=crop.field_id,
            crop_id=crop.id,
            crop_name=crop.name,
            variety=crop.variety,
            planting_date=actual_planting_date.strftime("%Y-%m-%d"),
            days_since_planting=das,
            current_growth_stage=current_stage,
            suggestions=suggestions,
        )
