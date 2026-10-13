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


def get_auth_header(client, email="gis_farmer@agrinexus.ai"):
    client.post("/api/v1/auth/register", json={"email": email, "password": "password123", "full_name": "GIS Farmer"})
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# Sample 4-point polygon around Coimbatore (approx 10-15 hectares)
SAMPLE_POLYGON = {
    "type": "Polygon",
    "coordinates": [
        [
            [76.9550, 11.0150],
            [76.9590, 11.0150],
            [76.9590, 11.0190],
            [76.9550, 11.0190],
            [76.9550, 11.0150]
        ]
    ]
}


def test_calculate_polygon_area_endpoint(client):
    """Test geodesic area, acre, and hectare calculation."""
    res = client.post("/api/v1/gis/calculate-area", json={"boundary_geojson": SAMPLE_POLYGON})
    assert res.status_code == 200
    data = res.json()
    assert data["area_hectares"] > 0
    assert data["area_acres"] > 0
    assert data["perimeter_meters"] > 0
    assert "centroid" in data
    assert 11.0 < data["centroid"]["latitude"] < 11.1
    assert 76.9 < data["centroid"]["longitude"] < 77.0


def test_calculate_polygon_area_invalid(client):
    """Test rejection of malformed polygon."""
    res = client.post("/api/v1/gis/calculate-area", json={"boundary_geojson": {"type": "Polygon", "coordinates": []}})
    assert res.status_code in [400, 422]


def test_water_intelligence_endpoint(client):
    """Test water resources intelligence endpoint."""
    payload = {
        "latitude": 11.0168,
        "longitude": 76.9558,
        "radius_meters": 10000,
    }
    res = client.post("/api/v1/gis/water-intelligence", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "water_bodies" in data
    assert len(data["water_bodies"]) > 0
    assert "water_accessibility" in data
    assert "water_availability" in data
    assert "disclaimer" in data["water_availability"]
    assert "water_requirement_guidance" in data


def test_save_farm_boundary_and_water_intelligence(client):
    """Test saving polygon boundary to a farm and running water intelligence on it."""
    headers = get_auth_header(client)

    # 1. Create Farm
    create_res = client.post(
        "/api/v1/farms/",
        json={"name": "Kovai Agro Plot", "location_name": "Coimbatore"},
        headers=headers,
    )
    farm_id = create_res.json()["id"]

    # 2. Save Boundary
    save_res = client.put(
        f"/api/v1/gis/farms/{farm_id}/boundary",
        json={"boundary_geojson": SAMPLE_POLYGON},
        headers=headers,
    )
    assert save_res.status_code == 200
    updated_farm = save_res.json()
    assert updated_farm["total_area_hectares"] > 0
    assert updated_farm["latitude"] is not None
    assert updated_farm["longitude"] is not None
    assert updated_farm["boundary_geojson"] == SAMPLE_POLYGON

    # 3. Get Farm Water Intelligence
    water_res = client.get(f"/api/v1/gis/farms/{farm_id}/water-intelligence", headers=headers)
    assert water_res.status_code == 200
    water_data = water_res.json()
    assert water_data["water_bodies_found_count"] > 0
    assert "water_accessibility" in water_data
