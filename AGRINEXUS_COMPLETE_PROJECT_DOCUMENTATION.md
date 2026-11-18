# AgriNexus AI — End-to-End System Architecture & Complete Feature Guide

**Project Version:** v0.2.0 (Phase 6 Integration Complete)  
**PDF Export:** [`AgriNexus_AI_Complete_Documentation.pdf`](file:///d:/sindhiya/agrinexus/AgriNexus_AI_Complete_Documentation.pdf)  
**Repository Working Directory:** `d:\sindhiya\agrinexus`

---

## 1. Executive Summary & Purpose

**AgriNexus AI** is a precision agronomy platform integrating spatial Geographic Information Systems (GIS), multi-source satellite Earth observation telemetry, machine learning algorithms, and an autonomous conversational AI agent.

### The Problem It Solves
Traditional farming depends heavily on generalized regional weather forecasts, infrequent physical soil testing, and manual heuristics. AgriNexus bridges this gap by providing **hyper-local, field-specific intelligence**:
1. Mapping precise farm boundaries using satellite GIS without on-site surveyor overhead.
2. Ingesting global digital soil pedology (ISRIC SoilGrids v2) and satellite microclimate (Open-Meteo) automatically for any GPS coordinate.
3. Modeling exact crop water loss ($ET_c$) and soil nutrient deficits to eliminate fertilizer waste and water over-extraction.
4. Enabling instant foliar disease identification and organic/chemical curative prescription using computer vision.
5. Providing an autonomous conversational AI Mentor (LangGraph) that verifies each recommendation with data citations.

---

## 2. Complete Technology Stack

| Layer | Technologies Used | Core Responsibilities |
| :--- | :--- | :--- |
| **Frontend Application** | React 18, TypeScript, Vite, Tailwind CSS, React-Leaflet, Lucide Icons | Responsive dashboard, polygon GIS drawing canvas, AI Mentor conversational stream, clean telemetry cards. |
| **Backend REST API** | FastAPI, Python 3.13, Starlette, Uvicorn, Pydantic v2 | High-performance asynchronous REST endpoints, request validation, JWT security, dependency injection, Swagger UI (`/docs`). |
| **Database & GIS** | PostgreSQL 17, PostGIS 3.6.2, SQLAlchemy 2.0, GeoAlchemy2 | Spatial polygon storage (`geometry(Polygon, 4326)`), geodesic area/perimeter computation, multi-tenant user isolation. |
| **Agent AI Engine** | LangGraph, LangChain Core | Multi-step reasoning pipeline, agricultural intent parsing, automated tool orchestration, and data citation tracking. |
| **Machine Learning** | Scikit-Learn 1.7.2, NumPy, SciPy, Pillow, Joblib | Random Forest multi-crop classification, harvest yield regression, foliar pathology image classification. |
| **External Providers** | ISRIC SoilGrids, Open-Meteo, Open-Elevation, Overpass API, Nominatim | Soil chemistry, live microclimate telemetry, 7-day rainfall forecasts, elevation DEM, and surface water proximity. |

---

## 3. End-to-End Feature & Functionality Breakdown

### Module 1: Smart Farm GIS & Spatial Mapping (`SmartFarmMap.tsx`)
- **Interactive Boundary Drafting:** Allows farmers to place coordinate vertices over Esri Satellite, OpenStreetMap, or Topographic basemaps.
- **Geodesic Calculations via PostGIS:** Uses native `ST_Area(geog)` and `ST_Perimeter(geog)` on the WGS84 spheroid to calculate exact area (hectares, acres) and perimeter (km) without flat-plane projection errors.
- **Centroid Calculation:** `ST_Centroid` locates the farm center for downstream telemetry queries.
- **Hydrology Proximity:** Leverages the Overpass API to scan rivers, canals, lakes, and reservoirs within a 10 km radius, rating water accessibility.
- **Global Search:** Powered by Nominatim geocoding to fly to any village, district, or pin code.

### Module 2: Multi-Layer Environmental Intelligence (`FarmAnalysis.tsx`)
Retains 7 functional environmental telemetry layers:
1. **Soil Health:** ISRIC SoilGrids v2 integration pulling pH (in H2O), Nitrogen (N), Phosphorus (P), Potassium (K), Organic Carbon %, and USDA soil texture class (Clay Loam, Sandy Loam, etc.).
2. **Weather Telemetry:** Real-time temperature, feels-like index, relative humidity, wind velocity, and solar radiation from Open-Meteo.
3. **Rainfall Radar & Trends:** Past 7-day and 14-day cumulative rainfall, 7-day forward forecasts, and reference evapotranspiration ($ET_0$).
4. **Terrain Topography:** Open-Elevation DEM data calculating elevation (meters ASL), slope gradient %, natural drainage, and soil erosion risk.
5. **Water Resources:** Hydrological classification and distance to surface water bodies.
6. **Crop Suitability:** Multi-criteria agro-climatic matching for regional crop cycles.
7. **Irrigation Deficit:** Net crop water requirements based on local microclimate.

### Module 3: Autonomous AI Agricultural Mentor (`AIMentor.tsx` & `AgentMentorChat.tsx`)
- **Intent Detection:** Parses questions into agriculture domains (irrigation, fertilizer, disease, weather, crop selection).
- **Tool Calling:** Dynamically calls 6 backend tools:
  - `soil_telemetry_tool`
  - `weather_forecast_tool`
  - `crop_recommendation_tool`
  - `irrigation_calculation_tool`
  - `fertilizer_dosage_tool`
  - `farm_lookup_tool`
- **Data Citations:** Labels data sources as *Retrieved Data*, *Calculated Value*, or *ML Prediction*.
- **Collapsible Reasoning Traces:** Inspectable step-by-step reasoning steps for complete transparency.

### Module 4: Precision ML Agronomy Engines (`MLIntelligenceSuite.tsx`)
- **Crop Recommendation:** 100-estimator Random Forest model predicting optimal crops based on NPK, temperature, humidity, pH, and rainfall (98.4% CV accuracy).
- **Yield Prediction:** Regression model estimating harvest yield per hectare, total tonnage, and 90% confidence intervals.
- **Smart Irrigation (FAO-56):** Calculates daily crop evapotranspiration ($ET_c = K_c \times ET_0$), deducts 7-day effective rainfall, and outputs net water volume ($m^3/ha$) and drip pump runtimes.
- **Fertilizer Advisor:** Computes elemental soil deficits ($\Delta N, \Delta P_2O_5, \Delta K_2O$) and formulates split commercial dosages of Urea (46% N), DAP (18% N, 46% P), and MOP (60% K).

### Module 5: Computer Vision Crop Disease Diagnostics (`DiseaseDetectionPage.tsx`)
- **Image Preprocessing:** Normalizes uploaded leaf photos (JPEG/PNG) using Pillow.
- **Pathology Classification:** Detects foliar conditions (blight, rust, leaf spot, mildew) and assesses infection severity (Early, Moderate, Advanced).
- **Curative Treatment:** Prescribes eco-friendly organic remedies (Neem extract, bio-fungicides) and chemical options (Mancozeb, Azoxystrobin) with dosage guidelines.

### Module 6: Farm & Land Parcel Management (`MyFarms.tsx`)
- **Hierarchical Domain Model:** User $\rightarrow$ Farms $\rightarrow$ Sub-Fields $\rightarrow$ Crops.
- **Zoned Sub-Fields:** Divide parcels into management units (e.g. North Drip Zone, Open Plot).
- **Crop Life Cycles:** Track seed variety, planting dates, growth stages (tillering, flowering), and harvest goals.

### Module 7: Authentication, Settings & Health Diagnostics (`Settings.tsx`, `Header.tsx`)
- **Security:** Standard OAuth2 password bearer tokens with signed JWT (HS256) and Bcrypt password hashing.
- **Health Diagnostics:** Endpoint `/health` monitors database connectivity, PostGIS extension status, and response latency.
- **OpenAPI Integration:** Direct link to interactive Swagger `/docs`.

---

## 4. API Endpoints Summary

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | System status, PostGIS version, DB latency |
| `POST` | `/api/v1/auth/register` | Public | Register new farmer account |
| `POST` | `/api/v1/auth/login` | Public | Login & receive JWT access token |
| `GET/POST`| `/api/v1/farms/` | JWT | List user farms or create a new farm |
| `PUT` | `/api/v1/farms/{id}/boundary`| JWT | Save GeoJSON polygon boundary |
| `GET/POST`| `/api/v1/fields/` | JWT | Sub-field parcel management |
| `GET/POST`| `/api/v1/crops/` | JWT | Crop rotation life cycle management |
| `POST` | `/api/v1/gis/polygon-area` | Public | PostGIS geodesic area & perimeter calculation |
| `POST` | `/api/v1/gis/water-intelligence` | Public | Hydrology water body scanning |
| `GET` | `/api/v1/soil/profile` | Public | ISRIC SoilGrids v2 profile |
| `GET` | `/api/v1/weather/current` | Public | Open-Meteo live microclimate |
| `GET` | `/api/v1/rainfall/historical`| Public | Cumulative rainfall and $ET_0$ |
| `GET` | `/api/v1/terrain/profile` | Public | Elevation, slope, and erosion risk |
| `POST` | `/api/v1/farm-analysis/` | Public/JWT | Unified multi-layer data fusion |
| `POST` | `/api/v1/ml/crop-recommendation` | Public | Random Forest crop prediction |
| `POST` | `/api/v1/ml/yield-prediction` | Public | Crop harvest tonnage prediction |
| `POST` | `/api/v1/ml/irrigation-calculator` | Public | FAO-56 drip irrigation schedule |
| `POST` | `/api/v1/ml/fertilizer-advisor` | Public | Soil nutrient deficit & NPK dosages |
| `POST` | `/api/v1/ml/disease-detection` | Public | Computer vision leaf diagnostics |
| `POST` | `/api/agent/chat` | Public | LangGraph autonomous AI mentor chat |

---

## 5. Verification & Testing Records

- **Backend Pytest Suite:** **33 / 33 PASSED** (Agent, Auth, Farms, Fields, Crops, GIS, Health, Intelligence, ML).
- **Frontend Production Build:** **Exit Code 0** (`tsc && vite build`), bundled in 3.87s, zero TypeScript errors.
- **Database & PostGIS:** PostgreSQL 17 + PostGIS 3.6.2 active and verified locally.
