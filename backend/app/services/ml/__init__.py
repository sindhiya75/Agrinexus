from app.services.ml.crop_recommendation_service import CropRecommendationService
from app.services.ml.fertilizer_recommendation_service import FertilizerRecommendationService
from app.services.ml.irrigation_recommendation_service import IrrigationRecommendationService
from app.services.ml.yield_prediction_service import YieldPredictionService
from app.services.ml.disease_detection_service import DiseaseDetectionService

__all__ = [
    "CropRecommendationService",
    "FertilizerRecommendationService",
    "IrrigationRecommendationService",
    "YieldPredictionService",
    "DiseaseDetectionService",
]
