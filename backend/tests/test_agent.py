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

def test_agent_chat_weekly_planning(client):
    """Test weekly farm plan reasoning flow using agent tools."""
    headers = get_auth_header(client, "farmer_agent@agrinexus.ai")
    
    # Create a farm holding
    farm_res = client.post("/api/v1/farms/", json={
        "name": "Green Valley Demo Farm",
        "location_name": "Coimbatore Rural",
        "latitude": 11.0168,
        "longitude": 76.9558,
        "total_area_hectares": 3.5
    }, headers=headers)
    farm_id = farm_res.json()["id"]

    payload = {
        "message": "What should I do this week for my farm?",
        "farm_id": farm_id,
        "crop_name": "rice"
    }

    response = client.post("/api/agent/chat", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["detected_intent"] == "weekly_farm_planning"
    assert "get_weather" in data["tools_executed"]
    assert "calculate_irrigation" in data["tools_executed"]
    assert len(data["reasoning_steps"]) >= 3
    assert len(data["data_citations"]) >= 2
    assert "action plan for this week" in data["reply"].lower()

def test_agent_chat_crop_recommendation(client):
    """Test crop recommendation intent triggering soil analysis and ML classification."""
    headers = get_auth_header(client, "crop_seeker@agrinexus.ai")
    payload = {
        "message": "Which crops are suitable to plant given my soil?",
        "latitude": 11.0168,
        "longitude": 76.9558
    }
    response = client.post("/api/agent/chat", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["detected_intent"] == "crop_recommendation"
    assert "recommend_crop" in data["tools_executed"]
    assert "analyze_soil" in data["tools_executed"]
    assert any("match" in data["reply"].lower() or "recommended" in data["reply"].lower() for _ in [1])

def test_agent_chat_fertilizer_advisory(client):
    """Test fertilizer advisory calculation."""
    headers = get_auth_header(client, "fert_farmer@agrinexus.ai")
    payload = {
        "message": "How much urea and DAP fertilizer should I apply for my rice crop?",
        "crop_name": "rice",
        "latitude": 11.0168,
        "longitude": 76.9558
    }
    response = client.post("/api/agent/chat", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["detected_intent"] == "fertilizer_advisory"
    assert "recommend_fertilizer" in data["tools_executed"]
    assert "urea" in data["reply"].lower() or "fertilizer" in data["reply"].lower()

def test_agent_unauthorized_farm_access(client):
    """Verify that user A cannot access farm of user B."""
    headers_a = get_auth_header(client, "farmer_a@agrinexus.ai")
    headers_b = get_auth_header(client, "farmer_b@agrinexus.ai")

    # User B creates Farm B
    farm_b_res = client.post("/api/v1/farms/", json={
        "name": "User B Secret Estate",
        "location_name": "Mysore",
        "latitude": 12.0,
        "longitude": 77.0,
        "total_area_hectares": 10.0
    }, headers=headers_b)
    farm_b_id = farm_b_res.json()["id"]

    # User A asks agent to inspect User B's farm
    payload = {
        "message": "Tell me about my farm acreage",
        "farm_id": farm_b_id
    }
    response = client.post("/api/agent/chat", json=payload, headers=headers_a)
    assert response.status_code == 200
    data = response.json()
    # Agent should flag unauthorized access in its response
    assert "unauthorized" in data["reply"].lower() or "permission" in data["reply"].lower()
