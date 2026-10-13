import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { Farm } from '../types/farm';
import {
  PolygonAreaResponse,
  WaterIntelligenceResponse,
  NominatimLocationResult,
} from '../types/gis';
import {
  getFarmsApi,
  calculatePolygonAreaApi,
  analyzeWaterResourcesApi,
  saveFarmBoundaryApi,
  searchNominatimLocation,
} from '../services/api';
import {
  Map as MapIcon,
  Layers,
  Search,
  Plus,
  Trash2,
  Save,
  Compass,
  Droplets,
  CheckCircle2,
  Info,
  RotateCcw,
  Loader2,
  Globe,
} from 'lucide-react';

// Fix Leaflet default marker icon paths in React bundle
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to handle map clicks for polygon drawing
interface MapEventsHandlerProps {
  isDrawing: boolean;
  onAddPoint: (lat: number, lng: number) => void;
}

function MapEventsHandler({ isDrawing, onAddPoint }: MapEventsHandlerProps) {
  useMapEvents({
    click(e) {
      if (isDrawing) {
        onAddPoint(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Component to programmatically re-center map
function MapFlyTo({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom || 15, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

export const SmartFarmMap: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([11.0168, 76.9558]); // Default Coimbatore
  const [mapZoom, setMapZoom] = useState<number>(14);
  const [tileLayerType, setTileLayerType] = useState<'osm' | 'satellite' | 'topo'>('satellite');

  // Drawing state
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([]); // Array of [lat, lng]
  const [areaMetrics, setAreaMetrics] = useState<PolygonAreaResponse | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<NominatimLocationResult[]>([]);
  const [searching, setSearching] = useState<boolean>(false);

  // Farms state
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [savingBoundary, setSavingBoundary] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Water Intelligence state
  const [waterData, setWaterData] = useState<WaterIntelligenceResponse | null>(null);
  const [loadingWater, setLoadingWater] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'water'>('metrics');

  // Load farms if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      getFarmsApi().then(setFarms).catch(() => {});
    }
  }, [isAuthenticated]);

  // Handle adding vertex point to polygon
  const handleAddPoint = (lat: number, lng: number) => {
    setPolygonPoints((prev) => [...prev, [lat, lng]]);
    setSaveSuccessMsg(null);
  };

  // Calculate area whenever polygon has >= 3 vertices
  const computePolygonArea = useCallback(async (points: [number, number][]) => {
    if (points.length < 3) {
      setAreaMetrics(null);
      return;
    }

    // Convert [lat, lng] array to GeoJSON coordinates: [[lng, lat], ...]
    const geojsonCoords = points.map((p) => [p[1], p[0]]);
    // Close the ring
    geojsonCoords.push([points[0][1], points[0][0]]);

    const geojson = {
      type: 'Polygon',
      coordinates: [geojsonCoords],
    };

    try {
      const res = await calculatePolygonAreaApi(geojson);
      setAreaMetrics(res);
    } catch (err) {
      console.error('Failed to calculate polygon area:', err);
    }
  }, []);

  useEffect(() => {
    if (polygonPoints.length >= 3) {
      computePolygonArea(polygonPoints);
    } else {
      setAreaMetrics(null);
    }
  }, [polygonPoints, computePolygonArea]);

  // Handle undo and clear
  const handleUndoPoint = () => {
    setPolygonPoints((prev) => prev.slice(0, -1));
  };

  const handleClearBoundary = () => {
    setPolygonPoints([]);
    setAreaMetrics(null);
    setWaterData(null);
    setSaveSuccessMsg(null);
  };

  // Handle Location Search
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchNominatimLocation(searchQuery);
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectLocation = (loc: NominatimLocationResult) => {
    const lat = parseFloat(loc.lat);
    const lon = parseFloat(loc.lon);
    setMapCenter([lat, lon]);
    setMapZoom(16);
    setSearchResults([]);
    setSearchQuery(loc.display_name.split(',')[0]);
  };

  // Handle Load Farm onto Map
  const handleSelectFarm = (farmId: string) => {
    setSelectedFarmId(farmId);
    setSaveSuccessMsg(null);
    const farm = farms.find((f) => f.id === farmId);
    if (!farm) return;

    if (farm.boundary_geojson && farm.boundary_geojson.coordinates) {
      const coords = farm.boundary_geojson.coordinates[0]; // [[lng, lat], ...]
      const points: [number, number][] = coords.map((c: number[]) => [c[1], c[0]]);
      // Remove closing point duplicate if present
      if (
        points.length > 3 &&
        points[0][0] === points[points.length - 1][0] &&
        points[0][1] === points[points.length - 1][1]
      ) {
        points.pop();
      }
      setPolygonPoints(points);
      if (farm.latitude && farm.longitude) {
        setMapCenter([farm.latitude, farm.longitude]);
        setMapZoom(16);
      }
    } else if (farm.latitude && farm.longitude) {
      setMapCenter([farm.latitude, farm.longitude]);
      setMapZoom(16);
    }
  };

  // Handle Save Boundary to Farm
  const handleSaveBoundaryToFarm = async () => {
    if (!selectedFarmId) {
      alert('Please select a farm from the dropdown to attach this boundary.');
      return;
    }
    if (polygonPoints.length < 3) {
      alert('Please draw at least 3 points to form a closed farm boundary.');
      return;
    }

    setSavingBoundary(true);
    setSaveSuccessMsg(null);
    try {
      const geojsonCoords = polygonPoints.map((p) => [p[1], p[0]]);
      geojsonCoords.push([polygonPoints[0][1], polygonPoints[0][0]]);

      const geojson = {
        type: 'Polygon',
        coordinates: [geojsonCoords],
      };

      const updatedFarm = await saveFarmBoundaryApi(selectedFarmId, geojson);
      setSaveSuccessMsg(`Boundary saved! Updated area: ${updatedFarm.total_area_hectares} ha`);
      // Update local farm item
      setFarms((prev) => prev.map((f) => (f.id === updatedFarm.id ? updatedFarm : f)));
      setIsDrawing(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to save farm boundary');
    } finally {
      setSavingBoundary(false);
    }
  };

  // Handle Water Intelligence Analysis
  const handleAnalyzeWater = async () => {
    const lat = areaMetrics?.centroid?.latitude || mapCenter[0];
    const lng = areaMetrics?.centroid?.longitude || mapCenter[1];

    setLoadingWater(true);
    try {
      const res = await analyzeWaterResourcesApi(lat, lng, 10000);
      setWaterData(res);
      setActiveTab('water');
    } catch (err: any) {
      alert(err?.message || 'Failed to analyze water resources');
    } finally {
      setLoadingWater(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold mb-2">
            <MapIcon className="w-3.5 h-3.5" /> PostGIS Spatial Engine • Phase 2
          </div>
          <h1 className="text-2xl font-bold text-white">Smart Farm GIS Map</h1>
          <p className="text-slate-400 text-sm mt-1">
            Interactive polygon boundary drafting, geodesic acreage calculation, and surface water proximity intelligence.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsDrawing(!isDrawing)}
            className={`px-4 py-2 text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 ${
              isDrawing
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            {isDrawing ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Finish Drawing
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Draw Boundary
              </>
            )}
          </button>

          {polygonPoints.length > 0 && (
            <>
              <button
                onClick={handleUndoPoint}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700"
                title="Undo Last Vertex"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleClearBoundary}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-400 text-xs border border-slate-700"
                title="Clear Boundary"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={handleAnalyzeWater}
            disabled={loadingWater}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loadingWater ? <Loader2 className="w-4 h-4 animate-spin" /> : <Droplets className="w-4 h-4" />}
            Water Intelligence
          </button>
        </div>
      </div>

      {/* Main Map + Side Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Container Column */}
        <div className="lg:col-span-2 space-y-3">
          {/* Map Toolbar: Search + Layer Selector + Farm Selector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
            {/* Location Search Bar */}
            <div className="relative flex-1 min-w-[240px]">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search village, city, pin code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                {searching && (
                  <Loader2 className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-sky-400 animate-spin" />
                )}
              </form>

              {/* Search Suggestions Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-10 left-0 right-0 z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.place_id}
                      onClick={() => handleSelectLocation(result)}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 border-b border-slate-800/60 last:border-0 truncate"
                    >
                      {result.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Farm Selector (if logged in) */}
            {isAuthenticated && farms.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedFarmId}
                  onChange={(e) => handleSelectFarm(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="">-- Load Saved Farm --</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} {f.total_area_hectares ? `(${f.total_area_hectares} ha)` : ''}
                    </option>
                  ))}
                </select>

                {polygonPoints.length >= 3 && selectedFarmId && (
                  <button
                    onClick={handleSaveBoundaryToFarm}
                    disabled={savingBoundary}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {savingBoundary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save
                  </button>
                )}
              </div>
            )}

            {/* Tile Layer Selector */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-medium">
              <button
                onClick={() => setTileLayerType('satellite')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  tileLayerType === 'satellite'
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => setTileLayerType('osm')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  tileLayerType === 'osm'
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Street Map
              </button>
              <button
                onClick={() => setTileLayerType('topo')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  tileLayerType === 'topo'
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Topo
              </button>
            </div>
          </div>

          {/* Success Message Banner */}
          {saveSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Interactive Leaflet Map Container */}
          <div className="h-[520px] rounded-2xl overflow-hidden border border-slate-800 relative shadow-2xl">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom={true}
              className="w-full h-full"
            >
              {/* Tile Provider */}
              {tileLayerType === 'satellite' && (
                <TileLayer
                  attribution='&copy; <a href="https://www.esri.com/">Esri</a>, Earthstar Geographics'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={19}
                />
              )}
              {tileLayerType === 'osm' && (
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />
              )}
              {tileLayerType === 'topo' && (
                <TileLayer
                  attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
                  url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                  maxZoom={17}
                />
              )}

              {/* Map Center Trigger */}
              <MapFlyTo center={mapCenter} zoom={mapZoom} />

              {/* Map Event Listener for Clicks */}
              <MapEventsHandler isDrawing={isDrawing} onAddPoint={handleAddPoint} />

              {/* Render In-Progress Polyline */}
              {polygonPoints.length > 1 && polygonPoints.length < 3 && (
                <Polyline positions={polygonPoints} pathOptions={{ color: '#10b981', weight: 3, dashArray: '6, 6' }} />
              )}

              {/* Render Closed Polygon */}
              {polygonPoints.length >= 3 && (
                <Polygon
                  positions={polygonPoints}
                  pathOptions={{
                    color: '#10b981',
                    weight: 3,
                    fillColor: '#10b981',
                    fillOpacity: 0.25,
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1">
                      <strong className="text-emerald-400 block font-bold">Farm Land Parcel</strong>
                      <div>Area: {areaMetrics?.area_hectares || 0} ha ({areaMetrics?.area_acres || 0} acres)</div>
                      <div>Perimeter: {areaMetrics?.perimeter_km || 0} km</div>
                    </div>
                  </Popup>
                </Polygon>
              )}

              {/* Render Markers on Polygon Vertices */}
              {polygonPoints.map((point, idx) => (
                <Marker key={idx} position={point} icon={defaultIcon}>
                  <Popup>
                    <div className="text-xs">
                      <strong>Vertex #{idx + 1}</strong>
                      <div>Lat: {point[0].toFixed(5)}</div>
                      <div>Lng: {point[1].toFixed(5)}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Centroid Marker if computed */}
              {areaMetrics?.centroid && (
                <Marker
                  position={[areaMetrics.centroid.latitude, areaMetrics.centroid.longitude]}
                  icon={defaultIcon}
                >
                  <Popup>
                    <div className="text-xs font-semibold">
                      Farm Centroid GPS: {areaMetrics.centroid.latitude.toFixed(5)}, {areaMetrics.centroid.longitude.toFixed(5)}
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>

            {/* Drawing Prompt Overlay */}
            {isDrawing && (
              <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 border border-emerald-500/40 text-emerald-300 text-xs px-3.5 py-2 rounded-xl backdrop-blur-md shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Drawing Mode Active: Click on the map to add boundary corners ({polygonPoints.length} points placed)</span>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: Metrics & Water Resource Intelligence */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'metrics'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Boundary Metrics
            </button>
            <button
              onClick={() => setActiveTab('water')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'water'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Droplets className="w-3.5 h-3.5" />
              Water Resources
            </button>
          </div>

          {/* Tab 1: Boundary & Geodesic Area Metrics */}
          {activeTab === 'metrics' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 animate-fadeIn">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Spatial Geometry Analysis
              </h3>

              {areaMetrics ? (
                <div className="space-y-3">
                  {/* Primary Area Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Hectares</span>
                      <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                        {areaMetrics.area_hectares}
                      </span>
                      <span className="text-[10px] text-slate-500 block">ha</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Acres</span>
                      <span className="text-2xl font-extrabold text-sky-400 font-mono">
                        {areaMetrics.area_acres}
                      </span>
                      <span className="text-[10px] text-slate-500 block">ac</span>
                    </div>
                  </div>

                  {/* Secondary Metrics */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Sq Meters:</span>
                      <span className="text-slate-200">{areaMetrics.area_sq_meters.toLocaleString()} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Perimeter:</span>
                      <span className="text-slate-200">{areaMetrics.perimeter_km} km ({areaMetrics.perimeter_meters} m)</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800/60 pt-2">
                      <span className="text-slate-400">Centroid Lat:</span>
                      <span className="text-emerald-400">{areaMetrics.centroid.latitude.toFixed(6)}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Centroid Lng:</span>
                      <span className="text-emerald-400">{areaMetrics.centroid.longitude.toFixed(6)}°</span>
                    </div>
                  </div>

                  {/* Save to Farm prompt if not saved */}
                  {isAuthenticated && farms.length > 0 && selectedFarmId && (
                    <button
                      onClick={handleSaveBoundaryToFarm}
                      disabled={savingBoundary}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {savingBoundary ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Attach Boundary to Farm
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center space-y-2">
                  <Globe className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">No Boundary Drawn</p>
                  <p className="text-[11px] text-slate-400">
                    Click <strong>"Draw Boundary"</strong> and click points on the map to measure area in acres and hectares.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Water Resource Intelligence */}
          {activeTab === 'water' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-sky-400" />
                  Water Resource Intelligence
                </h3>
                {waterData && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
                    {waterData.water_bodies_found_count} Bodies Found
                  </span>
                )}
              </div>

              {loadingWater ? (
                <div className="p-10 text-center flex flex-col items-center">
                  <Loader2 className="w-7 h-7 text-sky-400 animate-spin mb-2" />
                  <p className="text-xs text-slate-400">Scanning rivers, canals & reservoirs...</p>
                </div>
              ) : waterData ? (
                <div className="space-y-3">
                  {/* Accessibility Rating */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Water Accessibility</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        waterData.water_accessibility.rating === 'High'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : waterData.water_accessibility.rating === 'Moderate'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {waterData.water_accessibility.rating}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {waterData.water_accessibility.summary}
                    </p>
                  </div>

                  {/* Nearby Water Features List */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Identified Hydrological Features (10 km radius)
                    </span>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {waterData.water_bodies.map((body, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-white truncate max-w-[170px]">{body.name}</div>
                            <div className="text-[10px] text-slate-400">{body.type}</div>
                          </div>
                          <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/60 px-2 py-1 rounded border border-sky-800/40">
                            {body.distance_km} km
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scientific Disclaimer */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      Hydrological Data Note
                    </div>
                    <p className="leading-relaxed">
                      {waterData.water_availability.disclaimer}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center space-y-2">
                  <Droplets className="w-8 h-8 text-sky-400 mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">Water Intelligence Uncomputed</p>
                  <p className="text-[11px] text-slate-400">
                    Click <strong>"Water Intelligence"</strong> above to scan rivers, lakes, canals, and reservoirs around this farm.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
