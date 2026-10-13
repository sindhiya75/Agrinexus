import os
import json
import joblib
import numpy as np
from typing import Dict, Any, List, Optional
from app.schemas.ml import (
    CropRecommendationRequest,
    CropRecommendationResponse,
    RecommendedCrop,
    CropFactorScore
)

class CropRecommendationService:
    def __init__(self, model_dir: Optional[str] = None):
        if model_dir is None:
            # Check relative to cwd or repo root
            candidates = [
                os.path.abspath("ml/models"),
                os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../ml/models")),
                os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../ml/models")),
            ]
            for c in candidates:
                if os.path.exists(os.path.join(c, "crop_recommender.joblib")):
                    model_dir = c
                    break
            if model_dir is None:
                model_dir = "ml/models"

        self.model_path = os.path.join(model_dir, "crop_recommender.joblib")
        self.meta_path = os.path.join(model_dir, "crop_recommender_meta.json")
        self.model = None
        self.metadata = {}
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.meta_path):
            try:
                with open(self.meta_path, "r") as f:
                    self.metadata = json.load(f)
            except Exception:
                self.metadata = {}
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
        except Exception:
            self.model = None

    def _evaluate_factors(self, crop: str, req: CropRecommendationRequest) -> Dict[str, CropFactorScore]:
        profiles = self.metadata.get("crop_profiles", {})
        prof = profiles.get(crop.lower())
        if not prof:
            return {}

        factors = {}
        feature_map = {
            "Nitrogen (N)": (req.nitrogen, prof.get("N", [20, 80]), "kg/ha"),
            "Phosphorus (P)": (req.phosphorus, prof.get("P", [20, 80]), "kg/ha"),
            "Potassium (K)": (req.potassium, prof.get("K", [20, 80]), "kg/ha"),
            "Temperature": (req.temperature, prof.get("temp", [18, 30]), "°C"),
            "Humidity": (req.humidity, prof.get("humidity", [50, 85]), "%"),
            "Soil pH": (req.ph, prof.get("ph", [6.0, 7.5]), ""),
            "Rainfall": (req.rainfall, prof.get("rain", [60, 150]), "mm"),
        }

        for fname, (val, opt_range, unit) in feature_map.items():
            low, high = opt_range
            unit_str = f" {unit}" if unit else ""
            if low <= val <= high:
                status = "Optimal"
                expl = f"Current value ({val}{unit_str}) is within the prime physiological range ({low} - {high}{unit_str})."
            elif val < low:
                status = "Deficient"
                diff = round(low - val, 1)
                expl = f"Current value ({val}{unit_str}) is below the minimum threshold ({low}{unit_str}) by {diff}{unit_str}."
            else:
                status = "Excess"
                diff = round(val - high, 1)
                expl = f"Current value ({val}{unit_str}) exceeds the optimal upper boundary ({high}{unit_str}) by {diff}{unit_str}."

            factors[fname] = CropFactorScore(
                status=status,
                farmer_val=float(val),
                optimal_range=[float(low), float(high)],
                explanation=expl
            )

        return factors

    def recommend(self, req: CropRecommendationRequest, top_k: int = 3) -> CropRecommendationResponse:
        features = np.array([[
            req.nitrogen,
            req.phosphorus,
            req.potassium,
            req.temperature,
            req.humidity,
            req.ph,
            req.rainfall
        ]])

        if self.model is not None:
            probs = self.model.predict_proba(features)[0]
            classes = self.model.classes_
        else:
            classes = self.metadata.get("classes", ["rice", "maize", "chickpea", "cotton", "banana"])
            scores = []
            for c in classes:
                facs = self._evaluate_factors(c, req)
                optimal_c = sum(1 for f in facs.values() if f.status == "Optimal")
                scores.append(optimal_c + 0.1)
            tot = sum(scores) or 1.0
            probs = np.array([s / tot for s in scores])

        # Rank by probability
        ranked_indices = np.argsort(probs)[::-1][:top_k]

        recommendations: List[RecommendedCrop] = []
        for rank, idx in enumerate(ranked_indices):
            crop_name = classes[idx]
            conf = float(probs[idx])
            
            if conf >= 0.35:
                suitability = "Highly Recommended"
            elif conf >= 0.15:
                suitability = "Recommended"
            else:
                suitability = "Moderately Suitable"

            factors = self._evaluate_factors(crop_name, req)
            optimal_count = sum(1 for f in factors.values() if f.status == "Optimal")
            summary = (
                f"{crop_name.capitalize()} shows {round(conf * 100, 1)}% agronomic match. "
                f"{optimal_count} of 7 key environmental parameters fall precisely within ideal vegetative thresholds."
            )

            recommendations.append(RecommendedCrop(
                crop=crop_name.capitalize(),
                confidence_score=round(conf, 4),
                suitability=suitability,
                agronomic_factors=factors,
                summary=summary
            ))

        return CropRecommendationResponse(
            top_recommendations=recommendations,
            analyzed_features={
                "nitrogen": req.nitrogen,
                "phosphorus": req.phosphorus,
                "potassium": req.potassium,
                "temperature": req.temperature,
                "humidity": req.humidity,
                "ph": req.ph,
                "rainfall": req.rainfall,
            },
            model_version=self.metadata.get("version", "1.0.0"),
            dataset_source=self.metadata.get("dataset_source", "ICAR/FAO Agricultural Crop Norms"),
            limitations=self.metadata.get("limitations", "Assumes open-field cultivation.")
        )
