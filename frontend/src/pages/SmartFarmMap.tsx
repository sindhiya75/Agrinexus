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
  Search,
  Plus,
  Trash2,
  Save,
  Compass,
  Droplets,
  CheckCircle2,
  RotateCcw,
  Loader2,
  Globe,
  Layers
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
  const [tileLayerType, setTileLayerType] = useState<'satellite' | 'osm' | 'topo'>('satellite');

  // Drawing state
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([]);
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

    const geojsonCoords = points.map((p) => [p[1], p[0]]);
    geojsonCoords.push([points[0][1], points[0][0]]);

    try {
      const res = await calculatePolygonAreaApi(geojsonCoords);
      setAreaMetrics(res);
    } catch (err) {
      console.error('Failed to compute polygon area:', err);
    }
  }, []);

  useEffect(() => {
    computePolygonArea(polygonPoints);
  }, [polygonPoints, computePolygonArea]);

  // Handle undo last point
  const handleUndoPoint = () => {
    setPolygonPoints((prev) => prev.slice(0, -1));
  };

  // Handle clear boundary
  const handleClearBoundary = () => {
    setPolygonPoints([]);
    setAreaMetrics(null);
    setSaveSuccessMsg(null);
    setIsDrawing(false);
  };

  // Search location via Nominatim
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await searchNominatimLocation(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Location search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  // Select location from search
  const handleSelectLocation = (result: NominatimLocationResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setMapCenter([lat, lon]);
    setMapZoom(16);
    setSearchResults([]);
    setSearchQuery(result.display_name.split(',')[0]);
  };

  // Select existing farm from dropdown
  const handleSelectFarm = (farmId: string) => {
    setSelectedFarmId(farmId);
    setSaveSuccessMsg(null);

    const farm = farms.find((f) => f.id === farmId);
    if (!farm) return;

    if (farm.boundary_geojson && farm.boundary_geojson.coordinates) {
      try {
        const ring = farm.boundary_geojson.coordinates[0];
        const points: [number, number][] = ring.map((c: number[]) => [c[1], c[0]]);
        if (
          points.length > 1 &&
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
      } catch (e) {
        if (farm.latitude && farm.longitude) {
          setMapCenter([farm.latitude, farm.longitude]);
          setMapZoom(16);
        }
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
      setSaveSuccessMsg(`Boundary saved (${updatedFarm.total_area_hectares} ha).`);
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
    <div className="space-y-4 max-w-7xl pb-12 font-sans">
      {/* 1. Clean Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Smart Farm Map</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Draw parcel boundaries, measure geodesic acreage, and analyze water sources.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsDrawing(!isDrawing)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              isDrawing
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-forest-700 hover:bg-forest-800 text-white'
            }`}
          >
            {isDrawing ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Finish Drawing</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Draw Boundary</span>
              </>
            )}
          </button>

          {polygonPoints.length > 0 && (
            <>
              <button
                onClick={handleUndoPoint}
                className="p-1.5 rounded-lg bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 text-xs transition-colors"
                title="Undo point"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleClearBoundary}
                className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-neutral-700 hover:text-rose-600 border border-neutral-300 text-xs transition-colors"
                title="Clear boundary"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={handleAnalyzeWater}
            disabled={loadingWater}
            className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {loadingWater ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Droplets className="w-3.5 h-3.5 text-sky-600" />}
            <span>Water Analysis</span>
          </button>
        </div>
      </div>

      {/* 2. Main Map + Side Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Map Column */}
        <div className="lg:col-span-2 space-y-3">
          {/* Map Toolbar */}
          <div className="bg-white border border-neutral-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search city or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-forest-600"
                />
                {searching && (
                  <Loader2 className="absolute right-2.5 top-2 w-3.5 h-3.5 text-neutral-400 animate-spin" />
                )}
              </form>

              {searchResults.length > 0 && (
                <div className="absolute top-10 left-0 right-0 z-50 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.place_id}
                      onClick={() => handleSelectLocation(result)}
                      className="w-full text-left px-3 py-2 text-xs text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 border-b border-neutral-100 last:border-0 truncate"
                    >
                      {result.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Farm Selector */}
            {isAuthenticated && farms.length > 0 && (
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedFarmId}
                  onChange={(e) => handleSelectFarm(e.target.value)}
                  className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-forest-600"
                >
                  <option value="">Load Farm</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} {f.total_area_hectares ? `(${f.total_area_hectares.toFixed(1)} ha)` : ''}
                    </option>
                  ))}
                </select>

                {polygonPoints.length >= 3 && selectedFarmId && (
                  <button
                    onClick={handleSaveBoundaryToFarm}
                    disabled={savingBoundary}
                    className="px-2.5 py-1.5 bg-forest-700 hover:bg-forest-800 text-white font-medium text-xs rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    {savingBoundary ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Save
                  </button>
                )}
              </div>
            )}

            {/* Tile Selector */}
            <div className="flex items-center p-0.5 bg-neutral-100 rounded-lg text-xs">
              <button
                onClick={() => setTileLayerType('satellite')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  tileLayerType === 'satellite'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => setTileLayerType('osm')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  tileLayerType === 'osm'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Street
              </button>
              <button
                onClick={() => setTileLayerType('topo')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  tileLayerType === 'topo'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Topo
              </button>
            </div>
          </div>

          {/* Save Status Banner */}
          {saveSuccessMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Leaflet Map Canvas */}
          <div className="h-[520px] rounded-2xl overflow-hidden border border-neutral-200 relative">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom={true}
              className="w-full h-full"
            >
              {tileLayerType === 'satellite' && (
                <TileLayer
                  attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={19}
                />
              )}
              {tileLayerType === 'osm' && (
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />
              )}
              {tileLayerType === 'topo' && (
                <TileLayer
                  attribution='&copy; OpenTopoMap'
                  url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                  maxZoom={17}
                />
              )}

              <MapFlyTo center={mapCenter} zoom={mapZoom} />
              <MapEventsHandler isDrawing={isDrawing} onAddPoint={handleAddPoint} />

              {/* Polyline while drafting */}
              {polygonPoints.length > 1 && polygonPoints.length < 3 && (
                <Polyline positions={polygonPoints} pathOptions={{ color: '#153e2d', weight: 2.5, dashArray: '4, 4' }} />
              )}

              {/* Closed Polygon */}
              {polygonPoints.length >= 3 && (
                <Polygon
                  positions={polygonPoints}
                  pathOptions={{
                    color: '#153e2d',
                    weight: 2.5,
                    fillColor: '#2d6a4f',
                    fillOpacity: 0.3,
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1 p-1">
                      <strong className="block font-semibold">Boundary</strong>
                      <div>Area: {areaMetrics?.area_hectares || 0} ha ({areaMetrics?.area_acres || 0} acres)</div>
                      <div>Perimeter: {areaMetrics?.perimeter_km || 0} km</div>
                    </div>
                  </Popup>
                </Polygon>
              )}

              {/* Markers for vertices */}
              {polygonPoints.map((point, idx) => (
                <Marker key={idx} position={point} icon={defaultIcon}>
                  <Popup>
                    <div className="text-xs p-1">
                      <strong>Point #{idx + 1}</strong>
                      <div>{point[0].toFixed(5)}, {point[1].toFixed(5)}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Centroid */}
              {areaMetrics?.centroid && (
                <Marker
                  position={[areaMetrics.centroid.latitude, areaMetrics.centroid.longitude]}
                  icon={defaultIcon}
                >
                  <Popup>
                    <div className="text-xs p-1">
                      Centroid: {areaMetrics.centroid.latitude.toFixed(5)}, {areaMetrics.centroid.longitude.toFixed(5)}
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>

            {/* Drawing Prompt */}
            {isDrawing && (
              <div className="absolute top-3 left-3 z-[1000] bg-white/95 border border-neutral-300 text-neutral-900 text-xs px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-forest-600 animate-ping" />
                <span>Click map to add boundary points ({polygonPoints.length} added)</span>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: Metrics & Water Intelligence */}
        <div className="space-y-3">
          <div className="flex p-0.5 bg-neutral-100 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex-1 py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'metrics'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Boundary Metrics</span>
            </button>
            <button
              onClick={() => setActiveTab('water')}
              className={`flex-1 py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'water'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>Water Resources</span>
            </button>
          </div>

          {/* Metrics Tab */}
          {activeTab === 'metrics' && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-3.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-900 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-forest-700" />
                Area & Perimeter
              </h3>

              {areaMetrics ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                      <span className="text-[10px] text-neutral-500 block">Hectares</span>
                      <span className="text-xl font-bold text-neutral-900 font-mono">
                        {areaMetrics.area_hectares}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                      <span className="text-[10px] text-neutral-500 block">Acres</span>
                      <span className="text-xl font-bold text-neutral-900 font-mono">
                        {areaMetrics.area_acres}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-neutral-500 font-sans">Square Meters:</span>
                      <span className="font-semibold text-neutral-900">{areaMetrics.area_sq_meters.toLocaleString()} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 font-sans">Perimeter:</span>
                      <span className="font-semibold text-neutral-900">{areaMetrics.perimeter_km} km</span>
                    </div>
                    <div className="flex justify-between border-t border-neutral-200 pt-1.5">
                      <span className="text-neutral-500 font-sans">Centroid:</span>
                      <span className="font-semibold text-neutral-900">
                        {areaMetrics.centroid.latitude.toFixed(4)}°, {areaMetrics.centroid.longitude.toFixed(4)}°
                      </span>
                    </div>
                  </div>

                  {isAuthenticated && farms.length > 0 && selectedFarmId && (
                    <button
                      onClick={handleSaveBoundaryToFarm}
                      disabled={savingBoundary}
                      className="w-full py-2 bg-forest-700 hover:bg-forest-800 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {savingBoundary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Attach to Selected Farm
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-neutral-50 border border-dashed border-neutral-200 text-center space-y-1">
                  <Globe className="w-6 h-6 text-neutral-400 mx-auto" />
                  <p className="text-xs text-neutral-800 font-medium">No boundary active</p>
                  <p className="text-[11px] text-neutral-500">
                    Click "Draw Boundary" on the map to calculate parcel acreage.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Water Tab */}
          {activeTab === 'water' && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-900 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-600" />
                  Hydrology
                </h3>
                {waterData && (
                  <span className="text-[10px] text-neutral-500">
                    {waterData.water_bodies_found_count} sources found
                  </span>
                )}
              </div>

              {loadingWater ? (
                <div className="py-8 text-center flex flex-col items-center">
                  <Loader2 className="w-5 h-5 text-neutral-400 animate-spin mb-1.5" />
                  <p className="text-xs text-neutral-500">Scanning water bodies in 10 km radius...</p>
                </div>
              ) : waterData ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-600">Accessibility</span>
                      <span className="font-semibold text-neutral-900">
                        {waterData.water_accessibility.rating}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-1 leading-relaxed">
                      {waterData.water_accessibility.summary}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">
                      Nearby Features (10 km)
                    </span>
                    <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                      {waterData.water_bodies.map((body, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-medium text-neutral-900 truncate max-w-[150px]">{body.name}</div>
                            <div className="text-[10px] text-neutral-500">{body.type}</div>
                          </div>
                          <span className="text-xs font-mono font-medium text-sky-800">
                            {body.distance_km} km
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-neutral-50 border border-dashed border-neutral-200 text-center space-y-1">
                  <Droplets className="w-6 h-6 text-sky-600 mx-auto" />
                  <p className="text-xs text-neutral-800 font-medium">No water data</p>
                  <p className="text-[11px] text-neutral-500">
                    Click "Water Analysis" above to inspect rivers and lakes within 10 km.
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
export default SmartFarmMap;
