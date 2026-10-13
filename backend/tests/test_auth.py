import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db
from app.models.user import User

# Test in-memory SQLite database
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


def test_user_registration(client):
    """Test registering a new user."""
    payload = {
        "email": "farmer@agrinexus.ai",
        "password": "strongpassword123",
        "full_name": "Sindhiya Farmer",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "farmer@agrinexus.ai"
    assert data["full_name"] == "Sindhiya Farmer"
    assert "hashed_password" not in data
    assert "id" in data


def test_user_registration_duplicate_email(client):
    """Test duplicate email rejection."""
    payload = {
        "email": "duplicate@agrinexus.ai",
        "password": "password123",
        "full_name": "Test One",
    }
    r1 = client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 201

    r2 = client.post("/api/v1/auth/register", json=payload)
    assert r2.status_code == 400
    assert "already exists" in r2.json()["detail"]


def test_user_login_success_and_profile(client):
    """Test login returning JWT and fetching profile with bearer token."""
    reg_payload = {
        "email": "login@agrinexus.ai",
        "password": "password123",
        "full_name": "Login User",
    }
    client.post("/api/v1/auth/register", json=reg_payload)

    # Login
    login_payload = {
        "email": "login@agrinexus.ai",
        "password": "password123",
    }
    res = client.post("/api/v1/auth/login", json=login_payload)
    assert res.status_code == 200
    token_data = res.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["user"]["email"] == "login@agrinexus.ai"

    access_token = token_data["access_token"]
    refresh_token = token_data["refresh_token"]

    # Fetch /me profile
    headers = {"Authorization": f"Bearer {access_token}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "login@agrinexus.ai"

    # Refresh token
    refresh_res = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_res.status_code == 200
    assert "access_token" in refresh_res.json()


def test_user_login_invalid_password(client):
    """Test login failure with wrong password."""
    reg_payload = {
        "email": "wrongpass@agrinexus.ai",
        "password": "correctpassword",
    }
    client.post("/api/v1/auth/register", json=reg_payload)

    res = client.post("/api/v1/auth/login", json={"email": "wrongpass@agrinexus.ai", "password": "wrongpassword"})
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]


def test_protected_route_without_token(client):
    """Test that unauthorized access to /me returns 401."""
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401
