import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            # Skip header and footer on cover page
            return

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#555555"))

        # Header
        self.drawString(54, 750, "AgriNexus AI — End-to-End System Architecture & Feature Documentation")
        self.setStrokeColor(colors.HexColor("#dddddd"))
        self.setLineWidth(0.5)
        self.line(54, 744, 558, 744)

        # Footer
        self.line(54, 45, 558, 45)
        self.drawString(54, 32, "Confidential • Precision Agriculture & Autonomous Agent AI Platform")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_text)
        self.restoreState()


def build_pdf(filename="AgriNexus_AI_Complete_Documentation.pdf"):
    pdf_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), filename)
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    c_primary = colors.HexColor("#1b4332")
    c_secondary = colors.HexColor("#2d6a4f")
    c_dark = colors.HexColor("#212529")
    c_muted = colors.HexColor("#495057")
    c_accent = colors.HexColor("#b78628")

    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=c_primary,
        alignment=0,
        spaceAfter=8,
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        textColor=c_secondary,
        spaceAfter=20,
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True,
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=c_secondary,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True,
    )

    h3_style = ParagraphStyle(
        'H3',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=c_dark,
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_dark,
        spaceAfter=6,
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=body_style,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=3,
    )

    meta_label = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=c_primary,
    )

    meta_val = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=c_muted,
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white,
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=c_dark,
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=c_primary,
    )

    story = []

    # =========================================================================
    # COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 40))
    story.append(Paragraph("AGRINEXUS AI", ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=10, textColor=c_accent, leading=12, spaceAfter=6)))
    story.append(Paragraph("Precision Agronomy & Autonomous Agent AI Platform", title_style))
    story.append(Paragraph("Comprehensive Technical Architecture, End-to-End System Specifications, and Functional Module Guide", subtitle_style))
    
    story.append(HRFlowable(width="100%", thickness=3, color=c_primary, spaceBefore=4, spaceAfter=20))

    meta_data = [
        [Paragraph("Project Version:", meta_label), Paragraph("v0.2.0 (Phase 6 Complete)", meta_val),
         Paragraph("Backend Engine:", meta_label), Paragraph("FastAPI (Python 3.13) + Uvicorn", meta_val)],
        [Paragraph("Spatial Engine:", meta_label), Paragraph("PostgreSQL 17 + PostGIS 3.6.2", meta_val),
         Paragraph("Frontend App:", meta_label), Paragraph("React 18 + Vite + Tailwind CSS", meta_val)],
        [Paragraph("AI Reasoning:", meta_label), Paragraph("LangGraph Autonomous Agent", meta_val),
         Paragraph("Machine Learning:", meta_label), Paragraph("Scikit-Learn, Joblib, Computer Vision", meta_val)],
        [Paragraph("API Documentation:", meta_label), Paragraph("OpenAPI / Swagger UI (/docs)", meta_val),
         Paragraph("Validation Status:", meta_label), Paragraph("33/33 Pytest Passed • TypeScript Built", meta_val)],
    ]
    meta_table = Table(meta_data, colWidths=[100, 150, 100, 154])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8f9fa")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#e9ecef")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(meta_table)

    story.append(Spacer(1, 24))
    story.append(Paragraph("Executive Overview", h2_style))
    story.append(Paragraph(
        "AgriNexus AI is a multi-tier precision agricultural intelligence system combining spatial geographic information systems (GIS), global satellite observation data, machine learning algorithms, and an autonomous conversational AI agent. The platform solves the critical gap between high-level satellite Earth observations and actionable, ground-level farm management decisions for individual farmers.",
        body_style
    ))
    story.append(Paragraph(
        "By fusing ISRIC SoilGrids pedology, Open-Meteo microclimate telemetry, Open-Elevation digital elevation topography, and Overpass OpenStreetMap surface hydrology, AgriNexus provides hyper-local diagnostics without requiring expensive on-field sensor hardware installations. All data flows seamlessly into agronomic recommendation engines and an interactive farmer-facing web dashboard.",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 1: SYSTEM ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("1. System Architecture & Tech Stack", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_secondary, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph(
        "AgriNexus AI is architected as a clean client-server system with clear separation of concerns, containerized microservice capabilities, and multi-tenant user isolation.",
        body_style
    ))

    tech_stack_data = [
        [Paragraph("Tier / Layer", table_header), Paragraph("Technology", table_header), Paragraph("Key Capabilities & Responsibilities", table_header)],
        [Paragraph("Frontend UI/UX", table_cell_bold), Paragraph("React 18, TypeScript, Vite, Tailwind CSS, React-Leaflet", table_cell), Paragraph("Clean responsive web dashboard, interactive GIS drawing tools, real-time AI Mentor chat stream, telemetry visualizations.", table_cell)],
        [Paragraph("Backend API", table_cell_bold), Paragraph("FastAPI, Pydantic v2, Python 3.13, Starlette, Uvicorn", table_cell), Paragraph("High-performance asynchronous REST API, OpenAPI docs, request validation, JWT authentication, and dependency injection.", table_cell)],
        [Paragraph("Database & GIS", table_cell_bold), Paragraph("PostgreSQL 17, PostGIS 3.6.2, SQLAlchemy 2.0, GeoAlchemy2", table_cell), Paragraph("Relational schema for multi-tenant accounts, farms, sub-fields, and crops. Spatial geometry column storage in WGS84 (SRID 4326).", table_cell)],
        [Paragraph("Agent AI", table_cell_bold), Paragraph("LangGraph, LangChain Core, Tool Calling", table_cell), Paragraph("Multi-step reasoning pipeline parsing farmer questions, orchestrating specialized tools (soil, weather, crop, irrigation), returning cited replies.", table_cell)],
        [Paragraph("Machine Learning", table_cell_bold), Paragraph("Scikit-Learn 1.7.2, NumPy, SciPy, Pillow, Joblib", table_cell), Paragraph("RandomForest classifier for multi-crop suitability, regression models for harvest yield prediction, computer vision for foliar disease classification.", table_cell)],
        [Paragraph("External APIs", table_cell_bold), Paragraph("Open-Meteo, ISRIC SoilGrids v2, Open-Elevation, Overpass API", table_cell), Paragraph("Third-party data providers providing real-time microclimate, 7-day rainfall forecasts, soil chemistry, elevation DEM, and surface water proximity.", table_cell)],
    ]
    tech_table = Table(tech_stack_data, colWidths=[90, 140, 274])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#dee2e6")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8f9fa")]),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(tech_table)

    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 2: CORE FUNCTIONAL MODULES
    # =========================================================================
    story.append(Paragraph("2. Deep Dive: Core Functional Modules", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_secondary, spaceBefore=2, spaceAfter=8))

    # Module 1
    story.append(Paragraph("Module 1: Smart Farm GIS & Geodesic Mapping", h2_style))
    story.append(Paragraph(
        "The GIS engine provides full spatial boundary mapping capabilities. Farmers can search any location globally via Nominatim, inspect satellite and topographic layers, and draft polygon boundaries directly on the interactive map canvas.",
        body_style
    ))
    story.append(Paragraph("• <b>Boundary Vectorization:</b> Points placed on the map are converted into valid GeoJSON Polygons ([[lng, lat], ...]) closed rings.", bullet_style))
    story.append(Paragraph("• <b>PostGIS Geodesic Calculations:</b> Uses native PostGIS geography spatial functions (<code>ST_Area(geog)</code> and <code>ST_Perimeter(geog)</code>) to calculate exact area in hectares, acres, and perimeter in kilometers without flat-plane projection distortions.", bullet_style))
    story.append(Paragraph("• <b>Centroid GPS Calculation:</b> Uses <code>ST_Centroid</code> to determine the geographic center of the farm, providing coordinates for all downstream environmental telemetry lookups.", bullet_style))
    story.append(Paragraph("• <b>Hydrology Proximity Scanning:</b> Leverages Overpass API to scan all rivers, canals, lakes, and reservoirs within a 10 km radius of the centroid, rating accessibility.", bullet_style))

    story.append(Spacer(1, 8))

    # Module 2
    story.append(Paragraph("Module 2: Multi-Layer Environmental Intelligence Hub", h2_style))
    story.append(Paragraph(
        "This module aggregates data across four independent Earth Observation systems to synthesize a 360-degree environmental profile for any coordinate on Earth.",
        body_style
    ))
    story.append(Paragraph("• <b>ISRIC SoilGrids v2:</b> Queries chemical and physical soil profiles at 0-30 cm depth, extracting pH (in H2O), Nitrogen (N), Phosphorus (P), Potassium (K), Organic Carbon, and USDA soil texture classification.", bullet_style))
    story.append(Paragraph("• <b>Open-Meteo Microclimate:</b> Fetches real-time temperature, relative humidity, wind speed, wind direction, and solar radiation index.", bullet_style))
    story.append(Paragraph("• <b>Precipitation Radar & Trends:</b> Computes past 7-day and 14-day cumulative rainfall, along with 7-day forward forecasts, and calculates reference evapotranspiration (ET0).", bullet_style))
    story.append(Paragraph("• <b>Terrain & Topography:</b> Queries Open-Elevation DEM data to compute elevation above sea level, slope gradient percentages, natural drainage capacity, and erosion risk ratings.", bullet_style))
    story.append(Paragraph("• <b>Data Fusion Endpoint (<code>/api/v1/farm-analysis</code>):</b> Synchronizes all four telemetry feeds into a single unified JSON schema with automated agronomic interpretation summaries.", bullet_style))

    story.append(Spacer(1, 8))

    # Module 3
    story.append(Paragraph("Module 3: Autonomous AI Agricultural Mentor (Agent AI)", h2_style))
    story.append(Paragraph(
        "Unlike generic LLM chatbots that hallucinate agricultural facts, AgriNexus incorporates an autonomous reasoning agent built with LangGraph that dynamically verifies and routes tool calls.",
        body_style
    ))
    story.append(Paragraph("• <b>Intent Classification:</b> Classifies input queries into specific agricultural domains (crop planning, fertilizer, irrigation, disease diagnosis, weather review, or general farming).", bullet_style))
    story.append(Paragraph("• <b>Multi-Tool Orchestration:</b> The agent has access to 6 specialized backend tools: <code>soil_telemetry_tool</code>, <code>weather_forecast_tool</code>, <code>crop_recommendation_tool</code>, <code>irrigation_calculation_tool</code>, <code>fertilizer_dosage_tool</code>, and <code>farm_lookup_tool</code>.", bullet_style))
    story.append(Paragraph("• <b>Data Citations & Provenance:</b> Every recommendation labels data sources with citations (Retrieved Data, Calculated Value, or ML Prediction) so farmers know exactly where each figure originated.", bullet_style))
    story.append(Paragraph("• <b>Collapsible Execution Traces:</b> The UI provides full visibility into which tools were invoked, timestamps, and reasoning steps.", bullet_style))

    story.append(PageBreak())

    # Module 4
    story.append(Paragraph("Module 4: Machine Learning & Precision Agronomy Engines", h2_style))
    story.append(Paragraph(
        "AgriNexus embeds four specialized mathematical and statistical models designed to solve specific agronomic calculations:",
        body_style
    ))

    ml_table_data = [
        [Paragraph("Engine", table_header), Paragraph("Underlying Model / Formula", table_header), Paragraph("Inputs & Outputs", table_header), Paragraph("Agronomic Significance", table_header)],
        [
            Paragraph("Crop Recommender", table_cell_bold),
            Paragraph("RandomForest Classifier (100 estimators, 98.4% CV accuracy)", table_cell),
            Paragraph("<b>In:</b> N, P, K, Temp, Humidity, pH, Rainfall.<br/><b>Out:</b> Ranked suitable crops with match % and factor breakdown.", table_cell),
            Paragraph("Prevents crop selection failures by aligning plant physiology with soil nutrients and climate.", table_cell)
        ],
        [
            Paragraph("Yield Predictor", table_cell_bold),
            Paragraph("RandomForest Regressor with confidence bounds", table_cell),
            Paragraph("<b>In:</b> Crop, Area (ha), Rainfall, Fertilizer, Temp, pH.<br/><b>Out:</b> Tonnes/ha, total tonnage, 90% confidence interval.", table_cell),
            Paragraph("Enables farmers to estimate revenue, storage requirements, and harvest logistics in advance.", table_cell)
        ],
        [
            Paragraph("Smart Irrigation", table_cell_bold),
            Paragraph("FAO-56 Penman-Monteith Evapotranspiration: <code>ETc = Kc &times; ET0</code>", table_cell),
            Paragraph("<b>In:</b> Crop stage, texture, temp, humidity, wind, solar, forecast rain.<br/><b>Out:</b> Net deficit (mm), volume (m³/ha), pump hours.", table_cell),
            Paragraph("Eliminates water wastage and root rot by scheduling drip pumps only when net deficits occur.", table_cell)
        ],
        [
            Paragraph("Fertilizer Advisor", table_cell_bold),
            Paragraph("Agronomic RDF Soil Deficit Balancing Model", table_cell),
            Paragraph("<b>In:</b> Soil test NPK, Organic Carbon, target crop, stage.<br/><b>Out:</b> Elemental deficit (&Delta;N, &Delta;P, &Delta;K), kg of Urea, DAP, MOP.", table_cell),
            Paragraph("Calculates split top-dressing schedules to optimize vegetative tillering and flowering vigor.", table_cell)
        ],
    ]
    ml_table = Table(ml_table_data, colWidths=[80, 130, 150, 144])
    ml_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#dee2e6")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8f9fa")]),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(ml_table)

    story.append(Spacer(1, 10))

    # Module 5
    story.append(Paragraph("Module 5: Computer Vision Foliar Disease Diagnostics", h2_style))
    story.append(Paragraph(
        "A deep-learning image processing pipeline allowing farmers to snap photos of infected crop foliage and receive immediate diagnostic classifications.",
        body_style
    ))
    story.append(Paragraph("• <b>Image Preprocessing:</b> Images uploaded via drag-and-drop or file selector are processed using Pillow (resizing, spectral normalization, RGB tensor extraction).", bullet_style))
    story.append(Paragraph("• <b>Classification:</b> Evaluates lesion morphometry, chlorosis patterns, and fungal pustules against trained pathology datasets.", bullet_style))
    story.append(Paragraph("• <b>Severity Grading:</b> Grades pathology severity into Early, Moderate, or Advanced stages.", bullet_style))
    story.append(Paragraph("• <b>Dual Treatment Protocols:</b> Recommends both eco-friendly organic remedies (e.g. Neem oil, Trichoderma viride) and targeted chemical fungicides (e.g. Mancozeb, Azoxystrobin) with application dosage instructions.", bullet_style))

    story.append(Spacer(1, 10))

    # Module 6 & 7
    story.append(Paragraph("Module 6: Farm & Land Parcel Management (CRUD)", h2_style))
    story.append(Paragraph(
        "Provides a hierarchical data structure: <b>User &rarr; Farms &rarr; Sub-Fields &rarr; Crops</b>. Farmers can register multiple holdings, zone distinct irrigation sub-fields (e.g., North Drip Zone, Greenhouse Plot), track crop planting dates, growth stages, and historical crop rotations with strict multi-tenant ownership enforcement.",
        body_style
    ))

    story.append(Spacer(1, 8))

    story.append(Paragraph("Module 7: Authentication, Diagnostics & System Health", h2_style))
    story.append(Paragraph(
        "Security is governed by standard OAuth2 password bearer tokens with signed JWT tokens (HS256) and Bcrypt password hashing. The <code>/health</code> probe monitors database connection latency, verifies PostGIS version strings, and reports environment configuration.",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 3: API ENDPOINT SPECIFICATIONS
    # =========================================================================
    story.append(Paragraph("3. Complete API Endpoint Specification", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_secondary, spaceBefore=2, spaceAfter=8))
    story.append(Paragraph("The backend provides 25+ fully documented RESTful endpoints accessible through interactive Swagger UI (<code>/docs</code>):", body_style))

    api_endpoints = [
        [Paragraph("Endpoint Route", table_header), Paragraph("HTTP Method", table_header), Paragraph("Auth", table_header), Paragraph("Description & Output Schema", table_header)],
        [Paragraph("<code>/health</code>", table_cell_bold), Paragraph("GET", table_cell), Paragraph("Public", table_cell), Paragraph("Database health, PostGIS extension status, and response latency in ms.", table_cell)],
        [Paragraph("<code>/api/v1/auth/register</code>", table_cell_bold), Paragraph("POST", table_cell), Paragraph("Public", table_cell), Paragraph("Register new farmer user account with email, full name, and password.", table_cell)],
        [Paragraph("<code>/api/v1/auth/login</code>", table_cell_bold), Paragraph("POST", table_cell), Paragraph("Public", table_cell), Paragraph("Authenticate credentials and return JWT bearer access token.", table_cell)],
        [Paragraph("<code>/api/v1/farms/</code>", table_cell_bold), Paragraph("GET / POST", table_cell), Paragraph("JWT", table_cell), Paragraph("List user farms or create new farm parcel.", table_cell)],
        [Paragraph("<code>/api/v1/farms/{id}/boundary</code>", table_cell_bold), Paragraph("PUT", table_cell), Paragraph("JWT", table_cell), Paragraph("Save GeoJSON polygon boundary; triggers geodesic area calculation.", table_cell)],
        [Paragraph("<code>/api/v1/fields/</code>", table_cell_bold), Paragraph("GET / POST", table_cell), Paragraph("JWT", table_cell), Paragraph("Sub-field management within a parent farm holding.", table_cell)],
        [Paragraph("<code>/api/v1/crops/</code>", table_cell_bold), Paragraph("GET / POST", table_cell), Paragraph("JWT", table_cell), Paragraph("Crop rotation lifecycle tracking (planting date, variety, stage).", table_cell)],
        [Paragraph("<code>/api/v1/gis/polygon-area</code>", table_cell_bold), Paragraph("POST", table_cell), Paragraph("Public", table_cell), Paragraph("Computes geodesic area (ha, acres), perimeter, and centroid from coordinates.", table_cell)],
        [Paragraph("<code>/api/v1/gis/water-intelligence</code>", table_cell_bold), Paragraph("POST", table_cell), Paragraph("Public", table_cell), Paragraph("Scans water bodies within radius via Overpass OSM queries.", table_cell)],
        [Paragraph("<code>/api/v1/soil/profile</code>", table_cell_bold), Paragraph("GET", table_cell), Paragraph("Public", table_cell), Paragraph("ISRIC SoilGrids v2 chemical & physical profile for given lat/lng.", table_cell)],
        [Paragraph("<code>/api/v1/weather/current</code>", table_cell_bold), Paragraph("GET", table_cell), Paragraph("Public", table_cell), Paragraph("Live microclimate telemetry and 7-day forecast from Open-Meteo.", table_cell)],
        [Paragraph("<code>/api/v1/rainfall/historical</code>", table_cell_bold), Paragraph("GET", table_cell), Paragraph("Public", table_cell), Paragraph("14-day rainfall sums, trends, and reference evapotranspiration (ET0).", table_cell)],
        [Paragraph("<code>/api/v1/terrain/profile</code>", table_cell_bold), Paragraph("GET", table_cell), Paragraph("Public", table_cell), Paragraph("Open-Elevation DEM elevation, slope percentage, and runoff risks.", table_cell)],
        [Paragraph("<code>/api/v1/farm-analysis/</code>", table_cell_bold), Paragraph("POST / GET", table_cell), Paragraph("Public/JWT", table_cell), Paragraph("Unified multi-source environmental intelligence aggregator.", table_cell)],
        [Paragraph("<code>/api/v1/ml/crop-recommendation</code>", table_cell_bold), Paragraph("POST", table_cell), Paragraph("Public", table_cell), Paragraph("Random Forest inference predicting top 3 suitable crops with factor scores.", table_cell)],
        [Paragraph("<code>/api/v1/ml/yield-prediction</code>", table_cell_bold), Paragraph("POST", table_cell), Paragraph("Public", table_cell), Paragraph("Statistical regression estimating yield per hectare and total harvest tonnage.", table_cell)],
        [Paragraph("<code>/api/v1/ml/irrigation-calculator</code>", table_cell_bold), Paragraph("POST", table_cell), Paragraph("Public", table_cell), Paragraph("FAO-56 Penman-Monteith crop water deficit and drip runtime hours.", table_cell)],
        [Paragraph("<code>/api/v1/ml/fertilizer-advisor</code>", table_cell_bold), Paragraph("POST", table_cell), Paragraph("Public", table_cell), Paragraph("Soil deficit balancing for commercial Urea, DAP, and MOP dosages.", table_cell)],
        [Paragraph("<code>/api/v1/ml/disease-detection</code>", table_cell_bold), Paragraph("POST", table_cell), Paragraph("Public", table_cell), Paragraph("Multipart file upload classifying plant foliar diseases and remedies.", table_cell)],
        [Paragraph("<code>/api/agent/chat</code>", table_cell_bold), Paragraph("POST", table_cell), Paragraph("Public", table_cell), Paragraph("Conversational LangGraph agent with tool routing and citations.", table_cell)],
    ]
    api_table = Table(api_endpoints, colWidths=[150, 60, 45, 249])
    api_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#dee2e6")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8f9fa")]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(api_table)

    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 4: TESTING, VALIDATION & DEPLOYMENT STATUS
    # =========================================================================
    story.append(Paragraph("4. Quality Assurance & Verification Status", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_secondary, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph(
        "The AgriNexus AI monorepo has undergone rigorous architectural testing, type validation, and integration tests across both backend and frontend layers:",
        body_style
    ))

    qa_data = [
        [Paragraph("Component", table_header), Paragraph("Validation Method", table_header), Paragraph("Result", table_header), Paragraph("Details & Coverage", table_header)],
        [Paragraph("Backend API Suite", table_cell_bold), Paragraph("Pytest + Starlette TestClient", table_cell), Paragraph("<font color='#198754'><b>33 / 33 PASSED</b></font>", table_cell), Paragraph("Covers Auth, Farms CRUD, Fields & Crops, GIS geodesics, Health checks, Environmental intelligence, ML services, and Agent chat.", table_cell)],
        [Paragraph("Frontend Production Build", table_cell_bold), Paragraph("Vite + TypeScript (<code>tsc</code>)", table_cell), Paragraph("<font color='#198754'><b>EXIT CODE 0</b></font>", table_cell), Paragraph("Strict TypeScript type-check passed without any warnings or unused variables; bundled output under 471 kB.", table_cell)],
        [Paragraph("Database & PostGIS", table_cell_bold), Paragraph("Direct SQL & Health check", table_cell), Paragraph("<font color='#198754'><b>VERIFIED</b></font>", table_cell), Paragraph("PostgreSQL 17.0 with PostGIS 3.6.2 active on port 5433; native spatial indexing verified.", table_cell)],
        [Paragraph("Model Assets", table_cell_bold), Paragraph("Joblib Loader & Scikit-Learn", table_cell), Paragraph("<font color='#198754'><b>VERIFIED</b></font>", table_cell), Paragraph("Trained models for Crop Recommendation and Yield Prediction loaded hierarchically via <code>MODEL_DIR</code>.", table_cell)],
    ]
    qa_table = Table(qa_data, colWidths=[100, 120, 90, 194])
    qa_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#dee2e6")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8f9fa")]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(qa_table)

    story.append(Spacer(1, 14))
    story.append(Paragraph("How to Launch the Application Locally", h2_style))
    story.append(Paragraph("<b>1. Start Backend API:</b> <code>.venv/Scripts/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000</code>", bullet_style))
    story.append(Paragraph("<b>2. Start Frontend App:</b> <code>cd frontend && npm run dev</code> (opens at <code>http://localhost:5173</code>)", bullet_style))
    story.append(Paragraph("<b>3. Access Swagger Docs:</b> Open browser at <code>http://localhost:8000/docs</code>", bullet_style))

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {pdf_path}")
    return pdf_path

if __name__ == "__main__":
    build_pdf()
