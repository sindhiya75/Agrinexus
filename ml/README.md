# 🤖 AgriNexus AI — Machine Learning (ML) Layer

Welcome to the **Machine Learning Intelligence Layer** of AgriNexus AI. This directory houses model training pipelines, dataset processors, serialized pipeline artifacts, and evaluation metrics for Phase 4.

---

## 🏗️ Architecture & Organization

```text
ml/
├── datasets/                           # Agronomic, historical yield, and vision reference datasets
├── models/                             # Production serialized joblib artifacts & metadata JSONs
│   ├── crop_recommender.joblib         # Multi-class Random Forest (22 crops)
│   ├── crop_recommender_meta.json      # Features, accuracy (98.86%), F1-score, and crop thresholds
│   ├── yield_predictor.joblib          # Random Forest Regressor on agro-climatic history
│   ├── yield_predictor_meta.json       # R² score (0.8744), MAE (1.216 MT/ha), RMSE, feature importances
│   ├── disease_classifier.joblib       # ExtraTrees computer vision classifier (12 disease states)
│   └── disease_classifier_meta.json    # Morphological/spectral taxonomy, remedies, treatments
├── pipelines/                          # End-to-end reproducible training pipelines
│   ├── train_crop_recommender.py       # Stratified split, training, evaluation, SHAP-style factor exporter
│   ├── train_yield_predictor.py        # Non-linear regression, R² cross-validation, confidence interval calculator
│   └── train_disease_classifier.py     # Multi-spectral leaf foliage color & texture morphometry pipeline
└── README.md                           # Documentation, dataset citations, metrics & limitations
```

---

## 🔬 Model Cards & Evaluation Metrics

### 1. Crop Recommendation Service
* **Algorithm**: `RandomForestClassifier` (`n_estimators=100`, `max_depth=14`, `class_weight='balanced'`)
* **Features (7)**:
  * Nitrogen ($N$) [kg/ha]
  * Phosphorus ($P$) [kg/ha]
  * Potassium ($K$) [kg/ha]
  * Ambient Temperature [$^\circ\text{C}$]
  * Relative Humidity [$\%$]
  * Soil $\text{pH}$ [$0-14$]
  * Seasonal Rainfall [$\text{mm}$]
* **Target Classes (22)**: Rice, Maize, Chickpea, Kidney Beans, Pigeonpeas, Mothbeans, Mungbean, Blackgram, Lentil, Pomegranate, Banana, Mango, Grapes, Watermelon, Muskmelon, Apple, Orange, Papaya, Coconut, Cotton, Jute, Coffee.
* **Dataset Source**: ICAR / Kaggle Agricultural Multi-Crop Benchmark (2,200 samples).
* **Evaluation Metrics**:
  * **Test Accuracy**: $98.86\%$
  * **Weighted F1-Score**: $98.86\%$
  * **5-Fold Cross-Validation Accuracy**: $98.41\% \pm 0.39\%$
* **Explainability**: Every prediction includes agronomic factor analysis highlighting whether the farmer's soil nutrients and climatic parameters fall within the physiological bounds of the candidate crop (`Optimal`, `Moderate`, `Deficient`, `Excess`).
* **Limitations**: Model assumes open-field agronomic conditions. Extreme soil salinity or greenhouse climate control may require custom calibration.

---

### 2. Fertilizer Recommendation Engine
* **Algorithm**: Agronomic Soil Nutrient Deficit & Balancing Engine (Deterministic Expert System).
* **Inputs**: Crop type, Soil $N, P, K$ (kg/ha), Soil $\text{pH}$, Organic Carbon $\%$, Growth Stage (`Basal`, `Vegetative`, `Flowering & Fruiting`).
* **Standards Source**: ICAR (Indian Council of Agricultural Research) Recommended Doses of Fertilizers (RDF).
* **Formulations**:
  * Calculates exact nutrient deficits ($\Delta N, \Delta P_2O_5, \Delta K_2O$).
  * Formulates commercial fertilizer combinations (Urea $46\% N$, DAP $18-46-0$, MOP $0-0-60$).
  * Recommends organic amendments (Farmyard Manure FYM, Neem Cake) and bio-fertilizers (Azotobacter, PSB, VAM).
* **Limitations**: Assumes uniform soil texture across the field parcel; fertigation in precision micro-drip systems should adjust for electrical conductivity (EC).

---

### 3. Irrigation Recommendation Engine
* **Algorithm**: FAO-56 Penman-Monteith Crop Evapotranspiration ($\text{ET}_c = K_c \times \text{ET}_0$) & Soil Moisture Depletion Deficit.
* **Inputs**: Crop type, Growth Stage (`Initial`, `Crop Development`, `Mid-Season`, `Late Season`), Field Area (ha), Soil Texture, Temperature, Humidity, Wind Speed, Solar Radiation, 7-Day Forecast Rainfall.
* **Standards Source**: FAO Irrigation and Drainage Paper No. 56.
* **Outputs**:
  * Daily $\text{ET}_c$ (mm/day) and 7-day crop water demand (mm).
  * Effective rainfall deduction ($75\%$ efficiency factor).
  * Net & gross volumetric irrigation requirements ($\text{m}^3$ and liters).
  * Recommended drip pump running hours per day.
* **Limitations**: Assumes pressurized drip system with $88\%$ uniform application efficiency.

---

### 4. Crop Yield Prediction Service
* **Algorithm**: `RandomForestRegressor` (`n_estimators=120`, `max_depth=16`)
* **Features (7)**:
  * `crop_idx`: Cultivated crop category (Rice, Wheat, Maize, Cotton, Sugarcane, Banana, Potato, Tomato, Chickpea, Groundnut)
  * `area_ha`: Farm plot acreage
  * `annual_rainfall_mm`: Total seasonal precipitations
  * `fertilizer_kg_ha`: Cumulative NPK inputs
  * `avg_temp_c`: Average growing season temperature
  * `soil_ph`: Soil acidity / alkalinity
  * `is_irrigated`: Supplemental irrigation binary flag
* **Dataset Source**: FAOSTAT & Directorate of Economics and Statistics Agricultural Production Statistics (2,500 historical seasonal records).
* **Evaluation Metrics**:
  * **$R^2$ Score**: $0.8744$
  * **Mean Absolute Error (MAE)**: $1.216\text{ MT/ha}$
  * **Root Mean Squared Error (RMSE)**: $2.264\text{ MT/ha}$
  * **5-Fold Cross-Validation $R^2$**: $0.8552 \pm 0.0086$
* **Explainability**: Reports $90\%$ Confidence Intervals, positive drivers, and limiting agronomic factors.
* **Limitations**: Regression reflects normal growing cycles without catastrophic localized flooding, hail, or locust swarm damage.

---

### 5. Crop Disease Detection Computer Vision Service
* **Algorithm**: `ExtraTreesClassifier` trained on multi-spectral color and spatial morphometry feature representations.
* **Vision Features (13)**:
  * $R, G, B$ channel means and standard deviations
  * Brown necrotic lesion pixel ratio ($R > 90, G \in [40, 145], B < 100, R > G$)
  * Yellow chlorosis pixel ratio ($R > 130, G > 130, B < 120$)
  * Healthy chlorophyll green ratio ($G > R, G > B, G > 70$)
  * Black necrosis / burnt spot ratio ($R, G, B < 55$)
  * Texture gradient proxy (finite differences approximation)
  * Color variance index
* **Supported Disease Classes (12)**:
  1. Tomato Healthy
  2. Tomato Early Blight (*Alternaria solani*)
  3. Tomato Late Blight (*Phytophthora infestans*)
  4. Potato Healthy
  5. Potato Early Blight (*Alternaria solani*)
  6. Potato Late Blight (*Phytophthora infestans*)
  7. Corn Common Rust (*Puccinia sorghi*)
  8. Corn Northern Leaf Blight (*Exserohilum turcicum*)
  9. Rice Leaf Blast (*Magnaporthe oryzae*)
  10. Rice Brown Spot (*Bipolaris oryzae*)
  11. Cotton Bacterial Blight (*Xanthomonas citri*)
  12. Cotton Healthy
* **Dataset Source**: PlantVillage Benchmark & International Crop Pathology Reference Standards.
* **Evaluation Metrics**:
  * **Test Accuracy**: $100.0\%$ (on benchmark visual feature distributions)
  * **Weighted F1-Score**: $100.0\%$
* **Output**: Disease identification, confidence score, severity rating (`None`, `Mild`, `Moderate`, `Severe`), chemical fungicide treatment, organic remedy, and preventive measures.
* **Limitations**: Requires well-lit, non-blurred leaf images with clear view of foliar symptoms.

---

## 🚀 Running Training Pipelines

To retrain any model:

```bash
cd backend
.venv\Scripts\python ../ml/pipelines/train_crop_recommender.py
.venv\Scripts\python ../ml/pipelines/train_yield_predictor.py
.venv\Scripts\python ../ml/pipelines/train_disease_classifier.py
```
