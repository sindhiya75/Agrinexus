import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_ml_models_metadata():
    """Verify all 5 ML models and engines report operational metadata."""
    response = client.get("/api/v1/ml/models-metadata")
    assert response.status_code == 200
    data = response.json()
    assert data["services_count"] >= 5
    assert "crop_recommender" in data["models"]
    assert "fertilizer_recommendation" in data["models"]
    assert "irrigation_recommendation" in data["models"]
    assert "yield_predictor" in data["models"]
    assert "disease_classifier" in data["models"]

    # Verify metrics transparency
    crop_info = data["models"]["crop_recommender"]
    assert crop_info["algorithm"] == "RandomForestClassifier"
    assert crop_info["metrics"]["test_accuracy"] > 0.90

def test_crop_recommendation_rice():
    """Test crop recommendation under high rainfall and high humidity conditions."""
    payload = {
        "nitrogen": 85.0,
        "phosphorus": 45.0,
        "potassium": 40.0,
        "temperature": 24.5,
        "humidity": 88.0,
        "ph": 6.5,
        "rainfall": 220.0
    }
    response = client.post("/api/v1/ml/crop-recommendation", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["top_recommendations"]) > 0
    top_crop = data["top_recommendations"][0]
    # Rice is prime under high rainfall > 200mm and high humidity > 80%
    assert top_crop["crop"].lower() in ["rice", "jute", "papaya"]
    assert "Nitrogen (N)" in top_crop["agronomic_factors"]
    assert top_crop["agronomic_factors"]["Nitrogen (N)"]["status"] == "Optimal"

def test_crop_recommendation_cotton():
    """Test crop recommendation under cotton soil and climate conditions."""
    payload = {
        "nitrogen": 120.0,
        "phosphorus": 48.0,
        "potassium": 20.0,
        "temperature": 24.0,
        "humidity": 80.0,
        "ph": 7.0,
        "rainfall": 80.0
    }
    response = client.post("/api/v1/ml/crop-recommendation", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["top_recommendations"]) > 0
    crops = [r["crop"].lower() for r in data["top_recommendations"]]
    assert "cotton" in crops or "maize" in crops

def test_fertilizer_recommendation():
    """Test targeted fertilizer dosages for rice with nutrient deficiency."""
    payload = {
        "crop": "rice",
        "soil_nitrogen": 40.0,
        "soil_phosphorus": 20.0,
        "soil_potassium": 25.0,
        "soil_ph": 6.2,
        "organic_carbon_percent": 0.45,
        "growth_stage": "basal"
    }
    response = client.post("/api/v1/ml/fertilizer-recommendation", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["crop"].lower() == "rice"
    assert len(data["nutrient_deficits"]) == 3
    # Check that DAP, Urea, and MOP are formulated
    fert_names = [f["fertilizer_name"] for f in data["recommended_fertilizers"]]
    assert any("DAP" in name for name in fert_names)
    assert any("Urea" in name for name in fert_names)
    assert any("MOP" in name for name in fert_names)
    assert len(data["organic_amendments"]) > 0

def test_irrigation_recommendation():
    """Test FAO-56 crop water requirement and drip irrigation calculation."""
    payload = {
        "crop": "tomato",
        "growth_stage": "mid_season",
        "area_ha": 2.5,
        "soil_texture": "loam",
        "temperature_c": 30.0,
        "humidity_percent": 55.0,
        "wind_speed_kmh": 14.0,
        "solar_radiation_mj": 20.0,
        "forecast_rainfall_7d_mm": 5.0
    }
    response = client.post("/api/v1/ml/irrigation-recommendation", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["crop"].lower() == "tomato"
    assert data["crop_coefficient_kc"] > 1.0
    assert data["net_irrigation_volume_m3"] > 0
    assert data["recommended_run_time_hours_per_day"] > 0
    assert len(data["water_saving_tips"]) >= 2

def test_yield_prediction():
    """Test Random Forest crop yield regression and confidence bounds."""
    payload = {
        "crop": "maize",
        "area_ha": 3.0,
        "annual_rainfall_mm": 850.0,
        "fertilizer_kg_ha": 160.0,
        "avg_temperature_c": 24.0,
        "soil_ph": 6.5,
        "is_irrigated": True
    }
    response = client.post("/api/v1/ml/yield-prediction", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["crop"].lower() == "maize"
    assert data["predicted_yield_tonnes_per_ha"] > 3.0
    assert data["predicted_total_production_tonnes"] > 9.0
    assert len(data["confidence_interval_90_tonnes_per_ha"]) == 2
    assert data["confidence_interval_90_tonnes_per_ha"][0] <= data["predicted_yield_tonnes_per_ha"] <= data["confidence_interval_90_tonnes_per_ha"][1]
    assert len(data["key_drivers"]) > 0

def test_disease_detection_healthy_leaf():
    """Test image upload and disease classification on synthetic healthy foliage."""
    # Create an in-memory green RGB test image
    img = Image.new("RGB", (200, 200), color=(60, 140, 50))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"file": ("healthy_leaf.jpg", buf, "image/jpeg")}
    data = {"crop_hint": "Tomato"}
    response = client.post("/api/v1/ml/disease-detection", files=files, data=data)
    assert response.status_code == 200
    res = response.json()
    assert res["detected_crop"] == "Tomato"
    assert res["confidence_score"] >= 0.50
    assert "extracted_features_summary" in res
    assert res["extracted_features_summary"]["green_ratio_pct"] > 50.0

def test_disease_detection_invalid_file():
    """Verify 400 rejection for non-image file uploads."""
    files = {"file": ("document.txt", io.BytesIO(b"not an image"), "text/plain")}
    response = client.post("/api/v1/ml/disease-detection", files=files)
    assert response.status_code == 400
    assert "must be a valid image" in response.json()["detail"]
