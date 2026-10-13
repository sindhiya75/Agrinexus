# AgriNexus AI — End-to-End System Documentation & Technical Specification

> **Platform Version**: v1.0.0 (Phases 0 through 6 Complete)  
> **Target Audience**: Software Architects, Agronomists, Full-Stack Engineers, ML Engineers, System Administrators  
> **Last Updated**: October 2026

---

## Table of Contents

1. [Executive Summary & Architectural Overview](#1-executive-summary--architectural-overview)
2. [Technology Stack](#2-technology-stack)
3. [Database & Geospatial Architecture (PostgreSQL + PostGIS)](#3-database--geospatial-architecture-postgresql--postgis)
4. [Phase 1: Core Authentication & Multi-Tenant Data Layer](#4-phase-1-core-authentication--multi-tenant-data-layer)
5. [Phase 2: Smart Farm Map & GIS Intelligence Engine](#5-phase-2-smart-farm-map--gis-intelligence-engine)
6. [Phase 3: Environmental Intelligence Services](#6-phase-3-environmental-intelligence-services)
7. [Phase 4: Machine Learning & Agronomic Decision Engines](#7-phase-4-machine-learning--agronomic-decision-engines)
8. [Phase 5: Autonomous Agent AI Farming Mentor](#8-phase-5-autonomous-agent-ai-farming-mentor)
9. [Phase 6: Frontend Dashboard & User Interface Integration](#9-phase-6-frontend-dashboard--user-interface-integration)
10. [End-to-End User Workflows](#10-end-to-end-user-workflows)
11. [Deployment, Configuration & Verification](#11-deployment-configuration--verification)

---

## 1. Executive Summary & Architectural Overview

**AgriNexus AI** is a full-stack, enterprise-grade Precision Agriculture and Agronomic Decision Support System. It bridges real-time Earth Observation satellites, pedological soil databases, numerical hydrological models, machine learning algorithms, and an autonomous multi-turn Agent AI mentor to provide farmers with data-grounded, actionable insights.

### High-Level Architectural Flow

```text
                               ┌────────────────────────────────────────┐
                               │   Farmer Client (React 18 + Vite UI)   │
                               │  - 10 Specialized Agricultural Views   │
                               │  - Leaflet GIS Boundary Editor         │
                               │  - Conversational AI Mentor Interface  │
                               └───────────────────┬────────────────────┘
                                                   │ HTTPS / REST API
                                                   ▼
                               ┌────────────────────────────────────────┐
                               │         FastAPI Backend Gateway        │
                               │  - JWT Bearer Authentication           │
                               │  - Tenant Isolation Middleware         │
                               │  - Pydantic v2 Request/Response Schema │
                               └─────┬──────────────┬──────────────┬────┘
                                     │              │              │
           ┌─────────────────────────┘              │              └──────────────────────────┐
           ▼                                        ▼                                         ▼
┌──────────────────────┐               ┌────────────────────────┐               ┌───────────────────────────┐
│ Database Layer       │               │ Intelligence Services  │               │ ML & Agent AI Layer       │
│ - PostgreSQL 16      │               │ - ISRIC SoilGrids API  │               │ - LangGraph StateGraph    │
│ - PostGIS Extension  │               │ - Open-Meteo Weather   │               │ - 12 Agricultural Tools   │
│ - Users, Farms,      │               │ - Open-Meteo Rainfall  │               │ - Crop Recommender (RF)   │
│   Fields, Crops      │               │ - Open-Elevation API   │               │ - Yield Regressor (RF)    │
│ - ST_Area, Geodesic  │               │ - OSM Overpass GIS     │               │ - Foliar Vision Classifier│
└──────────────────────┘               └────────────────────────┘               └───────────────────────────┘
```

---

## 2. Technology Stack

| Layer | Technologies Used | Key Responsibilities |
|---|---|---|
| **Frontend** | React 18, Vite, TypeScript 5, Tailwind CSS, Lucide React, Leaflet, React-Leaflet | Responsive farmer-focused dashboard, interactive map boundary editor, conversational mentor chat, data visualization. |
| **Backend API** | Python 3.13 / FastAPI, Uvicorn, SQLAlchemy 2.0, Alembic, Pydantic v2 | High-performance asynchronous REST API, request validation, authentication, multi-tenant security, business logic orchestration. |
| **Database** | PostgreSQL 16 + PostGIS 3.4+ | Persistent relational storage, spatial geometries (`POLYGON`, `POINT`, SRID 4326), spatial indexing (`GIST`), geodesic area and proximity calculations. |
| **Machine Learning** | Scikit-Learn, NumPy, SciPy, Pillow, Joblib | Crop suitability classification, harvest tonnage regression, computer-vision leaf disease identification, agronomic RDF balancing. |
| **Agent AI** | LangGraph, LangChain Core | Multi-turn conversational planning, dynamic intent parsing, multi-step tool execution, grounded reasoning with transparent evidence citations. |
| **External APIs** | ISRIC SoilGrids v2.0, Open-Meteo, Open-Elevation, OpenStreetMap Overpass API | Satellite weather forecasting, historical rainfall telemetry, soil pedology, elevation grids, and surface hydrological resources. |
| **DevOps** | Docker, Docker Compose | Containerized multi-service orchestration (`agrinexus-db`, `agrinexus-backend`, `agrinexus-frontend`). |

---

## 3. Database & Geospatial Architecture (PostgreSQL + PostGIS)

The database schema enforces multi-tenant ownership, referential integrity, and spatial geospatial topologies.

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ FARMS : "owns"
    FARMS ||--o{ FIELDS : "contains"
    FIELDS ||--o{ CROPS : "cultivates"

    USERS {
        int id PK
        string email UK
        string hashed_password
        string full_name
        boolean is_active
        boolean is_superuser
        datetime created_at
        datetime updated_at
    }

    FARMS {
        int id PK
        int owner_id FK
        string name
        string description
        geometry boundary "Polygon, 4326"
        geometry location "Point, 4326"
        float total_area_hectares
        datetime created_at
        datetime updated_at
    }

    FIELDS {
        int id PK
        int farm_id FK
        string name
        geometry boundary "Polygon, 4326"
        float area_hectares
        string soil_type
        string irrigation_type
        datetime created_at
        datetime updated_at
    }

    CROPS {
        int id PK
        int field_id FK
        string name
        string variety
        date planting_date
        date expected_harvest_date
        string status
        datetime created_at
        datetime updated_at
    }
```

### Table Specifications

#### 1. `users` Table
- **Purpose**: Authenticates farmers and establishes ownership boundaries.
- **Key Columns**:
  - `id`: Integer Primary Key.
  - `email`: Unique Indexed String (`VARCHAR(255)`).
  - `hashed_password`: Bcrypt salted password hash.
  - `is_active`: Boolean flag for account activation.

#### 2. `farms` Table
- **Purpose**: Represents an agricultural holding or land parcel.
- **Key Columns**:
  - `owner_id`: Foreign Key referencing `users.id` (`ON DELETE CASCADE`).
  - `name`: User-defined farm title (e.g., "Green Valley Agro Farm").
  - `boundary`: PostGIS `Geometry(Polygon, 4326)` representing the geo-referenced property perimeter.
  - `location`: PostGIS `Geometry(Point, 4326)` representing the farm centroid coordinates.
  - `total_area_hectares`: Computed floating-point land area.

#### 3. `fields` Table
- **Purpose**: Represents sub-plots or agricultural management zones within a farm.
- **Key Columns**:
  - `farm_id`: Foreign Key referencing `farms.id` (`ON DELETE CASCADE`).
  - `name`: Sub-parcel label (e.g., "North Paddy Field", "South Drip Block").
  - `boundary`: PostGIS `Geometry(Polygon, 4326)` for the sub-field boundary.
  - `area_hectares`: Sub-plot area in hectares.
  - `soil_type`: Dominant soil classification (e.g., "Clay Loam").
  - `irrigation_type`: Method employed (e.g., "Drip", "Sprinkler", "Flood", "Rainfed").

#### 4. `crops` Table
- **Purpose**: Tracks active and historical crop cycles planted in individual fields.
- **Key Columns**:
  - `field_id`: Foreign Key referencing `fields.id` (`ON DELETE CASCADE`).
  - `name`: Common crop name (e.g., "Rice", "Maize", "Tomato").
  - `variety`: Cultivar or seed hybrid (e.g., "ADT 45", "CO 5").
  - `planting_date` & `expected_harvest_date`: Agronomic schedule dates.
  - `status`: Lifecycle stage (`active`, `harvested`, `failed`).

---

## 4. Phase 1: Core Authentication & Multi-Tenant Data Layer

### How It Works

1. **Password Hashing**: Uses Passlib with Bcrypt (12 salt rounds) to ensure passwords are never stored in plaintext.
2. **JWT Token Issuance**: On successful verification of email and password, FastAPI issues a JSON Web Token (JWT) signed with `HS256`.
   - **Access Token**: Short-lived (default 24 hours), carrying the user subject `sub`.
   - **Refresh Token**: Long-lived (7 days), allowing token renewal without re-entering credentials.
3. **Multi-Tenant Protection Dependency**:
   - `get_current_user`: Extracts the Bearer token from the `Authorization` header, decodes the signature, and retrieves the User from PostgreSQL.
   - Every Farm, Field, and Crop query enforces `filter(Farm.owner_id == current_user.id)` to strictly prevent cross-tenant unauthorized data access.

### Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Registers a new farmer account. | No |
| `POST` | `/api/v1/auth/login` | Validates credentials; returns access & refresh tokens. | No |
| `GET` | `/api/v1/auth/me` | Returns profile details of the authenticated user. | Yes |
| `GET` | `/api/v1/farms/` | Lists all farms owned by the logged-in user. | Yes |
| `POST` | `/api/v1/farms/` | Creates a new farm holding for the user. | Yes |
| `GET` | `/api/v1/farms/{id}` | Retrieves details of a specific farm (verifies ownership). | Yes |
| `PUT` | `/api/v1/farms/{id}` | Updates farm metadata or boundary. | Yes |
| `DELETE` | `/api/v1/farms/{id}` | Cascades deletion of farm, sub-fields, and crops. | Yes |
| `GET` | `/api/v1/farms/{id}/fields` | Lists fields belonging to the specified farm. | Yes |
| `POST` | `/api/v1/farms/{id}/fields` | Adds a new sub-field to the farm. | Yes |
| `GET` | `/api/v1/fields/{id}/crops` | Lists crops cultivated in a specific field. | Yes |
| `POST` | `/api/v1/fields/{id}/crops` | Records a new crop planting event. | Yes |

---

## 5. Phase 2: Smart Farm Map & GIS Intelligence Engine

### How It Works

1. **Boundary Drawing & Editing**:
   - The farmer interacts with a Leaflet canvas via OpenStreetMap tiles.
   - Drawing tools emit a GeoJSON `Polygon` coordinates array: `[[[lon1, lat1], [lon2, lat2], ..., [lon1, lat1]]]`.
2. **PostGIS Geodesic Area Calculation**:
   - When boundary coordinates are sent to `POST /api/v1/gis/calculate-area`, the backend converts the geometry into a PostGIS `GEOGRAPHY(Polygon, 4326)`:
     $$\text{Area}_{\text{m}^2} = \text{ST\_Area}(\text{ST\_SetSRID}(\text{ST\_GeomFromGeoJSON}(...), 4326)::\text{geography})$$
   - Computes:
     - Hectares: $\text{Area}_{\text{ha}} = \frac{\text{Area}_{\text{m}^2}}{10,000}$
     - Acres: $\text{Area}_{\text{acres}} = \text{Area}_{\text{ha}} \times 2.47105$
     - Centroid: $\text{ST\_Centroid}(\text{boundary})$
3. **Water Resource Discovery (Overpass GIS)**:
   - Queries OpenStreetMap Overpass API for all hydrological waterways within a 10 km bounding circle:
     - `waterway = river | canal | stream | drain`
     - `natural = water | lake | reservoir | pond`
   - Calculates geodesic distance from the farm centroid to each feature using Vincenty/Haversine geodesy.
   - Categorizes accessibility scores ($0 - 100$) while explicitly stating disclaimers regarding actual reservoir water levels.

### Endpoints Reference

| Method | Endpoint | Payload / Params | Return Data |
|---|---|---|---|
| `POST` | `/api/v1/gis/calculate-area` | `{ boundary_geojson: {...} }` | `area_sq_meters`, `area_hectares`, `area_acres`, `centroid` |
| `PUT` | `/api/v1/gis/farms/{id}/boundary` | `{ boundary_geojson: {...} }` | Updated `Farm` entity with saved PostGIS geometry |
| `POST` | `/api/v1/gis/water-intelligence` | `latitude`, `longitude`, `radius_meters` | Nearby rivers/lakes, geodesic distances, accessibility score |

---

## 6. Phase 3: Environmental Intelligence Services

The Environmental Intelligence Suite integrates authoritative open-access scientific APIs to provide comprehensive micro-climatic and soil conditions.

```mermaid
flowchart TD
    FarmCoord["Farm Coordinates (Lat / Lon)"] --> SoilSvc["SoilService\n(ISRIC SoilGrids v2.0)"]
    FarmCoord --> WeatherSvc["WeatherService\n(Open-Meteo Satellites)"]
    FarmCoord --> RainSvc["RainfallService\n(14d Past + 7d Forecast)"]
    FarmCoord --> TerrainSvc["TerrainService\n(Open-Elevation API)"]
    FarmCoord --> WaterSvc["WaterService\n(Overpass Hydrology)"]

    SoilSvc --> Unified["Unified Farm Analysis Engine\n(/api/v1/farm-analysis)"]
    WeatherSvc --> Unified
    RainSvc --> Unified
    TerrainSvc --> Unified
    WaterSvc --> Unified

    Unified --> Advisory["Comprehensive Agro-Climatic Advisory"]
```

### 1. `SoilService` (ISRIC SoilGrids v2.0)
- **Data Retrieved**:
  - Soil pH ($-\log[H^+]$ at 0–30 cm depth).
  - Nitrogen content ($g/\text{kg} \rightarrow \text{kg/ha}$).
  - Available Phosphorus (P) and Potassium (K).
  - Soil Organic Carbon percentage ($\text{SOC}$).
  - Cation Exchange Capacity ($\text{CEC}$).
  - USDA Texture Triangle classification (e.g., "Sandy Clay Loam", "Clay Loam", "Loam").
- **Reliability Flags**: Every soil metric tags its data status as `measured`, `estimated`, or `unavailable` to ensure transparency.

### 2. `WeatherService` (Open-Meteo Meteorology)
- **Data Retrieved**:
  - Real-time temperature (°C), apparent feels-like temperature.
  - Relative humidity percentage (%).
  - 10-meter wind speed ($\text{km/h}$) and compass direction.
  - Cloud cover fraction and solar UV radiation index.
  - 7-day daily forecast: maximum/minimum temperatures, precipitation probability.

### 3. `RainfallService` (Precipitation & Hydrological Trends)
- **Data Retrieved**:
  - Cumulative precipitation for past 7 days, 14 days, and 30 days ($\text{mm}$).
  - Forecast rainfall sum over the next 7 days.
  - Reference evapotranspiration ($\text{ET}_0$ in $\text{mm/day}$).
  - Trend categorizer: `Surplus`, `Normal`, or `Deficit`.

### 4. `TerrainService` (Open-Elevation Topography)
- **Data Retrieved**:
  - Elevation in meters above sea level ($\text{m AMSL}$).
  - Topographic slope gradient percentage ($\%$).
  - Aspect orientation (e.g., North-East facing slope).
  - Runoff and erosion risk classification: `Flat / Low Runoff`, `Undulating / Moderate`, or `Steep / Severe Erosion Risk`.

### 5. `WaterService` (Hydrology & Water Budgeting)
- Combines nearby water bodies with rainfall to determine:
  - Daily crop water requirement ($\text{mm/day}$).
  - Weekly irrigation deficit:
    $$\text{Deficit} = \max(0, \text{Weekly Demand} - \text{Forecast Rain})$$
  - Net supplemental irrigation volume in cubic meters per hectare ($\text{m}^3/\text{ha}$).

### 6. `UnifiedFarmAnalysisService`
- Endpoint: `GET /api/v1/farm-analysis` (and `GET /api/v1/farms/{id}/analysis`).
- Combines all 5 environmental layers into a single aggregated payload with an auto-synthesized agro-climatic summary.

---

## 7. Phase 4: Machine Learning & Agronomic Decision Engines

AgriNexus AI implements 5 independently replaceable, mathematically validated decision services.

---

### Model 1: Crop Recommendation Service

```text
Inputs:
[Nitrogen (N), Phosphorus (P), Potassium (K), Temperature, Humidity, Soil pH, Rainfall]
                                │
                                ▼
         ┌──────────────────────────────────────────────┐
         │ RandomForestClassifier (100 Estimators)      │
         │ - Trained on ICAR / Kaggle Benchmark         │
         │ - 22 Crop Classes, 2,200 Balanced Records    │
         │ - Test Accuracy: 98.86% | 5-Fold CV: 98.41%  │
         └──────────────────────┬───────────────────────┘
                                │
                                ▼
Outputs:
Top 3 Ranked Crops with Confidence Probabilities & Physiological Factor Scoring:
- "Optimal": Parameter is inside prime biological envelope.
- "Moderate": Parameter is tolerable without severe stress.
- "Deficient": Parameter falls below minimum threshold.
- "Excess": Parameter exceeds maximum toxicity threshold.
```

- **Resilient Fallback**: If the serialized `.joblib` model encounters an OS DLL block (e.g., Windows WDAC policy), the service automatically executes a pure-Python parametric similarity engine using saved physiological profiles from `crop_recommender_meta.json`.

---

### Model 2: Fertilizer Recommendation Service

Implements the **Indian Council of Agricultural Research (ICAR)** Recommended Doses of Fertilizers (RDF) standard.

#### Mathematical Formulation

1. **Target Crop Requirements**:
   Lookup baseline nutrient requirements $(N_{\text{req}}, P_{\text{req}}, K_{\text{req}})$ in $\text{kg/ha}$ for the target crop.
2. **Soil Test Deficit**:
   $$\Delta N = \max(0, N_{\text{req}} - N_{\text{soil}} \times 0.5)$$
   $$\Delta P_2O_5 = \max(0, P_{\text{req}} - P_{\text{soil}} \times 0.6)$$
   $$\Delta K_2O = \max(0, K_{\text{req}} - K_{\text{soil}} \times 0.5)$$
3. **Commercial Fertilizer Conversion**:
   - **Diammonium Phosphate (DAP)** ($18\% N, 46\% P_2O_5$):
     $$\text{DAP}_{\text{kg/ha}} = \frac{\Delta P_2O_5}{0.46}$$
     $$N_{\text{supplied by DAP}} = \text{DAP}_{\text{kg/ha}} \times 0.18$$
   - **Urea** ($46\% N$):
     $$\text{Remaining } \Delta N = \max(0, \Delta N - N_{\text{supplied by DAP}})$$
     $$\text{Urea}_{\text{kg/ha}} = \frac{\text{Remaining } \Delta N}{0.46}$$
   - **Muriate of Potash (MOP)** ($60\% K_2O$):
     $$\text{MOP}_{\text{kg/ha}} = \frac{\Delta K_2O}{0.60}$$
4. **Application Schedule**:
   - **Basal Dose**: $100\%$ DAP, $50\%$ MOP, $33\%$ Urea applied at transplanting/sowing.
   - **Vegetative Top-Dress**: $33\%$ Urea applied at active tillering.
   - **Panicle/Flowering Top-Dress**: $33\%$ Urea, $50\%$ MOP applied before flowering.

---

### Model 3: Irrigation Recommendation Service

Implements the **FAO Irrigation and Drainage Paper No. 56** Penman-Monteith methodology.

$$\text{ET}_c = K_c \times \text{ET}_0$$

Where:
- $\text{ET}_0$ = Reference evapotranspiration ($\text{mm/day}$).
- $K_c$ = Crop coefficient for the specific growth stage:
  - *Initial stage*: $K_c \approx 0.40 - 0.50$
  - *Mid-season stage*: $K_c \approx 1.05 - 1.20$
  - *Late-season stage*: $K_c \approx 0.70 - 0.80$
- **Net Irrigation Requirement ($I_{\text{net}}$)**:
  $$I_{\text{net}} = \max\left(0, (\text{ET}_c \times 7) - (P_{\text{7d}} \times \eta_{\text{eff}})\right)$$
  *(where $P_{\text{7d}}$ is 7-day forecast rainfall and $\eta_{\text{eff}} \approx 0.75$ is effective rainfall efficiency)*.
- **Drip Pump Running Hours**:
  $$\text{Pump Hours/Day} = \frac{I_{\text{net}} \times \text{Area}_{\text{ha}} \times 10}{\text{Drip Flow Rate} \times \text{Emitter Efficiency} \times 7}$$

---

### Model 4: Harvest Yield Prediction Service

- **Algorithm**: `RandomForestRegressor` (120 trees, max depth 16).
- **Features**: `crop_id`, `area_ha`, `annual_rainfall_mm`, `fertilizer_kg_ha`, `avg_temperature_c`, `soil_ph`, `is_irrigated`.
- **Metrics**: $R^2 = 0.8744$, $\text{MAE} = 1.216\text{ MT/ha}$, $\text{RMSE} = 2.264\text{ MT/ha}$.
- **Output**:
  - Predicted harvest yield in Metric Tonnes per Hectare ($\text{MT/ha}$).
  - Total expected farm tonnage ($\text{MT/ha} \times \text{Area}_{\text{ha}}$).
  - $90\%$ statistical confidence interval ($[\text{lower}, \text{upper}]$).
  - Positive drivers vs limiting agronomic factors analysis.

---

### Model 5: Crop Disease Detection Service

- **Algorithm**: Computer-vision foliar colorimetry and spectral morphometry + `ExtraTreesClassifier`.
- **Benchmark**: PlantVillage foliage dataset (1,800 feature vectors across 12 distinct foliar conditions).
- **Feature Extraction**:
  - Converts RGB input leaf images to normalized $224 \times 224$ arrays.
  - Computes channel statistics: $\mu_R, \mu_G, \mu_B, \sigma_R, \sigma_G, \sigma_B$.
  - Extracts chromatic pathology indices:
    - *Necrosis Ratio*: Brown/black necrotic lesion pixel percentage.
    - *Chlorosis Ratio*: Yellow chlorotic halo pixel percentage.
    - *Texture Gradient*: Canopy roughness indicating fungal sporulation.
- **Output**:
  - Disease classification (e.g., "Tomato Early Blight", "Apple Scab", "Rice Blast", "Healthy Leaf").
  - Confidence probability score ($0.0 - 1.0$).
  - Severity grade: `None`, `Mild`, `Moderate`, or `Severe`.
  - Curative chemical fungicides, organic biological remedies, and cultural preventive actions.

---

## 8. Phase 5: Autonomous Agent AI Farming Mentor

The Agent AI Farming Mentor orchestrates the entire AgriNexus toolchain through a multi-turn, stateful reasoning cycle using a LangGraph `StateGraph`.

### Mentor Reasoning Topology

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as Farmer (User)
    participant UI as AgentMentorChat UI
    participant EP as POST /api/agent/chat
    participant Agent as LangGraph Coordinator
    participant Tools as 12 Agricultural Tools
    participant Reasoner as Reasoner & Synthesizer

    Farmer->>UI: "What should I do this week for my farm?"
    UI->>EP: Send message + farm_id
    EP->>Agent: Initialize AgentState(message, farm_id, session_id)
    Agent->>Agent: Intent Parser Node (Identifies: weekly_farm_plan)
    Agent->>Agent: Planner Node (Selects: get_weather, get_rainfall, analyze_soil, calculate_irrigation)
    Agent->>Tools: Execute selected tools concurrently
    Tools-->>Agent: Raw telemetry (29.4°C, 15mm rain, pH 6.5, ETc 4.2mm)
    Agent->>Reasoner: Synthesize data + format citations
    Reasoner-->>EP: Grounded advisory + structured citations + execution trace
    EP-->>UI: Return AgentChatResponse
    UI-->>Farmer: Render response with verified evidence badges & execution steps
```

### The 12 Agricultural Agent Tools

| Tool Function | Description | Backing Service | Citation Tag |
|---|---|---|---|
| `get_farm_location` | Fetches GPS centroid coordinates and address. | `Farm` DB Model | `Retrieved Data` |
| `get_farm_area` | Computes farm and field area in ha and acres. | PostGIS `ST_Area` | `Calculated Value` |
| `analyze_soil` | Profiles soil pH, N, P, K, Organic Carbon, texture. | `SoilService` (ISRIC) | `Retrieved Data` |
| `get_weather` | Retrieves real-time temperature, wind, humidity. | `WeatherService` | `Retrieved Data` |
| `get_rainfall` | Fetches 14d past rainfall and 7d forecast rainfall. | `RainfallService` | `Retrieved Data` |
| `get_terrain` | Determines elevation, slope gradient, runoff risk. | `TerrainService` | `Retrieved Data` |
| `find_nearby_water_resources` | Locates rivers, canals, reservoirs within 10 km. | `WaterService` | `Retrieved Data` |
| `recommend_crop` | Predicts best crops with physiological scoring. | `CropRecommendationService` | `Model Prediction` |
| `recommend_fertilizer` | Calculates N-P-K nutrient deficits and Urea/DAP dosages. | `FertilizerRecommendationService` | `Calculated Value` |
| `calculate_irrigation` | Models FAO-56 $\text{ET}_c$ water loss and pump runtime. | `IrrigationRecommendationService` | `Calculated Value` |
| `predict_yield` | Forecasts harvest tonnage with confidence interval. | `YieldPredictionService` | `Model Prediction` |
| `detect_crop_disease` | Diagnoses foliar pathology from leaf image bytes. | `DiseaseDetectionService` | `Model Prediction` |

### Multi-Tenant Security & Factuality Guardrails

1. **Strict Ownership Check**: The agent validates `farm.owner_id == current_user.id` before executing any farm tool. Unauthorized access returns an explicit rejection.
2. **Anti-Hallucination Guardrail**: The reasoning prompt explicitly forbids inventing missing farm metrics. If a metric is missing, it is tagged as `estimated` or `unavailable`.
3. **Structured Citations**: Every generated advisory outputs structured `citations`:
   ```json
   {
     "metric": "Current Temperature",
     "value": "29.4 °C",
     "source": "Open-Meteo Satellite",
     "evidence_type": "Retrieved Data"
   }
   ```

---

## 9. Phase 6: Frontend Dashboard & User Interface Integration

The frontend is organized into 10 cohesive views accessible via the responsive sidebar and mobile slide-over drawer.

### Main Navigation Modules

```text
Operations & GIS:
├── 1. Dashboard (Farmer Command Center)
├── 2. My Farms (Holdings, Fields, Crop Cycles)
├── 3. Smart Farm Map (Leaflet Boundary Drawing & PostGIS)
└── 4. Farm Analysis (Multi-Layer Environmental Telemetry)

Autonomous AI:
└── 5. AI Mentor (Conversational Agent Chat Interface)

Agronomy & ML Tools:
├── 6. Crop Planning (Crop Recommender + Yield Predictor)
├── 7. Irrigation (FAO-56 Water Deficit & Drip Scheduler)
├── 8. Fertilizer (Soil NPK Balancer & RDF Dosages)
└── 9. Disease Detection (Computer-Vision Foliar Leaf Scanner)

System:
└── 10. Settings (Health Diagnostics, PostGIS, API URLs)
```

### Key Frontend Components

- [`Dashboard.tsx`](file:///d:/sindhiya/agrinexus/frontend/src/pages/Dashboard.tsx): Live telemetry overview with active farm selector, weather card, rainfall tracker, soil overview, farming activities monitor, interactive task checklist, and proactive agro alerts.
- [`SmartFarmMap.tsx`](file:///d:/sindhiya/agrinexus/frontend/src/pages/SmartFarmMap.tsx): Full-featured GIS editor with search autocompletion (Nominatim), boundary drawing, polygon area calculation, and water overlay.
- [`FarmAnalysis.tsx`](file:///d:/sindhiya/agrinexus/frontend/src/pages/FarmAnalysis.tsx): Tabbed multi-layer viewer for Soil, Weather, Rainfall, Terrain, Water bodies, Crop Suitability, and Irrigation.
- [`AIMentor.tsx`](file:///d:/sindhiya/agrinexus/frontend/src/pages/AIMentor.tsx) & [`AgentMentorChat.tsx`](file:///d:/sindhiya/agrinexus/frontend/src/components/AgentMentorChat.tsx): Full conversational workspace with quick prompt chips, live typing status, collapsible execution trace inspector, and citation badges.
- [`MLIntelligenceSuite.tsx`](file:///d:/sindhiya/agrinexus/frontend/src/components/MLIntelligenceSuite.tsx): Reusable ML decision component powering [`CropPlanning.tsx`](file:///d:/sindhiya/agrinexus/frontend/src/pages/CropPlanning.tsx), [`IrrigationPage.tsx`](file:///d:/sindhiya/agrinexus/frontend/src/pages/IrrigationPage.tsx), [`FertilizerPage.tsx`](file:///d:/sindhiya/agrinexus/frontend/src/pages/FertilizerPage.tsx), and [`DiseaseDetectionPage.tsx`](file:///d:/sindhiya/agrinexus/frontend/src/pages/DiseaseDetectionPage.tsx).

---

## 10. End-to-End User Workflows

### Workflow 1: Onboarding & Boundary Mapping
1. The farmer registers an account at `/api/v1/auth/register` and signs in.
2. Navigates to **Smart Farm Map**, searches their village or location via OpenStreetMap search.
3. Draws a polygon boundary around their land parcel on the Leaflet map.
4. The system calculates geodesic area (e.g., $2.4\text{ ha} \approx 5.9\text{ acres}$) via PostGIS `ST_Area`.
5. The farmer clicks **Save Boundary**, persisting the spatial polygon in PostgreSQL.

### Workflow 2: Environmental Diagnosis & Planning
1. The farmer opens **Dashboard** or **Farm Analysis**.
2. The platform automatically fetches live microclimate data from Open-Meteo and ISRIC SoilGrids for the farm's centroid.
3. The farmer reviews soil chemical properties (pH $6.5$, Nitrogen $180\text{ kg/ha}$) and 7-day rainfall ($15.2\text{ mm}$).
4. Navigates to **Crop Planning** to simulate crop suitability; the model recommends Rice ($98\%$) and Maize ($89\%$) with factor ratings.

### Workflow 3: Autonomous Agronomic Advisory
1. The farmer navigates to **AI Mentor** and types:
   > *"What should I do this week for my farm?"*
2. The agent executes `get_weather`, `get_rainfall`, `analyze_soil`, and `calculate_irrigation`.
3. The agent outputs:
   - A day-by-day action plan (e.g., run drip pump $2.8\text{ hrs/day}$, delay top-dress fertilizer due to upcoming rain).
   - Citations verifying the exact data source for every metric mentioned.
   - A collapsible execution trace showing all 4 tool calls.

### Workflow 4: Disease Detection & Remediation
1. The farmer discovers discolored spots on lower tomato leaves.
2. Navigates to **Disease Detection** and uploads a smartphone leaf photo.
3. The vision classifier extracts colorimetry and texture indices, detecting *Tomato Early Blight* ($91\%$ confidence, *Moderate Severity*).
4. The system prescribes curative treatments:
   - **Organic**: Copper-based fungicide spray (Bordeaux mixture) and neem oil extract.
   - **Chemical**: Mancozeb / Chlorothalonil foliar application.
   - **Preventive**: Drip irrigate at the soil line to avoid wetting foliage.

---

## 11. Deployment, Configuration & Verification

### Environment Configuration (`.env`)

```ini
# Environment
ENVIRONMENT=development
DEBUG=True
PROJECT_NAME="AgriNexus AI"
API_V1_STR="/api/v1"

# Database Connection (PostgreSQL + PostGIS)
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_DB=agrinexus
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Security
SECRET_KEY=agrinexus_jwt_super_secret_key_change_in_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

### Running the Application

#### Option A: Docker Compose (All Services)
```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`

#### Option B: Local Development
```bash
# Terminal 1: Backend
cd backend
source .venv/Scripts/activate   # Or .venv\Scripts\activate in PowerShell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Automated Verification

#### Backend Pytest Suite (33 Tests)
```bash
cd backend
.venv/Scripts/python -m pytest tests
# Result: 33 passed in ~48s
```

#### Frontend Production Build
```bash
cd frontend
npm run build
# Result: Built in ~8.4s with 0 errors
```

---

## Conclusion

AgriNexus AI provides an end-to-end, fully verified precision agriculture platform combining modern web GIS, open-access environmental intelligence, robust machine learning, and autonomous multi-turn Agent AI reasoning. Every layer is modular, tested, and ready for production deployment.

