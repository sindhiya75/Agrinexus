import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Farm, Field, Crop } from '../types/farm';
import {
  FarmTask,
  ActivityCategory,
  ActivityPriority,
  ActivityStatus,
  TaskCreatePayload,
  TaskUpdatePayload,
} from '../types/task';
import {
  CalendarViewMode,
  GenerateSuggestionsResponse,
} from '../types/calendar';
import {
  getFarmsApi,
  getFarmDetailApi,
  getCalendarActivitiesApi,
  createTaskApi,
  updateTaskApi,
  toggleTaskApi,
  deleteTaskApi,
  generateCropSuggestionsApi,
} from '../services/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Filter,
  CheckSquare,
  Square,
  Clock,
  AlertCircle,
  AlertTriangle,
  CloudRain,
  Sun,
  Droplets,
  FlaskConical,
  Sprout,
  ShieldAlert,
  Wrench,
  Layers,
  MapPin,
  Check,
  X,
  Loader2,
  Trash2,
  Edit3,
} from 'lucide-react';

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; bg: string; text: string; border: string }
> = {
  land_preparation: {
    label: 'Land Prep',
    icon: Layers,
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  sowing: {
    label: 'Sowing / Planting',
    icon: Sprout,
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  irrigation: {
    label: 'Irrigation',
    icon: Droplets,
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
  },
  fertilizer: {
    label: 'Fertilizer',
    icon: FlaskConical,
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
  },
  scouting: {
    label: 'Scouting / Monitoring',
    icon: AlertCircle,
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
  },
  crop_protection: {
    label: 'Crop Protection',
    icon: ShieldAlert,
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
  },
  harvest: {
    label: 'Harvest',
    icon: Sun,
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
  },
  maintenance: {
    label: 'Maintenance',
    icon: Wrench,
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    border: 'border-slate-200',
  },
  general: {
    label: 'General',
    icon: CheckSquare,
    bg: 'bg-neutral-50',
    text: 'text-neutral-700',
    border: 'border-neutral-200',
  },
};

export const SmartFarmingCalendar: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Navigation & View Mode
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Hierarchy Data
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmDetails, setFarmDetails] = useState<Record<string, Farm>>({});
  const [farmsLoading, setFarmsLoading] = useState<boolean>(false);

  // Filters State
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Calendar Activities State
  const [activities, setActivities] = useState<FarmTask[]>([]);
  const [loadingActivities, setLoadingActivities] = useState<boolean>(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Activity Modal State (Create / Edit)
  const [activityModalOpen, setActivityModalOpen] = useState<boolean>(false);
  const [editingActivity, setEditingActivity] = useState<FarmTask | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formFarmId, setFormFarmId] = useState<string>('');
  const [formFieldId, setFormFieldId] = useState<string>('');
  const [formCropId, setFormCropId] = useState<string>('');
  const [formCategory, setFormCategory] = useState<ActivityCategory>('general');
  const [formPriority, setFormPriority] = useState<ActivityPriority>('medium');
  const [formDueDate, setFormDueDate] = useState<string>('');
  const [formStartTime, setFormStartTime] = useState<string>('');
  const [formEndTime, setFormEndTime] = useState<string>('');
  const [formIsWeatherSensitive, setFormIsWeatherSensitive] = useState<boolean>(false);
  const [formStatus, setFormStatus] = useState<ActivityStatus>('pending');
  const [savingActivity, setSavingActivity] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Activity Details Modal
  const [viewDetailModalOpen, setViewDetailModalOpen] = useState<boolean>(false);
  const [selectedActivityDetail, setSelectedActivityDetail] = useState<FarmTask | null>(null);

  // Crop Stage Suggestions Modal
  const [suggestionModalOpen, setSuggestionModalOpen] = useState<boolean>(false);
  const [sugFarmId, setSugFarmId] = useState<string>('');
  const [sugCropId, setSugCropId] = useState<string>('');
  const [sugPlantingDate, setSugPlantingDate] = useState<string>('');
  const [generatingSuggestions, setGeneratingSuggestions] = useState<boolean>(false);
  const [suggestionResult, setSuggestionResult] = useState<GenerateSuggestionsResponse | null>(null);
  const [selectedSuggestionIndices, setSelectedSuggestionIndices] = useState<Set<number>>(new Set());
  const [schedulingSuggestions, setSchedulingSuggestions] = useState<boolean>(false);
  const [suggestionModalError, setSuggestionModalError] = useState<string | null>(null);

  // -------------------------------------------------------------
  // 1. Load Farms and their nested Fields / Crops
  // -------------------------------------------------------------
  const loadFarms = useCallback(async () => {
    if (!isAuthenticated) return;
    setFarmsLoading(true);
    try {
      const farmList = await getFarmsApi();
      setFarms(farmList);
      if (farmList.length > 0 && !selectedFarmId) {
        setSelectedFarmId(farmList[0].id);
      }

      // Fetch details for all farms in parallel to have fields & crops cached
      const detailPromises = farmList.map((f) =>
        getFarmDetailApi(f.id)
          .then((d) => ({ id: f.id, data: d }))
          .catch(() => null)
      );
      const results = await Promise.all(detailPromises);
      const detailMap: Record<string, Farm> = {};
      results.forEach((r) => {
        if (r && r.data) {
          detailMap[r.id] = r.data;
        }
      });
      setFarmDetails(detailMap);
    } catch (err: any) {
      console.error('Failed to load farms:', err);
    } finally {
      setFarmsLoading(false);
    }
  }, [isAuthenticated, selectedFarmId]);

  useEffect(() => {
    loadFarms();
  }, [loadFarms]);

  // Derive active fields & crops based on selected farm
  const currentFarmFields: Field[] = useMemo(() => {
    if (!selectedFarmId) {
      // Gather all fields across all farms
      return Object.values(farmDetails).flatMap((f) => f.fields || []);
    }
    return farmDetails[selectedFarmId]?.fields || [];
  }, [selectedFarmId, farmDetails]);

  const currentFieldCrops: Crop[] = useMemo(() => {
    if (selectedFieldId) {
      const field = currentFarmFields.find((f) => f.id === selectedFieldId);
      return field?.crops || [];
    }
    // Gather all crops across current farm fields
    return currentFarmFields.flatMap((f) => f.crops || []);
  }, [selectedFieldId, currentFarmFields]);

  // Form cascading fields
  const formAvailableFields: Field[] = useMemo(() => {
    if (!formFarmId) return [];
    return farmDetails[formFarmId]?.fields || [];
  }, [formFarmId, farmDetails]);

  const formAvailableCrops: Crop[] = useMemo(() => {
    if (!formFieldId) {
      return formAvailableFields.flatMap((f) => f.crops || []);
    }
    const field = formAvailableFields.find((f) => f.id === formFieldId);
    return field?.crops || [];
  }, [formFieldId, formAvailableFields]);

  // -------------------------------------------------------------
  // 2. Load Calendar Activities
  // -------------------------------------------------------------
  const loadActivities = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingActivities(true);
    setActivityError(null);
    try {
      const data = await getCalendarActivitiesApi({
        farm_id: selectedFarmId || undefined,
        field_id: selectedFieldId || undefined,
        crop_id: selectedCropId || undefined,
        category: selectedCategory || undefined,
        status: (selectedStatus as ActivityStatus) || undefined,
      });
      setActivities(data);
    } catch (err: any) {
      setActivityError(err?.message || 'Failed to load calendar activities.');
    } finally {
      setLoadingActivities(false);
    }
  }, [isAuthenticated, selectedFarmId, selectedFieldId, selectedCropId, selectedCategory, selectedStatus]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Auto-dismiss success notification
  useEffect(() => {
    if (successBanner) {
      const t = setTimeout(() => setSuccessBanner(null), 5000);
      return () => clearTimeout(t);
    }
  }, [successBanner]);

  // -------------------------------------------------------------
  // 3. Calendar Date Range Calculations
  // -------------------------------------------------------------
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formatHeaderTitle = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (viewMode === 'week') {
      const curr = new Date(currentDate);
      const first = curr.getDate() - curr.getDay();
      const firstDay = new Date(curr.setDate(first));
      const lastDay = new Date(curr.setDate(first + 6));
      return `${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Helper to extract clean YYYY-MM-DD from activity
  const getActivityDateStr = (t: FarmTask): string => {
    const raw = t.due_date || t.dueDate || '';
    if (raw.length >= 10 && raw[4] === '-' && raw[7] === '-') {
      return raw.substring(0, 10);
    }
    if (t.created_at) {
      return t.created_at.substring(0, 10);
    }
    return new Date().toISOString().substring(0, 10);
  };

  // Monthly calendar grid generation (42 cells: 6 weeks x 7 days)
  const monthCalendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 6 = Sat
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const todayStr = new Date().toISOString().substring(0, 10);
    const cells = [];

    // Map activities by date
    const actsByDate: Record<string, FarmTask[]> = {};
    activities.forEach((act) => {
      const dStr = getActivityDateStr(act);
      if (!actsByDate[dStr]) actsByDate[dStr] = [];
      actsByDate[dStr].push(act);
    });

    // Previous month filler days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const d = new Date(year, month - 1, dayNum);
      const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        date: d,
        dayNum,
        dateString,
        isCurrentMonth: false,
        isToday: dateString === todayStr,
        activities: actsByDate[dateString] || [],
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const d = new Date(year, month, i);
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push({
        date: d,
        dayNum: i,
        dateString,
        isCurrentMonth: true,
        isToday: dateString === todayStr,
        activities: actsByDate[dateString] || [],
      });
    }

    // Next month filler days (fill out remaining to reach 35 or 42 cells)
    const totalFilled = cells.length;
    const targetTotal = totalFilled <= 35 ? 35 : 42;
    const remaining = targetTotal - totalFilled;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push({
        date: d,
        dayNum: i,
        dateString,
        isCurrentMonth: false,
        isToday: dateString === todayStr,
        activities: actsByDate[dateString] || [],
      });
    }

    return cells;
  }, [year, month, activities]);

  // Weekly calendar days (7 days)
  const weekCalendarDays = useMemo(() => {
    const curr = new Date(currentDate);
    const first = curr.getDate() - curr.getDay();
    const days = [];
    const todayStr = new Date().toISOString().substring(0, 10);

    const actsByDate: Record<string, FarmTask[]> = {};
    activities.forEach((act) => {
      const dStr = getActivityDateStr(act);
      if (!actsByDate[dStr]) actsByDate[dStr] = [];
      actsByDate[dStr].push(act);
    });

    for (let i = 0; i < 7; i++) {
      const d = new Date(curr.getFullYear(), curr.getMonth(), first + i);
      const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({
        date: d,
        dateString,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: dateString === todayStr,
        activities: actsByDate[dateString] || [],
      });
    }
    return days;
  }, [currentDate, activities]);

  // Daily calendar activities for current date
  const dayCalendarActivities = useMemo(() => {
    const todayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    return activities.filter((act) => getActivityDateStr(act) === todayStr);
  }, [currentDate, activities]);

  // Quick stats
  const totalCount = activities.length;
  const pendingCount = activities.filter((a) => !a.completed && a.status !== 'cancelled').length;
  const completedCount = activities.filter((a) => a.completed || a.status === 'completed').length;
  const weatherRiskCount = activities.filter((a) => a.is_weather_sensitive && !a.completed).length;

  // -------------------------------------------------------------
  // 4. Activity CRUD Operations
  // -------------------------------------------------------------
  const handleOpenCreateModal = (presetDate?: string) => {
    setEditingActivity(null);
    setFormTitle('');
    setFormDescription('');
    setFormFarmId(selectedFarmId || (farms.length > 0 ? farms[0].id : ''));
    setFormFieldId(selectedFieldId || '');
    setFormCropId(selectedCropId || '');
    setFormCategory('general');
    setFormPriority('medium');
    setFormDueDate(presetDate || new Date().toISOString().substring(0, 10));
    setFormStartTime('08:00');
    setFormEndTime('10:00');
    setFormIsWeatherSensitive(false);
    setFormStatus('pending');
    setModalError(null);
    setActivityModalOpen(true);
  };

  const handleOpenEditModal = (activity: FarmTask, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingActivity(activity);
    setFormTitle(activity.title);
    setFormDescription(activity.description || '');
    setFormFarmId(activity.farm_id || (farms.length > 0 ? farms[0].id : ''));
    setFormFieldId(activity.field_id || '');
    setFormCropId(activity.crop_id || '');
    setFormCategory((activity.category as ActivityCategory) || 'general');
    setFormPriority(activity.priority || 'medium');
    setFormDueDate(getActivityDateStr(activity));
    setFormStartTime(activity.start_time || '');
    setFormEndTime(activity.end_time || '');
    setFormIsWeatherSensitive(Boolean(activity.is_weather_sensitive));
    setFormStatus(activity.status || (activity.completed ? 'completed' : 'pending'));
    setModalError(null);
    setViewDetailModalOpen(false);
    setActivityModalOpen(true);
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setModalError('Activity title is required.');
      return;
    }

    setSavingActivity(true);
    setModalError(null);

    try {
      if (editingActivity) {
        // Update existing activity
        const payload: TaskUpdatePayload = {
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          farm_id: formFarmId || null,
          field_id: formFieldId || null,
          crop_id: formCropId || null,
          category: formCategory,
          priority: formPriority,
          due_date: formDueDate,
          start_time: formStartTime || null,
          end_time: formEndTime || null,
          is_weather_sensitive: formIsWeatherSensitive,
          status: formStatus,
          completed: formStatus === 'completed',
        };
        const updated = await updateTaskApi(editingActivity.id, payload);
        setActivities((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        setSuccessBanner(`Updated activity: "${updated.title}"`);
      } else {
        // Create new activity
        const payload: TaskCreatePayload = {
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          farm_id: formFarmId || null,
          field_id: formFieldId || null,
          crop_id: formCropId || null,
          category: formCategory,
          priority: formPriority,
          due_date: formDueDate,
          start_time: formStartTime || null,
          end_time: formEndTime || null,
          is_weather_sensitive: formIsWeatherSensitive,
          status: formStatus,
          completed: formStatus === 'completed',
        };
        const created = await createTaskApi(payload);
        setActivities((prev) => [created, ...prev]);
        setSuccessBanner(`Added activity: "${created.title}"`);
      }
      setActivityModalOpen(false);
    } catch (err: any) {
      setModalError(err?.message || 'Failed to save activity.');
    } finally {
      setSavingActivity(false);
    }
  };

  const handleToggleActivity = async (activityId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Optimistic toggle
    setActivities((prev) =>
      prev.map((a) => {
        if (a.id === activityId) {
          const nextCompleted = !a.completed;
          return {
            ...a,
            completed: nextCompleted,
            status: nextCompleted ? 'completed' : 'pending',
          };
        }
        return a;
      })
    );

    try {
      const updated = await toggleTaskApi(activityId);
      setActivities((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      if (selectedActivityDetail && selectedActivityDetail.id === activityId) {
        setSelectedActivityDetail(updated);
      }
    } catch (err: any) {
      console.error('Failed to toggle activity state:', err);
      // Rollback
      loadActivities();
    }
  };

  const handleDeleteActivity = async (activityId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavingActivity(true);
    try {
      await deleteTaskApi(activityId);
      setActivities((prev) => prev.filter((a) => a.id !== activityId));
      setSuccessBanner('Activity deleted successfully.');
      setViewDetailModalOpen(false);
      setActivityModalOpen(false);
    } catch (err: any) {
      setModalError(err?.message || 'Failed to delete activity.');
    } finally {
      setSavingActivity(false);
    }
  };

  const handleOpenDetailModal = (activity: FarmTask, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedActivityDetail(activity);
    setViewDetailModalOpen(true);
  };

  // -------------------------------------------------------------
  // 5. Growth Stage Suggestions Workflow
  // -------------------------------------------------------------
  const handleOpenSuggestionsModal = () => {
    setSugFarmId(selectedFarmId || (farms.length > 0 ? farms[0].id : ''));
    setSugCropId('');
    setSugPlantingDate('');
    setSuggestionResult(null);
    setSelectedSuggestionIndices(new Set());
    setSuggestionModalError(null);
    setSuggestionModalOpen(true);
  };

  // Crops available in chosen suggestion farm
  const suggestionAvailableCrops: { crop: Crop; fieldName: string }[] = useMemo(() => {
    if (!sugFarmId) return [];
    const fields = farmDetails[sugFarmId]?.fields || [];
    const list: { crop: Crop; fieldName: string }[] = [];
    fields.forEach((f) => {
      (f.crops || []).forEach((c) => {
        list.push({ crop: c, fieldName: f.name });
      });
    });
    return list;
  }, [sugFarmId, farmDetails]);

  // When crop selected in suggestion modal, pre-fill planting date if already set
  const handleSugCropChange = (cropId: string) => {
    setSugCropId(cropId);
    const item = suggestionAvailableCrops.find((c) => c.crop.id === cropId);
    if (item && item.crop.planting_date) {
      setSugPlantingDate(item.crop.planting_date);
    } else {
      setSugPlantingDate(new Date().toISOString().substring(0, 10));
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!sugFarmId || !sugCropId) {
      setSuggestionModalError('Please select both a farm and a crop to generate recommendations.');
      return;
    }
    setGeneratingSuggestions(true);
    setSuggestionModalError(null);
    setSuggestionResult(null);

    try {
      const res = await generateCropSuggestionsApi({
        farm_id: sugFarmId,
        crop_id: sugCropId,
        planting_date: sugPlantingDate || null,
      });
      setSuggestionResult(res);
      // Select all by default
      const allIndices = new Set(res.suggestions.map((_, i) => i));
      setSelectedSuggestionIndices(allIndices);
    } catch (err: any) {
      setSuggestionModalError(err?.message || 'Failed to generate growth-stage suggestions.');
    } finally {
      setGeneratingSuggestions(false);
    }
  };

  const toggleSuggestionSelection = (index: number) => {
    setSelectedSuggestionIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleScheduleSuggestions = async () => {
    if (!suggestionResult || selectedSuggestionIndices.size === 0) return;
    setSchedulingSuggestions(true);
    setSuggestionModalError(null);

    try {
      const selectedList = suggestionResult.suggestions.filter((_, i) =>
        selectedSuggestionIndices.has(i)
      );

      // Create tasks sequentially to avoid overwhelming SQLite / PostgreSQL in test/prod
      let createdCount = 0;
      for (const sug of selectedList) {
        await createTaskApi({
          farm_id: suggestionResult.farm_id,
          field_id: suggestionResult.field_id,
          crop_id: suggestionResult.crop_id,
          title: sug.title,
          description: `${sug.description}\n[Growth Stage: ${sug.growth_stage} | DAS: ${sug.days_after_sowing}]`,
          category: sug.category as ActivityCategory,
          priority: sug.priority,
          due_date: sug.suggested_date,
          start_time: '07:30',
          end_time: '10:00',
          status: 'pending',
          is_weather_sensitive: sug.is_weather_sensitive,
          source: 'suggested',
        });
        createdCount++;
      }

      setSuccessBanner(`Scheduled ${createdCount} growth-stage activities for ${suggestionResult.crop_name}!`);
      setSuggestionModalOpen(false);
      loadActivities();
    } catch (err: any) {
      setSuggestionModalError(err?.message || 'Failed to schedule activities.');
    } finally {
      setSchedulingSuggestions(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl pb-16 font-sans">
      {/* ------------------------------------------------------------- */}
      {/* 1. Header & Page Introduction */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-forest-700 text-white shadow-sm">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Smart Farming Calendar</h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Orchestrate crop growth stages, weather-informed operations, and daily farm tasks in one interactive view.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenSuggestionsModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-800 border border-forest-300 shadow-sm transition-colors"
          >
            <Sparkles className="w-4 h-4 text-forest-700" />
            <span>Crop Stage Suggestions</span>
          </button>
          <button
            onClick={() => handleOpenCreateModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-forest-700 hover:bg-forest-800 text-white shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Activity</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Activity Error Banner */}
      {activityError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{activityError}</span>
          </div>
          <button onClick={() => setActivityError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. Filter Bar & Quick Stats */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-neutral-500 font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-neutral-400" /> Filter:
          </span>

          {/* Farm Selector */}
          <select
            value={selectedFarmId}
            onChange={(e) => {
              setSelectedFarmId(e.target.value);
              setSelectedFieldId('');
              setSelectedCropId('');
            }}
            className="bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-forest-600 font-medium"
          >
            <option value="">{farmsLoading ? 'Loading farms...' : 'All Farms'}</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          {/* Field Selector */}
          <select
            value={selectedFieldId}
            onChange={(e) => {
              setSelectedFieldId(e.target.value);
              setSelectedCropId('');
            }}
            className="bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-forest-600 font-medium"
          >
            <option value="">All Fields</option>
            {currentFarmFields.map((fld) => (
              <option key={fld.id} value={fld.id}>
                {fld.name}
              </option>
            ))}
          </select>

          {/* Crop Selector */}
          <select
            value={selectedCropId}
            onChange={(e) => setSelectedCropId(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-forest-600 font-medium"
          >
            <option value="">All Crops</option>
            {currentFieldCrops.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.variety ? `(${c.variety})` : ''}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-forest-600 font-medium"
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-forest-600 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {(selectedFarmId || selectedFieldId || selectedCropId || selectedCategory || selectedStatus) && (
            <button
              onClick={() => {
                setSelectedFarmId('');
                setSelectedFieldId('');
                setSelectedCropId('');
                setSelectedCategory('');
                setSelectedStatus('');
              }}
              className="text-[11px] text-neutral-500 hover:text-neutral-800 underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Quick KPI Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-100 text-xs">
          <div className="bg-[#edf4ee] border border-forest-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-forest-800 font-medium">Total Activities</span>
            <span className="font-bold text-forest-900 bg-white/70 px-2 py-0.5 rounded-lg border border-forest-200">
              {totalCount}
            </span>
          </div>
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-amber-800 font-medium">Pending Execution</span>
            <span className="font-bold text-amber-900 bg-white/70 px-2 py-0.5 rounded-lg border border-amber-200">
              {pendingCount}
            </span>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-emerald-800 font-medium">Completed</span>
            <span className="font-bold text-emerald-900 bg-white/70 px-2 py-0.5 rounded-lg border border-emerald-200">
              {completedCount}
            </span>
          </div>
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-sky-800 font-medium flex items-center gap-1">
              <CloudRain className="w-3.5 h-3.5 text-sky-600" /> Weather Alerted
            </span>
            <span className="font-bold text-sky-900 bg-white/70 px-2 py-0.5 rounded-lg border border-sky-200">
              {weatherRiskCount}
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Calendar View Toolbar (Navigation & Mode Switch) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-neutral-200 rounded-2xl px-4 py-3 shadow-sm">
        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 transition-colors"
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1 text-xs font-semibold rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-800 transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 transition-colors"
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <h3 className="font-bold text-sm sm:text-base text-neutral-900 ml-2 tracking-tight">
            {formatHeaderTitle()}
          </h3>
          {loadingActivities && <Loader2 className="w-4 h-4 animate-spin text-forest-700 ml-2" />}
        </div>

        {/* View Mode Segmented Controls */}
        <div className="flex items-center bg-neutral-100 p-1 rounded-xl self-start sm:self-auto">
          {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                viewMode === mode
                  ? 'bg-white text-forest-800 shadow-sm border border-neutral-200/60'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. Calendar Views Rendering */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'month' && (
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Day Headers (Sun - Sat) */}
          <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50/80 text-center text-xs font-semibold text-neutral-600 py-2.5">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Grid Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-neutral-200">
            {monthCalendarDays.map((cell, idx) => {
              const displayLimit = 3;
              const hasMore = cell.activities.length > displayLimit;
              const visibleActs = cell.activities.slice(0, displayLimit);

              return (
                <div
                  key={idx}
                  onClick={() => handleOpenCreateModal(cell.dateString)}
                  className={`min-h-[110px] p-1.5 flex flex-col justify-between cursor-pointer transition-colors hover:bg-forest-50/30 ${
                    cell.isToday
                      ? 'bg-forest-50/60 font-medium'
                      : cell.isCurrentMonth
                      ? 'bg-white'
                      : 'bg-neutral-50/50 text-neutral-400'
                  }`}
                >
                  {/* Date Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full inline-block ${
                        cell.isToday
                          ? 'bg-forest-700 text-white font-bold'
                          : cell.isCurrentMonth
                          ? 'text-neutral-800 font-medium'
                          : 'text-neutral-400'
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                    {cell.activities.length > 0 && (
                      <span className="text-[10px] text-neutral-400 font-medium">
                        {cell.activities.length} {cell.activities.length === 1 ? 'act' : 'acts'}
                      </span>
                    )}
                  </div>

                  {/* Activity Chips */}
                  <div className="space-y-1 overflow-hidden flex-1">
                    {visibleActs.map((act) => {
                      const cfg = CATEGORY_CONFIG[act.category] || CATEGORY_CONFIG.general;
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={act.id}
                          onClick={(e) => handleOpenDetailModal(act, e)}
                          title={`${act.title} (${cfg.label})`}
                          className={`group text-[11px] px-1.5 py-1 rounded-lg border flex items-center justify-between gap-1 transition-all hover:scale-[1.01] ${
                            act.completed
                              ? 'bg-neutral-100 text-neutral-400 border-neutral-200 line-through opacity-70'
                              : `${cfg.bg} ${cfg.text} ${cfg.border}`
                          }`}
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            <Icon className="w-3 h-3 shrink-0" />
                            <span className="truncate font-medium">{act.title}</span>
                          </div>
                          {act.is_weather_sensitive && !act.completed && (
                            <span title="Weather sensitive">
                              <CloudRain className="w-3 h-3 text-sky-600 shrink-0" />
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {hasMore && (
                      <div className="text-[10px] text-forest-700 font-semibold pl-1">
                        +{cell.activities.length - displayLimit} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekCalendarDays.map((day, idx) => (
            <div
              key={idx}
              className={`bg-white border rounded-2xl p-3 flex flex-col justify-between shadow-sm ${
                day.isToday ? 'border-forest-600 ring-1 ring-forest-500 bg-forest-50/20' : 'border-neutral-200'
              }`}
            >
              {/* Day Header */}
              <div className="pb-2.5 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-neutral-500 uppercase">{day.dayName}</span>
                  <p className="text-base font-bold text-neutral-900">{day.dayNum}</p>
                </div>
                <button
                  onClick={() => handleOpenCreateModal(day.dateString)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-forest-700 hover:bg-forest-50"
                  title="Add activity for this day"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Day Activities List */}
              <div className="space-y-2 mt-2.5 flex-1 min-h-[160px]">
                {day.activities.length === 0 ? (
                  <p className="text-[11px] text-neutral-400 italic py-4 text-center">No activities</p>
                ) : (
                  day.activities.map((act) => {
                    const cfg = CATEGORY_CONFIG[act.category] || CATEGORY_CONFIG.general;
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={act.id}
                        onClick={() => handleOpenDetailModal(act)}
                        className={`p-2 rounded-xl border text-xs cursor-pointer transition-all hover:border-neutral-300 ${
                          act.completed
                            ? 'bg-neutral-50 text-neutral-400 border-neutral-200'
                            : `${cfg.bg} ${cfg.border}`
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <Icon className="w-3.5 h-3.5 shrink-0 text-forest-700" />
                            <p className={`font-semibold truncate ${act.completed ? 'line-through' : 'text-neutral-900'}`}>
                              {act.title}
                            </p>
                          </div>
                          <button
                            onClick={(e) => handleToggleActivity(act.id, e)}
                            className="p-0.5 text-neutral-400 hover:text-forest-700 shrink-0"
                          >
                            {act.completed ? (
                              <CheckSquare className="w-3.5 h-3.5 text-forest-700" />
                            ) : (
                              <Square className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {act.start_time && (
                          <div className="text-[10px] text-neutral-500 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {act.start_time} {act.end_time ? `- ${act.end_time}` : ''}
                            </span>
                          </div>
                        )}

                        {act.is_weather_sensitive && !act.completed && (
                          <div className="mt-1 text-[10px] text-sky-700 flex items-center gap-1">
                            <CloudRain className="w-3 h-3 text-sky-600" /> Weather sensitive
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'day' && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Scheduled Activities for {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {dayCalendarActivities.length} {dayCalendarActivities.length === 1 ? 'activity' : 'activities'} planned
              </p>
            </div>
            <button
              onClick={() => handleOpenCreateModal(currentDate.toISOString().substring(0, 10))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-forest-700 text-white hover:bg-forest-800 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Activity
            </button>
          </div>

          {dayCalendarActivities.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 space-y-2">
              <CalendarIcon className="w-8 h-8 mx-auto text-neutral-300" />
              <p className="font-semibold text-neutral-700 text-sm">No activities scheduled for this date</p>
              <p className="text-xs text-neutral-400">
                Click "+ Add Activity" or generate crop growth stage recommendations.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {dayCalendarActivities.map((act) => {
                const cfg = CATEGORY_CONFIG[act.category] || CATEGORY_CONFIG.general;
                const Icon = cfg.icon;
                return (
                  <div
                    key={act.id}
                    onClick={() => handleOpenDetailModal(act)}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-neutral-50/70 p-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={(e) => handleToggleActivity(act.id, e)}
                        className="mt-1 text-neutral-400 hover:text-forest-700 shrink-0"
                      >
                        {act.completed ? (
                          <CheckSquare className="w-4 h-4 text-forest-700" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-semibold ${act.completed ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
                            {act.title}
                          </p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border flex items-center gap-1 ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                            <Icon className="w-3 h-3 shrink-0" />
                            <span>{cfg.label}</span>
                          </span>
                          {act.priority === 'high' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                              High Priority
                            </span>
                          )}
                          {act.is_weather_sensitive && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-medium flex items-center gap-1">
                              <CloudRain className="w-3 h-3 text-sky-600" /> Weather Sensitive
                            </span>
                          )}
                        </div>

                        {act.description && (
                          <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{act.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-neutral-500 mt-2 flex-wrap">
                          {act.start_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-neutral-400" />
                              {act.start_time} {act.end_time ? `- ${act.end_time}` : ''}
                            </span>
                          )}
                          {act.farm_name && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-neutral-400" /> {act.farm_name}
                            </span>
                          )}
                          {act.crop_name && (
                            <span className="flex items-center gap-1">
                              <Sprout className="w-3.5 h-3.5 text-forest-600" /> {act.crop_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={(e) => handleOpenEditModal(act, e)}
                        className="px-2.5 py-1 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg hover:bg-neutral-100 transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. Activity Creation & Edit Modal */}
      {/* ------------------------------------------------------------- */}
      {activityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-neutral-200 flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/60">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-forest-700" />
                <h3 className="font-bold text-sm text-neutral-900">
                  {editingActivity ? 'Edit Scheduled Activity' : 'Create New Activity'}
                </h3>
              </div>
              <button
                onClick={() => setActivityModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="p-5 overflow-y-auto space-y-4 text-xs">
              {modalError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                  <span>{modalError}</span>
                  <button onClick={() => setModalError(null)} className="text-rose-400 hover:text-rose-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Activity Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apply Vegetative Urea Top Dressing"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:border-forest-600 font-medium"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">Description & Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Notes, dosages, or field conditions..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:border-forest-600"
                />
              </div>

              {/* Farm, Field, Crop Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Farm</label>
                  <select
                    value={formFarmId}
                    onChange={(e) => {
                      setFormFarmId(e.target.value);
                      setFormFieldId('');
                      setFormCropId('');
                    }}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:border-forest-600"
                  >
                    <option value="">None / General</option>
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Field</label>
                  <select
                    value={formFieldId}
                    onChange={(e) => {
                      setFormFieldId(e.target.value);
                      setFormCropId('');
                    }}
                    disabled={!formFarmId}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:border-forest-600 disabled:opacity-50"
                  >
                    <option value="">None</option>
                    {formAvailableFields.map((fld) => (
                      <option key={fld.id} value={fld.id}>
                        {fld.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Crop</label>
                  <select
                    value={formCropId}
                    onChange={(e) => setFormCropId(e.target.value)}
                    disabled={!formFarmId}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:border-forest-600 disabled:opacity-50"
                  >
                    <option value="">None</option>
                    {formAvailableCrops.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ActivityCategory)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:border-forest-600 font-medium"
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as ActivityPriority)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:border-forest-600 font-medium"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Due Date & Times */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:border-forest-600"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:border-forest-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:border-forest-600"
                  />
                </div>
              </div>

              {/* Status & Weather Sensitivity */}
              <div className="pt-2 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ActivityStatus)}
                    className="bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:border-forest-600 font-medium"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer mt-3 sm:mt-0">
                  <input
                    type="checkbox"
                    checked={formIsWeatherSensitive}
                    onChange={(e) => setFormIsWeatherSensitive(e.target.checked)}
                    className="rounded border-neutral-300 text-forest-700 focus:ring-forest-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold text-neutral-800">Weather-sensitive</span>
                    <p className="text-[10px] text-neutral-400">Alert if heavy rain or extreme heat is forecast</p>
                  </div>
                </label>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-2">
                {editingActivity ? (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteActivity(editingActivity.id, e)}
                    disabled={savingActivity}
                    className="px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-50 border border-rose-200 font-semibold text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActivityModalOpen(false)}
                    className="px-3 py-2 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 font-semibold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingActivity}
                    className="px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                  >
                    {savingActivity && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingActivity ? 'Update Activity' : 'Save Activity'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. Activity Details Modal */}
      {/* ------------------------------------------------------------- */}
      {viewDetailModalOpen && selectedActivityDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-neutral-200">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/60">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-forest-100 text-forest-800">
                  <CalendarIcon className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Activity Details</span>
              </div>
              <button
                onClick={() => setViewDetailModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <h3 className="text-base font-bold text-neutral-900 tracking-tight">
                  {selectedActivityDetail.title}
                </h3>
                {selectedActivityDetail.description && (
                  <p className="text-neutral-600 mt-1 whitespace-pre-line leading-relaxed">
                    {selectedActivityDetail.description}
                  </p>
                )}
              </div>

              {/* Status & Priority Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded-lg border font-semibold ${
                    CATEGORY_CONFIG[selectedActivityDetail.category]?.bg || 'bg-neutral-50'
                  } ${CATEGORY_CONFIG[selectedActivityDetail.category]?.text || 'text-neutral-800'} ${
                    CATEGORY_CONFIG[selectedActivityDetail.category]?.border || 'border-neutral-200'
                  }`}
                >
                  {CATEGORY_CONFIG[selectedActivityDetail.category]?.label || selectedActivityDetail.category}
                </span>

                <span
                  className={`px-2 py-0.5 rounded-lg border font-semibold uppercase ${
                    selectedActivityDetail.priority === 'high'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : selectedActivityDetail.priority === 'medium'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                  }`}
                >
                  {selectedActivityDetail.priority}
                </span>

                <span
                  className={`px-2 py-0.5 rounded-lg border font-semibold capitalize ${
                    selectedActivityDetail.completed
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                  }`}
                >
                  {selectedActivityDetail.status || (selectedActivityDetail.completed ? 'completed' : 'pending')}
                </span>
              </div>

              {/* Associations info */}
              <div className="bg-neutral-50 rounded-xl p-3 space-y-1.5 border border-neutral-200/70 text-neutral-700">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Scheduled Date:</span>
                  <span className="font-semibold text-neutral-900">
                    {getActivityDateStr(selectedActivityDetail)}
                  </span>
                </div>
                {selectedActivityDetail.start_time && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Time Window:</span>
                    <span className="font-medium">
                      {selectedActivityDetail.start_time} {selectedActivityDetail.end_time ? `- ${selectedActivityDetail.end_time}` : ''}
                    </span>
                  </div>
                )}
                {selectedActivityDetail.farm_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Farm:</span>
                    <span className="font-medium">{selectedActivityDetail.farm_name}</span>
                  </div>
                )}
                {selectedActivityDetail.field_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Field:</span>
                    <span className="font-medium">{selectedActivityDetail.field_name}</span>
                  </div>
                )}
                {selectedActivityDetail.crop_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Planted Crop:</span>
                    <span className="font-medium text-forest-700">{selectedActivityDetail.crop_name}</span>
                  </div>
                )}
              </div>

              {/* Weather Sensitive Indicator */}
              {selectedActivityDetail.is_weather_sensitive && (
                <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Weather-sensitive operation. Check local rainfall/wind before field execution.</span>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                <button
                  onClick={() => handleToggleActivity(selectedActivityDetail.id)}
                  className={`px-3 py-1.5 rounded-xl border font-semibold text-xs flex items-center gap-1.5 transition-colors ${
                    selectedActivityDetail.completed
                      ? 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{selectedActivityDetail.completed ? 'Mark as Incomplete' : 'Mark as Completed'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(selectedActivityDetail)}
                    className="px-3 py-1.5 rounded-xl border border-neutral-200 text-neutral-800 hover:bg-neutral-50 font-semibold text-xs flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteActivity(selectedActivityDetail.id)}
                    className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200"
                    title="Delete activity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. Crop Growth Stage Suggestions Modal */}
      {/* ------------------------------------------------------------- */}
      {suggestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border border-neutral-200 flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-forest-50/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-forest-700" />
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">Crop Growth Stage Suggestions</h3>
                  <p className="text-[11px] text-neutral-500">
                    Calculate Days After Sowing (DAS) and review weather-informed recommendations before saving.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSuggestionModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {suggestionModalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{suggestionModalError}</span>
                  </div>
                  <button onClick={() => setSuggestionModalError(null)} className="text-rose-400 hover:text-rose-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Selection inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Farm</label>
                  <select
                    value={sugFarmId}
                    onChange={(e) => {
                      setSugFarmId(e.target.value);
                      setSugCropId('');
                      setSuggestionResult(null);
                    }}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:border-forest-600 font-medium"
                  >
                    <option value="">Select Farm...</option>
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Planted Crop</label>
                  <select
                    value={sugCropId}
                    onChange={(e) => handleSugCropChange(e.target.value)}
                    disabled={!sugFarmId}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:border-forest-600 font-medium disabled:opacity-50"
                  >
                    <option value="">Select Crop...</option>
                    {suggestionAvailableCrops.map(({ crop, fieldName }) => (
                      <option key={crop.id} value={crop.id}>
                        {crop.name} ({fieldName}) {crop.variety ? `- ${crop.variety}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Sowing / Planting Date</label>
                  <input
                    type="date"
                    value={sugPlantingDate}
                    onChange={(e) => setSugPlantingDate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:border-forest-600"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateSuggestions}
                  disabled={generatingSuggestions || !sugFarmId || !sugCropId}
                  className="px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50 shadow-sm transition-colors"
                >
                  {generatingSuggestions ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing growth stage & forecast...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Growth Stage Plan</span>
                    </>
                  )}
                </button>
              </div>

              {/* Suggestions Results */}
              {suggestionResult && (
                <div className="space-y-3 pt-3 border-t border-neutral-200 animate-fade-in">
                  {/* Agronomic Growth Stage Banner */}
                  <div className="p-3.5 rounded-xl bg-[#edf4ee] border border-forest-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sprout className="w-4 h-4 text-forest-700" />
                        <span className="font-bold text-forest-900 text-sm">
                          {suggestionResult.crop_name} {suggestionResult.variety ? `(${suggestionResult.variety})` : ''}
                        </span>
                      </div>
                      <p className="text-xs text-forest-700 mt-0.5">
                        Planting date: <span className="font-semibold">{suggestionResult.planting_date}</span> ({suggestionResult.days_since_planting} days after sowing)
                      </p>
                    </div>

                    <div className="px-3 py-1 rounded-xl bg-forest-700 text-white font-semibold text-xs tracking-wide self-start sm:self-auto">
                      Current Stage: {suggestionResult.current_growth_stage}
                    </div>
                  </div>

                  {/* Header of Activities List */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-bold text-neutral-800">
                      Recommended Activities ({selectedSuggestionIndices.size} of {suggestionResult.suggestions.length} selected)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedSuggestionIndices.size === suggestionResult.suggestions.length) {
                          setSelectedSuggestionIndices(new Set());
                        } else {
                          setSelectedSuggestionIndices(new Set(suggestionResult.suggestions.map((_, i) => i)));
                        }
                      }}
                      className="text-forest-700 hover:text-forest-900 font-semibold underline"
                    >
                      {selectedSuggestionIndices.size === suggestionResult.suggestions.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  {/* Suggested Activities Checklist */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {suggestionResult.suggestions.map((sug, idx) => {
                      const isSelected = selectedSuggestionIndices.has(idx);
                      const cfg = CATEGORY_CONFIG[sug.category] || CATEGORY_CONFIG.general;
                      const Icon = cfg.icon;

                      return (
                        <div
                          key={idx}
                          onClick={() => toggleSuggestionSelection(idx)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                            isSelected
                              ? 'bg-white border-forest-400 shadow-sm'
                              : 'bg-neutral-50/70 border-neutral-200 opacity-60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSuggestionSelection(idx)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-0.5 rounded border-neutral-300 text-forest-700 focus:ring-forest-600 w-4 h-4 shrink-0"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <Icon className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                                <span className="font-bold text-neutral-900">{sug.title}</span>
                              </div>
                              <span className="font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-lg border border-neutral-200">
                                Target: {sug.suggested_date} (DAS {sug.days_after_sowing})
                              </span>
                            </div>

                            <p className="text-neutral-600 mt-1">{sug.description}</p>

                            {/* Weather Warning */}
                            {sug.weather_warning && (
                              <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1.5 text-[11px] font-medium">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>{sug.weather_warning}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Schedule Confirmation Button */}
                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-neutral-500 text-xs">
                      Confirmed activities will be added directly to your interactive farming calendar.
                    </span>
                    <button
                      type="button"
                      onClick={handleScheduleSuggestions}
                      disabled={schedulingSuggestions || selectedSuggestionIndices.size === 0}
                      className="px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50 shadow-sm transition-colors"
                    >
                      {schedulingSuggestions && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Add {selectedSuggestionIndices.size} Activities to Calendar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartFarmingCalendar;
