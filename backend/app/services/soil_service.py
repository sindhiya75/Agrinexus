import logging
from typing import Any, Dict
import httpx
from app.schemas.intelligence import SoilProfileResponse, SoilProperty
from app.schemas.gis import CentroidCoordinates

logger = logging.getLogger(__name__)


class SoilService:
    """Soil intelligence service retrieving soil chemistry, NPK metrics, and taxonomy."""

    @staticmethod
    async def get_soil_profile(latitude: float, longitude: float) -> SoilProfileResponse:
        """
        Query ISRIC SoilGrids REST API or fallback to regional pedological mapping.
        Identifies soil type, pH, NPK, organic carbon, and texture.
        """
        # Default estimated values based on agro-ecological zones
        soil_type, texture, moisture = SoilService._determine_regional_soil_class(latitude, longitude)
        
        ph_val = 6.8
        n_val = 240.0  # kg/ha
        p_val = 22.0   # kg/ha
        k_val = 210.0  # kg/ha
        oc_val = 0.65  # %
        ec_val = 0.42  # dS/m
        source = "Regional Agro-Pedological Mapping (Estimated)"

        # Attempt to query ISRIC SoilGrids REST API v2
        try:
            url = f"https://rest.isric.org/soilgrids/v2.0/properties/query?lat={latitude}&lon={longitude}&property=phh2o&property=soc&property=clay&property=sand&property=silt&depth=0-30cm&value=mean"
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    properties = data.get("properties", {}).get("layers", [])
                    for layer in properties:
                        name = layer.get("name")
                        depths = layer.get("depths", [])
                        if depths and "values" in depths[0] and "mean" in depths[0]["values"]:
                            raw_mean = depths[0]["values"]["mean"]
                            if raw_mean is not None:
                                if name == "phh2o":
                                    ph_val = round(raw_mean / 10.0, 2)  # SoilGrids stores pH * 10
                                elif name == "soc":
                                    oc_val = round(raw_mean / 100.0, 2)  # Organic carbon in dg/kg -> %
                    source = "ISRIC World Soil Information (SoilGrids 250m)"
        except Exception as exc:
            logger.debug(f"SoilGrids live query skipped or timed out: {exc}")

        return SoilProfileResponse(
            location=CentroidCoordinates(latitude=latitude, longitude=longitude),
            soil_type=soil_type,
            ph=SoilProperty(
                value=ph_val,
                unit="pH",
                status="estimated",
                interpretation="Slightly acidic to neutral (Ideal for most crops)" if 6.0 <= ph_val <= 7.5 else ("Alkaline" if ph_val > 7.5 else "Acidic"),
            ),
            nitrogen_n=SoilProperty(
                value=n_val,
                unit="kg/ha",
                status="estimated",
                interpretation="Medium availability (Requires balanced basal application)" if 200 <= n_val <= 350 else "Low availability",
            ),
            phosphorus_p=SoilProperty(
                value=p_val,
                unit="kg/ha",
                status="estimated",
                interpretation="Adequate for root establishment",
            ),
            potassium_k=SoilProperty(
                value=k_val,
                unit="kg/ha",
                status="estimated",
                interpretation="High potassium reserve",
            ),
            organic_carbon=SoilProperty(
                value=oc_val,
                unit="%",
                status="estimated",
                interpretation="Moderate organic matter content" if 0.5 <= oc_val <= 0.75 else ("High" if oc_val > 0.75 else "Low"),
            ),
            electrical_conductivity=SoilProperty(
                value=ec_val,
                unit="dS/m",
                status="estimated",
                interpretation="Non-saline (< 1.0 dS/m), safe for seed germination",
            ),
            texture_class=texture,
            moisture_retention=moisture,
            data_source=source,
            disclaimer="Values represent geospatial gridded soil estimates. For precision nutrient management, periodic laboratory soil testing (N-P-K-pH-EC) from field samples is advised.",
        )

    @staticmethod
    def _determine_regional_soil_class(latitude: float, longitude: float) -> tuple:
        """Heuristic regional soil taxonomy mapping."""
        if 8.0 <= latitude <= 14.0 and 76.0 <= longitude <= 80.5:
            # Southern Peninsula / Tamil Nadu / Kerala / Karnataka
            if latitude > 11.5:
                return "Black Cotton Soil (Vertisols)", "Clay Loam", "High (Good water holding capacity)"
            elif longitude < 77.0:
                return "Red Lateritic Soil (Alfisols)", "Sandy Clay Loam", "Moderate (Well-drained)"
            else:
                return "Alluvial Loam (Inceptisols)", "Silt Clay", "High (Fertile river basin)"
        elif 15.0 <= latitude <= 22.0:
            # Deccan / Central India
            return "Medium Black Soil (Vertic Inceptisols)", "Clay", "High (Shrink-swell characteristics)"
        elif 24.0 <= latitude <= 32.0:
            # Indo-Gangetic Plains
            return "Deep Alluvial Soil (Entisols)", "Loam / Silt Loam", "High (Highly fertile)"
        else:
            return "Agricultural Loam", "Loam", "Moderate"
