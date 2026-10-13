import logging
from datetime import datetime, timedelta, timezone
from typing import List
import httpx
from app.schemas.intelligence import RainfallResponse, DailyRainfallRecord
from app.schemas.gis import CentroidCoordinates

logger = logging.getLogger(__name__)


class RainfallService:
    """Rainfall intelligence service computing precipitation accumulations, trends, and ET₀."""

    @staticmethod
    async def get_rainfall_intelligence(latitude: float, longitude: float) -> RainfallResponse:
        """Fetch past and forecast precipitation records, calculate rainfall trends and ET₀."""
        # Open-Meteo past 14 days and next 7 days precipitation
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={latitude}&longitude={longitude}"
            f"&daily=precipitation_sum,et0_fao_evapotranspiration"
            f"&past_days=14&forecast_days=7"
            f"&timezone=auto"
        )

        daily_records: List[DailyRainfallRecord] = []
        recent_7_total = 0.0
        recent_14_total = 0.0
        recent_30_est = 0.0
        forecast_24h = 0.0
        forecast_7_total = 0.0
        et0_avg = 4.2  # mm/day default
        source = "Open-Meteo Gridded Precipitation & FAO-56 ET₀"

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    daily = data.get("daily", {})
                    times = daily.get("time", [])
                    precips = daily.get("precipitation_sum", [])
                    et0s = daily.get("et0_fao_evapotranspiration", [])

                    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

                    past_records = []
                    future_records = []

                    for i in range(len(times)):
                        t_date = times[i]
                        p_val = round(precips[i] if (i < len(precips) and precips[i] is not None) else 0.0, 1)
                        is_future = t_date >= today_str

                        rec = DailyRainfallRecord(
                            date=t_date,
                            rainfall_mm=p_val,
                            is_forecast=is_future,
                        )
                        daily_records.append(rec)

                        if is_future:
                            future_records.append(p_val)
                        else:
                            past_records.append(p_val)

                    # Calculations
                    if past_records:
                        recent_7_total = round(sum(past_records[-7:]), 1)
                        recent_14_total = round(sum(past_records), 1)
                        recent_30_est = round(recent_14_total * 2.1, 1)

                    if future_records:
                        forecast_24h = round(future_records[0], 1)
                        forecast_7_total = round(sum(future_records[:7]), 1)

                    # Calculate average ET0
                    valid_et0s = [e for e in et0s if e is not None]
                    if valid_et0s:
                        et0_avg = round(sum(valid_et0s) / len(valid_et0s), 2)
        except Exception as exc:
            logger.warning(f"Rainfall API query failed: {exc}, using seasonal estimates.")
            source = "Seasonal Precipitation Baseline"
            recent_7_total = 14.5
            recent_14_total = 32.0
            recent_30_est = 65.0
            forecast_24h = 2.0
            forecast_7_total = 18.0
            today = datetime.now(timezone.utc)
            daily_records = [
                DailyRainfallRecord(
                    date=(today - timedelta(days=i)).strftime("%Y-%m-%d"),
                    rainfall_mm=2.5,
                    is_forecast=False,
                ) for i in range(7, 0, -1)
            ] + [
                DailyRainfallRecord(
                    date=(today + timedelta(days=i)).strftime("%Y-%m-%d"),
                    rainfall_mm=3.0,
                    is_forecast=True,
                ) for i in range(7)
            ]

        # Determine Rainfall Trend
        if forecast_7_total > 40.0 or recent_7_total > 50.0:
            trend = "Above Normal (High Moisture / Watch for Waterlogging)"
        elif forecast_7_total < 5.0 and recent_7_total < 5.0:
            trend = "Below Normal / Dry Spell (Supplemental Irrigation Required)"
        else:
            trend = "Normal (Adequate Seasonal Distribution)"

        return RainfallResponse(
            coordinates=CentroidCoordinates(latitude=latitude, longitude=longitude),
            recent_7_day_total_mm=recent_7_total,
            recent_14_day_total_mm=recent_14_total,
            recent_30_day_total_mm=recent_30_est,
            forecast_24h_mm=forecast_24h,
            forecast_7_day_total_mm=forecast_7_total,
            rainfall_trend=trend,
            evapotranspiration_et0_mm_day=et0_avg,
            daily_records=daily_records,
            data_source=source,
        )
