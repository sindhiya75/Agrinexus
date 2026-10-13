import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Farm,
  FarmCreatePayload,
  Field,
  FieldCreatePayload,
  Crop,
  CropCreatePayload,
  CropUpdatePayload,
} from '../types/farm';
import {
  getFarmsApi,
  createFarmApi,
  updateFarmApi,
  deleteFarmApi,
  getFarmDetailApi,
  createFieldApi,
  deleteFieldApi,
  createCropApi,
  updateCropApi,
  deleteCropApi,
} from '../services/api';
import { AuthModal } from '../components/AuthModal';
import {
  Tractor,
  Plus,
  Layers,
  MapPin,
  Trash2,
  Edit3,
  ChevronRight,
  ArrowLeft,
  Sprout,
  Calendar,
  Loader2,
  AlertCircle,
  LogIn,
} from 'lucide-react';

export const MyFarms: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Modals state
  const [farmModalOpen, setFarmModalOpen] = useState<boolean>(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [fieldModalOpen, setFieldModalOpen] = useState<boolean>(false);
  const [cropModalOpen, setCropModalOpen] = useState<boolean>(false);
  const [selectedFieldForCrop, setSelectedFieldForCrop] = useState<Field | null>(null);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);

  // Form states
  const [farmName, setFarmName] = useState('');
  const [farmDesc, setFarmDesc] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [farmLat, setFarmLat] = useState<string>('');
  const [farmLng, setFarmLng] = useState<string>('');
  const [farmArea, setFarmArea] = useState<string>('');

  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('open_field');
  const [fieldArea, setFieldArea] = useState<string>('');
  const [fieldSoil, setFieldSoil] = useState('Alluvial Clay');

  const [cropName, setCropName] = useState('');
  const [cropVariety, setCropVariety] = useState('');
  const [cropPlantDate, setCropPlantDate] = useState('');
  const [cropHarvestDate, setCropHarvestDate] = useState('');
  const [cropStatus, setCropStatus] = useState<string>('planted');
  const [cropNotes, setCropNotes] = useState('');

  // Load farms
  const loadFarms = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getFarmsApi();
      setFarms(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load farms');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadFarmDetail = async (farmId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFarmDetailApi(farmId);
      setSelectedFarm(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load farm details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadFarms();
    } else {
      setFarms([]);
      setSelectedFarm(null);
    }
  }, [isAuthenticated, loadFarms]);

  // Handle Farm Actions
  const handleOpenCreateFarm = () => {
    setEditingFarm(null);
    setFarmName('');
    setFarmDesc('');
    setFarmLocation('');
    setFarmLat('');
    setFarmLng('');
    setFarmArea('');
    setFarmModalOpen(true);
  };

  const handleOpenEditFarm = (farm: Farm, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFarm(farm);
    setFarmName(farm.name);
    setFarmDesc(farm.description || '');
    setFarmLocation(farm.location_name || '');
    setFarmLat(farm.latitude ? String(farm.latitude) : '');
    setFarmLng(farm.longitude ? String(farm.longitude) : '');
    setFarmArea(farm.total_area_hectares ? String(farm.total_area_hectares) : '');
    setFarmModalOpen(true);
  };

  const handleSaveFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: FarmCreatePayload = {
        name: farmName,
        description: farmDesc || undefined,
        location_name: farmLocation || undefined,
        latitude: farmLat ? parseFloat(farmLat) : undefined,
        longitude: farmLng ? parseFloat(farmLng) : undefined,
        total_area_hectares: farmArea ? parseFloat(farmArea) : undefined,
      };

      if (editingFarm) {
        await updateFarmApi(editingFarm.id, payload);
      } else {
        await createFarmApi(payload);
      }
      setFarmModalOpen(false);
      await loadFarms();
      if (selectedFarm && editingFarm?.id === selectedFarm.id) {
        await loadFarmDetail(selectedFarm.id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save farm');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFarm = async (farmId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this farm? All associated fields and crops will be deleted.')) return;
    setLoading(true);
    try {
      await deleteFarmApi(farmId);
      if (selectedFarm?.id === farmId) setSelectedFarm(null);
      await loadFarms();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete farm');
    } finally {
      setLoading(false);
    }
  };

  // Handle Field Actions
  const handleOpenCreateField = () => {
    setFieldName('');
    setFieldType('open_field');
    setFieldArea('');
    setFieldSoil('Alluvial Loam');
    setFieldModalOpen(true);
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarm) return;
    setLoading(true);
    try {
      const payload: FieldCreatePayload = {
        name: fieldName,
        field_type: fieldType,
        area_hectares: fieldArea ? parseFloat(fieldArea) : undefined,
        soil_type: fieldSoil,
      };
      await createFieldApi(selectedFarm.id, payload);
      setFieldModalOpen(false);
      await loadFarmDetail(selectedFarm.id);
      await loadFarms();
    } catch (err: any) {
      setError(err?.message || 'Failed to create field');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Are you sure you want to delete this field and its planted crops?')) return;
    if (!selectedFarm) return;
    setLoading(true);
    try {
      await deleteFieldApi(fieldId);
      await loadFarmDetail(selectedFarm.id);
      await loadFarms();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete field');
    } finally {
      setLoading(false);
    }
  };

  // Handle Crop Actions
  const handleOpenAddCrop = (field: Field) => {
    setSelectedFieldForCrop(field);
    setEditingCrop(null);
    setCropName('');
    setCropVariety('');
    setCropPlantDate('');
    setCropHarvestDate('');
    setCropStatus('planted');
    setCropNotes('');
    setCropModalOpen(true);
  };

  const handleOpenEditCrop = (field: Field, crop: Crop) => {
    setSelectedFieldForCrop(field);
    setEditingCrop(crop);
    setCropName(crop.name);
    setCropVariety(crop.variety || '');
    setCropPlantDate(crop.planting_date || '');
    setCropHarvestDate(crop.expected_harvest_date || '');
    setCropStatus(crop.status);
    setCropNotes(crop.notes || '');
    setCropModalOpen(true);
  };

  const handleSaveCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarm || !selectedFieldForCrop) return;
    setLoading(true);
    try {
      if (editingCrop) {
        const payload: CropUpdatePayload = {
          name: cropName,
          variety: cropVariety || undefined,
          planting_date: cropPlantDate || undefined,
          expected_harvest_date: cropHarvestDate || undefined,
          status: cropStatus,
          notes: cropNotes || undefined,
        };
        await updateCropApi(editingCrop.id, payload);
      } else {
        const payload: CropCreatePayload = {
          name: cropName,
          variety: cropVariety || undefined,
          planting_date: cropPlantDate || undefined,
          expected_harvest_date: cropHarvestDate || undefined,
          status: cropStatus,
          notes: cropNotes || undefined,
        };
        await createCropApi(selectedFieldForCrop.id, payload);
      }
      setCropModalOpen(false);
      await loadFarmDetail(selectedFarm.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to save crop');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCrop = async (cropId: string) => {
    if (!confirm('Are you sure you want to remove this crop record?')) return;
    if (!selectedFarm) return;
    setLoading(true);
    try {
      await deleteCropApi(cropId);
      await loadFarmDetail(selectedFarm.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete crop');
    } finally {
      setLoading(false);
    }
  };

  // If unauthenticated, show prompt
  if (!isAuthenticated) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
              <Tractor className="w-3.5 h-3.5" /> Phase 1 Data Layer
            </div>
            <h1 className="text-2xl font-bold text-white">My Farms & Plots</h1>
            <p className="text-slate-400 text-sm mt-1">
              Authenticate to register and manage your farm holdings, field boundaries, and crop allocations.
            </p>
          </div>
        </div>

        <div className="p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
            <Tractor className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Sign In to Manage Your Farms</h2>
          <p className="text-sm text-slate-400 max-w-md mt-2 leading-relaxed">
            AgriNexus AI uses strict user data isolation. Sign in or create a free farmer account to start adding farm plots, sub-fields, and planted crops.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
            >
              <LogIn className="w-4 h-4" />
              Sign In / Register
            </button>
          </div>
        </div>

        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // View: Farm Details Drilldown (Fields & Crops)
  // ---------------------------------------------------------------------------
  if (selectedFarm) {
    return (
      <div className="space-y-6 max-w-6xl pb-12 animate-fadeIn">
        {/* Back Button and Farm Banner */}
        <button
          onClick={() => setSelectedFarm(null)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Farms
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold font-mono">
                {selectedFarm.total_area_hectares ? `${selectedFarm.total_area_hectares} Hectares` : 'Area Not Specified'}
              </span>
              {selectedFarm.location_name && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {selectedFarm.location_name}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mt-2">{selectedFarm.name}</h1>
            {selectedFarm.description && (
              <p className="text-slate-400 text-xs mt-1 max-w-2xl">{selectedFarm.description}</p>
            )}
            {selectedFarm.latitude && selectedFarm.longitude && (
              <p className="text-[11px] text-slate-400 font-mono mt-1">
                GPS: {selectedFarm.latitude.toFixed(4)}° N, {selectedFarm.longitude.toFixed(4)}° E
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleOpenCreateField}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Field / Plot
            </button>
            <button
              onClick={(e) => handleOpenEditFarm(selectedFarm, e)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Farm
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Fields List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Sub-Fields & Plots ({selectedFarm.fields?.length || 0})
            </h2>
          </div>

          {selectedFarm.fields && selectedFarm.fields.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedFarm.fields.map((field) => (
                <div
                  key={field.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Field Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          {field.field_type || 'open_field'}
                        </span>
                        <h3 className="text-base font-bold text-white mt-2">{field.name}</h3>
                      </div>
                      <button
                        onClick={() => handleDeleteField(field.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete Field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Field Metrics */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs py-2 px-3 rounded-xl bg-slate-950 border border-slate-800/80">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Area</span>
                        <span className="font-semibold text-slate-200">
                          {field.area_hectares ? `${field.area_hectares} ha` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Soil Type</span>
                        <span className="font-semibold text-slate-200">{field.soil_type || 'Unspecified'}</span>
                      </div>
                    </div>

                    {/* Planted Crops in this Field */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Sprout className="w-3.5 h-3.5 text-emerald-400" /> Planted Crops
                        </span>
                        <button
                          onClick={() => handleOpenAddCrop(field)}
                          className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Plant Crop
                        </button>
                      </div>

                      {field.crops && field.crops.length > 0 ? (
                        <div className="space-y-2">
                          {field.crops.map((crop) => (
                            <div
                              key={crop.id}
                              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-xs text-white">{crop.name}</span>
                                  {crop.variety && (
                                    <span className="text-[10px] text-slate-400 font-mono">({crop.variety})</span>
                                  )}
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                    crop.status === 'harvested'
                                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                      : crop.status === 'flowering'
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  }`}>
                                    {crop.status}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                                  {crop.planting_date && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" /> Planted: {crop.planting_date}
                                    </span>
                                  )}
                                  {crop.expected_harvest_date && (
                                    <span>Harvest: {crop.expected_harvest_date}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenEditCrop(field, crop)}
                                  className="p-1 text-slate-400 hover:text-slate-200"
                                  title="Edit Crop"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCrop(crop.id)}
                                  className="p-1 text-slate-400 hover:text-rose-400"
                                  title="Delete Crop"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-400">
                          No crops recorded in this field. Click "Plant Crop" to add one.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center flex flex-col items-center">
              <Layers className="w-8 h-8 text-slate-400 mb-2" />
              <h3 className="font-semibold text-white text-sm">No Fields Defined Yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Divide this farm into parcels or sub-fields (e.g. North Plot, Greenhouse 1) to track soil and crop rotations.
              </p>
              <button
                onClick={handleOpenCreateField}
                className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" /> Add First Field
              </button>
            </div>
          )}
        </div>

        {/* Modal: Add/Edit Farm */}
        {renderFarmModal()}
        {/* Modal: Add Field */}
        {renderFieldModal()}
        {/* Modal: Add/Edit Crop */}
        {renderCropModal()}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // View: All Farms Grid
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6 max-w-6xl pb-12 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <Tractor className="w-3.5 h-3.5" /> Phase 1 Data Layer
          </div>
          <h1 className="text-2xl font-bold text-white">My Farms & Land Holdings</h1>
          <p className="text-slate-400 text-sm mt-1">
            Registered properties for {user?.full_name || user?.email}
          </p>
        </div>

        <button
          onClick={handleOpenCreateFarm}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add New Farm
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && farms.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
          <p className="text-xs text-slate-400">Loading your farms from PostgreSQL...</p>
        </div>
      ) : farms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm) => (
            <div
              key={farm.id}
              onClick={() => loadFarmDetail(farm.id)}
              className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-xl hover:shadow-emerald-500/5 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    {farm.total_area_hectares ? `${farm.total_area_hectares} ha` : 'Unspecified'}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleOpenEditFarm(farm, e)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Edit Farm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteFarm(farm.id, e)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                      title="Delete Farm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mt-3 group-hover:text-emerald-400 transition-colors">
                  {farm.name}
                </h3>
                {farm.location_name && (
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {farm.location_name}
                  </p>
                )}
                {farm.description && (
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {farm.description}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 font-medium">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  {farm.field_count || 0} Sub-Fields
                </span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px] group-hover:translate-x-0.5 transition-transform">
                  View Fields & Crops <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center flex flex-col items-center">
          <Tractor className="w-12 h-12 text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-white">No Farms Registered Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Get started by adding your first agricultural property or field parcel.
          </p>
          <button
            onClick={handleOpenCreateFarm}
            className="mt-5 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Your First Farm
          </button>
        </div>
      )}

      {/* Modal: Add/Edit Farm */}
      {renderFarmModal()}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Modal Render Helpers
  // ---------------------------------------------------------------------------
  function renderFarmModal() {
    if (!farmModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
        <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <h3 className="text-lg font-bold text-white mb-1">
            {editingFarm ? 'Edit Farm Details' : 'Add New Farm Property'}
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Configure land property name, location, and total acreage.
          </p>

          <form onSubmit={handleSaveFarm} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Farm Name *</label>
              <input
                type="text"
                required
                placeholder="Green Valley Agro Farm"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Location Name</label>
                <input
                  type="text"
                  placeholder="Coimbatore, TN"
                  value={farmLocation}
                  onChange={(e) => setFarmLocation(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Total Area (Hectares)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="12.5"
                  value={farmArea}
                  onChange={(e) => setFarmArea(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Latitude (GPS)</label>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="11.0168"
                  value={farmLat}
                  onChange={(e) => setFarmLat(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Longitude (GPS)</label>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="76.9558"
                  value={farmLng}
                  onChange={(e) => setFarmLng(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Description / Notes</label>
              <textarea
                rows={2}
                placeholder="Organic paddy farm with drip irrigation infrastructure."
                value={farmDesc}
                onChange={(e) => setFarmDesc(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFarmModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingFarm ? 'Update Farm' : 'Create Farm'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  function renderFieldModal() {
    if (!fieldModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-lg font-bold text-white mb-1">Add Sub-Field / Plot</h3>
          <p className="text-xs text-slate-400 mb-4">Adding plot to: {selectedFarm?.name}</p>

          <form onSubmit={handleSaveField} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Field Name *</label>
              <input
                type="text"
                required
                placeholder="North Plot A1"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Field Type</label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="open_field">Open Field</option>
                  <option value="greenhouse">Greenhouse</option>
                  <option value="orchard">Orchard / Plantation</option>
                  <option value="polyhouse">Polyhouse</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Area (ha)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="3.5"
                  value={fieldArea}
                  onChange={(e) => setFieldArea(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Soil Type</label>
              <input
                type="text"
                placeholder="Alluvial Clay / Sandy Loam"
                value={fieldSoil}
                onChange={(e) => setFieldSoil(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFieldModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Field'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  function renderCropModal() {
    if (!cropModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-lg font-bold text-white mb-1">
            {editingCrop ? 'Update Crop Cycle' : 'Plant Crop in Field'}
          </h3>
          <p className="text-xs text-slate-400 mb-4">Field: {selectedFieldForCrop?.name}</p>

          <form onSubmit={handleSaveCrop} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Crop Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Paddy / Rice"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Variety</label>
                <input
                  type="text"
                  placeholder="Ponni / CR 1009"
                  value={cropVariety}
                  onChange={(e) => setCropVariety(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Planting Date</label>
                <input
                  type="date"
                  value={cropPlantDate}
                  onChange={(e) => setCropPlantDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Harvest Date</label>
                <input
                  type="date"
                  value={cropHarvestDate}
                  onChange={(e) => setCropHarvestDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Growth Status</label>
              <select
                value={cropStatus}
                onChange={(e) => setCropStatus(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="planted">Planted (Seedling / Sown)</option>
                <option value="growing">Vegetative Growth</option>
                <option value="flowering">Flowering / Grain Filling</option>
                <option value="harvested">Harvested</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Notes</label>
              <textarea
                rows={2}
                placeholder="Fertilizer schedule, weather observations, etc."
                value={cropNotes}
                onChange={(e) => setCropNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingCrop ? 'Update Crop' : 'Plant Crop'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
};
