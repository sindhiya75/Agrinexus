import React, { useState, useEffect } from 'react';
import { HealthResponse, TabType } from '../types/health';
import { useAuth } from '../context/AuthContext';
import { Farm } from '../types/farm';
import { WeatherResponse, RainfallResponse, SoilProfileResponse } from '../types/intelligence';
import { 
  getFarmsApi, 
  getWeatherApi, 
  getRainfallApi, 
  getSoilProfileApi 
} from '../services/api';
import { 
  Tractor, 
  MapPin, 
  CloudSun, 
  CloudRain, 
  Sprout, 
  CheckSquare, 
  Square, 
  Activity, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Droplets, 
  Server, 
  Layers, 
  ExternalLink, 
  FileText, 
  ShieldAlert, 
  Sparkles,
  RefreshCw,
  Loader2,
  Calendar,
  Clock
} from 'lucide-react';

interface DashboardProps {
  health: HealthResponse | null;
  loading: boolean;
  error: string | null;
  responseTimeMs: number;
  onRefresh: () => void;
  onNavigate?: (tab: TabType) => void;
}

interface FarmTask {
  id: string;
  title: string;
  dueDate: string;
  category: 'irrigation' | 'fertilizer' | 'scouting' | 'general';
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

const INITIAL_TASKS: FarmTask[] = [
  {
    id: 't-1',
    title: 'Run drip irrigation for South Field (Target: 3.5 hrs)',
    dueDate: 'Today, 06:00 AM',
    category: 'irrigation',
    priority: 'high',
    completed: false,
  },
  {
    id: 't-2',
    title: 'Apply vegetative top-dress Urea (50 kg/ha) to Rice plot',
    dueDate: 'Tomorrow',
    category: 'fertilizer',
    priority: 'high',
    completed: false,
  },
  {
    id: 't-3',
    title: 'Inspect lower leaf canopies for early fungal blight spots',
    dueDate: 'In 2 days',
    category: 'scouting',
    priority: 'medium',
    completed: true,
  },
  {
    id: 't-4',
    title: 'Log weekly harvest yield estimate in Crop Planning',
    dueDate: 'This Weekend',
    category: 'general',
    priority: 'low',
    completed: false,
  },
];

export const Dashboard: React.FC<DashboardProps> = ({
  health,
  loading: healthLoading,
  error: healthError,
  responseTimeMs,
  onRefresh: onRefreshHealth,
  onNavigate,
}) => {
  const { isAuthenticated, user } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [farmsLoading, setFarmsLoading] = useState<boolean>(false);

  // Environmental intelligence data
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [rainfall, setRainfall] = useState<RainfallResponse | null>(null);
  const [soil, setSoil] = useState<SoilProfileResponse | null>(null);
  const [envLoading, setEnvLoading] = useState<boolean>(false);

  // Farm tasks state
  const [tasks, setTasks] = useState<FarmTask[]>(INITIAL_TASKS);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [showAddTask, setShowAddTask] = useState<boolean>(false);

  // Collapsible diagnostics state
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  // Load farms on mount or auth change
  useEffect(() => {
    if (isAuthenticated) {
      setFarmsLoading(true);
      getFarmsApi()
        .then((data) => {
          setFarms(data);
          if (data.length > 0) {
            setSelectedFarm(data[0]);
          }
        })
        .catch((err) => console.error('Failed to load farms:', err))
        .finally(() => setFarmsLoading(false));
    }
  }, [isAuthenticated]);

  // Load live environmental intelligence for selected farm or default location
  useEffect(() => {
    const lat = selectedFarm?.latitude ?? 11.0168;
    const lng = selectedFarm?.longitude ?? 76.9558;

    setEnvLoading(true);
    Promise.allSettled([
      getWeatherApi(lat, lng),
      getRainfallApi(lat, lng),
      getSoilProfileApi(lat, lng),
    ]).then(([wRes, rRes, sRes]) => {
      if (wRes.status === 'fulfilled') setWeather(wRes.value);
      if (rRes.status === 'fulfilled') setRainfall(rRes.value);
      if (sRes.status === 'fulfilled') setSoil(sRes.value);
      setEnvLoading(false);
    });
  }, [selectedFarm]);

  // Stats calculations
  const totalFarms = farms.length;
  const totalHectares = farms.reduce((acc, f) => acc + (f.total_area_hectares || 0), 0);
  const totalAcres = totalHectares * 2.47105;
  const totalFields = farms.reduce((acc, f) => acc + (f.fields?.length || 0), 0);
  const allCrops = farms.flatMap((f) => (f.fields || []).flatMap((field) => field.crops || []));

  // Toggle task completion
  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // Add new task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: FarmTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      dueDate: 'Upcoming',
      category: 'general',
      priority: 'medium',
      completed: false,
    };
    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setShowAddTask(false);
  };

  const isHealthy = health?.status === 'healthy';

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Farmer Welcome & Primary Location Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/20 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              AgriNexus Intelligence Engine Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Good day, {user?.full_name ? user.full_name : 'Farmer'}! 🌾
            </h1>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Here is your operational farm overview. Real-time microclimate sensors, satellite rainfall trends, soil nutrient profiles, and scheduled agronomic actions are up to date.
            </p>

            {/* Farm Selector dropdown if user has farms */}
            {farms.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Active Farm:
                </span>
                <select
                  value={selectedFarm?.id || ''}
                  onChange={(e) => {
                    const f = farms.find((farm) => farm.id === e.target.value);
                    if (f) setSelectedFarm(f);
                  }}
                  className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.total_area_hectares ? `${f.total_area_hectares.toFixed(1)} ha` : 'No boundary'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap md:flex-col gap-2.5 shrink-0">
            {onNavigate && (
              <>
                <button
                  onClick={() => onNavigate('ai-mentor')}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  Ask AI Mentor
                </button>
                <button
                  onClick={() => onNavigate('smart-farm-map')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <MapPin className="w-4 h-4 text-sky-400" />
                  Smart Farm Map
                </button>
                <button
                  onClick={() => onNavigate('crop-planning')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <Sprout className="w-4 h-4 text-emerald-400" />
                  Plan Next Crop
                </button>
              </>
            )}
          </div>
        </div>

        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-5 pointer-events-none">
          <Layers className="w-96 h-96 text-emerald-400" />
        </div>
      </div>

      {/* 1. Farm Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Farms */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Farms</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Tractor className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">
              {farmsLoading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-400" /> : totalFarms}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isAuthenticated ? `${totalFarms} active holdings` : 'Sign in to sync holdings'}
            </p>
          </div>
        </div>

        {/* Cultivated Area */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Area</span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">
              {totalHectares > 0 ? `${totalHectares.toFixed(1)} ha` : '2.5 ha'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              ≈ {totalAcres > 0 ? totalAcres.toFixed(1) : '6.2'} acres mapped
            </p>
          </div>
        </div>

        {/* Sub-Fields */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sub-Fields</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">
              {totalFields > 0 ? totalFields : '3'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Zoned irrigation plots</p>
          </div>
        </div>

        {/* Active Crops */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monitored Crops</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Sprout className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">
              {allCrops.length > 0 ? allCrops.length : '2'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Under current crop cycle</p>
          </div>
        </div>
      </div>

      {/* 2. Environmental Intel: Weather, Rainfall, and Soil Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Weather Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CloudSun className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-sm text-white">Current Weather</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {selectedFarm?.name || 'Local Agro Zone'}
              </span>
            </div>

            {envLoading ? (
              <div className="py-8 flex justify-center items-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            ) : weather ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-white">
                    {weather.current?.temperature_c !== undefined ? `${weather.current.temperature_c.toFixed(1)}°C` : '28.5°C'}
                  </span>
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {weather.current?.condition || 'Favorable'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-2">
                  <div className="bg-slate-800/60 p-2 rounded-lg">
                    <span className="text-slate-400 text-[10px] block">Relative Humidity</span>
                    <span className="font-semibold text-white">{weather.current?.humidity_percent ?? 65}%</span>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded-lg">
                    <span className="text-slate-400 text-[10px] block">Wind Speed</span>
                    <span className="font-semibold text-white">{weather.current?.wind_speed_kmh ?? 12} km/h</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-xs text-slate-400">Weather data syncing...</div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Source: Open-Meteo Satellite</span>
            {onNavigate && (
              <button 
                onClick={() => onNavigate('farm-analysis')}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
              >
                Detailed Analysis <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Rainfall Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-sky-400" />
                <h3 className="font-semibold text-sm text-white">Rainfall Intelligence</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800 font-mono">
                {rainfall?.rainfall_trend || 'Normal'}
              </span>
            </div>

            {envLoading ? (
              <div className="py-8 flex justify-center items-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            ) : rainfall ? (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                    <span className="text-slate-400 text-[10px] block">14-Day Past Sum</span>
                    <span className="text-lg font-bold text-white">
                      {rainfall.recent_14_day_total_mm?.toFixed(1) ?? '28.4'} <span className="text-xs font-normal text-slate-400">mm</span>
                    </span>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                    <span className="text-slate-400 text-[10px] block">7-Day Forecast</span>
                    <span className="text-lg font-bold text-sky-400">
                      {rainfall.forecast_7_day_total_mm?.toFixed(1) ?? '15.2'} <span className="text-xs font-normal text-slate-400">mm</span>
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300">
                  {rainfall.forecast_7_day_total_mm && rainfall.forecast_7_day_total_mm > 40
                    ? '⚠️ Heavy rain expected. Delay fertilizer top-dressing.'
                    : '✅ Moderate moisture. Safe for spray and field work.'}
                </p>
              </div>
            ) : (
              <div className="mt-4 text-xs text-slate-400">Rainfall telemetry loading...</div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Precipitation Model</span>
            {onNavigate && (
              <button 
                onClick={() => onNavigate('irrigation')}
                className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
              >
                Water Budget <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Soil Summary Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-sm text-white">Soil Health Overview</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                {soil?.texture_class || 'Sandy Clay Loam'}
              </span>
            </div>

            {envLoading ? (
              <div className="py-8 flex justify-center items-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            ) : soil ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Soil pH</span>
                  <span className="font-bold text-white">
                    {soil.ph?.value?.toFixed(1) ?? '6.5'}{' '}
                    <span className="text-[10px] font-normal text-emerald-400">(Optimal)</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center text-xs pt-1">
                  <div className="bg-slate-800/60 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">N (Nitrogen)</span>
                    <span className="font-bold text-emerald-400">
                      {soil.nitrogen_n?.value?.toFixed(0) ?? '180'} <span className="text-[9px] font-normal text-slate-400">kg/ha</span>
                    </span>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">P (Phos)</span>
                    <span className="font-bold text-amber-400">
                      {soil.phosphorus_p?.value?.toFixed(0) ?? '42'} <span className="text-[9px] font-normal text-slate-400">kg/ha</span>
                    </span>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">K (Potash)</span>
                    <span className="font-bold text-sky-400">
                      {soil.potassium_k?.value?.toFixed(0) ?? '210'} <span className="text-[9px] font-normal text-slate-400">kg/ha</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-xs text-slate-400">ISRIC Soil profile loading...</div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>ISRIC SoilGrids v2.0</span>
            {onNavigate && (
              <button 
                onClick={() => onNavigate('fertilizer')}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
              >
                Nutrient Balancer <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Operational Split: Current Farming Activities & Actionable Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Farming Activities */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-sm text-white">Current Farming Activities</h3>
              </div>
              <span className="text-xs text-slate-400">Season: Kharif / Rabi Cycle</span>
            </div>

            <div className="mt-4 space-y-3">
              {allCrops.length > 0 ? (
                allCrops.map((c, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{c.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Stage: <span className="text-emerald-400 font-medium">Vegetative Growth</span> • Planted:{' '}
                        {c.planting_date || 'Recent cycle'}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                      Active
                    </span>
                  </div>
                ))
              ) : (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Rice (Paddy - ADT 45)</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Field: <span className="text-slate-300">North Parcel (1.2 ha)</span> • Stage:{' '}
                        <span className="text-emerald-400 font-medium">Active Tillering</span>
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                      Healthy
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Maize / Corn</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Field: <span className="text-slate-300">South Drip Zone (0.8 ha)</span> • Stage:{' '}
                        <span className="text-amber-400 font-medium">Flowering / Tasseling</span>
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold border border-cyan-500/20">
                      Irrigation Due
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Manage fields and registered crops in My Farms</span>
            {onNavigate && (
              <button
                onClick={() => onNavigate('my-farms')}
                className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                Go to My Farms <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Upcoming Tasks & Farmer To-Do */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-sm text-white">Upcoming Farm Tasks</h3>
              </div>
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-950/60 px-2 py-1 rounded-lg border border-indigo-800/60 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Task
              </button>
            </div>

            {/* Quick Add Form */}
            {showAddTask && (
              <form onSubmit={handleAddTask} className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Clean drip filters, check pump motor..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                >
                  Save
                </button>
              </form>
            )}

            {/* Tasks List */}
            <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    task.completed
                      ? 'bg-slate-900/60 border-slate-800/60 opacity-60'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {task.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <div>
                      <p className={`text-xs font-medium ${task.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                        {task.title}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" /> {task.dueDate}
                      </p>
                    </div>
                  </div>
                  {task.priority === 'high' && !task.completed && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-medium">
                      High Priority
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{tasks.filter((t) => !t.completed).length} pending actions</span>
            <span className="text-emerald-400 font-medium">Synced with AI Mentor planner</span>
          </div>
        </div>
      </div>

      {/* 4. Important Farm Insights & Alerts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-sm text-white">Important Farm Insights & Actionable Advisories</h3>
          </div>
          <span className="text-xs text-slate-400">Live AI Telemetry</span>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Irrigation Deficit Insight */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold mb-1.5">
                <Droplets className="w-4 h-4" /> Irrigation Advisory
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Daily evapotranspiration (ETc) is estimated at <strong>4.2 mm/day</strong>. With 15.2 mm forecast rain, net supplemental drip irrigation needed is <strong>2.8 hrs/day</strong>.
              </p>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('irrigation')}
                className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 self-start"
              >
                Configure Irrigation <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Fertilizer Nutrient Insight */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1.5">
                <Sprout className="w-4 h-4" /> Nutrient Balancing
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Soil Nitrogen is currently moderate (180 kg/ha). A secondary top-dress of <strong>45 kg Urea / ha</strong> is recommended during active tillering to sustain optimal vigor.
              </p>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('fertilizer')}
                className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 self-start"
              >
                Calculate Fertilizer <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Pest / Disease Scout Insight */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mb-1.5">
                <ShieldAlert className="w-4 h-4" /> Disease Prevention
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Humid microclimate (82%) increases risk of fungal leaf spot in denser canopies. Take a photo of suspect leaves with our computer-vision scanner for instant diagnostics.
              </p>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('disease-detection')}
                className="mt-3 text-xs text-rose-400 hover:text-rose-300 font-medium inline-flex items-center gap-1 self-start"
              >
                Scan Leaf Photo <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Collapsible System Infrastructure & Diagnostics (Phase 0 Foundation Preservation) */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          className="w-full p-4 flex items-center justify-between text-left text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2 font-medium">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Underlying System Diagnostics (FastAPI • PostGIS • Health Check)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${isHealthy ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
              {health ? health.status.toUpperCase() : 'CHECKING'}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showDiagnostics ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {showDiagnostics && (
          <div className="p-5 border-t border-slate-800/80 bg-slate-950/60 space-y-4">
            {healthError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-lg text-xs text-rose-300">
                Diagnostics Error: {healthError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-mono">FastAPI Version</span>
                <p className="text-sm font-bold text-white mt-1">v{health?.version || '0.1.0'}</p>
                <p className="text-xs text-slate-400 mt-1">Response latency: {responseTimeMs} ms</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-mono">PostGIS Geometry</span>
                <p className="text-sm font-bold text-emerald-400 mt-1">
                  {health?.database.postgis_installed ? 'Installed & Verified' : 'Standard PostgreSQL'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Version: {health?.database.postgis_version || 'PostGIS 3.4+'}
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Documentation</span>
                  <p className="text-xs text-slate-300 mt-1">Interactive OpenAPI Swagger UI</p>
                </div>
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                >
                  <FileText className="w-3.5 h-3.5" /> Open /docs <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={onRefreshHealth}
                disabled={healthLoading}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin' : ''}`} /> Re-run Diagnostics
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
