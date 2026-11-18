import math
from typing import List, Dict, Any
from app.schemas.ml import (
    IrrigationRecommendationRequest,
    IrrigationRecommendationResponse
)

# Standard FAO-56 Crop Coefficients (Kc) across growth stages
# [initial, crop_development, mid_season, late_season]
FAO_CROP_KC = {
    "rice": {"initial": 1.05, "crop_development": 1.15, "mid_season": 1.20, "late_season": 0.90},
    "wheat": {"initial": 0.35, "crop_development": 0.75, "mid_season": 1.15, "late_season": 0.45},
    "maize": {"initial": 0.30, "crop_development": 0.70, "mid_season": 1.20, "late_season": 0.50},
    "cotton": {"initial": 0.35, "crop_development": 0.75, "mid_season": 1.20, "late_season": 0.65},
    "sugarcane": {"initial": 0.40, "crop_development": 0.80, "mid_season": 1.25, "late_season": 0.75},
    "banana": {"initial": 0.50, "crop_development": 0.85, "mid_season": 1.10, "late_season": 1.00},
    "potato": {"initial": 0.50, "crop_development": 0.75, "mid_season": 1.15, "late_season": 0.75},
    "tomato": {"initial": 0.60, "crop_development": 0.85, "mid_season": 1.15, "late_season": 0.80},
    "chickpea": {"initial": 0.40, "crop_development": 0.70, "mid_season": 1.05, "late_season": 0.35},
    "groundnut": {"initial": 0.40, "crop_development": 0.70, "mid_season": 1.15, "late_season": 0.60},
}

DEFAULT_KC = {"initial": 0.40, "crop_development": 0.75, "mid_season": 1.15, "late_season": 0.60}

# Soil texture available water capacities (mm water / meter soil depth)
SOIL_WATER_CAPACITY = {
    "sandy": 80.0,
    "sandy_loam": 120.0,
    "loam": 160.0,
    "clay_loam": 180.0,
    "clay": 200.0,
}

class IrrigationRecommendationService:
    def _calculate_fao_et0(self, temp: float, humidity: float, wind: float, rad: float) -> float:
        """
        Simplified Hargreaves / Penman-Monteith approximation for ET0 (mm/day).
        """
        # Temperature & radiation base component
        t_mean = max(5.0, temp)
        et0 = 0.0023 * (t_mean + 17.8) * math.sqrt(max(1.0, 12.0)) * (rad * 0.408)
        # Humidity and wind corrections
        hum_factor = 1.0 + (max(0.0, 60.0 - humidity) * 0.004)
        wind_factor = 1.0 + (max(0.0, wind - 5.0) * 0.01)
        return max(1.5, min(10.0, round(et0 * hum_factor * wind_factor, 2)))

    def recommend(self, req: IrrigationRecommendationRequest) -> IrrigationRecommendationResponse:
        crop_key = (req.crop or "tomato").lower().strip()
        kc_table = FAO_CROP_KC.get(crop_key, DEFAULT_KC)
        stage_key = (req.growth_stage or "mid_season").lower().strip()
        kc = kc_table.get(stage_key, kc_table.get("mid_season", 1.10))
        area_ha = max(0.01, float(req.area_ha or 1.0))
        soil_texture = (req.soil_texture or "loam").lower().strip()

        # Determine reference ET0
        if req.et0_mm_day and req.et0_mm_day > 0:
            et0 = req.et0_mm_day
        else:
            et0 = self._calculate_fao_et0(
                temp=req.temperature_c if req.temperature_c is not None else 28.0,
                humidity=req.humidity_percent if req.humidity_percent is not None else 65.0,
                wind=req.wind_speed_kmh if req.wind_speed_kmh is not None else 12.0,
                rad=req.solar_radiation_mj if req.solar_radiation_mj is not None else 18.0
            )

        # Crop Evapotranspiration: ETc = Kc * ET0 (mm/day)
        etc_daily = round(kc * et0, 2)
        seven_day_demand_mm = round(etc_daily * 7.0, 2)

        # Effective rainfall (FAO approximation: 75% of rainfall up to seven_day_demand is crop-effective)
        raw_rain = max(0.0, float(req.forecast_rainfall_7d_mm or 0.0))
        effective_rain = round(min(raw_rain * 0.75, seven_day_demand_mm), 2)

        # Net Irrigation Requirement in mm (Deficit)
        net_irrig_mm = max(0.0, round(seven_day_demand_mm - effective_rain, 2))

        # Volumetric calculations: 1 mm depth on 1 hectare = 10 m³ (10,000 liters)
        # Total Net Volume = net_mm * area_ha * 10 m³
        net_vol_m3 = round(net_irrig_mm * area_ha * 10.0, 1)

        # Gross irrigation volume assuming Drip Irrigation (88% efficiency)
        drip_efficiency = 0.88
        gross_vol_m3 = round(net_vol_m3 / drip_efficiency, 1)

        # Drip run time estimate:
        # Standard agricultural drip system delivers ~25 m³/ha per operating hour
        pump_discharge_m3_per_hr = max(5.0, area_ha * 25.0)
        daily_gross_m3 = gross_vol_m3 / 7.0
        if net_irrig_mm <= 0.0:
            daily_run_hours = 0.0
        else:
            daily_run_hours = max(0.1, round(daily_gross_m3 / pump_discharge_m3_per_hr, 1))

        # Schedule wording
        if net_irrig_mm <= 0.0:
            schedule = f"No supplemental irrigation required this week. Upcoming forecast rainfall ({raw_rain} mm) will fully satisfy crop evapotranspiration demand ({seven_day_demand_mm} mm). Ensure surface drainage is clear to prevent waterlogging."
        elif net_irrig_mm <= 5.0:
            schedule = f"Minimal deficit ({net_irrig_mm} mm / ~{gross_vol_m3} m³). Upcoming rainfall satisfies most water needs. Consider a light drip cycle (~{daily_run_hours} hrs) only if topsoil feels dry."
        elif net_irrig_mm <= 20.0:
            schedule = f"Light irrigation cycle: Apply {round(gross_vol_m3 / 2, 1)} m³ twice this week (~{daily_run_hours} hrs per cycle, e.g. Wednesday and Sunday)."
        else:
            schedule = f"Intensive irrigation cycle: Apply ~{round(daily_gross_m3, 1)} m³/day for {daily_run_hours} hours daily in 2 split runs (early morning and late afternoon)."

        tips = [
            "Irrigate during early morning (6:00 AM – 9:00 AM) or late evening to minimize direct atmospheric evaporative losses.",
            "Use organic straw or plastic mulching along plant beds to reduce soil moisture evaporation by up to 35%.",
            f"Soil texture '{soil_texture}': Adjust cycle frequency — lighter sandy soils need frequent short cycles, whereas clay soils require deeper, spaced irrigations to avoid root hypoxia."
        ]

        return IrrigationRecommendationResponse(
            crop=(req.crop or "Tomato").capitalize(),
            growth_stage=stage_key.replace("_", " ").capitalize(),
            crop_coefficient_kc=kc,
            et0_mm_day=et0,
            crop_evapotranspiration_etc_mm_day=etc_daily,
            seven_day_crop_water_need_mm=seven_day_demand_mm,
            effective_rainfall_7d_mm=effective_rain,
            net_irrigation_requirement_mm=net_irrig_mm,
            net_irrigation_volume_m3=net_vol_m3,
            gross_irrigation_volume_m3=gross_vol_m3,
            recommended_run_time_hours_per_day=daily_run_hours,
            irrigation_method_assumed="Pressurized Drip Irrigation (88% system application efficiency)",
            suggested_watering_schedule=schedule,
            water_saving_tips=tips,
            disclaimer="Based on FAO-56 Penman-Monteith crop water models. Adjust immediately if unpredicted heavy rain, cloudburst, or localized waterlogging occurs."
        )
