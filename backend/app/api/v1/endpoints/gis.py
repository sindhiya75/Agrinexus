from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.farm import Farm
from app.models.field import Field
from app.schemas.farm import FarmResponse
from app.schemas.field import FieldResponse
from app.schemas.gis import (
    PolygonAreaRequest,
    PolygonAreaResponse,
    WaterIntelligenceRequest,
    WaterIntelligenceResponse,
    SaveBoundaryRequest,
)
from app.services.gis_service import GISService

router = APIRouter()


@router.post(
    "/calculate-area",
    response_model=PolygonAreaResponse,
    summary="Calculate Geodesic Area and Boundary Metrics",
    description="Calculates spherical area (hectares, acres, m²), centroid, perimeter, and bounding box from GeoJSON Polygon.",
)
def calculate_polygon_area(payload: PolygonAreaRequest):
    """Compute exact geodesic area and boundary metrics from a GeoJSON polygon."""
    try:
        metrics = GISService.analyze_polygon_geometry(payload.boundary_geojson)
        return metrics
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(val_err),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to calculate polygon area: {exc}",
        )


@router.post(
    "/water-intelligence",
    response_model=WaterIntelligenceResponse,
    summary="Analyze Nearby Water Resources and Hydrological Proximity",
    description="Identifies rivers, canals, reservoirs, and lakes within search radius and evaluates accessibility.",
)
async def analyze_water_resources(payload: WaterIntelligenceRequest):
    """Retrieve nearby surface water resources and evaluate agricultural water accessibility."""
    results = await GISService.fetch_nearby_water_resources(
        latitude=payload.latitude,
        longitude=payload.longitude,
        radius_meters=payload.radius_meters or 10000,
    )
    return results


@router.put(
    "/farms/{farm_id}/boundary",
    response_model=FarmResponse,
    summary="Save Farm Polygon Boundary",
    description="Saves GeoJSON boundary to farm, automatically recalculating area and GPS centroid.",
)
def save_farm_boundary(
    farm_id: str,
    payload: SaveBoundaryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Attach a spatial boundary to a farm and compute its land area."""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found or you do not have permission to modify it.",
        )

    try:
        metrics = GISService.analyze_polygon_geometry(payload.boundary_geojson)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid boundary polygon: {val_err}",
        )

    farm.boundary_geojson = payload.boundary_geojson
    farm.total_area_hectares = metrics["area_hectares"]
    farm.latitude = metrics["centroid"]["latitude"]
    farm.longitude = metrics["centroid"]["longitude"]

    db.add(farm)
    db.commit()
    db.refresh(farm)

    field_count = db.query(Field).filter(Field.farm_id == farm.id).count()
    resp = FarmResponse.model_validate(farm)
    resp.field_count = field_count
    return resp


@router.put(
    "/fields/{field_id}/boundary",
    response_model=FieldResponse,
    summary="Save Field Polygon Boundary",
    description="Saves GeoJSON boundary to a sub-field and updates its area.",
)
def save_field_boundary(
    field_id: str,
    payload: SaveBoundaryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Attach a spatial boundary to a field and compute its land area."""
    field = (
        db.query(Field)
        .join(Farm, Field.farm_id == Farm.id)
        .filter(Field.id == field_id, Farm.user_id == current_user.id)
        .first()
    )
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found or you do not have permission to modify it.",
        )

    try:
        metrics = GISService.analyze_polygon_geometry(payload.boundary_geojson)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid boundary polygon: {val_err}",
        )

    field.boundary_geojson = payload.boundary_geojson
    field.area_hectares = metrics["area_hectares"]

    db.add(field)
    db.commit()
    db.refresh(field)
    return field


@router.get(
    "/farms/{farm_id}/water-intelligence",
    response_model=WaterIntelligenceResponse,
    summary="Water Resource Intelligence for Farm",
)
async def get_farm_water_intelligence(
    farm_id: str,
    radius_meters: int = 10000,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Run hydrological water proximity intelligence directly on a saved farm's location."""
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found or you do not have permission to access it.",
        )

    if not farm.latitude or not farm.longitude:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Farm does not have GPS coordinates or boundary defined. Please set a location first.",
        )

    return await GISService.fetch_nearby_water_resources(
        latitude=farm.latitude,
        longitude=farm.longitude,
        radius_meters=radius_meters,
    )
