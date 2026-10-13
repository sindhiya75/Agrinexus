import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from app.main import app
from app.db.session import get_db

client = TestClient(app)


def test_root_endpoint():
    """Test the welcome endpoint returns expected structure."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "AgriNexus AI"
    assert "version" in data
    assert data["docs"] == "/docs"
    assert data["health"] == "/health"


def test_health_endpoint_mock_healthy_postgis():
    """Test /health with a healthy mocked database and PostGIS version."""
    mock_db = MagicMock()
    mock_db.execute.return_value.scalar.return_value = "POSTGIS=\"3.4.0\" [EXTENSION] PGSQL=\"160\""

    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"]["connected"] is True
        assert data["database"]["postgis_installed"] is True
        assert "3.4" in data["database"]["postgis_version"]
    finally:
        app.dependency_overrides.clear()


def test_health_endpoint_mock_db_failure():
    """Test /health when database connection raises an exception."""
    mock_db = MagicMock()
    mock_db.execute.side_effect = Exception("Connection timeout to PostgreSQL")

    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = client.get("/health")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "unhealthy"
        assert data["database"]["connected"] is False
        assert data["database"]["postgis_installed"] is False
        assert "Connection timeout" in data["database"]["error"]
    finally:
        app.dependency_overrides.clear()
