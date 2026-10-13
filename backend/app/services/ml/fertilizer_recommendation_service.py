from typing import List, Dict, Any
from app.schemas.ml import (
    FertilizerRecommendationRequest,
    FertilizerRecommendationResponse,
    FertilizerDosage,
    NutrientDeficit
)

# Standard Recommended Doses of Fertilizer (RDF) in kg/ha (N - P2O5 - K2O) according to ICAR / Agricultural Extension Guidelines
CROP_RDF = {
    "rice": {"N": 120.0, "P": 60.0, "K": 40.0, "organic_carbon_target": 0.75},
    "wheat": {"N": 120.0, "P": 60.0, "K": 40.0, "organic_carbon_target": 0.70},
    "maize": {"N": 150.0, "P": 75.0, "K": 50.0, "organic_carbon_target": 0.75},
    "cotton": {"N": 120.0, "P": 60.0, "K": 60.0, "organic_carbon_target": 0.65},
    "sugarcane": {"N": 250.0, "P": 115.0, "K": 115.0, "organic_carbon_target": 0.80},
    "potato": {"N": 180.0, "P": 100.0, "K": 120.0, "organic_carbon_target": 0.80},
    "tomato": {"N": 150.0, "P": 100.0, "K": 100.0, "organic_carbon_target": 0.80},
    "banana": {"N": 200.0, "P": 80.0, "K": 200.0, "organic_carbon_target": 0.85},
    "chickpea": {"N": 25.0, "P": 50.0, "K": 25.0, "organic_carbon_target": 0.60},
    "groundnut": {"N": 25.0, "P": 50.0, "K": 75.0, "organic_carbon_target": 0.65},
}

DEFAULT_RDF = {"N": 100.0, "P": 50.0, "K": 50.0, "organic_carbon_target": 0.70}

class FertilizerRecommendationService:
    def recommend(self, req: FertilizerRecommendationRequest) -> FertilizerRecommendationResponse:
        crop_key = req.crop.lower().strip()
        rdf = CROP_RDF.get(crop_key, DEFAULT_RDF)

        # Calculate Nutrient Deficits (Target requirement minus soil test values, adjusted by soil efficiency factor)
        # Note: Soil test nutrients in kg/ha are partially available to crops in the current season
        n_avail = req.soil_nitrogen * 0.40
        p_avail = req.soil_phosphorus * 0.35
        k_avail = req.soil_potassium * 0.50

        n_deficit = max(0.0, round(rdf["N"] - n_avail, 1))
        p_deficit = max(0.0, round(rdf["P"] - p_avail, 1))
        k_deficit = max(0.0, round(rdf["K"] - k_avail, 1))

        deficits: List[NutrientDeficit] = [
            NutrientDeficit(
                nutrient="Nitrogen (N)",
                current_kg_ha=round(req.soil_nitrogen, 1),
                target_kg_ha=round(rdf["N"], 1),
                deficit_kg_ha=n_deficit,
                status="Deficient (High Need)" if n_deficit > 50 else ("Slight Deficit" if n_deficit > 0 else "Sufficient")
            ),
            NutrientDeficit(
                nutrient="Phosphorus (P₂O₅)",
                current_kg_ha=round(req.soil_phosphorus, 1),
                target_kg_ha=round(rdf["P"], 1),
                deficit_kg_ha=p_deficit,
                status="Deficient (High Need)" if p_deficit > 30 else ("Slight Deficit" if p_deficit > 0 else "Sufficient")
            ),
            NutrientDeficit(
                nutrient="Potassium (K₂O)",
                current_kg_ha=round(req.soil_potassium, 1),
                target_kg_ha=round(rdf["K"], 1),
                deficit_kg_ha=k_deficit,
                status="Deficient (High Need)" if k_deficit > 30 else ("Slight Deficit" if k_deficit > 0 else "Sufficient")
            ),
        ]

        # Formulate Commercial Fertilizer Dosages:
        # Strategy:
        # 1. Supply Phosphorus via DAP (Di-Ammonium Phosphate: 18% N, 46% P2O5)
        # 2. Balance remaining Nitrogen via Urea (46% N)
        # 3. Supply Potassium via MOP (Muriate of Potash: 60% K2O)
        fertilizers: List[FertilizerDosage] = []

        dap_kg = 0.0
        n_supplied_by_dap = 0.0
        if p_deficit > 0:
            dap_kg = round(p_deficit / 0.46, 1)
            n_supplied_by_dap = dap_kg * 0.18
            fertilizers.append(FertilizerDosage(
                fertilizer_name="DAP (Di-Ammonium Phosphate 18-46-0)",
                quantity_kg_ha=dap_kg,
                nutrient_supplied=f"{p_deficit} kg P₂O₅ + {round(n_supplied_by_dap, 1)} kg N",
                timing="Basal (At Sowing / Land Preparation)",
                application_method="Soil placement 5 cm below and beside the seed line."
            ))

        remaining_n_deficit = max(0.0, n_deficit - n_supplied_by_dap)
        if remaining_n_deficit > 0:
            urea_kg = round(remaining_n_deficit / 0.46, 1)
            stage_instruction = "Split: 50% Basal, 25% Tillering/Active Vegetative, 25% Panicle/Flower initiation."
            if req.growth_stage == "vegetative":
                stage_instruction = "Top dressing during active vegetative shoot elongation."
            elif req.growth_stage == "flowering_fruiting":
                stage_instruction = "Light top dressing or foliar spray to prevent premature leaf senescence."

            fertilizers.append(FertilizerDosage(
                fertilizer_name="Urea (46% N)",
                quantity_kg_ha=urea_kg,
                nutrient_supplied=f"{round(remaining_n_deficit, 1)} kg N",
                timing=stage_instruction,
                application_method="Broadcast evenly on moist soil; avoid waterlogged standing water."
            ))

        if k_deficit > 0:
            mop_kg = round(k_deficit / 0.60, 1)
            fertilizers.append(FertilizerDosage(
                fertilizer_name="MOP (Muriate of Potash 0-0-60)",
                quantity_kg_ha=mop_kg,
                nutrient_supplied=f"{k_deficit} kg K₂O",
                timing="50% Basal and 50% at flowering/grain filling stage.",
                application_method="Deep furrow placement to enhance drought and pest resistance."
            ))

        # Organic Amendments
        organic_amendments = [
            "Well-decomposed Farmyard Manure (FYM) or Compost: 5 - 10 tonnes/ha applied 3 weeks prior to planting.",
            "Neem Cake: 250 kg/ha to act as a natural nitrification inhibitor and protect roots from soil nematodes."
        ]
        if req.organic_carbon_percent and req.organic_carbon_percent < 0.5:
            organic_amendments.append(
                "CRITICAL: Soil Organic Carbon is low (<0.5%). Incorporate green manuring (Dhaincha or Sunhemp) to boost microbial biomass."
            )

        # Bio-Fertilizers
        bio_fertilizers = [
            "Azotobacter / Azospirillum seed coating (200g / 10kg seeds) to fix 20-30 kg atmospheric N/ha.",
            "Phosphate Solubilizing Bacteria (PSB) @ 5 kg/ha mixed with compost to unlock fixed soil phosphorus.",
            "VAM (Vesicular Arbuscular Mycorrhiza) @ 12.5 kg/ha to improve root exploration and micronutrient uptake."
        ]

        # Cautions and Soil pH adjustments
        tips = [
            "Always calibrate fertilizer drills to avoid root scorch from localized salt concentrations.",
            "Do not mix Urea with SSP or lime immediately before application to avoid nitrogen volatilization."
        ]
        if req.soil_ph:
            if req.soil_ph < 5.5:
                tips.append("Soil is strongly acidic (pH < 5.5). Apply Agricultural Lime (CaCO₃) @ 1-2 tonnes/ha to prevent aluminium toxicity and phosphorus lockup.")
            elif req.soil_ph > 8.0:
                tips.append("Soil is alkaline (pH > 8.0). Apply Gypsum (CaSO₄) @ 500 kg/ha and emphasize sulfur-containing fertilizers (Ammonium Sulphate).")

        return FertilizerRecommendationResponse(
            crop=req.crop.capitalize(),
            growth_stage=req.growth_stage.replace("_", " ").capitalize(),
            nutrient_deficits=deficits,
            recommended_fertilizers=fertilizers,
            organic_amendments=organic_amendments,
            bio_fertilizers=bio_fertilizers,
            cautions_and_tips=tips,
            disclaimer="Recommendations adhere to standard ICAR/FAO agronomic norms. For certified organic farms or precision micro-drip fertigation, consult your local district Krishi Vigyan Kendra (KVK)."
        )
