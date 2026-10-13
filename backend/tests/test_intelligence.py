import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def get_auth_header(client, email="intel_farmer@agrinexus.ai"):
    client.post("/api/v1/auth/register", json={"email": email, "password": "password123", "full_name": "Intel Farmer"})
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_soil_intelligence_endpoint(client):
    """Test soil profile, pH, NPK, and data status flags."""
    res = client.get("/api/v1/soil?latitude=11.0168&longitude=76.9558")
    assert res.status_code == 200
    data = res.json()
    assert "soil_type" in data
    assert "ph" in data
    assert data["ph"]["value"] > 0
    assert data["ph"]["status"] in ["measured", "estimated", "unavailable"]
    assert "nitrogen_n" in data
    assert "phosphorus_p" in data
    assert "potassium_k" in data
    assert "disclaimer" in data


def test_weather_intelligence_endpoint(client):
    """Test current weather and 7-day forecast."""
    res = client.get("/api/v1/weather?latitude=11.0168&longitude=76.9558")
    assert res.status_code == 200
    data = res.json()
    assert "current" in data
    assert "temperature_c" in data["current"]
    assert "humidity_percent" in data["current"]
    assert "forecast_7_day" in data
    assert len(data["forecast_7_day"]) > 0


def test_rainfall_intelligence_endpoint(client):
    """Test rainfall analytics, trends, and ET0."""
    res = client.get("/api/v1/rainfall?latitude=11.0168&longitude=76.9558")
    assert res.status_code == 200
    data = res.json()
    assert "recent_7_day_total_mm" in data
    assert "forecast_7_day_total_mm" in data
    assert "rainfall_trend" in data
    assert "evapotranspiration_et0_mm_day" in data
    assert data["evapotranspiration_et0_mm_day"] > 0


def test_terrain_intelligence_endpoint(client):
    """Test digital elevation, slope, and terrain classification."""
    res = client.get("/api/v1/terrain?latitude=11.0168&longitude=76.9558")
    assert res.status_code == 200
    data = res.json()
    assert "elevation_meters" in data
    assert "slope_degrees" in data
    assert "terrain_classification" in data
    assert "drainage_capacity" in data


def test_water_intelligence_endpoint(client):
    """Test synthesized water resources and irrigation deficit."""
    res = client.get("/api/v1/water?latitude=11.0168&longitude=76.9558&area_hectares=2.5")
    assert res.status_code == 200
    data = res.json()
    assert "water_accessibility_score" in data
    assert 0 <= data["water_accessibility_score"] <= 100
    assert "daily_crop_water_requirement_mm" in data
    assert "weekly_water_requirement_m3_per_ha" in data
    assert "irrigation_status" in data


def test_unified_farm_analysis_coordinates(client):
    """Test unified multi-layer farm analysis by coordinates."""
    res = client.get("/api/v1/farm-analysis?latitude=11.0168&longitude=76.9558&area_hectares=3.0")
    assert res.status_code == 200
    data = res.json()
    assert "soil" in data
    assert "weather" in data
    assert "rainfall" in data
    assert "terrain" in data
    assert "water" in data
    assert "agro_climatic_summary" in data
    assert len(data["agro_climatic_summary"]) > 20


def test_unified_farm_analysis_saved_farm(client):
    """Test unified analysis directly on an authenticated user's farm."""
    headers = get_auth_header(client)

    # Create farm with GPS coordinates
    farm_res = client.post(
        "/api/v1/farms/",
        json={
            "name": "Coimbatore Tech Farm",
            "location_name": "Coimbatore",
            "latitude": 11.0168,
            "longitude": 76.9558,
            "total_area_hectares": 4.5,
        },
        headers=headers,
    )
    farm_id = farm_res.json()["id"]

    # Request analysis
    res = client.get(f"/api/v1/farm-analysis/{farm_id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["farm_id"] == farm_id
    assert data["farm_name"] == "Coimbatore Tech Farm"
    assert data["area_hectares"] == 4.5
    assert "soil" in data
    assert "weather" in data
    assert "rainfall" in data
    assert "terrain" in data
    assert "water" in data
