import os
import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import Optional

from app.schemas.ml import (
    CropRecommendationRequest,
    CropRecommendationResponse,
    FertilizerRecommendationRequest,
    FertilizerRecommendationResponse,
    IrrigationRecommendationRequest,
    IrrigationRecommendationResponse,
    YieldPredictionRequest,
    YieldPredictionResponse,
    DiseaseDetectionResponse,
    AllModelsMetadataResponse,
    ModelInfo
)
from app.services.ml.crop_recommendation_service import CropRecommendationService
from app.services.ml.fertilizer_recommendation_service import FertilizerRecommendationService
from app.services.ml.irrigation_recommendation_service import IrrigationRecommendationService
from app.services.ml.yield_prediction_service import YieldPredictionService
from app.services.ml.disease_detection_service import DiseaseDetectionService

router = APIRouter(prefix="/ml", tags=["Machine Learning Intelligence"])

# Initialize singleton inference service instances
crop_service = CropRecommendationService()
fertilizer_service = FertilizerRecommendationService()
irrigation_service = IrrigationRecommendationService()
yield_service = YieldPredictionService()
disease_service = DiseaseDetectionService()

@router.post(
    "/crop-recommendation",
    response_model=CropRecommendationResponse,
    summary="Predict optimal crops based on soil and climatic features",
    description="Evaluates Nitrogen, Phosphorus, Potassium, Temperature, Humidity, pH, and Rainfall to return ranked crop recommendations with physiological factor explanations."
)
def recommend_crop(payload: CropRecommendationRequest):
    try:
        return crop_service.recommend(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error running crop recommendation inference: {str(e)}"
        )

@router.post(
    "/fertilizer-recommendation",
    response_model=FertilizerRecommendationResponse,
    summary="Calculate crop nutrient deficits and fertilizer dosages",
    description="Analyzes soil N-P-K, pH, and Organic Carbon against target crop requirements to calculate Urea, DAP, MOP, and organic fertilizer dosages."
)
def recommend_fertilizer(payload: FertilizerRecommendationRequest):
    try:
        return fertilizer_service.recommend(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating fertilizer recommendation: {str(e)}"
        )

@router.post(
    "/irrigation-recommendation",
    response_model=IrrigationRecommendationResponse,
    summary="Estimate crop water requirement and irrigation schedule",
    description="Implements FAO-56 Penman-Monteith crop water models (ETc = Kc * ET0) to determine 7-day volumetric irrigation deficit and pump run hours."
)
def recommend_irrigation(payload: IrrigationRecommendationRequest):
    try:
        return irrigation_service.recommend(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating irrigation recommendation: {str(e)}"
        )

@router.post(
    "/yield-prediction",
    response_model=YieldPredictionResponse,
    summary="Predict expected crop harvest yield in MT/ha",
    description="Applies Random Forest regression model on crop, area, seasonal rainfall, fertilizer input, temperature, and irrigation to estimate harvest output with 90% confidence intervals."
)
def predict_yield(payload: YieldPredictionRequest):
    try:
        return yield_service.predict(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing yield prediction model: {str(e)}"
        )

@router.post(
    "/disease-detection",
    response_model=DiseaseDetectionResponse,
    summary="Detect foliar diseases from uploaded leaf image",
    description="Computer vision pipeline that extracts multi-spectral color and necrotic spot morphometry from leaf photos to classify condition and provide immediate remedies."
)
async def detect_leaf_disease(
    file: UploadFile = File(..., description="Crop leaf photo (JPG, PNG, WebP)"),
    crop_hint: Optional[str] = Form(None, description="Optional crop hint (e.g. Tomato, Potato, Corn, Rice, Cotton)")
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a valid image (JPEG, PNG, WebP)."
        )

    try:
        image_bytes = await file.read()
        if len(image_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty."
            )
        return disease_service.detect(image_bytes, crop_hint=crop_hint)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing leaf image: {str(e)}"
        )

@router.get(
    "/models-metadata",
    response_model=AllModelsMetadataResponse,
    summary="Inspect active ML models metadata, performance, and limitations",
    description="Provides transparent introspection into all trained machine learning pipelines, evaluation metrics, features, and agronomic limitations."
)
def get_models_metadata():
    models_info = {}

    # Crop Recommender Meta
    crop_meta = crop_service.metadata
    models_info["crop_recommender"] = ModelInfo(
        model_name=crop_meta.get("model_name", "AgriNexus Crop Recommender"),
        algorithm=crop_meta.get("algorithm", "RandomForestClassifier"),
        version=crop_meta.get("version", "1.0.0"),
        metrics={
            "test_accuracy": crop_meta.get("test_accuracy"),
            "weighted_f1": crop_meta.get("weighted_f1"),
            "cv_accuracy_mean": crop_meta.get("cv_accuracy_mean")
        },
        features_count=len(crop_meta.get("features", [])),
        dataset_source=crop_meta.get("dataset_source", "ICAR/FAO Agricultural Crop Norms"),
        limitations=crop_meta.get("limitations", "Open field assumptions.")
    )

    # Fertilizer Meta
    models_info["fertilizer_recommendation"] = ModelInfo(
        model_name="AgriNexus Soil Nutrient Balancing Engine",
        algorithm="Agronomic Nutrient Deficit (ICAR / FAO Extension Standard)",
        version="1.0.0",
        metrics={"status": "deterministic_expert_system", "supported_crops": 10},
        features_count=5,
        dataset_source="ICAR Recommended Doses of Fertilizers (RDF)",
        limitations="Recommendations apply to average soil textures; micro-fertigation requires tailored electrical conductivity monitoring."
    )

    # Irrigation Meta
    models_info["irrigation_recommendation"] = ModelInfo(
        model_name="AgriNexus FAO-56 Crop Water Balance Engine",
        algorithm="FAO-56 Penman-Monteith (ETc = Kc * ET0)",
        version="1.0.0",
        metrics={"status": "deterministic_hydrological_model", "kc_stages_supported": 4},
        features_count=7,
        dataset_source="FAO Irrigation and Drainage Paper No. 56",
        limitations="Assumes uniform drip emitter discharge."
    )

    # Yield Predictor Meta
    yield_meta = yield_service.metadata
    models_info["yield_predictor"] = ModelInfo(
        model_name=yield_meta.get("model_name", "AgriNexus Crop Yield Predictor"),
        algorithm=yield_meta.get("algorithm", "RandomForestRegressor"),
        version=yield_meta.get("version", "1.0.0"),
        metrics={
            "r2_score": yield_meta.get("r2_score"),
            "mae_mt_ha": yield_meta.get("mae_mt_ha"),
            "rmse_mt_ha": yield_meta.get("rmse_mt_ha")
        },
        features_count=len(yield_meta.get("features", [])),
        dataset_source=yield_meta.get("dataset_source", "FAOSTAT & Agricultural Statistics"),
        limitations=yield_meta.get("limitations", "Historical yield correlations without extreme catastrophic weather events.")
    )

    # Disease Classifier Meta
    disease_meta = disease_service.metadata
    models_info["disease_classifier"] = ModelInfo(
        model_name=disease_meta.get("model_name", "AgriNexus Leaf Disease Computer Vision Classifier"),
        algorithm=disease_meta.get("algorithm", "ExtraTreesClassifier + Multi-Spectral Morphometry"),
        version=disease_meta.get("version", "1.0.0"),
        metrics={
            "test_accuracy": disease_meta.get("test_accuracy"),
            "weighted_f1": disease_meta.get("weighted_f1"),
            "classes_count": len(disease_meta.get("classes", []))
        },
        features_count=len(disease_meta.get("features", [])),
        dataset_source=disease_meta.get("dataset_source", "PlantVillage Benchmark"),
        limitations=disease_meta.get("limitations", "Clear single-leaf images required.")
    )

    return AllModelsMetadataResponse(
        services_count=len(models_info),
        models=models_info
    )
