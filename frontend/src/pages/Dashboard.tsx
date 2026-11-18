import React, { useState, useEffect } from 'react';
import { HealthResponse, TabType } from '../types/health';
import { useAuth } from '../context/AuthContext';
import { Farm } from '../types/farm';
import { WeatherResponse, RainfallResponse, SoilProfileResponse } from '../types/intelligence';
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
  Plus, 
  Droplets, 
  Layers, 
  ShieldAlert, 
  Loader2, 
  Clock, 
  ArrowUpRight,
  Trash2,
  Pencil,
  RotateCw,
  AlertCircle,
  Calendar,
  X
} from 'lucide-react';
import { 
  getFarmsApi, 
  getWeatherApi, 
  getRainfallApi, 
  getSoilProfileApi,
  getTasksApi,
  createTaskApi,
  toggleTaskApi,
  updateTaskApi,
  deleteTaskApi
} from '../services/api';
import { FarmTask, TaskUpdatePayload } from '../types/task';

interface DashboardProps {
  health: HealthResponse | null;
  loading: boolean;
  error: string | null;
  responseTimeMs: number;
  onRefresh: () => void;
  onNavigate?: (tab: TabType) => void;
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
  const [tasksLoading, setTasksLoading] = useState<boolean>(false);
  const [taskSyncError, setTaskSyncError] = useState<string | null>(null);
  const [taskActionError, setTaskActionError] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [showAddTask, setShowAddTask] = useState<boolean>(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Edit Task State
  const [editingTask, setEditingTask] = useState<FarmTask | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDueDate, setEditDueDate] = useState<string>('');
  const [editPriority, setEditPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [editCategory, setEditCategory] = useState<string>('general');
  const [isUpdatingTask, setIsUpdatingTask] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

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

  // Load environmental intelligence when selected farm changes or defaults
  useEffect(() => {
    const lat = selectedFarm?.latitude || 11.0168; // Default Coimbatore
    const lng = selectedFarm?.longitude || 76.9558;

    setEnvLoading(true);
    Promise.all([
      getWeatherApi(lat, lng).catch(() => null),
      getRainfallApi(lat, lng).catch(() => null),
      getSoilProfileApi(lat, lng).catch(() => null),
    ])
      .then(([weatherRes, rainfallRes, soilRes]) => {
        if (weatherRes) setWeather(weatherRes);
        if (rainfallRes) setRainfall(rainfallRes);
        if (soilRes) setSoil(soilRes);
      })
      .finally(() => setEnvLoading(false));
  }, [selectedFarm]);

  // Load tasks from backend when authenticated
  const loadTasks = async () => {
    if (!isAuthenticated) {
      setTasks(INITIAL_TASKS);
      setTaskSyncError(null);
      setTasksLoading(false);
      return;
    }

    setTasksLoading(true);
    setTaskSyncError(null);
    try {
      const data = await getTasksApi(selectedFarm?.id);
      if (Array.isArray(data)) {
        // Always respect valid array response (even if empty, length === 0)
        setTasks(data);
      } else {
        setTasks([]);
      }
    } catch (err: any) {
      console.error('Failed to sync tasks from API:', err);
      setTaskSyncError(err?.message || 'Failed to sync tasks from cloud');
      // Do not silently substitute demo data for authenticated users on failure
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [isAuthenticated, selectedFarm?.id]);

  const handleToggleTask = async (taskId: string) => {
    setTaskActionError(null);
    // Optimistic local update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );

    if (isAuthenticated && !taskId.startsWith('t-')) {
      try {
        await toggleTaskApi(taskId);
      } catch (err: any) {
        console.error('Failed to toggle task via API:', err);
        // Rollback state
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
        );
        setTaskActionError(`Failed to update task status: ${err?.message || 'Server error'}`);
      }
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const title = newTaskTitle.trim();
    setNewTaskTitle('');
    setShowAddTask(false);
    setTaskActionError(null);

    if (isAuthenticated) {
      try {
        const created = await createTaskApi({
          title,
          due_date: 'Scheduled',
          category: 'general',
          priority: 'medium',
          farm_id: selectedFarm?.id || null,
          completed: false,
        });
        setTasks((prev) => [created, ...prev]);
      } catch (err: any) {
        console.error('Failed to create task via API:', err);
        const fallbackTask: FarmTask = {
          id: `task-${Date.now()}`,
          title,
          due_date: 'Scheduled',
          dueDate: 'Scheduled',
          category: 'general',
          priority: 'medium',
          completed: false,
        };
        setTasks((prev) => [fallbackTask, ...prev]);
        setTaskActionError(`Task created offline: ${err?.message || 'Failed to sync to cloud'}`);
      }
    } else {
      const fallbackTask: FarmTask = {
        id: `task-${Date.now()}`,
        title,
        due_date: 'Scheduled',
        dueDate: 'Scheduled',
        category: 'general',
        priority: 'medium',
        completed: false,
      };
      setTasks((prev) => [fallbackTask, ...prev]);
    }
  };

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingTaskId === taskId) return;
    setTaskActionError(null);

    // Preserve previous state for rollback
    const previousTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    if (isAuthenticated && !taskId.startsWith('t-') && !taskId.startsWith('task-')) {
      setDeletingTaskId(taskId);
      try {
        await deleteTaskApi(taskId);
      } catch (err: any) {
        console.error('Failed to delete task via API:', err);
        // Rollback to prior list on failure
        setTasks(previousTasks);
        setTaskActionError(`Failed to delete task: ${err?.message || 'Server error'}`);
      } finally {
        setDeletingTaskId(null);
      }
    }
  };

  const openEditModal = (task: FarmTask, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDueDate(task.due_date || task.dueDate || 'Scheduled');
    setEditPriority(task.priority || 'medium');
    setEditCategory(task.category || 'general');
    setEditError(null);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if (!editTitle.trim()) {
      setEditError('Task title cannot be empty.');
      return;
    }

    setIsUpdatingTask(true);
    setEditError(null);

    const updatedPayload: TaskUpdatePayload = {
      title: editTitle.trim(),
      due_date: editDueDate.trim() || 'Scheduled',
      priority: editPriority,
      category: editCategory,
    };

    if (isAuthenticated && !editingTask.id.startsWith('t-') && !editingTask.id.startsWith('task-')) {
      try {
        const result = await updateTaskApi(editingTask.id, updatedPayload);
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? result : t)));
        setEditingTask(null);
      } catch (err: any) {
        console.error('Failed to update task via API:', err);
        setEditError(`Failed to update task: ${err?.message || 'Server error'}`);
      } finally {
        setIsUpdatingTask(false);
      }
    } else {
      // Local/demo update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                title: updatedPayload.title!,
                due_date: updatedPayload.due_date!,
                dueDate: updatedPayload.due_date!,
                priority: updatedPayload.priority!,
                category: updatedPayload.category!,
              }
            : t
        )
      );
      setIsUpdatingTask(false);
      setEditingTask(null);
    }
  };

  // Aggregated metrics
  const totalFarms = farms.length;
  const totalHectares = farms.reduce((acc, f) => acc + (f.total_area_hectares || 0), 0);
  const totalAcres = totalHectares * 2.47105;
  const totalFields = farms.reduce((acc, f) => acc + (f.fields?.length || 0), 0);
  const allCrops = farms.flatMap((f) => f.fields?.flatMap((field) => field.crops || []) || []);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Top Bar: Greeting & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Welcome back, {user?.full_name ? user.full_name.split(' ')[0] : 'Farmer'}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-neutral-500">Active Farm:</span>
            {farms.length > 0 ? (
              <select
                value={selectedFarm?.id || ''}
                onChange={(e) => {
                  const f = farms.find((farm) => farm.id === e.target.value);
                  if (f) setSelectedFarm(f);
                }}
                className="bg-white border border-neutral-300 text-neutral-900 text-xs font-medium rounded-lg px-2.5 py-1 focus:outline-none focus:border-forest-600"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.total_area_hectares ? `${f.total_area_hectares.toFixed(1)} ha` : 'No boundary'})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-medium text-neutral-700">Coimbatore Region (Demo)</span>
            )}
          </div>
        </div>

        {/* Quick Shortcuts */}
        {onNavigate && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('smart-farm-map')}
              className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-forest-700" />
              <span>Map</span>
            </button>
            <button
              onClick={() => onNavigate('ai-mentor')}
              className="px-3 py-1.5 bg-forest-700 hover:bg-forest-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Sprout className="w-3.5 h-3.5" />
              <span>AI Mentor</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Farms</span>
            <Tractor className="w-4 h-4 text-forest-700" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">
            {farmsLoading ? <Loader2 className="w-5 h-5 animate-spin text-neutral-400" /> : totalFarms}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            {isAuthenticated ? 'Active holdings' : 'Sign in to sync'}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Total Area</span>
            <MapPin className="w-4 h-4 text-forest-700" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">
            {totalHectares > 0 ? `${totalHectares.toFixed(1)} ha` : '2.5 ha'}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            ≈ {totalAcres > 0 ? totalAcres.toFixed(1) : '6.2'} acres
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Sub-Fields</span>
            <Layers className="w-4 h-4 text-forest-700" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">
            {totalFields > 0 ? totalFields : '3'}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Irrigation plots</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Active Crops</span>
            <Sprout className="w-4 h-4 text-forest-700" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">
            {allCrops.length > 0 ? allCrops.length : '2'}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">In cultivation</p>
        </div>
      </div>

      {/* 3. Environmental Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Weather Card */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-xs text-neutral-900 uppercase tracking-wide">Weather</h3>
              </div>
              <span className="text-[11px] text-neutral-500 font-medium">
                {selectedFarm?.name || 'Local'}
              </span>
            </div>

            {envLoading ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
              </div>
            ) : weather ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-neutral-900">
                    {weather.current?.temperature_c !== undefined ? `${weather.current.temperature_c.toFixed(1)}°C` : '28.5°C'}
                  </span>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    {weather.current?.condition || 'Favorable'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600">
                  <div className="bg-neutral-50 p-2 rounded-lg">
                    <span className="text-neutral-500 text-[10px] block">Humidity</span>
                    <span className="font-semibold text-neutral-900">{weather.current?.humidity_percent ?? 65}%</span>
                  </div>
                  <div className="bg-neutral-50 p-2 rounded-lg">
                    <span className="text-neutral-500 text-[10px] block">Wind</span>
                    <span className="font-semibold text-neutral-900">{weather.current?.wind_speed_kmh ?? 12} km/h</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 text-xs text-neutral-400">Syncing weather...</div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-end">
            {onNavigate && (
              <button 
                onClick={() => onNavigate('farm-analysis')}
                className="text-xs text-forest-700 hover:text-forest-900 font-medium inline-flex items-center gap-1"
              >
                Detailed Analysis <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Rainfall Card */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-sky-600" />
                <h3 className="font-semibold text-xs text-neutral-900 uppercase tracking-wide">Rainfall</h3>
              </div>
              <span className="text-[11px] text-neutral-500 font-medium">
                {rainfall?.rainfall_trend || 'Normal'}
              </span>
            </div>

            {envLoading ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
              </div>
            ) : rainfall ? (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-neutral-50 p-2 rounded-lg">
                    <span className="text-neutral-500 text-[10px] block">Past 14 Days</span>
                    <span className="text-sm font-bold text-neutral-900">
                      {rainfall.recent_14_day_total_mm?.toFixed(1) ?? '28.4'} mm
                    </span>
                  </div>
                  <div className="bg-neutral-50 p-2 rounded-lg">
                    <span className="text-neutral-500 text-[10px] block">7-Day Forecast</span>
                    <span className="text-sm font-bold text-sky-700">
                      {rainfall.forecast_7_day_total_mm?.toFixed(1) ?? '15.2'} mm
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-neutral-600 bg-neutral-50 p-2 rounded-lg">
                  {rainfall.forecast_7_day_total_mm && rainfall.forecast_7_day_total_mm > 40
                    ? 'Heavy rain forecast. Hold off fertilizer top-dressing.'
                    : 'Balanced precipitation forecast.'}
                </p>
              </div>
            ) : (
              <div className="mt-3 text-xs text-neutral-400">Loading rainfall data...</div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-end">
            {onNavigate && (
              <button 
                onClick={() => onNavigate('irrigation')}
                className="text-xs text-forest-700 hover:text-forest-900 font-medium inline-flex items-center gap-1"
              >
                Irrigation Calculator <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Soil Health Card */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-forest-700" />
                <h3 className="font-semibold text-xs text-neutral-900 uppercase tracking-wide">Soil Health</h3>
              </div>
              <span className="text-[11px] text-neutral-500 font-medium">
                {soil?.texture_class || 'Clay Loam'}
              </span>
            </div>

            {envLoading ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
              </div>
            ) : soil ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between text-xs bg-neutral-50 p-2 rounded-lg">
                  <span className="text-neutral-600">pH Level</span>
                  <span className="font-bold text-neutral-900">
                    {soil.ph?.value?.toFixed(1) ?? '6.5'} (Optimal)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                  <div className="bg-neutral-50 p-1.5 rounded-lg">
                    <span className="text-[10px] text-neutral-500 block">N</span>
                    <span className="font-bold text-neutral-900 text-xs">
                      {soil.nitrogen_n?.value?.toFixed(0) ?? '180'}
                    </span>
                  </div>
                  <div className="bg-neutral-50 p-1.5 rounded-lg">
                    <span className="text-[10px] text-neutral-500 block">P</span>
                    <span className="font-bold text-neutral-900 text-xs">
                      {soil.phosphorus_p?.value?.toFixed(0) ?? '42'}
                    </span>
                  </div>
                  <div className="bg-neutral-50 p-1.5 rounded-lg">
                    <span className="text-[10px] text-neutral-500 block">K</span>
                    <span className="font-bold text-neutral-900 text-xs">
                      {soil.potassium_k?.value?.toFixed(0) ?? '210'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 text-xs text-neutral-400">Loading soil data...</div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-end">
            {onNavigate && (
              <button 
                onClick={() => onNavigate('fertilizer')}
                className="text-xs text-forest-700 hover:text-forest-900 font-medium inline-flex items-center gap-1"
              >
                Nutrient Advisor <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Operations: Activities & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Current Farming Activities */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-forest-700" />
                <h3 className="font-semibold text-xs text-neutral-900 uppercase tracking-wide">Farming Activities</h3>
              </div>
              <span className="text-xs text-neutral-500">Current Season</span>
            </div>

            <div className="mt-3 space-y-2">
              {allCrops.length > 0 ? (
                allCrops.map((c, i) => (
                  <div key={i} className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">{c.name}</h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Planted: {c.planting_date || 'Active season'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-100">
                      Active
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">Rice (Paddy - ADT 45)</h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        North Parcel (1.2 ha) • Active Tillering
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-100">
                      Healthy
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">Maize / Sweet Corn</h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        South Drip Zone (0.8 ha) • Flowering
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-100">
                      Irrigation Due
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-end">
            {onNavigate && (
              <button
                onClick={() => onNavigate('my-farms')}
                className="text-xs text-forest-700 hover:text-forest-900 font-medium inline-flex items-center gap-1"
              >
                Manage Farms <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-forest-700" />
                <h3 className="font-semibold text-xs text-neutral-900 uppercase tracking-wide">Upcoming Tasks</h3>
              </div>
              <div className="flex items-center gap-2">
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('smart-farming-calendar')}
                    className="text-xs text-forest-700 hover:text-forest-900 font-medium flex items-center gap-1 bg-forest-50 hover:bg-forest-100 px-2 py-0.5 rounded-lg border border-forest-200 transition-colors"
                    title="Open full interactive Smart Farming Calendar"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Full Calendar
                  </button>
                )}
                <button
                  onClick={() => setShowAddTask(!showAddTask)}
                  className="text-xs text-forest-700 hover:text-forest-900 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Task
                </button>
              </div>
            </div>

            {/* Quick Add Form */}
            {showAddTask && (
              <form onSubmit={handleAddTask} className="mt-2.5 flex gap-2">
                <input
                  type="text"
                  placeholder="Task title..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-forest-600"
                />
                <button
                  type="submit"
                  className="bg-forest-700 hover:bg-forest-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  Add
                </button>
              </form>
            )}

            {/* Task Error Banners */}
            {taskSyncError && (
              <div className="mt-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="truncate">{taskSyncError}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={loadTasks}
                    disabled={tasksLoading}
                    className="text-[11px] font-medium text-rose-700 hover:text-rose-900 underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <RotateCw className={`w-3 h-3 ${tasksLoading ? 'animate-spin' : ''}`} />
                    Retry
                  </button>
                  <button
                    onClick={() => setTaskSyncError(null)}
                    className="text-rose-400 hover:text-rose-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {taskActionError && (
              <div className="mt-2 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="truncate">{taskActionError}</span>
                </div>
                <button
                  onClick={() => setTaskActionError(null)}
                  className="text-rose-400 hover:text-rose-600 p-0.5 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Tasks List */}
            <div className="mt-2.5 space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {tasksLoading && (
                <div className="flex items-center justify-center py-4 text-neutral-400 gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
                  <span>Syncing tasks...</span>
                </div>
              )}
              {!tasksLoading && !taskSyncError && tasks.length === 0 && (
                <div className="text-center py-6 text-neutral-400 text-xs">
                  <CheckSquare className="w-5 h-5 mx-auto mb-1.5 opacity-40 text-neutral-400" />
                  <p className="font-medium text-neutral-600">No tasks found</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {selectedFarm ? `No tasks scheduled for ${selectedFarm.name}.` : 'Click "+ Add Task" to schedule your first activity.'}
                  </p>
                </div>
              )}
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`group p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    task.completed
                      ? 'bg-neutral-50/60 border-neutral-100 opacity-60'
                      : 'bg-neutral-50 border-neutral-100 hover:border-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {task.completed ? (
                      <CheckSquare className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className={`text-xs truncate ${task.completed ? 'line-through text-neutral-400' : 'text-neutral-800 font-medium'}`}>
                        {task.title}
                      </p>
                      <p className="text-[10px] text-neutral-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {task.due_date || task.dueDate || 'Scheduled'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {task.priority === 'high' && !task.completed && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                        High
                      </span>
                    )}
                    <button
                      onClick={(e) => openEditModal(task, e)}
                      title="Edit task"
                      className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-forest-700 transition-opacity p-0.5 rounded hover:bg-neutral-200/50"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteTask(task.id, e)}
                      disabled={deletingTaskId === task.id}
                      title="Delete task"
                      className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-600 transition-opacity p-0.5 rounded hover:bg-neutral-200/50 disabled:opacity-50"
                    >
                      {deletingTaskId === task.id ? (
                        <Loader2 className="w-3 h-3 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 text-[11px] text-neutral-500">
            {tasks.filter((t) => !t.completed).length} pending actions
          </div>
        </div>
      </div>

      {/* 5. Farm Advisories */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5">
        <h3 className="font-semibold text-xs text-neutral-900 uppercase tracking-wide pb-3 border-b border-neutral-100">
          Farm Advisories
        </h3>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Irrigation Deficit */}
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-neutral-900 text-xs font-semibold mb-1">
                <Droplets className="w-3.5 h-3.5 text-sky-600" /> Irrigation
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                ETc estimated at 4.2 mm/day. Net supplemental drip needed is 2.8 hrs/day.
              </p>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('irrigation')}
                className="mt-2.5 text-xs text-forest-700 hover:text-forest-900 font-medium inline-flex items-center gap-1 self-start"
              >
                Configure <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Fertilizer Nutrient */}
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-neutral-900 text-xs font-semibold mb-1">
                <Sprout className="w-3.5 h-3.5 text-forest-700" /> Nutrients
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Soil Nitrogen moderate (180 kg/ha). Secondary top-dress of 45 kg Urea/ha recommended.
              </p>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('fertilizer')}
                className="mt-2.5 text-xs text-forest-700 hover:text-forest-900 font-medium inline-flex items-center gap-1 self-start"
              >
                Calculate <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Disease Prevention */}
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-neutral-900 text-xs font-semibold mb-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Disease Alert
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Humidity at 82% increases fungal risk. Inspect lower foliage for early lesions.
              </p>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('disease-detection')}
                className="mt-2.5 text-xs text-forest-700 hover:text-forest-900 font-medium inline-flex items-center gap-1 self-start"
              >
                Scan Leaf <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2 text-forest-800 font-semibold text-sm">
                <Pencil className="w-4 h-4 text-forest-700" />
                <span>Edit Farm Task</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isUpdatingTask) setEditingTask(null);
                }}
                className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-forest-600"
                  placeholder="e.g. Irrigate South Field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Due Date / Time
                  </label>
                  <input
                    type="text"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-forest-600"
                    placeholder="e.g. Today, 06:00 AM"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as 'high' | 'medium' | 'low')}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-forest-600"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as 'irrigation' | 'fertilizer' | 'scouting' | 'general')}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-forest-600"
                >
                  <option value="general">General</option>
                  <option value="irrigation">Irrigation</option>
                  <option value="fertilizer">Fertilizer</option>
                  <option value="scouting">Scouting</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  disabled={isUpdatingTask}
                  onClick={() => setEditingTask(null)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingTask}
                  className="px-3.5 py-1.5 rounded-lg bg-forest-700 hover:bg-forest-800 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isUpdatingTask && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Dashboard;
