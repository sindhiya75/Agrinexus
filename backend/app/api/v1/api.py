from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    farms,
    fields,
    crops,
    gis,
    soil,
    weather,
    rainfall,
    terrain,
    water,
    farm_analysis,
    ml,
    agent,
)

api_router = APIRouter()

# Health & Diagnostics
api_router.include_router(health.router, tags=["Health & Diagnostics"])

# Authentication & User Management
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Farm Management CRUD
api_router.include_router(farms.router, prefix="/farms", tags=["Farms"])

# Field Management CRUD
api_router.include_router(fields.router, tags=["Fields"])

# Crop Management CRUD
api_router.include_router(crops.router, tags=["Crops"])

# GIS & Spatial Intelligence
api_router.include_router(gis.router, prefix="/gis", tags=["GIS & Water Intelligence"])

# Phase 3 Farm Intelligence Services
api_router.include_router(soil.router, tags=["Soil Intelligence"])
api_router.include_router(weather.router, tags=["Weather Intelligence"])
api_router.include_router(rainfall.router, tags=["Rainfall Intelligence"])
api_router.include_router(terrain.router, tags=["Terrain Intelligence"])
api_router.include_router(water.router, tags=["Water Intelligence"])
api_router.include_router(farm_analysis.router, tags=["Unified Farm Analysis"])

# Phase 4 Machine Learning Intelligence
api_router.include_router(ml.router, tags=["Machine Learning Intelligence"])

# Phase 5 Agent AI Farming Mentor
api_router.include_router(agent.router, tags=["Agent AI Farming Mentor"])
