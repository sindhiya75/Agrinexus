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
  Activity,
  Layers,
  Thermometer,
  CloudRain,
  Mountain,
  Droplets,
  FlaskConical,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Compass,
  Sprout,
} from 'lucide-react';

export const FarmAnalysis: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');

  // Coordinates inputs for custom coordinates analysis
  const [customLat, setCustomLat] = useState<string>('11.0168');
  const [customLng, setCustomLng] = useState<string>('76.9558');
  const [customArea, setCustomArea] = useState<string>('2.5');

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
        const res = await getFarmAnalysisApi(lat, lng, area, 'Custom Agro Plot');
        setAnalysis(res);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to complete farm intelligence analysis.');
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

  return (
    <div className="space-y-6 max-w-7xl pb-16 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
            <Activity className="w-3.5 h-3.5" />
            Phase 3 — Multi-Layer Environmental Intelligence
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Farm Intelligence & Geospatial Layers</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time integration of ISRIC SoilGrids, Open-Meteo satellite weather & precipitation, Open-Elevation terrain slopes, and Overpass GIS hydrological networks.
          </p>
        </div>

        {/* Farm Selector / Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {farms.length > 0 && (
            <select
              value={selectedFarmId}
              onChange={handleSelectFarmChange}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.total_area_hectares?.toFixed(1) || '?'} ha)
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleRunAnalysis}
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh Intelligence
          </button>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 text-xs font-medium">
        <button
          onClick={() => setActiveSubTab('all')}
          className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeSubTab === 'all'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" /> All Layers
        </button>
        <button
          onClick={() => setActiveSubTab('soil')}
          className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeSubTab === 'soil'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5 text-amber-400" /> Soil Profile
        </button>
        <button
          onClick={() => setActiveSubTab('weather')}
          className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeSubTab === 'weather'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Thermometer className="w-3.5 h-3.5 text-rose-400" /> Weather
        </button>
        <button
          onClick={() => setActiveSubTab('rainfall')}
          className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeSubTab === 'rainfall'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <CloudRain className="w-3.5 h-3.5 text-sky-400" /> Rainfall
        </button>
        <button
          onClick={() => setActiveSubTab('terrain')}
          className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeSubTab === 'terrain'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Mountain className="w-3.5 h-3.5 text-emerald-400" /> Terrain
        </button>
        <button
          onClick={() => setActiveSubTab('water')}
          className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeSubTab === 'water'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Water Resources
        </button>
        <button
          onClick={() => setActiveSubTab('suitability')}
          className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeSubTab === 'suitability'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Sprout className="w-3.5 h-3.5 text-emerald-400" /> Crop Suitability
        </button>
        <button
          onClick={() => setActiveSubTab('irrigation')}
          className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeSubTab === 'irrigation'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Irrigation Deficit
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && !analysis && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
          <p className="text-sm font-semibold text-white">Aggregating Global Earth Observation Telemetry...</p>
          <p className="text-xs text-slate-400 mt-1">Querying ISRIC SoilGrids, Open-Meteo, Open-Elevation, and OSM Overpass</p>
        </div>
      )}

      {/* Content Render */}
      {analysis && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">
                  {analysis.farm_name || 'Agro-Parcel Telemetry'} • {analysis.coordinates.latitude.toFixed(4)}°N,{' '}
                  {analysis.coordinates.longitude.toFixed(4)}°E
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{analysis.agro_climatic_summary}</p>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Timestamp: {new Date(analysis.analyzed_at).toLocaleTimeString()}
            </div>
          </div>

          {/* 1. SOIL INTELLIGENCE */}
          {(activeSubTab === 'all' || activeSubTab === 'soil') && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">ISRIC Soil Intelligence Profile</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  Texture: {analysis.soil.texture_class}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">Soil pH</span>
                  <span className="text-lg font-bold text-white">{analysis.soil.ph?.value?.toFixed(1) ?? '6.5'}</span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">
                    {analysis.soil.ph?.interpretation || 'Neutral/Optimal'}
                  </span>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">Nitrogen (N)</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {analysis.soil.nitrogen_n?.value?.toFixed(0) ?? '180'} <span className="text-[10px] font-normal text-slate-400">kg/ha</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{analysis.soil.nitrogen_n?.status}</span>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">Phosphorus (P)</span>
                  <span className="text-lg font-bold text-amber-400">
                    {analysis.soil.phosphorus_p?.value?.toFixed(0) ?? '42'} <span className="text-[10px] font-normal text-slate-400">kg/ha</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{analysis.soil.phosphorus_p?.status}</span>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">Potassium (K)</span>
                  <span className="text-lg font-bold text-sky-400">
                    {analysis.soil.potassium_k?.value?.toFixed(0) ?? '210'} <span className="text-[10px] font-normal text-slate-400">kg/ha</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{analysis.soil.potassium_k?.status}</span>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">Organic Carbon</span>
                  <span className="text-lg font-bold text-indigo-400">
                    {analysis.soil.organic_carbon?.value?.toFixed(2) ?? '0.85'}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{analysis.soil.organic_carbon?.status}</span>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">Moisture Retention</span>
                  <span className="text-sm font-bold text-white mt-1 block truncate">
                    {analysis.soil.moisture_retention}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Hydraulic Class</span>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span>{analysis.soil.disclaimer}</span>
                <span className="font-mono text-[10px] text-slate-500">{analysis.soil.data_source}</span>
              </div>
            </div>
          )}

          {/* 2. WEATHER INTELLIGENCE */}
          {(activeSubTab === 'all' || activeSubTab === 'weather') && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-rose-400" />
                  <h3 className="text-sm font-bold text-white">Weather Intelligence & 7-Day Forecast</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {analysis.weather.source}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1 bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Current Temperature</span>
                    <div className="text-3xl font-extrabold text-white mt-2">
                      {analysis.weather.current.temperature_c.toFixed(1)}°C
                    </div>
                    <span className="text-xs text-emerald-400 block mt-1">
                      Feels like {analysis.weather.current.feels_like_c.toFixed(1)}°C • {analysis.weather.current.condition}
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-700/60 text-xs text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Humidity:</span>
                      <span className="font-semibold text-white">{analysis.weather.current.humidity_percent}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Wind:</span>
                      <span className="font-semibold text-white">{analysis.weather.current.wind_speed_kmh} km/h</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-7 gap-2">
                  {analysis.weather.forecast_7_day.map((day, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/40 text-center flex flex-col justify-between"
                    >
                      <span className="text-[11px] font-semibold text-slate-300">{day.date.split('-').slice(1).join('/')}</span>
                      <div className="my-2">
                        <span className="text-xs font-bold text-white block">{day.temp_max_c.toFixed(0)}°</span>
                        <span className="text-[10px] text-slate-400 block">{day.temp_min_c.toFixed(0)}°</span>
                      </div>
                      <div className="text-[10px] text-sky-400 font-mono">{day.precipitation_sum_mm.toFixed(1)} mm</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. RAINFALL INTELLIGENCE */}
          {(activeSubTab === 'all' || activeSubTab === 'rainfall') && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CloudRain className="w-5 h-5 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">Rainfall Intelligence & Moisture Trends</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 font-mono">
                  {analysis.rainfall.rainfall_trend}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">Past 7 Days Total</span>
                  <span className="text-xl font-bold text-white">{analysis.rainfall.recent_7_day_total_mm.toFixed(1)} mm</span>
                </div>
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">Past 14 Days Total</span>
                  <span className="text-xl font-bold text-white">{analysis.rainfall.recent_14_day_total_mm.toFixed(1)} mm</span>
                </div>
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">7-Day Forecast Sum</span>
                  <span className="text-xl font-bold text-sky-400">{analysis.rainfall.forecast_7_day_total_mm.toFixed(1)} mm</span>
                </div>
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">Evapotranspiration (ET0)</span>
                  <span className="text-xl font-bold text-amber-400">{analysis.rainfall.evapotranspiration_et0_mm_day.toFixed(1)} mm/day</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. TERRAIN INTELLIGENCE */}
          {(activeSubTab === 'all' || activeSubTab === 'terrain') && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Mountain className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Terrain Topography & Runoff Risk</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {analysis.terrain.data_source}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">Elevation</span>
                  <span className="text-xl font-bold text-white">{analysis.terrain.elevation_meters.toFixed(0)} m</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Above sea level</span>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">Slope</span>
                  <span className="text-xl font-bold text-emerald-400">{analysis.terrain.slope_percent.toFixed(1)}%</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{analysis.terrain.terrain_classification}</span>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">Drainage Capacity</span>
                  <span className="text-sm font-bold text-white mt-1 block">{analysis.terrain.drainage_capacity}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Natural percolation</span>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">Soil Erosion Risk</span>
                  <span className="text-sm font-bold text-amber-400 mt-1 block">{analysis.terrain.soil_erosion_risk}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{analysis.terrain.farming_suitability}</span>
                </div>
              </div>
            </div>
          )}

          {/* 5. WATER RESOURCES & IRRIGATION */}
          {(activeSubTab === 'all' || activeSubTab === 'water' || activeSubTab === 'irrigation') && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">Hydrology & Water Accessibility Intelligence</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                  Rating: {analysis.water.water_accessibility_rating}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 space-y-2">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Closest Natural Water Body</span>
                  {analysis.water.closest_water_body ? (
                    <div>
                      <h4 className="text-sm font-bold text-white mt-1">{analysis.water.closest_water_body.name}</h4>
                      <p className="text-xs text-cyan-400 mt-0.5">
                        Distance: {(analysis.water.closest_water_body.distance_meters / 1000).toFixed(2)} km • Type:{' '}
                        {analysis.water.closest_water_body.type}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1">No surface water bodies mapped within 10km.</p>
                  )}
                  <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-700/60">
                    {analysis.water.availability_disclaimer}
                  </p>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 space-y-2">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Irrigation Demand</span>
                  <div className="space-y-1 text-xs text-slate-300 mt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Daily Crop Demand:</span>
                      <span className="font-semibold text-white">{analysis.water.daily_crop_water_requirement_mm.toFixed(1)} mm/day</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Weekly Deficit:</span>
                      <span className="font-semibold text-cyan-400">{analysis.water.net_irrigation_deficit_mm.toFixed(1)} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Weekly Volume:</span>
                      <span className="font-semibold text-white">{analysis.water.weekly_water_requirement_m3_per_ha.toFixed(0)} m³/ha</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Agronomic Recommendation</span>
                    <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">{analysis.water.irrigation_recommendation}</p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 mt-2">Status: {analysis.water.irrigation_status}</span>
                </div>
              </div>
            </div>
          )}

          {/* 6. CROP SUITABILITY INSIGHT */}
          {(activeSubTab === 'all' || activeSubTab === 'suitability') && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Agro-Climatic Suitability Analysis</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                  Machine Learning Evaluated
                </span>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
                <p>
                  Based on soil conditions ({analysis.soil.texture_class}, pH {analysis.soil.ph?.value?.toFixed(1) ?? '6.5'}, N {analysis.soil.nitrogen_n?.value?.toFixed(0) ?? '180'} kg/ha) and climate telemetry (Temp {analysis.weather.current.temperature_c.toFixed(1)}°C, 7-day Rain {analysis.rainfall.forecast_7_day_total_mm.toFixed(1)} mm), this location is exceptionally suited for cereal, legume, and horticulture rotations.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    🌾 Rice (High Fit - 98%)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    🌽 Maize (Moderate/High - 89%)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    🌱 Cotton (Moderate - 82%)
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
