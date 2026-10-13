import time
import logging
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.schemas.health import HealthResponse, DatabaseHealth

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="System Health & PostGIS Diagnostic",
    description="Inspects backend operational status, PostgreSQL database connectivity, and PostGIS extension installation.",
)
def check_health(db: Session = Depends(get_db)):
    """Check health of the backend, database connection, and PostGIS installation."""
    db_connected = False
    postgis_installed = False
    postgis_version = None
    db_latency_ms = None
    error_msg = None

    start_time = time.perf_counter()
    try:
        # 1. Ping PostgreSQL
        db.execute(text("SELECT 1"))
        db_latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        db_connected = True

        # 2. Check PostGIS extension and version
        postgis_query = text("SELECT PostGIS_Full_Version()")
        result = db.execute(postgis_query).scalar()
        if result:
            postgis_installed = True
            postgis_version = str(result)
        else:
            # Fallback simple check
            check_ext = text("SELECT extversion FROM pg_extension WHERE extname = 'postgis'")
            ver = db.execute(check_ext).scalar()
            if ver:
                postgis_installed = True
                postgis_version = f"PostGIS {ver}"
    except Exception as exc:
        logger.warning(f"Database health check failed: {exc}")
        error_msg = str(exc)
        if db_latency_ms is None:
            db_latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

    # Determine overall status
    if db_connected and postgis_installed:
        overall_status = "healthy"
        http_code = status.HTTP_200_OK
    elif db_connected:
        overall_status = "degraded"
        http_code = status.HTTP_200_OK
    else:
        overall_status = "unhealthy"
        http_code = status.HTTP_503_SERVICE_UNAVAILABLE

    db_health = DatabaseHealth(
        connected=db_connected,
        postgis_installed=postgis_installed,
        postgis_version=postgis_version,
        database_name=settings.POSTGRES_DB,
        latency_ms=db_latency_ms,
        error=error_msg,
    )

    response_data = HealthResponse(
        status=overall_status,
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        database=db_health,
        details={
            "debug": settings.DEBUG,
            "api_prefix": settings.API_V1_STR,
            "docs_url": "/docs",
        },
    )

    if http_code != status.HTTP_200_OK:
        return JSONResponse(status_code=http_code, content=response_data.model_dump(mode="json"))

    return response_data
