import React, { useState } from 'react';
import {
  BrainCircuit,
  Sprout,
  FlaskConical,
  Droplets,
  TrendingUp,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  Sparkles,
  Info
} from 'lucide-react';
import {
  getCropRecommendationApi,
  getFertilizerRecommendationApi,
  getIrrigationRecommendationApi,
  getYieldPredictionApi,
  detectDiseaseApi
} from '../services/api';
import {
  CropRecommendationResponse,
  FertilizerRecommendationResponse,
  IrrigationRecommendationResponse,
  YieldPredictionResponse,
  DiseaseDetectionResponse
} from '../types/ml';

export interface MLIntelligenceSuiteProps {
  initialTab?: 'crop' | 'fertilizer' | 'irrigation' | 'yield' | 'disease';
  allowedTabs?: ('crop' | 'fertilizer' | 'irrigation' | 'yield' | 'disease')[];
  title?: string;
  subtitle?: string;
  badge?: string;
}

export const MLIntelligenceSuite: React.FC<MLIntelligenceSuiteProps> = ({
  initialTab = 'crop',
  allowedTabs,
  title,
  subtitle,
  badge,
}) => {
  const [activeTab, setActiveTab] = useState<'crop' | 'fertilizer' | 'irrigation' | 'yield' | 'disease'>(initialTab);

  // ====================================================
  // 1. CROP RECOMMENDATION STATE
  // ====================================================
  const [cropInputs, setCropInputs] = useState({
    nitrogen: 80,
    phosphorus: 45,
    potassium: 40,
    temperature: 24.5,
    humidity: 82,
    ph: 6.5,
    rainfall: 190
  });
  const [cropLoading, setCropLoading] = useState(false);
  const [cropResult, setCropResult] = useState<CropRecommendationResponse | null>(null);

  const handleRunCrop = async () => {
    setCropLoading(true);
    try {
      const res = await getCropRecommendationApi(cropInputs);
      setCropResult(res);
    } catch (err: any) {
      alert(err?.message || 'Error running crop recommendation');
    } finally {
      setCropLoading(false);
    }
  };

  // ====================================================
  // 2. FERTILIZER RECOMMENDATION STATE
  // ====================================================
  const [fertInputs, setFertInputs] = useState({
    crop: 'rice',
    soil_nitrogen: 45,
    soil_phosphorus: 25,
    soil_potassium: 30,
    soil_ph: 6.5,
    organic_carbon_percent: 0.55,
    growth_stage: 'basal' as 'basal' | 'vegetative' | 'flowering_fruiting'
  });
  const [fertLoading, setFertLoading] = useState(false);
  const [fertResult, setFertResult] = useState<FertilizerRecommendationResponse | null>(null);

  const handleRunFertilizer = async () => {
    setFertLoading(true);
    try {
      const res = await getFertilizerRecommendationApi(fertInputs);
      setFertResult(res);
    } catch (err: any) {
      alert(err?.message || 'Error running fertilizer recommendation');
    } finally {
      setFertLoading(false);
    }
  };

  // ====================================================
  // 3. IRRIGATION RECOMMENDATION STATE
  // ====================================================
  const [irrigInputs, setIrrigInputs] = useState({
    crop: 'tomato',
    growth_stage: 'mid_season' as 'initial' | 'crop_development' | 'mid_season' | 'late_season',
    area_ha: 2.0,
    soil_texture: 'loam' as 'sandy' | 'loam' | 'clay' | 'clay_loam' | 'sandy_loam',
    temperature_c: 29.0,
    humidity_percent: 60.0,
    wind_speed_kmh: 12.0,
    solar_radiation_mj: 19.0,
    forecast_rainfall_7d_mm: 8.0
  });
  const [irrigLoading, setIrrigLoading] = useState(false);
  const [irrigResult, setIrrigResult] = useState<IrrigationRecommendationResponse | null>(null);

  const handleRunIrrigation = async () => {
    setIrrigLoading(true);
    try {
      const res = await getIrrigationRecommendationApi(irrigInputs);
      setIrrigResult(res);
    } catch (err: any) {
      alert(err?.message || 'Error calculating irrigation recommendation');
    } finally {
      setIrrigLoading(false);
    }
  };

  // ====================================================
  // 4. YIELD PREDICTION STATE
  // ====================================================
  const [yieldInputs, setYieldInputs] = useState({
    crop: 'maize',
    area_ha: 3.0,
    annual_rainfall_mm: 850,
    fertilizer_kg_ha: 160,
    avg_temperature_c: 24.5,
    soil_ph: 6.5,
    is_irrigated: true
  });
  const [yieldLoading, setYieldLoading] = useState(false);
  const [yieldResult, setYieldResult] = useState<YieldPredictionResponse | null>(null);

  const handleRunYield = async () => {
    setYieldLoading(true);
    try {
      const res = await getYieldPredictionApi(yieldInputs);
      setYieldResult(res);
    } catch (err: any) {
      alert(err?.message || 'Error running yield prediction');
    } finally {
      setYieldLoading(false);
    }
  };

  // ====================================================
  // 5. DISEASE DETECTION STATE
  // ====================================================
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropHint, setCropHint] = useState<string>('Tomato');
  const [diseaseLoading, setDiseaseLoading] = useState(false);
  const [diseaseResult, setDiseaseResult] = useState<DiseaseDetectionResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDiseaseResult(null);
    }
  };

  const handleRunDisease = async () => {
    if (!selectedFile) {
      alert('Please select or upload a leaf photo first.');
      return;
    }
    setDiseaseLoading(true);
    try {
      const res = await detectDiseaseApi(selectedFile, cropHint);
      setDiseaseResult(res);
    } catch (err: any) {
      alert(err?.message || 'Error detecting disease from image');
    } finally {
      setDiseaseLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <BrainCircuit className="w-3.5 h-3.5" /> {badge || 'Phase 4 Machine Learning Engine'}
          </div>
          <h2 className="text-xl font-bold text-white">{title || 'AI Crop & Agronomic Decision Suite'}</h2>
          <p className="text-slate-400 text-xs mt-1 max-w-2xl">
            {subtitle || 'Trained predictive models for multi-crop suitability, balanced soil fertilization, FAO-56 crop water demand, harvest yield regression, and leaf disease vision.'}
          </p>
        </div>

        {/* Tab Navigator */}
        {(!allowedTabs || allowedTabs.length > 1) && (
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            {[
              { id: 'crop', label: 'Crop Recommender', icon: Sprout },
              { id: 'fertilizer', label: 'Fertilizer Calculator', icon: FlaskConical },
              { id: 'irrigation', label: 'Smart Irrigation', icon: Droplets },
              { id: 'yield', label: 'Yield Predictor', icon: TrendingUp },
              { id: 'disease', label: 'Leaf Disease Vision', icon: ShieldAlert },
            ]
              .filter((tab) => (allowedTabs ? allowedTabs.includes(tab.id as any) : true))
              .map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* 1. CROP RECOMMENDATION TAB */}
      {/* ==================================================== */}
      {activeTab === 'crop' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-400" /> Soil & Climate Features
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Nitrogen (N): <b>{cropInputs.nitrogen} kg/ha</b></span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={cropInputs.nitrogen}
                  onChange={(e) => setCropInputs({ ...cropInputs, nitrogen: Number(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Phosphorus (P): <b>{cropInputs.phosphorus} kg/ha</b></span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={cropInputs.phosphorus}
                  onChange={(e) => setCropInputs({ ...cropInputs, phosphorus: Number(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Potassium (K): <b>{cropInputs.potassium} kg/ha</b></span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="220"
                  value={cropInputs.potassium}
                  onChange={(e) => setCropInputs({ ...cropInputs, potassium: Number(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Temperature (°C)</label>
                  <input
                    type="number"
                    value={cropInputs.temperature}
                    onChange={(e) => setCropInputs({ ...cropInputs, temperature: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Humidity (%)</label>
                  <input
                    type="number"
                    value={cropInputs.humidity}
                    onChange={(e) => setCropInputs({ ...cropInputs, humidity: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Soil pH (0-14)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cropInputs.ph}
                    onChange={(e) => setCropInputs({ ...cropInputs, ph: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Rainfall (mm)</label>
                  <input
                    type="number"
                    value={cropInputs.rainfall}
                    onChange={(e) => setCropInputs({ ...cropInputs, rainfall: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleRunCrop}
              disabled={cropLoading}
              className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {cropLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Run Crop Recommendation
            </button>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-4">
            {!cropResult ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
                <Sprout className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                Configure soil nutrients and climate parameters, then run inference to view top recommended crops with explainable factors.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Top Recommended Crops</h3>
                  <span className="text-[11px] font-mono text-slate-400">Model: {cropResult.model_version}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {cropResult.top_recommendations.map((item, idx) => (
                    <div
                      key={item.crop}
                      className={`p-4 rounded-xl border ${
                        idx === 0
                          ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-900/20'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-base text-white">{item.crop}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          {Math.round(item.confidence_score * 100)}% Match
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mb-3">{item.summary}</p>
                      <div className="space-y-1.5 text-[11px]">
                        {Object.entries(item.agronomic_factors).slice(0, 4).map(([fName, fVal]) => (
                          <div key={fName} className="flex justify-between items-center text-slate-400">
                            <span>{fName}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${
                                fVal.status === 'Optimal'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-amber-500/10 text-amber-400'
                              }`}
                            >
                              {fVal.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{cropResult.limitations}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. FERTILIZER RECOMMENDATION TAB */}
      {/* ==================================================== */}
      {activeTab === 'fertilizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-emerald-400" /> Crop & Soil Nutrient Test
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Target Crop</label>
                <select
                  value={fertInputs.crop}
                  onChange={(e) => setFertInputs({ ...fertInputs, crop: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white capitalize"
                >
                  {['rice', 'wheat', 'maize', 'cotton', 'sugarcane', 'potato', 'tomato', 'banana', 'chickpea'].map(
                    (c) => (
                      <option key={c} value={c}>{c}</option>
                    )
                  )}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Soil N</label>
                  <input
                    type="number"
                    value={fertInputs.soil_nitrogen}
                    onChange={(e) => setFertInputs({ ...fertInputs, soil_nitrogen: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Soil P</label>
                  <input
                    type="number"
                    value={fertInputs.soil_phosphorus}
                    onChange={(e) => setFertInputs({ ...fertInputs, soil_phosphorus: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Soil K</label>
                  <input
                    type="number"
                    value={fertInputs.soil_potassium}
                    onChange={(e) => setFertInputs({ ...fertInputs, soil_potassium: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Organic Carbon %</label>
                <input
                  type="number"
                  step="0.05"
                  value={fertInputs.organic_carbon_percent}
                  onChange={(e) => setFertInputs({ ...fertInputs, organic_carbon_percent: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Growth Stage</label>
                <select
                  value={fertInputs.growth_stage}
                  onChange={(e) => setFertInputs({ ...fertInputs, growth_stage: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value="basal">Basal (Sowing / Planting)</option>
                  <option value="vegetative">Vegetative Growth</option>
                  <option value="flowering_fruiting">Flowering & Fruiting</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleRunFertilizer}
              disabled={fertLoading}
              className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {fertLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
              Calculate Fertilizer Doses
            </button>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-4">
            {!fertResult ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
                <FlaskConical className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                Select target crop and enter your soil test lab values to compute commercial fertilizer and organic amendment dosages.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Nutrient Deficits (kg/ha)</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {fertResult.nutrient_deficits.map((d) => (
                      <div key={d.nutrient} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                        <span className="text-slate-400 block">{d.nutrient}</span>
                        <span className="text-base font-bold text-amber-400 block mt-1">Δ {d.deficit_kg_ha} kg/ha</span>
                        <span className="text-[10px] text-slate-500">{d.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Formulated Commercial Fertilizers</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {fertResult.recommended_fertilizers.map((f) => (
                      <div key={f.fertilizer_name} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs text-white">{f.fertilizer_name}</span>
                          <span className="font-mono font-bold text-xs text-emerald-400">{f.quantity_kg_ha} kg/ha</span>
                        </div>
                        <p className="text-[11px] text-slate-400"><b>Timing:</b> {f.timing}</p>
                        <p className="text-[11px] text-slate-500"><b>Method:</b> {f.application_method}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-xs space-y-2">
                  <span className="font-bold text-emerald-400 block">Organic Amendments & Bio-Fertilizers:</span>
                  <ul className="list-disc list-inside text-slate-300 space-y-1 text-[11px]">
                    {fertResult.organic_amendments.concat(fertResult.bio_fertilizers).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. IRRIGATION RECOMMENDATION TAB */}
      {/* ==================================================== */}
      {activeTab === 'irrigation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Droplets className="w-4 h-4 text-sky-400" /> Farm Field & Weather Parameters
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Crop</label>
                <select
                  value={irrigInputs.crop}
                  onChange={(e) => setIrrigInputs({ ...irrigInputs, crop: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white capitalize"
                >
                  {['tomato', 'potato', 'rice', 'wheat', 'maize', 'cotton', 'sugarcane', 'banana'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Growth Stage</label>
                <select
                  value={irrigInputs.growth_stage}
                  onChange={(e) => setIrrigInputs({ ...irrigInputs, growth_stage: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value="initial">Initial Seedling (Kc ~ 0.40)</option>
                  <option value="crop_development">Crop Development (Kc ~ 0.75)</option>
                  <option value="mid_season">Mid-Season Flowering/Fruiting (Kc ~ 1.15)</option>
                  <option value="late_season">Late Season / Maturity (Kc ~ 0.65)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Field Area (Hectares)</label>
                <input
                  type="number"
                  step="0.5"
                  value={irrigInputs.area_ha}
                  onChange={(e) => setIrrigInputs({ ...irrigInputs, area_ha: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Temp (°C)</label>
                  <input
                    type="number"
                    value={irrigInputs.temperature_c}
                    onChange={(e) => setIrrigInputs({ ...irrigInputs, temperature_c: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Rainfall (mm/7d)</label>
                  <input
                    type="number"
                    value={irrigInputs.forecast_rainfall_7d_mm}
                    onChange={(e) => setIrrigInputs({ ...irrigInputs, forecast_rainfall_7d_mm: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleRunIrrigation}
              disabled={irrigLoading}
              className="w-full mt-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {irrigLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Droplets className="w-4 h-4" />}
              Compute Water Requirements
            </button>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {!irrigResult ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
                <Droplets className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                Configure crop and field parameters to estimate FAO-56 crop evapotranspiration (ETc) and volumetric irrigation schedules.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-[11px] text-slate-400 block">Daily ETc</span>
                    <span className="text-base font-bold text-white block mt-1">{irrigResult.crop_evapotranspiration_etc_mm_day} mm/d</span>
                    <span className="text-[10px] text-slate-500">Kc = {irrigResult.crop_coefficient_kc}</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-[11px] text-slate-400 block">7-Day Net Deficit</span>
                    <span className="text-base font-bold text-sky-400 block mt-1">{irrigResult.net_irrigation_requirement_mm} mm</span>
                    <span className="text-[10px] text-slate-500">After Rain Credit</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-[11px] text-slate-400 block">Total Volume</span>
                    <span className="text-base font-bold text-emerald-400 block mt-1">{irrigResult.net_irrigation_volume_m3} m³</span>
                    <span className="text-[10px] text-slate-500">Field Total</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-[11px] text-slate-400 block">Drip Pump Time</span>
                    <span className="text-base font-bold text-purple-400 block mt-1">{irrigResult.recommended_run_time_hours_per_day} hrs/day</span>
                    <span className="text-[10px] text-slate-500">Drip Run Time</span>
                  </div>
                </div>

                <div className="p-4 bg-sky-950/30 border border-sky-800/50 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-sky-300 block">Suggested Watering Schedule:</span>
                  <p className="text-xs text-slate-200 leading-relaxed">{irrigResult.suggested_watering_schedule}</p>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1.5">
                  <span className="font-bold text-slate-300 block">Water Conservation Recommendations:</span>
                  <ul className="list-disc list-inside text-slate-400 space-y-1 text-[11px]">
                    {irrigResult.water_saving_tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. YIELD PREDICTION TAB */}
      {/* ==================================================== */}
      {activeTab === 'yield' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Historical & Seasonal Inputs
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Cultivated Crop</label>
                <select
                  value={yieldInputs.crop}
                  onChange={(e) => setYieldInputs({ ...yieldInputs, crop: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white capitalize"
                >
                  {['rice', 'wheat', 'maize', 'cotton', 'sugarcane', 'potato', 'tomato', 'banana'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Area (ha)</label>
                  <input
                    type="number"
                    value={yieldInputs.area_ha}
                    onChange={(e) => setYieldInputs({ ...yieldInputs, area_ha: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Annual Rain (mm)</label>
                  <input
                    type="number"
                    value={yieldInputs.annual_rainfall_mm}
                    onChange={(e) => setYieldInputs({ ...yieldInputs, annual_rainfall_mm: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Fertilizer (kg/ha)</label>
                  <input
                    type="number"
                    value={yieldInputs.fertilizer_kg_ha}
                    onChange={(e) => setYieldInputs({ ...yieldInputs, fertilizer_kg_ha: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Avg Temp (°C)</label>
                  <input
                    type="number"
                    value={yieldInputs.avg_temperature_c}
                    onChange={(e) => setYieldInputs({ ...yieldInputs, avg_temperature_c: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="irrigated_check"
                  checked={yieldInputs.is_irrigated}
                  onChange={(e) => setYieldInputs({ ...yieldInputs, is_irrigated: e.target.checked })}
                  className="rounded accent-emerald-500"
                />
                <label htmlFor="irrigated_check" className="text-slate-300 text-xs">Supplemental Irrigation Applied</label>
              </div>
            </div>

            <button
              onClick={handleRunYield}
              disabled={yieldLoading}
              className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {yieldLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              Predict Harvest Yield
            </button>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {!yieldResult ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
                <TrendingUp className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                Input farm area and environmental factors to execute Random Forest regression and estimate crop tonnage.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl">
                    <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">Predicted Unit Yield</span>
                    <span className="text-3xl font-extrabold text-white block mt-2">
                      {yieldResult.predicted_yield_tonnes_per_ha} <span className="text-sm font-normal text-emerald-400">MT / ha</span>
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1 font-mono">
                      90% CI: [{yieldResult.confidence_interval_90_tonnes_per_ha[0]} - {yieldResult.confidence_interval_90_tonnes_per_ha[1]} MT/ha]
                    </span>
                  </div>

                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                    <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">Total Harvest Output</span>
                    <span className="text-3xl font-extrabold text-white block mt-2">
                      {yieldResult.predicted_total_production_tonnes} <span className="text-sm font-normal text-purple-400">Metric Tonnes</span>
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1 font-mono">
                      Over {yieldResult.area_ha} hectares
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Positive Drivers
                    </span>
                    <ul className="text-slate-300 text-[11px] space-y-1 list-disc list-inside">
                      {yieldResult.key_drivers.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" /> Limiting Factors
                    </span>
                    <ul className="text-slate-300 text-[11px] space-y-1 list-disc list-inside">
                      {yieldResult.limiting_factors.map((l, i) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{yieldResult.limitations}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. DISEASE DETECTION TAB */}
      {/* ==================================================== */}
      {activeTab === 'disease' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" /> Leaf Photo Scanner
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Crop Hint</label>
                <select
                  value={cropHint}
                  onChange={(e) => setCropHint(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value="Tomato">Tomato</option>
                  <option value="Potato">Potato</option>
                  <option value="Corn (Maize)">Corn (Maize)</option>
                  <option value="Rice">Rice</option>
                  <option value="Cotton">Cotton</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-2">Upload Leaf Photo</label>
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950 rounded-xl cursor-pointer transition-all">
                  <Upload className="w-8 h-8 text-slate-500 mb-2" />
                  <span className="text-xs text-slate-300 font-medium">Click to select image</span>
                  <span className="text-[10px] text-slate-500 mt-1">JPEG, PNG, WebP up to 10MB</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>

              {previewUrl && (
                <div className="relative rounded-xl overflow-hidden border border-slate-800 aspect-video bg-black flex items-center justify-center">
                  <img src={previewUrl} alt="Leaf Preview" className="max-h-full object-contain" />
                </div>
              )}
            </div>

            <button
              onClick={handleRunDisease}
              disabled={diseaseLoading || !selectedFile}
              className="w-full mt-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {diseaseLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              Diagnose Foliar Condition
            </button>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {!diseaseResult ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
                <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                Upload a field leaf photo and run diagnostics to detect fungal, bacterial, or chlorotic pathogens with immediate treatment guides.
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className={`p-5 rounded-2xl border ${
                    diseaseResult.is_healthy
                      ? 'bg-emerald-950/40 border-emerald-500/50'
                      : 'bg-rose-950/40 border-rose-500/50'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xs text-slate-400 block">{diseaseResult.detected_crop} Foliage</span>
                      <h4 className="text-xl font-bold text-white mt-0.5">{diseaseResult.condition}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-slate-950 border border-slate-800 text-white">
                        {Math.round(diseaseResult.confidence_score * 100)}% Confidence
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          diseaseResult.severity === 'None'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : diseaseResult.severity === 'Severe'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {diseaseResult.severity} Severity
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed mt-2">{diseaseResult.symptoms_observed}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                    <span className="text-xs font-bold text-rose-400 block">Targeted Chemical Treatment:</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{diseaseResult.chemical_treatment}</p>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                    <span className="text-xs font-bold text-emerald-400 block">Organic Remedy:</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{diseaseResult.organic_remedy}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">Preventive Field Measures:</span>
                  <ul className="text-slate-400 text-[11px] space-y-1 list-disc list-inside">
                    {diseaseResult.preventive_measures.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-[10px] text-slate-500 flex items-center justify-between font-mono">
                  <span>Green: {diseaseResult.extracted_features_summary.green_ratio_pct}%</span>
                  <span>Necrosis: {diseaseResult.extracted_features_summary.brown_necrotic_ratio_pct}%</span>
                  <span>Chlorosis: {diseaseResult.extracted_features_summary.yellow_chlorotic_ratio_pct}%</span>
                  <span>Texture Index: {diseaseResult.extracted_features_summary.texture_gradient_index}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
