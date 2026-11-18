import React, { useState } from 'react';
import {
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
  Info,
  X
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

const InlineErrorBanner: React.FC<{ message: string; onDismiss: () => void }> = ({ message, onDismiss }) => (
  <div className="flex items-start justify-between gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 transition-all">
    <div className="flex items-start gap-2">
      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
      <span className="leading-relaxed font-medium">{message}</span>
    </div>
    <button
      onClick={onDismiss}
      type="button"
      className="p-1 -mr-1 text-rose-500 hover:text-rose-700 rounded-md hover:bg-rose-100 transition-colors"
      aria-label="Dismiss error"
    >
      <X className="w-3.5 h-3.5" />
    </button>
  </div>
);

export const MLIntelligenceSuite: React.FC<MLIntelligenceSuiteProps> = ({
  initialTab = 'crop',
  allowedTabs,
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
  const [cropError, setCropError] = useState<string | null>(null);
  const [cropResult, setCropResult] = useState<CropRecommendationResponse | null>(null);

  const handleRunCrop = async () => {
    setCropLoading(true);
    setCropError(null);
    try {
      const res = await getCropRecommendationApi(cropInputs);
      setCropResult(res);
    } catch (err: any) {
      setCropError(err?.message || 'Error running crop recommendation');
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
  const [fertError, setFertError] = useState<string | null>(null);
  const [fertResult, setFertResult] = useState<FertilizerRecommendationResponse | null>(null);

  const handleRunFertilizer = async () => {
    setFertLoading(true);
    setFertError(null);
    try {
      const res = await getFertilizerRecommendationApi(fertInputs);
      setFertResult(res);
    } catch (err: any) {
      setFertError(err?.message || 'Error running fertilizer recommendation');
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
  const [irrigError, setIrrigError] = useState<string | null>(null);
  const [irrigResult, setIrrigResult] = useState<IrrigationRecommendationResponse | null>(null);

  const handleRunIrrigation = async () => {
    setIrrigLoading(true);
    setIrrigError(null);
    try {
      const res = await getIrrigationRecommendationApi(irrigInputs);
      setIrrigResult(res);
    } catch (err: any) {
      setIrrigError(err?.message || 'Error calculating irrigation recommendation');
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
  const [yieldError, setYieldError] = useState<string | null>(null);
  const [yieldResult, setYieldResult] = useState<YieldPredictionResponse | null>(null);

  const handleRunYield = async () => {
    setYieldLoading(true);
    setYieldError(null);
    try {
      const res = await getYieldPredictionApi(yieldInputs);
      setYieldResult(res);
    } catch (err: any) {
      setYieldError(err?.message || 'Error running yield prediction');
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
  const [diseaseError, setDiseaseError] = useState<string | null>(null);
  const [diseaseResult, setDiseaseResult] = useState<DiseaseDetectionResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDiseaseResult(null);
      setDiseaseError(null);
    }
  };

  const handleRunDisease = async () => {
    if (!selectedFile) {
      setDiseaseError('Please select or upload a leaf photo first.');
      return;
    }
    setDiseaseLoading(true);
    setDiseaseError(null);
    try {
      const res = await detectDiseaseApi(selectedFile, cropHint);
      setDiseaseResult(res);
    } catch (err: any) {
      setDiseaseError(err?.message || 'Error detecting disease from image');
    } finally {
      setDiseaseLoading(false);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Tab Switcher if multiple tabs available */}
      {(!allowedTabs || allowedTabs.length > 1) && (
        <div className="flex flex-wrap gap-1 p-1 bg-neutral-100 rounded-lg text-xs w-fit">
          {[
            { id: 'crop', label: 'Crop Recommender', icon: Sprout },
            { id: 'fertilizer', label: 'Fertilizer Calculator', icon: FlaskConical },
            { id: 'irrigation', label: 'Irrigation', icon: Droplets },
            { id: 'yield', label: 'Yield Predictor', icon: TrendingUp },
            { id: 'disease', label: 'Disease Detection', icon: ShieldAlert },
          ]
            .filter((tab) => (allowedTabs ? allowedTabs.includes(tab.id as any) : true))
            .map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
        </div>
      )}

      {/* ==================================================== */}
      {/* 1. CROP RECOMMENDATION TAB */}
      {/* ==================================================== */}
      {activeTab === 'crop' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="bg-white border border-cream-200 rounded-3xl p-6 space-y-4 shadow-soft">
            <h3 className="text-sm font-bold text-earth-900 flex items-center gap-2">
              <Sprout className="w-4 h-4 text-forest-700" /> Soil & Climate Features
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between text-earth-700 mb-1 font-semibold">
                  <span>Nitrogen (N): <b className="text-forest-800">{cropInputs.nitrogen} kg/ha</b></span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={cropInputs.nitrogen}
                  onChange={(e) => setCropInputs({ ...cropInputs, nitrogen: Number(e.target.value) })}
                  className="w-full accent-forest-700"
                />
              </div>

              <div>
                <div className="flex justify-between text-earth-700 mb-1 font-semibold">
                  <span>Phosphorus (P): <b className="text-amber-800">{cropInputs.phosphorus} kg/ha</b></span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={cropInputs.phosphorus}
                  onChange={(e) => setCropInputs({ ...cropInputs, phosphorus: Number(e.target.value) })}
                  className="w-full accent-forest-700"
                />
              </div>

              <div>
                <div className="flex justify-between text-earth-700 mb-1 font-semibold">
                  <span>Potassium (K): <b className="text-sky-800">{cropInputs.potassium} kg/ha</b></span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="220"
                  value={cropInputs.potassium}
                  onChange={(e) => setCropInputs({ ...cropInputs, potassium: Number(e.target.value) })}
                  className="w-full accent-forest-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-cream-200">
                <div>
                  <label className="text-[11px] text-earth-600 block mb-1 font-semibold">Temperature (°C)</label>
                  <input
                    type="number"
                    value={cropInputs.temperature}
                    onChange={(e) => setCropInputs({ ...cropInputs, temperature: Number(e.target.value) })}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-earth-900 font-bold focus:outline-none focus:border-forest-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-earth-600 block mb-1 font-semibold">Humidity (%)</label>
                  <input
                    type="number"
                    value={cropInputs.humidity}
                    onChange={(e) => setCropInputs({ ...cropInputs, humidity: Number(e.target.value) })}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-earth-900 font-bold focus:outline-none focus:border-forest-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-earth-600 block mb-1 font-semibold">Soil pH (0-14)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cropInputs.ph}
                    onChange={(e) => setCropInputs({ ...cropInputs, ph: Number(e.target.value) })}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-earth-900 font-bold focus:outline-none focus:border-forest-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-earth-600 block mb-1 font-semibold">Rainfall (mm)</label>
                  <input
                    type="number"
                    value={cropInputs.rainfall}
                    onChange={(e) => setCropInputs({ ...cropInputs, rainfall: Number(e.target.value) })}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-earth-900 font-bold focus:outline-none focus:border-forest-600"
                  />
                </div>
              </div>
            </div>

            {cropError && (
              <InlineErrorBanner message={cropError} onDismiss={() => setCropError(null)} />
            )}

            <button
              onClick={handleRunCrop}
              disabled={cropLoading}
              className="w-full mt-4 py-3 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs rounded-xl shadow-md shadow-forest-900/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {cropLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Run Crop Recommendation
            </button>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-4">
            {!cropResult ? (
              <div className="bg-white border border-dashed border-cream-300 rounded-3xl p-12 text-center text-earth-500 text-xs shadow-soft">
                <Sprout className="w-10 h-10 text-earth-400 mx-auto mb-2" />
                Configure soil nutrients and climate parameters, then run inference to view top recommended crops with explainable factors.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-earth-900">Top Recommended Crops</h3>
                  <span className="text-[11px] font-mono text-earth-500 font-semibold">Model: {cropResult.model_version}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {cropResult.top_recommendations.map((item, idx) => (
                    <div
                      key={item.crop}
                      className={`p-5 rounded-3xl border transition-all ${
                        idx === 0
                          ? 'bg-forest-50/80 border-forest-300 shadow-card'
                          : 'bg-white border-cream-200 shadow-soft'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-base text-earth-900">{item.crop}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-forest-100 text-forest-800 border border-forest-200">
                          {Math.round(item.confidence_score * 100)}% Match
                        </span>
                      </div>
                      <p className="text-xs text-earth-600 leading-relaxed mb-3">{item.summary}</p>
                      <div className="space-y-1.5 text-[11px]">
                        {Object.entries(item.agronomic_factors).slice(0, 4).map(([fName, fVal]) => (
                          <div key={fName} className="flex justify-between items-center text-earth-600 font-medium">
                            <span>{fName}</span>
                            <span
                              className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                                fVal.status === 'Optimal'
                                  ? 'bg-forest-100 text-forest-800'
                                  : 'bg-amber-50 text-amber-800'
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

                <div className="p-3.5 bg-cream-50 border border-cream-200 rounded-2xl text-[11px] text-earth-600 flex items-center gap-2">
                  <Info className="w-4 h-4 text-earth-400 shrink-0" />
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
          <div className="bg-white border border-cream-200 rounded-3xl p-6 space-y-4 shadow-soft">
            <h3 className="text-sm font-bold text-earth-900 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-forest-700" /> Crop & Soil Nutrient Test
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] text-earth-600 block mb-1 font-semibold">Target Crop</label>
                <select
                  value={fertInputs.crop}
                  onChange={(e) => setFertInputs({ ...fertInputs, crop: e.target.value })}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-earth-900 font-bold focus:outline-none focus:border-forest-600 capitalize"
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
                  <label className="text-[11px] text-earth-600 block mb-1 font-semibold">Soil N</label>
                  <input
                    type="number"
                    value={fertInputs.soil_nitrogen}
                    onChange={(e) => setFertInputs({ ...fertInputs, soil_nitrogen: Number(e.target.value) })}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2 text-earth-900 font-bold focus:outline-none focus:border-forest-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-earth-600 block mb-1 font-semibold">Soil P</label>
                  <input
                    type="number"
                    value={fertInputs.soil_phosphorus}
                    onChange={(e) => setFertInputs({ ...fertInputs, soil_phosphorus: Number(e.target.value) })}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2 text-earth-900 font-bold focus:outline-none focus:border-forest-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-earth-600 block mb-1 font-semibold">Soil K</label>
                  <input
                    type="number"
                    value={fertInputs.soil_potassium}
                    onChange={(e) => setFertInputs({ ...fertInputs, soil_potassium: Number(e.target.value) })}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2 text-earth-900 font-bold focus:outline-none focus:border-forest-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-earth-600 block mb-1 font-semibold">Organic Carbon %</label>
                <input
                  type="number"
                  step="0.05"
                  value={fertInputs.organic_carbon_percent}
                  onChange={(e) => setFertInputs({ ...fertInputs, organic_carbon_percent: Number(e.target.value) })}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-earth-900 font-bold focus:outline-none focus:border-forest-600"
                />
              </div>

              <div>
                <label className="text-[11px] text-earth-600 block mb-1 font-semibold">Growth Stage</label>
                <select
                  value={fertInputs.growth_stage}
                  onChange={(e) => setFertInputs({ ...fertInputs, growth_stage: e.target.value as any })}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-earth-900 font-bold focus:outline-none focus:border-forest-600"
                >
                  <option value="basal">Basal (Sowing / Planting)</option>
                  <option value="vegetative">Vegetative Growth</option>
                  <option value="flowering_fruiting">Flowering & Fruiting</option>
                </select>
              </div>
            </div>

            {fertError && (
              <InlineErrorBanner message={fertError} onDismiss={() => setFertError(null)} />
            )}

            <button
              onClick={handleRunFertilizer}
              disabled={fertLoading}
              className="w-full mt-4 py-3 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs rounded-xl shadow-md shadow-forest-900/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {fertLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
              Calculate Fertilizer Doses
            </button>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-4">
            {!fertResult ? (
              <div className="bg-white border border-dashed border-cream-300 rounded-3xl p-12 text-center text-earth-500 text-xs shadow-soft">
                <FlaskConical className="w-10 h-10 text-earth-400 mx-auto mb-2" />
                Select target crop and enter your soil test lab values to compute commercial fertilizer and organic amendment dosages.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-5 rounded-3xl bg-white border border-cream-200 shadow-soft">
                  <h4 className="text-xs font-bold text-earth-700 uppercase tracking-wider mb-3">Nutrient Deficits (kg/ha)</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {fertResult.nutrient_deficits.map((d) => (
                      <div key={d.nutrient} className="p-3.5 bg-cream-50 rounded-2xl border border-cream-200 text-xs">
                        <span className="text-earth-500 block font-semibold">{d.nutrient}</span>
                        <span className="text-base font-extrabold text-amber-800 block mt-1">Δ {d.deficit_kg_ha} kg/ha</span>
                        <span className="text-[10px] text-earth-500 font-medium">{d.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-earth-700 uppercase tracking-wider">Formulated Commercial Fertilizers</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {fertResult.recommended_fertilizers.map((f) => (
                      <div key={f.fertilizer_name} className="p-4 bg-white border border-cream-200 rounded-2xl shadow-soft space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs text-earth-900">{f.fertilizer_name}</span>
                          <span className="font-mono font-extrabold text-xs text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200">
                            {f.quantity_kg_ha} kg/ha
                          </span>
                        </div>
                        <p className="text-[11px] text-earth-600 font-medium"><b>Timing:</b> {f.timing}</p>
                        <p className="text-[11px] text-earth-500"><b>Method:</b> {f.application_method}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 bg-forest-50/70 border border-forest-200 rounded-2xl text-xs space-y-2">
                  <span className="font-bold text-forest-900 block">Organic Amendments & Bio-Fertilizers:</span>
                  <ul className="list-disc list-inside text-earth-700 space-y-1 text-[11px] font-medium">
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
          <div className="bg-white border border-cream-200 rounded-3xl p-6 space-y-4 shadow-soft">
            <h3 className="text-sm font-bold text-earth-900 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-cyan-700" /> Farm Field & Weather Parameters
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] text-earth-600 block mb-1 font-semibold">Crop</label>
                <select
                  value={irrigInputs.crop}
                  onChange={(e) => setIrrigInputs({ ...irrigInputs, crop: e.target.value })}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-earth-900 font-bold focus:outline-none focus:border-forest-600 capitalize"
                >
                  {['tomato', 'potato', 'rice', 'wheat', 'maize', 'cotton', 'sugarcane', 'banana'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-earth-600 block mb-1 font-semibold">Growth Stage</label>
                <select
                  value={irrigInputs.growth_stage}
                  onChange={(e) => setIrrigInputs({ ...irrigInputs, growth_stage: e.target.value as any })}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-earth-900 font-bold focus:outline-none focus:border-forest-600"
                >
                  <option value="initial">Initial Seedling (Kc ~ 0.40)</option>
                  <option value="crop_development">Crop Development (Kc ~ 0.75)</option>
                  <option value="mid_season">Mid-Season Flowering/Fruiting (Kc ~ 1.15)</option>
                  <option value="late_season">Late Season / Maturity (Kc ~ 0.65)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-earth-600 block mb-1 font-semibold">Field Area (Hectares)</label>
                <input
                  type="number"
                  step="0.5"
                  value={irrigInputs.area_ha}
                  onChange={(e) => setIrrigInputs({ ...irrigInputs, area_ha: Number(e.target.value) })}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-earth-900 font-bold focus:outline-none focus:border-forest-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-earth-600 block mb-1 font-semibold">Temp (°C)</label>
                  <input
                    type="number"
                    value={irrigInputs.temperature_c}
                    onChange={(e) => setIrrigInputs({ ...irrigInputs, temperature_c: Number(e.target.value) })}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-earth-900 font-bold focus:outline-none focus:border-forest-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-earth-600 block mb-1 font-semibold">Rainfall (mm/7d)</label>
                  <input
                    type="number"
                    value={irrigInputs.forecast_rainfall_7d_mm}
                    onChange={(e) => setIrrigInputs({ ...irrigInputs, forecast_rainfall_7d_mm: Number(e.target.value) })}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-earth-900 font-bold focus:outline-none focus:border-forest-600"
                  />
                </div>
              </div>
            </div>

            {irrigError && (
              <InlineErrorBanner message={irrigError} onDismiss={() => setIrrigError(null)} />
            )}

            <button
              onClick={handleRunIrrigation}
              disabled={irrigLoading}
              className="w-full mt-4 py-3 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-900/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {irrigLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Droplets className="w-4 h-4" />}
              Compute Water Requirements
            </button>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {!irrigResult ? (
              <div className="bg-white border border-dashed border-cream-300 rounded-3xl p-12 text-center text-earth-500 text-xs shadow-soft">
                <Droplets className="w-10 h-10 text-earth-400 mx-auto mb-2" />
                Configure crop and field parameters to estimate FAO-56 crop evapotranspiration (ETc) and volumetric irrigation schedules.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-4 bg-white border border-cream-200 rounded-2xl shadow-soft">
                    <span className="text-[11px] text-earth-500 block font-semibold">Daily ETc</span>
                    <span className="text-base font-extrabold text-earth-900 block mt-1">{irrigResult.crop_evapotranspiration_etc_mm_day} mm/d</span>
                    <span className="text-[10px] text-earth-400 font-mono">Kc = {irrigResult.crop_coefficient_kc}</span>
                  </div>
                  <div className="p-4 bg-white border border-cream-200 rounded-2xl shadow-soft">
                    <span className="text-[11px] text-earth-500 block font-semibold">7-Day Net Deficit</span>
                    <span className="text-base font-extrabold text-cyan-800 block mt-1">{irrigResult.net_irrigation_requirement_mm} mm</span>
                    <span className="text-[10px] text-earth-400">After Rain Credit</span>
                  </div>
                  <div className="p-4 bg-white border border-cream-200 rounded-2xl shadow-soft">
                    <span className="text-[11px] text-earth-500 block font-semibold">Total Volume</span>
                    <span className="text-base font-extrabold text-forest-800 block mt-1">{irrigResult.net_irrigation_volume_m3} m³</span>
                    <span className="text-[10px] text-earth-400">Field Total</span>
                  </div>
                  <div className="p-4 bg-white border border-cream-200 rounded-2xl shadow-soft">
                    <span className="text-[11px] text-earth-500 block font-semibold">Drip Pump Time</span>
                    <span className="text-base font-extrabold text-purple-800 block mt-1">{irrigResult.recommended_run_time_hours_per_day} hrs/day</span>
                    <span className="text-[10px] text-earth-400">Drip Run Time</span>
                  </div>
                </div>

                <div className="p-5 bg-cyan-50/70 border border-cyan-200 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-cyan-900 block">Suggested Watering Schedule:</span>
                  <p className="text-xs text-earth-800 leading-relaxed font-medium">{irrigResult.suggested_watering_schedule}</p>
                </div>

                <div className="p-5 bg-white border border-cream-200 rounded-2xl text-xs space-y-2 shadow-soft">
                  <span className="font-bold text-earth-900 block">Water Conservation Recommendations:</span>
                  <ul className="list-disc list-inside text-earth-600 space-y-1 text-[11px]">
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
          <div className="bg-white border border-cream-200 rounded-3xl p-6 space-y-4 shadow-soft">
            <h3 className="text-sm font-bold text-earth-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-forest-700" /> Historical & Seasonal Inputs
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] text-earth-600 block mb-1 font-semibold">Cultivated Crop</label>
                <select
                  value={yieldInputs.crop}
                  onChange={(e) => setYieldInputs({ ...yieldInputs, crop: e.target.value })}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-earth-900 font-bold focus:outline-none focus:border-forest-600 capitalize"
                >
                  {['rice', 'wheat', 'maize', 'cotton', 'sugarcane', 'potato', 'tomato', 'banana'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-earth-600 block mb-1 font-semibold">Area (ha)</label>
                  <input
                    type="number"
                    value={yieldInputs.area_ha}
                    onChange={(e) => setYieldInputs({ ...yieldInputs, area_ha: Number(e.target.value) })}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-earth-900 font-bold focus:outline-none focus:border-forest-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-earth-600 block mb-1 font-semibold">Annual Rain (mm)</label>
                  <input
                    type="number"
                    value={yieldInputs.annual_rainfall_mm}
                    onChange={(e) => setYieldInputs({ ...yieldInputs, annual_rainfall_mm: Number(e.target.value) })}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-earth-900 font-bold focus:outline-none focus:border-forest-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-earth-600 block mb-1 font-semibold">Fertilizer (kg/ha)</label>
                  <input
                    type="number"
                    value={yieldInputs.fertilizer_kg_ha}
                    onChange={(e) => setYieldInputs({ ...yieldInputs, fertilizer_kg_ha: Number(e.target.value) })}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-earth-900 font-bold focus:outline-none focus:border-forest-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-earth-600 block mb-1 font-semibold">Avg Temp (°C)</label>
                  <input
                    type="number"
                    value={yieldInputs.avg_temperature_c}
                    onChange={(e) => setYieldInputs({ ...yieldInputs, avg_temperature_c: Number(e.target.value) })}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-earth-900 font-bold focus:outline-none focus:border-forest-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="irrigated_check"
                  checked={yieldInputs.is_irrigated}
                  onChange={(e) => setYieldInputs({ ...yieldInputs, is_irrigated: e.target.checked })}
                  className="rounded accent-forest-700 w-4 h-4"
                />
                <label htmlFor="irrigated_check" className="text-earth-700 text-xs font-semibold">Supplemental Irrigation Applied</label>
              </div>
            </div>

            {yieldError && (
              <InlineErrorBanner message={yieldError} onDismiss={() => setYieldError(null)} />
            )}

            <button
              onClick={handleRunYield}
              disabled={yieldLoading}
              className="w-full mt-4 py-3 bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs rounded-xl shadow-md shadow-forest-900/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {yieldLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              Predict Harvest Yield
            </button>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {!yieldResult ? (
              <div className="bg-white border border-dashed border-cream-300 rounded-3xl p-12 text-center text-earth-500 text-xs shadow-soft">
                <TrendingUp className="w-10 h-10 text-earth-400 mx-auto mb-2" />
                Input farm area and environmental factors to execute Random Forest regression and estimate crop tonnage.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 bg-forest-50 border border-forest-200 rounded-3xl">
                    <span className="text-xs text-forest-800 block uppercase tracking-wider font-bold">Predicted Unit Yield</span>
                    <span className="text-3xl font-extrabold text-forest-900 block mt-2">
                      {yieldResult.predicted_yield_tonnes_per_ha} <span className="text-sm font-normal text-forest-700">MT / ha</span>
                    </span>
                    <span className="text-[11px] text-forest-700 block mt-1 font-mono font-semibold">
                      90% CI: [{yieldResult.confidence_interval_90_tonnes_per_ha[0]} - {yieldResult.confidence_interval_90_tonnes_per_ha[1]} MT/ha]
                    </span>
                  </div>

                  <div className="p-6 bg-white border border-cream-200 rounded-3xl shadow-soft">
                    <span className="text-xs text-earth-500 block uppercase tracking-wider font-bold">Total Harvest Output</span>
                    <span className="text-3xl font-extrabold text-earth-900 block mt-2">
                      {yieldResult.predicted_total_production_tonnes} <span className="text-sm font-normal text-purple-700">Metric Tonnes</span>
                    </span>
                    <span className="text-[11px] text-earth-500 block mt-1 font-mono font-semibold">
                      Over {yieldResult.area_ha} hectares
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 bg-white border border-cream-200 rounded-2xl shadow-soft space-y-2">
                    <span className="text-xs font-bold text-forest-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-forest-700" /> Positive Drivers
                    </span>
                    <ul className="text-earth-600 text-[11px] space-y-1 list-disc list-inside font-medium">
                      {yieldResult.key_drivers.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-5 bg-white border border-cream-200 rounded-2xl shadow-soft space-y-2">
                    <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-700" /> Limiting Factors
                    </span>
                    <ul className="text-earth-600 text-[11px] space-y-1 list-disc list-inside font-medium">
                      {yieldResult.limiting_factors.map((l, i) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-3.5 bg-cream-50 border border-cream-200 rounded-2xl text-[11px] text-earth-600 flex items-center gap-2">
                  <Info className="w-4 h-4 text-earth-400 shrink-0" />
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
          <div className="bg-white border border-cream-200 rounded-3xl p-6 space-y-4 shadow-soft">
            <h3 className="text-sm font-bold text-earth-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" /> Leaf Photo Scanner
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] text-earth-600 block mb-1 font-semibold">Crop Hint</label>
                <select
                  value={cropHint}
                  onChange={(e) => setCropHint(e.target.value)}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-earth-900 font-bold focus:outline-none focus:border-forest-600"
                >
                  <option value="Tomato">Tomato</option>
                  <option value="Potato">Potato</option>
                  <option value="Corn (Maize)">Corn (Maize)</option>
                  <option value="Rice">Rice</option>
                  <option value="Cotton">Cotton</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-earth-600 block mb-2 font-semibold">Upload Leaf Photo</label>
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-cream-300 hover:border-forest-500 bg-cream-50/70 rounded-2xl cursor-pointer transition-all">
                  <Upload className="w-8 h-8 text-forest-700 mb-2" />
                  <span className="text-xs text-earth-900 font-bold">Click to select leaf image</span>
                  <span className="text-[10px] text-earth-500 mt-1">JPEG, PNG, WebP up to 10MB</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>

              {previewUrl && (
                <div className="relative rounded-2xl overflow-hidden border border-cream-300 aspect-video bg-black flex items-center justify-center">
                  <img src={previewUrl} alt="Leaf Preview" className="max-h-full object-contain" />
                </div>
              )}
            </div>

            {diseaseError && (
              <InlineErrorBanner message={diseaseError} onDismiss={() => setDiseaseError(null)} />
            )}

            <button
              onClick={handleRunDisease}
              disabled={diseaseLoading || !selectedFile}
              className="w-full mt-4 py-3 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-900/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {diseaseLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              Diagnose Foliar Condition
            </button>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {!diseaseResult ? (
              <div className="bg-white border border-dashed border-cream-300 rounded-3xl p-12 text-center text-earth-500 text-xs shadow-soft">
                <ShieldAlert className="w-10 h-10 text-earth-400 mx-auto mb-2" />
                Upload a field leaf photo and run diagnostics to detect fungal, bacterial, or chlorotic pathogens with immediate treatment guides.
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className={`p-6 rounded-3xl border ${
                    diseaseResult.is_healthy
                      ? 'bg-forest-50 border-forest-200'
                      : 'bg-rose-50 border-rose-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xs text-earth-500 block font-semibold">{diseaseResult.detected_crop} Foliage</span>
                      <h4 className="text-xl font-extrabold text-earth-900 mt-0.5">{diseaseResult.condition}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-white border border-cream-200 text-earth-900 shadow-sm">
                        {Math.round(diseaseResult.confidence_score * 100)}% Confidence
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          diseaseResult.severity === 'None'
                            ? 'bg-forest-100 text-forest-800 border border-forest-200'
                            : diseaseResult.severity === 'Severe'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {diseaseResult.severity} Severity
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-earth-700 leading-relaxed mt-2.5 font-medium">{diseaseResult.symptoms_observed}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 bg-white border border-cream-200 rounded-2xl shadow-soft space-y-1.5">
                    <span className="text-xs font-bold text-rose-700 block">Targeted Chemical Treatment:</span>
                    <p className="text-xs text-earth-700 leading-relaxed">{diseaseResult.chemical_treatment}</p>
                  </div>
                  <div className="p-5 bg-white border border-cream-200 rounded-2xl shadow-soft space-y-1.5">
                    <span className="text-xs font-bold text-forest-800 block">Organic Remedy:</span>
                    <p className="text-xs text-earth-700 leading-relaxed">{diseaseResult.organic_remedy}</p>
                  </div>
                </div>

                <div className="p-5 bg-white border border-cream-200 rounded-2xl shadow-soft space-y-2">
                  <span className="text-xs font-bold text-earth-800 block">Preventive Field Measures:</span>
                  <ul className="text-earth-600 text-[11px] space-y-1 list-disc list-inside font-medium">
                    {diseaseResult.preventive_measures.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-cream-50 border border-cream-200 rounded-2xl text-[10px] text-earth-500 flex items-center justify-between font-mono font-semibold">
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
export default MLIntelligenceSuite;
