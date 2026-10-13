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


def get_auth_header(client, email, password="password123"):
    client.post("/api/v1/auth/register", json={"email": email, "password": password, "full_name": email})
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_farm_crud_and_isolation(client):
    """Test Farm CRUD and multi-tenant user isolation."""
    # User A setup
    headers_a = get_auth_header(client, "user_a@agrinexus.ai")

    # 1. User A creates Farm A
    farm_payload = {
        "name": "Green Valley Farm",
        "description": "Organic paddy farm",
        "location_name": "Coimbatore, TN",
        "latitude": 11.0168,
        "longitude": 76.9558,
        "total_area_hectares": 15.5,
    }
    create_res = client.post("/api/v1/farms/", json=farm_payload, headers=headers_a)
    assert create_res.status_code == 201
    farm_a = create_res.json()
    assert farm_a["name"] == "Green Valley Farm"
    assert farm_a["total_area_hectares"] == 15.5
    farm_a_id = farm_a["id"]

    # 2. User A lists farms -> should contain Farm A
    list_res_a = client.get("/api/v1/farms/", headers=headers_a)
    assert list_res_a.status_code == 200
    assert len(list_res_a.json()) == 1
    assert list_res_a.json()[0]["id"] == farm_a_id

    # 3. User B setup
    headers_b = get_auth_header(client, "user_b@agrinexus.ai")

    # User B lists farms -> should be empty
    list_res_b = client.get("/api/v1/farms/", headers=headers_b)
    assert list_res_b.status_code == 200
    assert len(list_res_b.json()) == 0

    # User B attempts to access Farm A -> should be 404
    get_res_b = client.get(f"/api/v1/farms/{farm_a_id}", headers=headers_b)
    assert get_res_b.status_code == 404

    # User B attempts to update Farm A -> should be 404
    put_res_b = client.put(f"/api/v1/farms/{farm_a_id}", json={"name": "Hacked Farm"}, headers=headers_b)
    assert put_res_b.status_code == 404

    # User B attempts to delete Farm A -> should be 404
    del_res_b = client.delete(f"/api/v1/farms/{farm_a_id}", headers=headers_b)
    assert del_res_b.status_code == 404

    # 4. User A updates Farm A
    update_payload = {"name": "Updated Green Valley Farm", "total_area_hectares": 18.0}
    put_res_a = client.put(f"/api/v1/farms/{farm_a_id}", json=update_payload, headers=headers_a)
    assert put_res_a.status_code == 200
    assert put_res_a.json()["name"] == "Updated Green Valley Farm"
    assert put_res_a.json()["total_area_hectares"] == 18.0

    # 5. User A retrieves Farm A detail
    detail_res_a = client.get(f"/api/v1/farms/{farm_a_id}", headers=headers_a)
    assert detail_res_a.status_code == 200
    assert detail_res_a.json()["name"] == "Updated Green Valley Farm"
    assert "fields" in detail_res_a.json()

    # 6. User A deletes Farm A
    del_res_a = client.delete(f"/api/v1/farms/{farm_a_id}", headers=headers_a)
    assert del_res_a.status_code == 204

    # Verify deleted
    get_res_deleted = client.get(f"/api/v1/farms/{farm_a_id}", headers=headers_a)
    assert get_res_deleted.status_code == 404
