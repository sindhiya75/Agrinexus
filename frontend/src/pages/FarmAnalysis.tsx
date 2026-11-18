import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Farm } from '../types/farm';
import { UnifiedFarmAnalysisResponse } from '../types/intelligence';
import {
  getFarmsApi,
  getFarmAnalysisApi,
  getSavedFarmAnalysisApi,
} from '../services/api';
import {
  Layers,
  Thermometer,
  CloudRain,
  Mountain,
  Droplets,
  FlaskConical,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Sprout,
  ChevronDown
} from 'lucide-react';

export const FarmAnalysis: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');

  // Coordinates inputs for custom coordinates analysis
  const [customLat, setCustomLat] = useState<string>('11.0168');
  const [customLng, setCustomLng] = useState<string>('76.9558');
  const [customArea, setCustomArea] = useState<string>('2.5');
  const [showCoordInputs, setShowCoordInputs] = useState<boolean>(false);

  const [activeSubTab, setActiveSubTab] = useState<
    'all' | 'soil' | 'weather' | 'rainfall' | 'terrain' | 'water' | 'suitability' | 'irrigation'
  >('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<UnifiedFarmAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load farms if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      getFarmsApi()
        .then((data) => {
          setFarms(data);
          if (data.length > 0) {
            setSelectedFarmId(data[0].id);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // Initial load default analysis
  useEffect(() => {
    handleRunAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRunAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      if (selectedFarmId) {
        const res = await getSavedFarmAnalysisApi(selectedFarmId);
        setAnalysis(res);
      } else {
        const lat = parseFloat(customLat) || 11.0168;
        const lng = parseFloat(customLng) || 76.9558;
        const area = parseFloat(customArea) || 1.0;
        const res = await getFarmAnalysisApi(lat, lng, area, 'Agro Plot');
        setAnalysis(res);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to complete farm analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedFarmId(val);
    if (val) {
      const f = farms.find((farm) => farm.id === val);
      if (f && f.latitude && f.longitude) {
        setCustomLat(String(f.latitude));
        setCustomLng(String(f.longitude));
        setCustomArea(f.total_area_hectares ? String(f.total_area_hectares) : '2.0');
      }
    }
  };

  const tabs: { id: typeof activeSubTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'all', label: 'All Layers', icon: Layers },
    { id: 'soil', label: 'Soil', icon: FlaskConical },
    { id: 'weather', label: 'Weather', icon: Thermometer },
    { id: 'rainfall', label: 'Rainfall', icon: CloudRain },
    { id: 'terrain', label: 'Terrain', icon: Mountain },
    { id: 'water', label: 'Water Resources', icon: Droplets },
    { id: 'suitability', label: 'Crop Suitability', icon: Sprout },
    { id: 'irrigation', label: 'Irrigation Deficit', icon: Droplets },
  ];

  return (
    <div className="space-y-5 max-w-7xl pb-12 font-sans">
      {/* 1. Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Environmental Analysis</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Multi-layer telemetry for soil, microclimate, topography, and hydrology.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {farms.length > 0 && (
            <select
              value={selectedFarmId}
              onChange={handleSelectFarmChange}
              className="bg-white border border-neutral-300 text-neutral-900 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-forest-600"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.total_area_hectares ? `${f.total_area_hectares.toFixed(1)} ha` : 'No area'})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowCoordInputs(!showCoordInputs)}
            className="px-2.5 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
          >
            <span>Coordinates</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showCoordInputs ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={handleRunAnalysis}
            disabled={loading}
            className="px-3 py-1.5 bg-forest-700 hover:bg-forest-800 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Expandable Custom Coordinates Form */}
      {showCoordInputs && (
        <div className="p-3.5 bg-white border border-neutral-200 rounded-xl flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500">Lat:</span>
            <input
              type="number"
              step="any"
              value={customLat}
              onChange={(e) => setCustomLat(e.target.value)}
              className="w-24 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-neutral-900"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500">Lng:</span>
            <input
              type="number"
              step="any"
              value={customLng}
              onChange={(e) => setCustomLng(e.target.value)}
              className="w-24 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-neutral-900"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500">Area (ha):</span>
            <input
              type="number"
              step="any"
              value={customArea}
              onChange={(e) => setCustomArea(e.target.value)}
              className="w-20 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-neutral-900"
            />
          </div>
          <button
            onClick={() => {
              setSelectedFarmId('');
              handleRunAnalysis();
            }}
            className="px-3 py-1 bg-neutral-800 hover:bg-neutral-900 text-white rounded text-xs font-medium"
          >
            Analyze GPS
          </button>
        </div>
      )}

      {/* 2. Sub-Tabs Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-neutral-200 text-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && !analysis && (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-6 h-6 text-forest-700 animate-spin mb-2" />
          <p className="text-xs text-neutral-600">Gathering satellite and soil data...</p>
        </div>
      )}

      {/* Content Render */}
      {analysis && (
        <div className="space-y-4">
          {/* Location Summary */}
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-wrap items-center justify-between text-xs gap-2">
            <div>
              <span className="font-semibold text-neutral-900">
                {analysis.farm_name || 'Agro Parcel'}
              </span>
              <span className="text-neutral-500 ml-2 font-mono text-[11px]">
                ({analysis.coordinates.latitude.toFixed(4)}°N, {analysis.coordinates.longitude.toFixed(4)}°E)
              </span>
              <span className="text-neutral-600 block sm:inline sm:ml-3">
                {analysis.agro_climatic_summary}
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">
              Updated {new Date(analysis.analyzed_at).toLocaleTimeString()}
            </span>
          </div>

          {/* 1. SOIL INTELLIGENCE */}
          {(activeSubTab === 'all' || activeSubTab === 'soil') && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-900">Soil Profile</h3>
                </div>
                <span className="text-xs text-neutral-500 font-medium">
                  Texture: {analysis.soil.texture_class}
                </span>
              </div>

              <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-500 block">pH Level</span>
                  <span className="text-lg font-bold text-neutral-900">{analysis.soil.ph?.value?.toFixed(1) ?? '6.5'}</span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">{analysis.soil.ph?.interpretation || 'Optimal'}</span>
                </div>
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-500 block">Nitrogen (N)</span>
                  <span className="text-lg font-bold text-neutral-900">
                    {analysis.soil.nitrogen_n?.value?.toFixed(0) ?? '180'} <span className="text-[10px] font-normal text-neutral-500">kg/ha</span>
                  </span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">{analysis.soil.nitrogen_n?.status}</span>
                </div>
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-500 block">Phosphorus (P)</span>
                  <span className="text-lg font-bold text-neutral-900">
                    {analysis.soil.phosphorus_p?.value?.toFixed(0) ?? '42'} <span className="text-[10px] font-normal text-neutral-500">kg/ha</span>
                  </span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">{analysis.soil.phosphorus_p?.status}</span>
                </div>
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-500 block">Potassium (K)</span>
                  <span className="text-lg font-bold text-neutral-900">
                    {analysis.soil.potassium_k?.value?.toFixed(0) ?? '210'} <span className="text-[10px] font-normal text-neutral-500">kg/ha</span>
                  </span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">{analysis.soil.potassium_k?.status}</span>
                </div>
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-500 block">Organic Carbon</span>
                  <span className="text-lg font-bold text-neutral-900">
                    {analysis.soil.organic_carbon?.value?.toFixed(2) ?? '0.85'}%
                  </span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">{analysis.soil.organic_carbon?.status}</span>
                </div>
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-500 block">Moisture Retention</span>
                  <span className="text-xs font-bold text-neutral-900 mt-1 block truncate">
                    {analysis.soil.moisture_retention}
                  </span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Hydraulic</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. WEATHER INTELLIGENCE */}
          {(activeSubTab === 'all' || activeSubTab === 'weather') && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-900">Weather & 7-Day Forecast</h3>
                </div>
                <span className="text-xs text-neutral-500">Open-Meteo</span>
              </div>

              <div className="mt-3.5 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] text-neutral-500">Current Temperature</span>
                    <div className="text-2xl font-bold text-neutral-900 mt-1">
                      {analysis.weather.current.temperature_c.toFixed(1)}°C
                    </div>
                    <span className="text-xs text-neutral-600 block mt-0.5">
                      {analysis.weather.current.condition} • Feels {analysis.weather.current.feels_like_c.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-neutral-200 text-xs text-neutral-600 space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Humidity:</span>
                      <span className="font-semibold text-neutral-900">{analysis.weather.current.humidity_percent}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Wind:</span>
                      <span className="font-semibold text-neutral-900">{analysis.weather.current.wind_speed_kmh} km/h</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-7 gap-2">
                  {analysis.weather.forecast_7_day.map((day, idx) => (
                    <div
                      key={idx}
                      className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-100 text-center flex flex-col justify-between"
                    >
                      <span className="text-[10px] font-semibold text-neutral-600">{day.date.split('-').slice(1).join('/')}</span>
                      <div className="my-1.5">
                        <span className="text-xs font-bold text-neutral-900 block">{day.temp_max_c.toFixed(0)}°</span>
                        <span className="text-[10px] text-neutral-500 block">{day.temp_min_c.toFixed(0)}°</span>
                      </div>
                      <div className="text-[10px] text-sky-700 font-medium">{day.precipitation_sum_mm.toFixed(1)} mm</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. RAINFALL INTELLIGENCE */}
          {(activeSubTab === 'all' || activeSubTab === 'rainfall') && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-sky-600" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-900">Rainfall & Moisture</h3>
                </div>
                <span className="text-xs text-neutral-500">{analysis.rainfall.rainfall_trend}</span>
              </div>

              <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-500 block">Past 7 Days</span>
                  <span className="text-lg font-bold text-neutral-900">{analysis.rainfall.recent_7_day_total_mm.toFixed(1)} mm</span>
                </div>
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-500 block">Past 14 Days</span>
                  <span className="text-lg font-bold text-neutral-900">{analysis.rainfall.recent_14_day_total_mm.toFixed(1)} mm</span>
                </div>
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-500 block">7-Day Forecast</span>
                  <span className="text-lg font-bold text-sky-700">{analysis.rainfall.forecast_7_day_total_mm.toFixed(1)} mm</span>
                </div>
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-500 block">Evapotranspiration (ET0)</span>
                  <span className="text-lg font-bold text-neutral-900">{analysis.rainfall.evapotranspiration_et0_mm_day.toFixed(1)} mm/d</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. TERRAIN INTELLIGENCE */}
          {(activeSubTab === 'all' || activeSubTab === 'terrain') && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Mountain className="w-4 h-4 text-forest-700" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-900">Terrain & Topography</h3>
                </div>
                <span className="text-xs text-neutral-500">{analysis.terrain.terrain_classification}</span>
              </div>

              <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-500 block">Elevation</span>
                  <span className="text-lg font-bold text-neutral-900">{analysis.terrain.elevation_meters.toFixed(0)} m</span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Above sea level</span>
                </div>
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-500 block">Slope</span>
                  <span className="text-lg font-bold text-neutral-900">{analysis.terrain.slope_percent.toFixed(1)}%</span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Gradient</span>
                </div>
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-500 block">Drainage</span>
                  <span className="text-xs font-bold text-neutral-900 mt-1 block">{analysis.terrain.drainage_capacity}</span>
                </div>
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-500 block">Erosion Risk</span>
                  <span className="text-xs font-bold text-neutral-900 mt-1 block">{analysis.terrain.soil_erosion_risk}</span>
                </div>
              </div>
            </div>
          )}

          {/* 5. WATER RESOURCES & IRRIGATION */}
          {(activeSubTab === 'all' || activeSubTab === 'water' || activeSubTab === 'irrigation') && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-600" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-900">Water Resources & Irrigation</h3>
                </div>
                <span className="text-xs text-neutral-500">Rating: {analysis.water.water_accessibility_rating}</span>
              </div>

              <div className="mt-3.5 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-100 space-y-1.5">
                  <span className="text-[11px] font-semibold text-neutral-700 block">Nearest Surface Water</span>
                  {analysis.water.closest_water_body ? (
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">{analysis.water.closest_water_body.name}</h4>
                      <p className="text-[11px] text-neutral-600 mt-0.5">
                        {(analysis.water.closest_water_body.distance_meters / 1000).toFixed(2)} km away ({analysis.water.closest_water_body.type})
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-500">No surface water within 10 km.</p>
                  )}
                </div>

                <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-100 space-y-1 text-xs">
                  <span className="text-[11px] font-semibold text-neutral-700 block mb-1">Water Demand</span>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Daily Demand:</span>
                    <span className="font-semibold text-neutral-900">{analysis.water.daily_crop_water_requirement_mm.toFixed(1)} mm/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Weekly Deficit:</span>
                    <span className="font-semibold text-sky-700">{analysis.water.net_irrigation_deficit_mm.toFixed(1)} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Weekly Volume:</span>
                    <span className="font-semibold text-neutral-900">{analysis.water.weekly_water_requirement_m3_per_ha.toFixed(0)} m³/ha</span>
                  </div>
                </div>

                <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-neutral-700 block mb-1">Recommendation</span>
                    <p className="text-xs text-neutral-700 leading-relaxed">{analysis.water.irrigation_recommendation}</p>
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-2">Status: {analysis.water.irrigation_status}</span>
                </div>
              </div>
            </div>
          )}

          {/* 6. CROP SUITABILITY */}
          {(activeSubTab === 'all' || activeSubTab === 'suitability') && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-forest-700" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-900">Crop Suitability</h3>
                </div>
                <span className="text-xs text-neutral-500">Evaluated</span>
              </div>

              <div className="mt-3.5 p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 text-xs text-neutral-700 leading-relaxed">
                <p>
                  Conditions indicate {analysis.soil.texture_class} with pH {analysis.soil.ph?.value?.toFixed(1) ?? '6.5'}. Highly compatible with regional rotation patterns.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-neutral-900 font-medium">
                    Rice (High Fit - 98%)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-neutral-900 font-medium">
                    Maize (Moderate - 89%)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-neutral-900 font-medium">
                    Cotton (Moderate - 82%)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default FarmAnalysis;
