# 🌱 AgriNexus AI

> **AI-Powered Agricultural Assistant for Farmers — From Land Planning to Harvest.**

📖 **Complete Technical Specification & Feature Reference**: See [SYSTEM_DOCUMENTATION.md](file:///d:/sindhiya/agrinexus/SYSTEM_DOCUMENTATION.md) for in-depth documentation of all functions, formulas, ML models, agent tools, schemas, and end-to-end workflows.

AgriNexus AI is a modern agricultural intelligence platform designed to empower farmers with data-driven decision making. By uniting spatial GIS capabilities, soil telemetry, meteorological forecasts, and machine learning models into an intuitive system, AgriNexus AI provides end-to-end guidance across the entire farming lifecycle.

---

## 🏗️ System Architecture

```text
                               ┌─────────────────────────┐
                               │  React 18 + TypeScript  │
                               │  Leaflet GIS Dashboard  │
                               └────────────┬────────────┘
                                            │ HTTP / JWT / GeoJSON
                                            ▼
                               ┌─────────────────────────┐
                               │     FastAPI Backend     │
                               │   Python 3.11 + Async   │
                               └──────┬────────────┬─────┘
                                      │            │
                    SQLAlchemy / PostGIS           │ Subsystem Calls (Phase 3)
                                      ▼            ▼
         ┌──────────────────────────────┐        ┌──────────────────────────────┐
         │   PostgreSQL 16 + PostGIS    │        │      ML & AI Services        │
         │  Spatial Polygons & Parcels  │        │ Crop, Irrigation & Disease   │
         └──────────────────────────────┘        └──────────────────────────────┘
```

---

## 📁 Scalable Monorepo Structure

```text
agrinexus/
├── frontend/                   # React 18 + Vite + TypeScript + Tailwind CSS + Leaflet
│   ├── public/                 # Favicon and static assets
│   ├── src/
│   │   ├── components/         # Header, Sidebar, AuthModal, SystemHealthBadge
│   │   ├── context/            # AuthContext (JWT auth state, login/register/logout)
│   │   ├── pages/              # Dashboard, MyFarms, SmartFarmMap (GIS), AIMentor, Settings
│   │   ├── services/           # API integration layer (Auth, Farm, Field, Crop, GIS, Health)
│   │   ├── types/              # TypeScript models (Auth, Farm, Field, Crop, GIS, Health)
│   │   ├── App.tsx             # Root application shell
│   │   └── main.tsx            # React application entrypoint
│   ├── Dockerfile              # Multi-stage production Nginx container
│   ├── nginx.conf              # Reverse proxy & SPA routing configuration
│   ├── package.json            # Frontend package manifest
│   └── vite.config.ts          # Vite configuration with API dev proxies
│
├── backend/                    # FastAPI + SQLAlchemy + Pydantic v2 + Shapely + Alembic
│   ├── alembic/                # Database migrations
│   │   └── versions/           # Migration scripts (0001_create_core_tables.py, 0002_add_boundary_geojson.py)
│   ├── app/
│   │   ├── api/                # API router aggregators & dependencies (deps.py)
│   │   │   └── v1/             # Versioned API routes (/auth, /farms, /fields, /crops, /gis, /health)
│   │   ├── core/               # App configuration (JWT, Security, Settings)
│   │   ├── db/                 # SQLAlchemy engine, session maker & Base
│   │   ├── models/             # SQLAlchemy Models (User, Farm, Field, Crop)
│   │   ├── schemas/            # Pydantic request/response schemas (GIS, Farm, User, etc.)
│   │   ├── services/           # Service layer (GISService - Spherical area & Water Intelligence)
│   │   └── main.py             # FastAPI entrypoint, CORS & documentation setup
│   ├── tests/                  # Pytest test suite (test_auth, test_farms, test_fields, test_gis, test_health)
│   ├── Dockerfile              # Python 3.11 container definition
│   ├── requirements.txt        # Production & testing dependencies
│   ├── alembic.ini             # Alembic database migration configuration
│   └── .env.example            # Backend standalone environment template
│
├── database/                   # PostgreSQL + PostGIS Configurations
│   ├── init/
│   │   └── 01-init-postgis.sql # Extension initialization (PostGIS, UUID)
│   └── README.md               # Database layer documentation
│
├── ml/                         # Machine Learning & AI Modules (Phase 3)
│   └── README.md               # ML architecture guide
│
├── docker-compose.yml          # Multi-container orchestration (DB + API + Web)
├── .env.example                # Root environment template
├── .gitignore                  # Git ignore rules for Python, Node, Docker & IDEs
└── README.md                   # Project documentation
```

---

## ⚡ Implemented Features

### Phase 0 — Foundation
- [x] **FastAPI Application**: Asynchronous REST API with Swagger UI at `/docs` and ReDoc at `/redoc`.
- [x] **Health Check Diagnostic**: `GET /health` with real-time PostgreSQL connectivity test and PostGIS extension version verification.
- [x] **CORS Configuration**: Configurable allowed origins supporting local and containerized frontends.
- [x] **PostgreSQL 16 + PostGIS 3.4**: Spatial database initialized with `postgis`, `postgis_topology`, and `uuid-ossp` extensions.
- [x] **Docker Compose Orchestration**: Single command setup for database, backend, and frontend.

### Phase 1 — Core Data and Authentication
- [x] **Relational Data Models**: `User`, `Farm`, `Field`, `Crop` with strict foreign keys, timestamps, indexes, and cascade deletion.
- [x] **Alembic Database Migrations**: `0001_create_core_tables.py` for automated schema management.
- [x] **JWT Authentication**: Bcrypt password hashing, access/refresh token rotation, and `get_current_active_user` dependency.
- [x] **Multi-Tenant Farm Management APIs**: Full CRUD for Farms, Fields, and Crops with strict user data isolation.
- [x] **Interactive Farm Management UI**: My Farms page with farm cards, sub-fields drilldown, and crop cycle tracking.

### Phase 2 — Smart Farm Map & GIS Intelligence
- [x] **Interactive React-Leaflet Map**:
  - Multi-tile layer switching (Esri Satellite World Imagery, OpenStreetMap Standard, OpenTopoMap).
  - Geocoding location search (Nominatim API) with smooth fly-to animation.
  - Interactive polygon drafting, vertex markers, real-time perimeter, undo point, and clear tools.
  - Real-time geodesic area calculation in **Hectares** (`ha`) and **Acres** (`ac`).
  - Spatial boundary persistence: Save drawn boundary to user's Farm or Field in PostgreSQL/PostGIS.
  - Load existing saved boundaries from user's farms onto the map canvas.
- [x] **GIS Service Layer (`gis_service.py`)**:
  - Spherical excess polygon area calculation.
  - Centroid GPS coordinate extraction and bounding box computation.
  - GeoJSON polygon validation.
- [x] **Water Resource Intelligence**:
  - Automated scanning of nearby surface water bodies within 10 km (Rivers, Lakes, Canals, Reservoirs/Dams).
  - Geodesic distance calculation to each water body in meters and kilometers.
  - Hydrological Water Accessibility Classification (`High`, `Moderate`, `Low / Groundwater Dependent`).
  - Authoritative hydrological disclaimers distinguishing **Water Accessibility**, **Water Availability**, and **Crop Water Requirement**.

### Phase 3 — Farm Intelligence Services
- [x] **Soil Intelligence (`soil_service.py`)**:
  - Global ISRIC SoilGrids REST v2 integration with regional agro-ecological zone fallback.
  - Granular depth sampling (0-5cm, 5-15cm, 15-30cm, 30-60cm) for pH, Organic Carbon, Nitrogen, Phosphorus, Potassium, CEC, and Sand/Silt/Clay fractions.
  - Explicit data source flags: `measured`, `estimated`, or `unavailable`.
- [x] **Weather Intelligence (`weather_service.py`)**:
  - Open-Meteo live meteorology (temperature, apparent temp, humidity, wind, pressure, solar radiation, UV index).
  - 7-day daily agricultural forecast (high/low temps, precipitation probability, daily rainfall, sunshine duration).
- [x] **Rainfall Intelligence (`rainfall_service.py`)**:
  - Past 14-day rainfall tracking and cumulative precipitations (7, 14, 30-day).
  - Next 7-day precipitation forecast & trend determination (`Increasing`, `Decreasing`, `Stable`, `Drought Risk`).
  - FAO-56 Reference Evapotranspiration (ET₀) modeling for field water balance.
- [x] **Terrain Intelligence (`terrain_service.py`)**:
  - Digital elevation (m ASL) using Open-Meteo / USGS SRTM elevation services.
  - 5-point finite-difference slope gradient calculation (`%` grade and `degrees`).
  - Aspect compass direction, topographical drainage capacity, and water runoff erosion risk.
- [x] **Water Intelligence & Crop Water Balance (`water_service.py`)**:
  - Synthesis of GIS surface water bodies proximity + meteorological forecast + FAO-56 ET₀.
  - Field-scale water balance calculation ($1\text{ mm} = 10\text{ m}^3/\text{ha}$).
  - Irrigation accessibility rating, status (`Water Deficit (Irrigation Required)`, `Optimal Hydration`, `Water Surplus`), and actionable irrigation suggestions.
- [x] **Unified Farm Analysis Endpoint (`GET /api/v1/farm-analysis`)**:
  - Async multi-layer synthesis gathering all 5 intelligence dimensions with `asyncio.gather` fault shielding.
  - Available via coordinate lookup or by saved `farm_id`.
- [x] **AI Mentor / Farm Intelligence Hub UI (`AIMentor.tsx`)**:
  - Interactive farm selector and custom coordinate simulator.
  - Multi-tab layer navigation (`All`, `Soil`, `Weather`, `Rainfall`, `Terrain`, `Water Balance`).
  - Executive Agro-Climatic Synthesis banner highlighting critical farming recommendations.

---

## 📡 API Endpoints Reference

### 🧠 Farm Intelligence Services

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/soil` | Get soil profile (pH, NPK, organic carbon, texture) by lat/lng | No |
| `GET` | `/api/v1/weather` | Get live weather and 7-day agricultural forecast by lat/lng | No |
| `GET` | `/api/v1/rainfall` | Get historical precipitation, forecast, trends, and ET₀ by lat/lng | No |
| `GET` | `/api/v1/terrain` | Get elevation, slope (%), aspect, drainage, and erosion risk by lat/lng | No |
| `GET` | `/api/v1/water` | Get combined water intelligence & crop water balance by lat/lng | No |
| `GET` | `/api/v1/farm-analysis` | Get unified multi-layer intelligence analysis by coordinates | No |
| `GET` | `/api/v1/farm-analysis/{farm_id}` | Get unified intelligence analysis for a registered farm | **Yes (Bearer)** |

### 🗺️ GIS & Spatial Intelligence (`/api/v1/gis`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/gis/calculate-area` | Calculate geodesic area (ha, acres, m²), centroid, perimeter from GeoJSON | No |
| `POST` | `/api/v1/gis/water-intelligence` | Scan nearby rivers, canals, lakes, reservoirs and calculate distances | No |
| `PUT` | `/api/v1/gis/farms/{farm_id}/boundary` | Save polygon boundary to farm, updating land area and GPS centroid | **Yes (Bearer)** |
| `PUT` | `/api/v1/gis/fields/{field_id}/boundary` | Save polygon boundary to field, updating parcel area | **Yes (Bearer)** |
| `GET` | `/api/v1/gis/farms/{farm_id}/water-intelligence` | Run hydrological water scan directly on saved farm location | **Yes (Bearer)** |

### 🔐 Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new farmer account | No |
| `POST` | `/api/v1/auth/login` | Login and obtain JWT tokens | No |
| `POST` | `/api/v1/auth/refresh` | Obtain fresh access token | No |
| `GET` | `/api/v1/auth/me` | Retrieve authenticated user profile | **Yes (Bearer)** |

### 🚜 Farms (`/api/v1/farms`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/farms/` | List all farms belonging to current user | **Yes (Bearer)** |
| `POST` | `/api/v1/farms/` | Create a new farm holding | **Yes (Bearer)** |
| `GET` | `/api/v1/farms/{farm_id}` | Get farm details with sub-fields, crops, and boundary | **Yes (Bearer)** |
| `PUT` | `/api/v1/farms/{farm_id}` | Update farm metadata | **Yes (Bearer)** |
| `DELETE` | `/api/v1/farms/{farm_id}` | Delete farm and cascade delete sub-entities | **Yes (Bearer)** |

---

## 🧪 Testing & Verification

### Running Automated Test Suite

```bash
cd backend
.venv\Scripts\python -m pytest tests
```

- `test_agent.py`: Automated tests for LangGraph Agent AI Farming Mentor (weekly planning, crop suitability, fertilizer dosages, and unauthorized farm security isolation).
- `test_ml.py`: Automated tests for all 5 ML services (Crop Recommender, Fertilizer Balancer, FAO-56 Irrigation, Yield Regressor, Leaf Disease Scanner) and metadata introspection.
- `test_intelligence.py`: Soil profile fetching, weather/rainfall/terrain/water services, combined farm analysis, and fallback resiliency.
- `test_gis.py`: Geodesic area in acres/ha, water intelligence, boundary persistence, and invalid polygon handling.
- `test_auth.py`: Registration, duplicate rejection, login, token refresh, `/me` profile.
- `test_farms_crud.py`: Farm creation, listing, updating, deletion, and cross-tenant isolation.
- `test_fields_crops_crud.py`: Field and crop creation, updating, deletion, and cascading.
- `test_health.py`: System diagnostic and PostGIS regression check.

```text
======================= 33 passed in 37.41s =======================
```

---

## 🗺️ Development Roadmap

- [x] **Phase 0 — Foundation**: Repository structure, Docker Compose, PostgreSQL + PostGIS, FastAPI health probe, React dashboard shell.
- [x] **Phase 1 — Core Data & Authentication**: Users, JWT Auth, Alembic migrations, Farm/Field/Crop CRUD with multi-tenant isolation, React Farm Management UI.
- [x] **Phase 2 — Smart Farm Map & GIS Intelligence**: Interactive Leaflet map, satellite imagery, polygon boundary drafting, geodesic area in acres/ha, PostGIS GeoJSON storage, and Water Resource Intelligence.
- [x] **Phase 3 — Farm Intelligence Services**: Modular Soil, Weather, Rainfall, Terrain, Water Balance services & Unified Analysis API, interactive AI Mentor UI.
- [x] **Phase 4 — Machine Learning Intelligence**: Modular Crop Recommendation (Random Forest, 98.9% acc), Fertilizer Balancing Engine, FAO-56 Irrigation Engine, Crop Yield Regressor ($R^2=0.874$), Computer Vision Leaf Disease Scanner, and ML Decision Suite UI.
- [x] **Phase 5 — Agent AI Farming Mentor**: LangGraph autonomous state machine, 12 modular agricultural tools, multi-tenant farm ownership authorization, factual data citations (*Retrieved Data*, *Calculated Value*, *Model Prediction*), `POST /api/agent/chat`, and interactive conversational Mentor UI.

---

## 👩‍💻 Developer

**Sindhiya K** — Final Year Engineering Project

---

## 📄 License

This project is licensed under the MIT License.
