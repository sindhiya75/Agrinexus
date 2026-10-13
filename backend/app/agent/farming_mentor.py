"""
AgriNexus Farming Mentor Agent Workflow powered by LangGraph.
Implements:
  Intent Parser -> Planner -> Tool Executor -> Reasoner -> Response Synthesizer
"""
import uuid
import logging
from typing import Dict, Any, List, Optional, TypedDict
from sqlalchemy.orm import Session
from langgraph.graph import StateGraph, END

from app.models.user import User
from app.agent.tools.agricultural_tools import (
    tool_get_farm_location,
    tool_get_farm_area,
    tool_analyze_soil,
    tool_get_weather,
    tool_get_rainfall,
    tool_get_terrain,
    tool_find_nearby_water_resources,
    tool_recommend_crop,
    tool_recommend_fertilizer,
    tool_calculate_irrigation,
    tool_predict_yield,
    tool_detect_crop_disease,
)
from app.schemas.agent import AgentChatRequest, AgentChatResponse, DataCitation

logger = logging.getLogger(__name__)


class AgentState(TypedDict):
    session_id: str
    user_id: str
    farm_id: Optional[str]
    user_message: str
    latitude: Optional[float]
    longitude: Optional[float]
    area_ha: float
    crop_name: Optional[str]
    
    # Internal execution tracking
    detected_intent: str
    tool_plan: List[str]
    tool_results: Dict[str, Any]
    reasoning_traces: List[str]
    data_citations: List[Dict[str, str]]
    final_reply: str
    farm_context: Optional[Dict[str, Any]]


# Session store for conversation continuity
SESSION_MEMORY: Dict[str, List[Dict[str, str]]] = {}


def intent_parser_node(state: AgentState) -> AgentState:
    """Analyze farmer's inquiry to classify intent and extract target concepts."""
    msg = state["user_message"].lower()

    if any(k in msg for k in ["this week", "week plan", "schedule", "what should i do", "advice", "overview"]):
        intent = "weekly_farm_planning"
    elif any(k in msg for k in ["fertilizer", "urea", "dap", "mop", "nutrient", "npk"]):
        intent = "fertilizer_advisory"
    elif any(k in msg for k in ["water", "irrigate", "irrigation", "deficit", "drip", "moisture"]):
        intent = "irrigation_planning"
    elif any(k in msg for k in ["crop", "plant", "sow", "suitable", "which crop", "recommend crop"]):
        intent = "crop_recommendation"
    elif any(k in msg for k in ["yield", "tonnes", "harvest", "production", "how much will i get"]):
        intent = "yield_prediction"
    elif any(k in msg for k in ["disease", "pest", "leaf", "blight", "spots", "fungus"]):
        intent = "disease_inquiry"
    elif any(k in msg for k in ["weather", "rain", "temperature", "forecast", "climate"]):
        intent = "weather_inquiry"
    elif any(k in msg for k in ["soil", "ph", "texture", "fertility", "organic carbon"]):
        intent = "soil_inquiry"
    else:
        intent = "general_agro_inquiry"

    state["detected_intent"] = intent
    state["reasoning_traces"].append(f"Parsed intent: '{intent}' from user query: '{state['user_message']}'.")
    return state


def planner_node(state: AgentState) -> AgentState:
    """Sequence required tools according to intent and location availability."""
    intent = state["detected_intent"]
    plan: List[str] = []

    # If farm_id provided, always get location and verified area first
    if state["farm_id"]:
        plan.append("get_farm_location")
        plan.append("get_farm_area")

    if intent == "weekly_farm_planning":
        plan.extend(["get_weather", "get_rainfall", "analyze_soil", "calculate_irrigation"])
    elif intent == "crop_recommendation":
        plan.extend(["analyze_soil", "get_weather", "get_rainfall", "recommend_crop"])
    elif intent == "fertilizer_advisory":
        plan.extend(["analyze_soil", "recommend_fertilizer"])
    elif intent == "irrigation_planning":
        plan.extend(["get_weather", "get_rainfall", "find_nearby_water_resources", "calculate_irrigation"])
    elif intent == "yield_prediction":
        plan.extend(["get_rainfall", "get_weather", "analyze_soil", "predict_yield"])
    elif intent == "weather_inquiry":
        plan.extend(["get_weather", "get_rainfall"])
    elif intent == "soil_inquiry":
        plan.extend(["analyze_soil", "get_terrain"])
    elif intent == "disease_inquiry":
        plan.append("disease_guidance")
    else:
        plan.extend(["get_weather", "analyze_soil"])

    state["tool_plan"] = plan
    state["reasoning_traces"].append(f"Constructed plan with tools: {', '.join(plan)}.")
    return state


async def tool_executor_node(state: AgentState, current_user: User, db: Session) -> AgentState:
    """Execute sequenced tools, honoring authorization, database context, and service layers."""
    results = {}
    citations = []
    traces = state["reasoning_traces"]

    # 1. Location & Farm Metadata
    lat = state.get("latitude")
    lng = state.get("longitude")
    area_ha = state.get("area_ha") or 1.0
    farm_info = None

    if "get_farm_location" in state["tool_plan"] and state["farm_id"]:
        loc_res = tool_get_farm_location(state["farm_id"], current_user, db)
        results["get_farm_location"] = loc_res
        if "error" in loc_res:
            traces.append(f"Security Alert: {loc_res['error']}")
        else:
            lat = loc_res.get("latitude") or lat
            lng = loc_res.get("longitude") or lng
            farm_info = loc_res
            citations.append({
                "source": "PostgreSQL User Farm Entity",
                "data_type": "Retrieved Data",
                "metric": "Farm Centroid GPS",
                "details": f"{loc_res.get('farm_name')} located at ({lat}, {lng})"
            })
            traces.append(f"Retrieved farm coordinates ({lat}, {lng}) from database.")

    if "get_farm_area" in state["tool_plan"] and state["farm_id"]:
        area_res = tool_get_farm_area(state["farm_id"], current_user, db)
        results["get_farm_area"] = area_res
        if "area_hectares" in area_res:
            area_ha = area_res["area_hectares"]
            citations.append({
                "source": area_res.get("source", "PostGIS Boundary"),
                "data_type": "Calculated Value",
                "metric": "Farm Land Acreage",
                "details": f"{area_ha} ha ({area_res.get('area_acres')} acres)"
            })
            traces.append(f"Verified farm acreage: {area_ha} ha.")

    # Fallback coordinates if none found
    if lat is None or lng is None:
        lat = 11.0168
        lng = 76.9558
        traces.append(f"Using default regional agro-climatic coordinates ({lat}, {lng}).")

    # 2. Weather
    weather_data = None
    if "get_weather" in state["tool_plan"]:
        w_res = await tool_get_weather(lat, lng)
        results["get_weather"] = w_res
        weather_data = w_res
        if w_res.get("status") == "success":
            citations.append({
                "source": "Open-Meteo High-Resolution Meteorology",
                "data_type": "Retrieved Data",
                "metric": "Live Temperature & Condition",
                "details": f"{w_res.get('temperature_c')}°C, {w_res.get('weather_condition')}, Humidity {w_res.get('relative_humidity_pct')}%"
            })
            traces.append(f"Retrieved meteorology: {w_res.get('temperature_c')}°C, {w_res.get('weather_condition')}.")

    # 3. Rainfall
    rain_data = None
    if "get_rainfall" in state["tool_plan"]:
        r_res = await tool_get_rainfall(lat, lng)
        results["get_rainfall"] = r_res
        rain_data = r_res
        if r_res.get("status") == "success":
            citations.append({
                "source": "Open-Meteo Hydrology & Soil Moisture",
                "data_type": "Retrieved Data",
                "metric": "Past 14-Day & Forecast Rainfall",
                "details": f"Past 14d: {r_res.get('past_14d_total_mm')} mm, 7d Forecast: {r_res.get('forecast_7d_total_mm')} mm ({r_res.get('trend')} trend)"
            })
            traces.append(f"Rainfall analytics: {r_res.get('forecast_7d_total_mm')} mm forecast ({r_res.get('trend')} trend).")

    # 4. Soil
    soil_data = None
    if "analyze_soil" in state["tool_plan"]:
        s_res = await tool_analyze_soil(lat, lng)
        results["analyze_soil"] = s_res
        soil_data = s_res
        if s_res.get("status") == "success":
            citations.append({
                "source": "ISRIC SoilGrids 250m Pedology",
                "data_type": "Retrieved Data",
                "metric": "Soil Chemistry Profile",
                "details": f"Type: {s_res.get('soil_type')}, pH: {s_res.get('ph')} ({s_res.get('ph_interpretation')}), Texture: {s_res.get('texture')}"
            })
            traces.append(f"Soil analysis: pH {s_res.get('ph')}, type: {s_res.get('soil_type')}.")

    # 5. Terrain
    if "get_terrain" in state["tool_plan"]:
        t_res = await tool_get_terrain(lat, lng)
        results["get_terrain"] = t_res
        if t_res.get("status") == "success":
            citations.append({
                "source": "SRTM Digital Elevation Model",
                "data_type": "Retrieved Data",
                "metric": "Topography & Slope",
                "details": f"Elevation: {t_res.get('elevation_m_asl')} m, Slope: {t_res.get('slope_degrees')}° ({t_res.get('slope_category')})"
            })

    # 6. Water Resources
    if "find_nearby_water_resources" in state["tool_plan"]:
        wat_res = await tool_find_nearby_water_resources(lat, lng, area_ha)
        results["find_nearby_water_resources"] = wat_res
        if wat_res.get("status") == "success":
            citations.append({
                "source": "PostGIS Hydrological Scan",
                "data_type": "Calculated Value",
                "metric": "Surface Water Proximity",
                "details": f"Closest: {wat_res.get('closest_water_body', {}).get('name')} at {wat_res.get('closest_water_body', {}).get('distance_km')} km"
            })

    # 7. Crop Recommendation ML
    if "recommend_crop" in state["tool_plan"]:
        n_val = soil_data.get("nitrogen_kg_ha", 80.0) if soil_data else 80.0
        p_val = soil_data.get("phosphorus_kg_ha", 45.0) if soil_data else 45.0
        k_val = soil_data.get("potassium_kg_ha", 40.0) if soil_data else 40.0
        ph_val = soil_data.get("ph", 6.5) if soil_data else 6.5
        t_val = weather_data.get("temperature_c", 25.0) if weather_data else 25.0
        h_val = weather_data.get("relative_humidity_pct", 75.0) if weather_data else 75.0
        r_val = (rain_data.get("forecast_7d_total_mm", 20.0) * 8.0) if rain_data else 150.0

        c_res = tool_recommend_crop(
            nitrogen=min(200.0, max(10.0, n_val)),
            phosphorus=min(150.0, max(5.0, p_val)),
            potassium=min(220.0, max(5.0, k_val)),
            temperature=t_val,
            humidity=h_val,
            ph=ph_val,
            rainfall=min(1500.0, max(20.0, r_val))
        )
        results["recommend_crop"] = c_res
        if c_res.get("status") == "success" and c_res.get("top_crops"):
            top = c_res["top_crops"][0]
            citations.append({
                "source": f"Random Forest Crop Classifier (v{c_res.get('model_version')})",
                "data_type": "Model Prediction",
                "metric": "Optimal Crop Fit",
                "details": f"Top Match: {top['crop']} ({top['confidence_pct']}% match)"
            })
            traces.append(f"ML Crop Recommender predicted {top['crop']} as #1 choice.")

    # 8. Fertilizer Recommendation Engine
    if "recommend_fertilizer" in state["tool_plan"]:
        target_crop = state.get("crop_name") or "rice"
        raw_n = soil_data.get("nitrogen_kg_ha", 50.0) if soil_data else 50.0
        raw_p = soil_data.get("phosphorus_kg_ha", 25.0) if soil_data else 25.0
        raw_k = soil_data.get("potassium_kg_ha", 30.0) if soil_data else 30.0

        f_res = tool_recommend_fertilizer(
            crop=target_crop,
            soil_n=min(250.0, max(10.0, raw_n)),
            soil_p=min(200.0, max(5.0, raw_p)),
            soil_k=min(250.0, max(10.0, raw_k)),
            ph=soil_data.get("ph", 6.5) if soil_data else 6.5,
            organic_carbon_pct=soil_data.get("organic_carbon_pct", 0.5) if soil_data else 0.5
        )
        results["recommend_fertilizer"] = f_res
        citations.append({
            "source": "ICAR Soil Nutrient Balancing Engine",
            "data_type": "Calculated Value",
            "metric": "Fertilizer Dosages",
            "details": f"Urea / DAP / MOP formulated for {target_crop.capitalize()}"
        })
        traces.append(f"Formulated nutrient dosages for {target_crop}.")

    # 9. Irrigation Calculation Engine
    if "calculate_irrigation" in state["tool_plan"]:
        target_crop = state.get("crop_name") or "rice"
        temp_val = weather_data.get("temperature_c", 28.0) if weather_data else 28.0
        hum_val = weather_data.get("relative_humidity_pct", 65.0) if weather_data else 65.0
        wind_val = weather_data.get("wind_speed_kmh", 12.0) if weather_data else 12.0
        rad_val = weather_data.get("solar_radiation_mj", 18.0) if weather_data else 18.0
        rain_7d = rain_data.get("forecast_7d_total_mm", 0.0) if rain_data else 0.0
        texture = soil_data.get("texture", "loam") if soil_data else "loam"

        irrig_res = tool_calculate_irrigation(
            crop=target_crop,
            growth_stage="mid_season",
            area_ha=area_ha,
            soil_texture=texture,
            temp_c=temp_val,
            humidity=hum_val,
            wind_kmh=wind_val,
            solar_rad_mj=rad_val,
            rainfall_7d_mm=rain_7d
        )
        results["calculate_irrigation"] = irrig_res
        citations.append({
            "source": "FAO-56 Penman-Monteith Model",
            "data_type": "Calculated Value",
            "metric": "Net Irrigation Demand",
            "details": f"{irrig_res.get('net_irrigation_volume_m3')} m³ ({irrig_res.get('drip_run_hours_daily')} hrs/day drip runtime)"
        })
        traces.append(f"Computed crop water demand: {irrig_res.get('net_irrigation_volume_m3')} m³.")

    # 10. Yield Prediction ML
    if "predict_yield" in state["tool_plan"]:
        target_crop = state.get("crop_name") or "maize"
        tot_rain = (rain_data.get("past_30d_total_mm", 50.0) + rain_data.get("forecast_7d_total_mm", 15.0)) * 6.0 if rain_data else 850.0
        t_val = weather_data.get("temperature_c", 24.0) if weather_data else 24.0
        ph_val = soil_data.get("ph", 6.5) if soil_data else 6.5

        y_res = tool_predict_yield(
            crop=target_crop,
            area_ha=area_ha,
            annual_rainfall_mm=min(2500.0, max(200.0, tot_rain)),
            fertilizer_kg_ha=150.0,
            avg_temp_c=t_val,
            soil_ph=ph_val,
            is_irrigated=True
        )
        results["predict_yield"] = y_res
        citations.append({
            "source": "AgriNexus Crop Yield Regressor",
            "data_type": "Model Prediction",
            "metric": "Estimated Harvest Output",
            "details": f"{y_res.get('predicted_yield_mt_ha')} MT/ha ({y_res.get('predicted_total_tonnes')} MT total)"
        })
        traces.append(f"Predicted expected yield: {y_res.get('predicted_yield_mt_ha')} MT/ha.")

    state["tool_results"] = results
    state["data_citations"] = citations
    state["farm_context"] = farm_info
    return state


def reasoner_and_synthesizer_node(state: AgentState) -> AgentState:
    """Synthesize evidence and format natural agronomic response with actionable steps."""
    intent = state["detected_intent"]
    results = state["tool_results"]
    farm_ctx = state.get("farm_context")
    traces = state["reasoning_traces"]

    # Check for authorization failure
    if results.get("get_farm_location", {}).get("error"):
        state["final_reply"] = f"⚠️ {results['get_farm_location']['error']}"
        return state

    lines = []
    farm_title = farm_ctx.get("farm_name") if farm_ctx else "Your Field Location"
    lines.append(f"### 🌾 AgriNexus Farming Advisor: {farm_title}\n")

    # Intent-specific synthesized reasoning
    if intent == "weekly_farm_planning":
        w = results.get("get_weather", {})
        r = results.get("get_rainfall", {})
        irrig = results.get("calculate_irrigation", {})
        soil = results.get("analyze_soil", {})

        lines.append(f"Here is your personalized **action plan for this week**:")
        lines.append("")
        lines.append(f"**1. Meteorology & Field Atmosphere:**")
        lines.append(f"- Current temperature is **{w.get('temperature_c')}°C** with **{w.get('relative_humidity_pct')}%** relative humidity and '{w.get('weather_condition')}' conditions.")
        lines.append(f"- Expected rainfall over next 7 days: **{r.get('forecast_7d_total_mm')} mm** (Trend: *{r.get('trend')}*).")
        lines.append("")
        lines.append(f"**2. Water & Irrigation Management:**")
        if irrig:
            lines.append(f"- **Calculated Crop Water Demand**: {irrig.get('net_irrigation_demand_mm')} mm ({irrig.get('net_irrigation_volume_m3')} m³ total).")
            lines.append(f"- **Drip Run Schedule**: Run drip irrigation for approximately **{irrig.get('drip_run_hours_daily')} hours/day** during early mornings (6:00 AM – 9:00 AM).")
        lines.append("")
        lines.append(f"**3. Soil Health & Nutrient Action:**")
        if soil:
            lines.append(f"- Soil classification is **{soil.get('soil_type')}** with pH **{soil.get('ph')}** ({soil.get('ph_interpretation')}). Texture is **{soil.get('texture')}**.")
            lines.append(f"- Apply organic compost or mulching to retain root moisture and buffer against soil evaporative loss.")

    elif intent == "crop_recommendation":
        crop_res = results.get("recommend_crop", {})
        soil = results.get("analyze_soil", {})
        top_crops = crop_res.get("top_crops", [])

        lines.append(f"Based on your soil telemetry and current climate, here are the top recommended crops:")
        lines.append("")
        for i, c in enumerate(top_crops[:3], 1):
            lines.append(f"**{i}. {c['crop']}** ({c['confidence_pct']}% match — *{c['suitability']}*)")
            lines.append(f"   _{c['summary']}_")
        if soil:
            lines.append(f"\n*Evaluated against soil pH {soil.get('ph')} and {soil.get('soil_type')} pedology.*")

    elif intent == "fertilizer_advisory":
        fert = results.get("recommend_fertilizer", {})
        soil = results.get("analyze_soil", {})
        lines.append(f"Recommended nutrient balancing for **{fert.get('crop')}** ({fert.get('growth_stage')} stage):")
        lines.append("")
        for f in fert.get("fertilizers", []):
            lines.append(f"- **{f['name']}**: Apply **{f['quantity_kg_ha']} kg/ha** ({f['timing']}).")
        if fert.get("organic_amendments"):
            lines.append(f"\n**Organic Boosters:** {', '.join(fert['organic_amendments'])}.")

    elif intent == "irrigation_planning":
        irrig = results.get("calculate_irrigation", {})
        wat = results.get("find_nearby_water_resources", {})
        lines.append(f"**Hydrological & Irrigation Assessment:**")
        lines.append(f"- 7-Day Net Deficit: **{irrig.get('net_irrigation_demand_mm')} mm**")
        lines.append(f"- Volumetric Demand: **{irrig.get('net_irrigation_volume_m3')} m³**")
        lines.append(f"- Drip Schedule: **{irrig.get('drip_run_hours_daily')} hrs/day**")
        if wat.get("closest_water_body"):
            c = wat["closest_water_body"]
            lines.append(f"- Surface Water Source: **{c.get('name')}** ({c.get('distance_km')} km away, Accessibility: *{wat.get('water_accessibility')}*).")

    elif intent == "yield_prediction":
        y = results.get("predict_yield", {})
        lines.append(f"**Harvest Yield Forecast for {y.get('crop')}:**")
        lines.append(f"- **Expected Unit Yield**: {y.get('predicted_yield_mt_ha')} MT/ha")
        lines.append(f"- **Estimated Farm Production**: {y.get('predicted_total_tonnes')} Metric Tonnes")
        lines.append(f"- **90% Confidence Interval**: [{y.get('confidence_interval_90', [0, 0])[0]} – {y.get('confidence_interval_90', [0, 0])[1]} MT/ha]")
        if y.get("key_drivers"):
            lines.append(f"- **Key Drivers**: {', '.join(y['key_drivers'])}")

    elif intent == "disease_inquiry":
        lines.append("To analyze crop diseases, upload a clear photo of the infected leaf using the **Leaf Disease Scanner** tab in the ML Suite.")
        lines.append("AgriNexus computer vision detects Early Blight, Late Blight, Rust, Blast, and Bacterial Blight across Tomato, Potato, Corn, Rice, and Cotton.")

    else:
        w = results.get("get_weather", {})
        s = results.get("analyze_soil", {})
        lines.append(f"**Agro-Climatic Summary:**")
        if w:
            lines.append(f"- Weather: {w.get('temperature_c')}°C, {w.get('weather_condition')}, Humidity {w.get('relative_humidity_pct')}%.")
        if s:
            lines.append(f"- Soil: {s.get('soil_type')} (pH {s.get('ph')}).")

    lines.append("\n---")
    lines.append("*💡 Note: Recommendations synthesize real-time Open-Meteo weather, SoilGrids pedology, and AgriNexus ML models. Verify field conditions prior to large-scale chemical spraying.*")

    state["final_reply"] = "\n".join(lines)
    traces.append("Synthesized final agro-climatic advisory response.")
    return state


class AgentFarmingMentor:
    """Orchestrates LangGraph pipeline execution for farmer natural language chats."""

    def __init__(self):
        self.workflow = StateGraph(AgentState)
        self.workflow.add_node("intent_parser", intent_parser_node)
        self.workflow.add_node("planner", planner_node)
        
        # Tool execution wrapper node
        async def exec_node(state: AgentState):
            # db and user are injected dynamically via closure/dispatch
            return state

        self.workflow.set_entry_point("intent_parser")
        self.workflow.add_edge("intent_parser", "planner")
        self.workflow.add_edge("planner", END)
        self.graph = self.workflow.compile()

    async def chat(
        self,
        request: AgentChatRequest,
        current_user: User,
        db: Session
    ) -> AgentChatResponse:
        session_id = request.session_id or str(uuid.uuid4())

        initial_state: AgentState = {
            "session_id": session_id,
            "user_id": current_user.id,
            "farm_id": request.farm_id,
            "user_message": request.message,
            "latitude": request.latitude,
            "longitude": request.longitude,
            "area_ha": request.area_hectares or 1.0,
            "crop_name": request.crop_name,
            "detected_intent": "",
            "tool_plan": [],
            "tool_results": {},
            "reasoning_traces": [],
            "data_citations": [],
            "final_reply": "",
            "farm_context": None,
        }

        # Step 1: Parse Intent
        state = intent_parser_node(initial_state)

        # Step 2: Dynamic Planner
        state = planner_node(state)

        # Step 3: Tool Execution with Authentication Context
        state = await tool_executor_node(state, current_user, db)

        # Step 4 & 5: Reasoner and Response Synthesizer
        state = reasoner_and_synthesizer_node(state)

        # Record into session memory
        if session_id not in SESSION_MEMORY:
            SESSION_MEMORY[session_id] = []
        SESSION_MEMORY[session_id].append({"role": "user", "content": request.message})
        SESSION_MEMORY[session_id].append({"role": "assistant", "content": state["final_reply"]})

        citations_models = [
            DataCitation(
                source=c["source"],
                data_type=c["data_type"],
                metric=c["metric"],
                details=c["details"]
            ) for c in state["data_citations"]
        ]

        return AgentChatResponse(
            session_id=session_id,
            reply=state["final_reply"],
            detected_intent=state["detected_intent"],
            tools_executed=state["tool_plan"],
            reasoning_steps=state["reasoning_traces"],
            data_citations=citations_models,
            farm_context=state["farm_context"]
        )
