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


def get_auth_header(client, email="farmer_crops@agrinexus.ai", password="password123"):
    client.post("/api/v1/auth/register", json={"email": email, "password": password, "full_name": "Crop Farmer"})
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_field_and_crop_crud_flow(client):
    """Test full hierarchy: Farm -> Field -> Crop CRUD and Cascade."""
    headers = get_auth_header(client)

    # 1. Create Farm
    farm_res = client.post(
        "/api/v1/farms/",
        json={"name": "Delta Agri Estate", "location_name": "Thanjavur", "total_area_hectares": 20.0},
        headers=headers,
    )
    farm_id = farm_res.json()["id"]

    # 2. Create Field in Farm
    field_payload = {
        "name": "North Field A1",
        "field_type": "open_field",
        "area_hectares": 5.2,
        "soil_type": "Alluvial Loam",
    }
    field_res = client.post(f"/api/v1/farms/{farm_id}/fields", json=field_payload, headers=headers)
    assert field_res.status_code == 201
    field_data = field_res.json()
    assert field_data["name"] == "North Field A1"
    field_id = field_data["id"]

    # 3. List Fields in Farm
    list_fields = client.get(f"/api/v1/farms/{farm_id}/fields", headers=headers)
    assert list_fields.status_code == 200
    assert len(list_fields.json()) == 1

    # 4. Plant Crop in Field
    crop_payload = {
        "name": "Ponni Paddy",
        "variety": "CR 1009",
        "planting_date": "2026-06-15",
        "expected_harvest_date": "2026-10-30",
        "status": "growing",
        "notes": "Healthy growth stage, 2nd fertilizer application complete",
    }
    crop_res = client.post(f"/api/v1/fields/{field_id}/crops", json=crop_payload, headers=headers)
    assert crop_res.status_code == 201
    crop_data = crop_res.json()
    assert crop_data["name"] == "Ponni Paddy"
    assert crop_data["status"] == "growing"
    crop_id = crop_data["id"]

    # 5. List Crops in Field
    list_crops = client.get(f"/api/v1/fields/{field_id}/crops", headers=headers)
    assert list_crops.status_code == 200
    assert len(list_crops.json()) == 1
    assert list_crops.json()[0]["id"] == crop_id

    # 6. Update Crop
    update_crop_res = client.put(
        f"/api/v1/crops/{crop_id}",
        json={"status": "flowering", "notes": "Entering grain filling stage"},
        headers=headers,
    )
    assert update_crop_res.status_code == 200
    assert update_crop_res.json()["status"] == "flowering"

    # 7. Check Farm Detail includes Field and Crop
    farm_detail = client.get(f"/api/v1/farms/{farm_id}", headers=headers)
    assert farm_detail.status_code == 200
    detail_data = farm_detail.json()
    assert len(detail_data["fields"]) == 1
    assert len(detail_data["fields"][0]["crops"]) == 1
    assert detail_data["fields"][0]["crops"][0]["name"] == "Ponni Paddy"

    # 8. Delete Crop
    del_crop_res = client.delete(f"/api/v1/crops/{crop_id}", headers=headers)
    assert del_crop_res.status_code == 204

    # Verify crop deleted
    assert client.get(f"/api/v1/crops/{crop_id}", headers=headers).status_code == 404

    # 9. Delete Field
    del_field_res = client.delete(f"/api/v1/fields/{field_id}", headers=headers)
    assert del_field_res.status_code == 204
    assert client.get(f"/api/v1/fields/{field_id}", headers=headers).status_code == 404
