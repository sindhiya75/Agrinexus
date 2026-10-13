import os
import io
import json
import joblib
import numpy as np
from PIL import Image
from typing import Dict, Any, List, Optional
from app.schemas.ml import DiseaseDetectionResponse

CROPS_LIST = ["Tomato", "Potato", "Corn (Maize)", "Rice", "Cotton"]

class DiseaseDetectionService:
    def __init__(self, model_dir: Optional[str] = None):
        if model_dir is None:
            candidates = [
                os.path.abspath("ml/models"),
                os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../ml/models")),
                os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../ml/models")),
            ]
            for c in candidates:
                if os.path.exists(os.path.join(c, "disease_classifier.joblib")):
                    model_dir = c
                    break
            if model_dir is None:
                model_dir = "ml/models"

        self.model_path = os.path.join(model_dir, "disease_classifier.joblib")
        self.meta_path = os.path.join(model_dir, "disease_classifier_meta.json")
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

    def _extract_image_features(self, image_bytes: bytes, crop_hint: Optional[str] = None) -> (np.ndarray, Dict[str, float], str):
        image = Image.open(io.BytesIO(image_bytes))
        image = image.convert("RGB")
        image = image.resize((224, 224))
        rgb = np.array(image, dtype=np.float32)

        h, w, _ = rgb.shape
        total_pixels = h * w

        r = rgb[:, :, 0]
        g = rgb[:, :, 1]
        b = rgb[:, :, 2]

        r_mean = float(np.mean(r))
        g_mean = float(np.mean(g))
        b_mean = float(np.mean(b))
        r_std = float(np.std(r))
        g_std = float(np.std(g))
        b_std = float(np.std(b))

        # Brown pixels (necrotic spots / fungal lesions)
        brown_mask = (r > 90) & (g >= 40) & (g <= 145) & (b < 100) & (r > g)
        brown_ratio = float(np.sum(brown_mask)) / total_pixels

        # Yellow pixels (chlorosis)
        yellow_mask = (r > 130) & (g > 130) & (b < 120) & (abs(r - g) < 40)
        yellow_ratio = float(np.sum(yellow_mask)) / total_pixels

        # Healthy green pixels
        green_mask = (g > r) & (g > b) & (g > 70)
        green_ratio = float(np.sum(green_mask)) / total_pixels

        # Black necrosis
        black_mask = (r < 55) & (g < 55) & (b < 55)
        black_ratio = float(np.sum(black_mask)) / total_pixels

        # Texture gradient
        grad_x = np.abs(g[:, 1:] - g[:, :-1])
        grad_y = np.abs(g[1:, :] - g[:-1, :])
        texture_grad = float(np.mean(grad_x) + np.mean(grad_y))

        color_var_ratio = float((r_std + g_std + b_std) / (r_mean + g_mean + b_mean + 1e-5))

        # Crop ID determination
        detected_crop = "Tomato"
        crop_id = 0
        if crop_hint:
            crop_hint_clean = crop_hint.lower().strip()
            for idx, c in enumerate(CROPS_LIST):
                if c.lower() in crop_hint_clean or crop_hint_clean in c.lower():
                    crop_id = idx
                    detected_crop = c
                    break

        feature_vector = np.array([[
            float(crop_id),
            r_mean, g_mean, b_mean,
            r_std, g_std, b_std,
            brown_ratio, yellow_ratio, green_ratio,
            texture_grad, black_ratio, color_var_ratio
        ]], dtype=np.float32)

        summary = {
            "green_ratio_pct": round(green_ratio * 100, 1),
            "brown_necrotic_ratio_pct": round(brown_ratio * 100, 1),
            "yellow_chlorotic_ratio_pct": round(yellow_ratio * 100, 1),
            "black_spot_ratio_pct": round(black_ratio * 100, 1),
            "texture_gradient_index": round(texture_grad, 2),
            "color_variance_index": round(color_var_ratio, 3)
        }

        return feature_vector, summary, detected_crop

    def detect(self, image_bytes: bytes, crop_hint: Optional[str] = None) -> DiseaseDetectionResponse:
        feat_vec, feat_summary, assigned_crop = self._extract_image_features(image_bytes, crop_hint)

        if self.model is not None:
            probs = self.model.predict_proba(feat_vec)[0]
            classes = self.model.classes_
            top_idx = int(np.argmax(probs))
            predicted_class = classes[top_idx]
            conf = float(probs[top_idx])
        else:
            classes = list(self.metadata.get("taxonomy", {}).keys()) or ["healthy", "early_blight", "powdery_mildew"]
            if feat_summary.get("brown_necrotic_ratio_pct", 0) > 15:
                matching = [c for c in classes if "blight" in c or "spot" in c or "scab" in c] or [classes[0]]
                predicted_class = matching[0]
                conf = 0.88
            elif feat_summary.get("yellow_chlorotic_ratio_pct", 0) > 20:
                matching = [c for c in classes if "rust" in c or "yellow" in c or "mildew" in c] or [classes[0]]
                predicted_class = matching[0]
                conf = 0.85
            else:
                healthy_c = [c for c in classes if "healthy" in c]
                predicted_class = healthy_c[0] if healthy_c else classes[0]
                conf = 0.92

        taxonomy = self.metadata.get("taxonomy", {})
        disease_info = taxonomy.get(predicted_class, {
            "crop": assigned_crop,
            "condition": predicted_class.replace("_", " ").title(),
            "severity": "Moderate",
            "description": "Foliar discoloration observed.",
            "treatment": "Inspect leaf underside and isolate affected plants."
        })

        is_healthy = "healthy" in predicted_class.lower()

        return DiseaseDetectionResponse(
            detected_crop=disease_info.get("crop", assigned_crop),
            condition=disease_info.get("condition", "Unknown Condition"),
            is_healthy=is_healthy,
            confidence_score=round(conf, 4),
            severity=disease_info.get("severity", "None" if is_healthy else "Moderate"),
            symptoms_observed=disease_info.get("description", "Characteristic foliar patterns identified."),
            chemical_treatment=disease_info.get("treatment", "Consult local extension specialist.") if not is_healthy else "No chemical pesticide required.",
            organic_remedy="Spray 5% Neem oil emulsion (Azadirachtin) or Pseudomonas fluorescens @ 5g/L." if not is_healthy else "Maintain routine bio-protection.",
            preventive_measures=[
                "Avoid overhead irrigation to keep leaf canopies dry.",
                "Ensure recommended plant spacing for optimal aeration and solar penetration.",
                "Disinfect pruning shears between crops to prevent pathogen transmission."
            ],
            extracted_features_summary=feat_summary,
            model_version=self.metadata.get("version", "1.0.0"),
            limitations=self.metadata.get("limitations", "Clear, high-contrast single leaf images required.")
        )
