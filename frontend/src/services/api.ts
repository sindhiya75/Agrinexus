import { HealthResponse } from '../types/health';
import { User, TokenResponse, LoginPayload, RegisterPayload } from '../types/auth';
import {
  Farm,
  FarmCreatePayload,
  FarmUpdatePayload,
  Field,
  FieldCreatePayload,
  FieldUpdatePayload,
  Crop,
  CropCreatePayload,
  CropUpdatePayload,
} from '../types/farm';
import {
  PolygonAreaResponse,
  WaterIntelligenceResponse,
  NominatimLocationResult,
} from '../types/gis';
import {
  SoilProfileResponse,
  WeatherResponse,
  RainfallResponse,
  TerrainResponse,
  WaterIntelligenceCombinedResponse,
  UnifiedFarmAnalysisResponse,
} from '../types/intelligence';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Token storage helpers
export const TOKEN_KEY = 'agrinexus_access_token';
export const REFRESH_TOKEN_KEY = 'agrinexus_refresh_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearStoredTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Authenticated fetch wrapper
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data?.detail || `API error: ${response.status} ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// ---------------------------------------------------------------------------
// System Health (Phase 0)
// ---------------------------------------------------------------------------
export async function fetchHealth(): Promise<{ data: HealthResponse | null; error: string | null; responseTimeMs: number }> {
  const startTime = performance.now();
  const endpoints = [
    `${API_BASE_URL}/health`,
    `${API_BASE_URL}/api/v1/health`,
    '/health',
    '/api/v1/health',
  ];

  let lastError: string | null = null;

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      const responseTimeMs = Math.round(performance.now() - startTime);

      if (response.ok || response.status === 503) {
        const data: HealthResponse = await response.json();
        return { data, error: null, responseTimeMs };
      }
    } catch (err: any) {
      lastError = err?.message || 'Network request failed';
    }
  }

  const responseTimeMs = Math.round(performance.now() - startTime);
  return {
    data: null,
    error: lastError || 'Unable to connect to FastAPI backend service. Ensure backend is running.',
    responseTimeMs,
  };
}

// ---------------------------------------------------------------------------
// Authentication (Phase 1)
// ---------------------------------------------------------------------------
export async function registerApi(payload: RegisterPayload): Promise<User> {
  return apiRequest<User>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loginApi(payload: LoginPayload): Promise<TokenResponse> {
  const data = await apiRequest<TokenResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setStoredTokens(data.access_token, data.refresh_token);
  return data;
}

export async function getMeApi(): Promise<User> {
  return apiRequest<User>('/api/v1/auth/me');
}

// ---------------------------------------------------------------------------
// Farms CRUD (Phase 1)
// ---------------------------------------------------------------------------
export async function getFarmsApi(): Promise<Farm[]> {
  return apiRequest<Farm[]>('/api/v1/farms/');
}

export async function createFarmApi(payload: FarmCreatePayload): Promise<Farm> {
  return apiRequest<Farm>('/api/v1/farms/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getFarmDetailApi(farmId: string): Promise<Farm> {
  return apiRequest<Farm>(`/api/v1/farms/${farmId}`);
}

export async function updateFarmApi(farmId: string, payload: FarmUpdatePayload): Promise<Farm> {
  return apiRequest<Farm>(`/api/v1/farms/${farmId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteFarmApi(farmId: string): Promise<void> {
  return apiRequest<void>(`/api/v1/farms/${farmId}`, {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// Fields CRUD (Phase 1)
// ---------------------------------------------------------------------------
export async function getFieldsApi(farmId: string): Promise<Field[]> {
  return apiRequest<Field[]>(`/api/v1/farms/${farmId}/fields`);
}

export async function createFieldApi(farmId: string, payload: FieldCreatePayload): Promise<Field> {
  return apiRequest<Field>(`/api/v1/farms/${farmId}/fields`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getFieldDetailApi(fieldId: string): Promise<Field> {
  return apiRequest<Field>(`/api/v1/fields/${fieldId}`);
}

export async function updateFieldApi(fieldId: string, payload: FieldUpdatePayload): Promise<Field> {
  return apiRequest<Field>(`/api/v1/fields/${fieldId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteFieldApi(fieldId: string): Promise<void> {
  return apiRequest<void>(`/api/v1/fields/${fieldId}`, {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// Crops CRUD (Phase 1)
// ---------------------------------------------------------------------------
export async function getCropsApi(fieldId: string): Promise<Crop[]> {
  return apiRequest<Crop[]>(`/api/v1/fields/${fieldId}/crops`);
}

export async function createCropApi(fieldId: string, payload: CropCreatePayload): Promise<Crop> {
  return apiRequest<Crop>(`/api/v1/fields/${fieldId}/crops`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCropApi(cropId: string, payload: CropUpdatePayload): Promise<Crop> {
  return apiRequest<Crop>(`/api/v1/crops/${cropId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteCropApi(cropId: string): Promise<void> {
  return apiRequest<void>(`/api/v1/crops/${cropId}`, {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// GIS & Spatial Intelligence (Phase 2)
// ---------------------------------------------------------------------------
export async function calculatePolygonAreaApi(boundaryGeojson: any): Promise<PolygonAreaResponse> {
  return apiRequest<PolygonAreaResponse>('/api/v1/gis/calculate-area', {
    method: 'POST',
    body: JSON.stringify({ boundary_geojson: boundaryGeojson }),
  });
}

export async function analyzeWaterResourcesApi(
  latitude: number,
  longitude: number,
  radiusMeters: number = 10000
): Promise<WaterIntelligenceResponse> {
  return apiRequest<WaterIntelligenceResponse>('/api/v1/gis/water-intelligence', {
    method: 'POST',
    body: JSON.stringify({
      latitude,
      longitude,
      radius_meters: radiusMeters,
    }),
  });
}

export async function saveFarmBoundaryApi(farmId: string, boundaryGeojson: any): Promise<Farm> {
  return apiRequest<Farm>(`/api/v1/gis/farms/${farmId}/boundary`, {
    method: 'PUT',
    body: JSON.stringify({ boundary_geojson: boundaryGeojson }),
  });
}

export async function saveFieldBoundaryApi(fieldId: string, boundaryGeojson: any): Promise<Field> {
  return apiRequest<Field>(`/api/v1/gis/fields/${fieldId}/boundary`, {
    method: 'PUT',
    body: JSON.stringify({ boundary_geojson: boundaryGeojson }),
  });
}

export async function getFarmWaterIntelligenceApi(farmId: string): Promise<WaterIntelligenceResponse> {
  return apiRequest<WaterIntelligenceResponse>(`/api/v1/gis/farms/${farmId}/water-intelligence`);
}

export async function searchNominatimLocation(query: string): Promise<NominatimLocationResult[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AgriNexusAI/1.0',
        },
      }
    );
    if (res.ok) {
      return await res.json();
    }
    return [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Phase 3 Farm Intelligence Services
// ---------------------------------------------------------------------------
export async function getSoilProfileApi(latitude: number, longitude: number): Promise<SoilProfileResponse> {
  return apiRequest<SoilProfileResponse>(`/api/v1/soil?latitude=${latitude}&longitude=${longitude}`);
}

export async function getWeatherApi(latitude: number, longitude: number): Promise<WeatherResponse> {
  return apiRequest<WeatherResponse>(`/api/v1/weather?latitude=${latitude}&longitude=${longitude}`);
}

export async function getRainfallApi(latitude: number, longitude: number): Promise<RainfallResponse> {
  return apiRequest<RainfallResponse>(`/api/v1/rainfall?latitude=${latitude}&longitude=${longitude}`);
}

export async function getTerrainApi(latitude: number, longitude: number): Promise<TerrainResponse> {
  return apiRequest<TerrainResponse>(`/api/v1/terrain?latitude=${latitude}&longitude=${longitude}`);
}

export async function getWaterApi(latitude: number, longitude: number, areaHectares: number = 1.0): Promise<WaterIntelligenceCombinedResponse> {
  return apiRequest<WaterIntelligenceCombinedResponse>(`/api/v1/water?latitude=${latitude}&longitude=${longitude}&area_hectares=${areaHectares}`);
}

export async function getFarmAnalysisApi(
  latitude: number,
  longitude: number,
  areaHectares: number = 1.0,
  farmName?: string
): Promise<UnifiedFarmAnalysisResponse> {
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    area_hectares: String(areaHectares),
  });
  if (farmName) query.append('farm_name', farmName);
  return apiRequest<UnifiedFarmAnalysisResponse>(`/api/v1/farm-analysis?${query.toString()}`);
}

export async function getSavedFarmAnalysisApi(farmId: string): Promise<UnifiedFarmAnalysisResponse> {
  return apiRequest<UnifiedFarmAnalysisResponse>(`/api/v1/farm-analysis/${farmId}`);
}

// ========================================================
// PHASE 4: MACHINE LEARNING INTELLIGENCE SERVICES
// ========================================================

export async function getCropRecommendationApi(
  payload: import('../types/ml').CropRecommendationRequest
): Promise<import('../types/ml').CropRecommendationResponse> {
  return apiRequest<import('../types/ml').CropRecommendationResponse>('/api/v1/ml/crop-recommendation', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getFertilizerRecommendationApi(
  payload: import('../types/ml').FertilizerRecommendationRequest
): Promise<import('../types/ml').FertilizerRecommendationResponse> {
  return apiRequest<import('../types/ml').FertilizerRecommendationResponse>('/api/v1/ml/fertilizer-recommendation', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getIrrigationRecommendationApi(
  payload: import('../types/ml').IrrigationRecommendationRequest
): Promise<import('../types/ml').IrrigationRecommendationResponse> {
  return apiRequest<import('../types/ml').IrrigationRecommendationResponse>('/api/v1/ml/irrigation-recommendation', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getYieldPredictionApi(
  payload: import('../types/ml').YieldPredictionRequest
): Promise<import('../types/ml').YieldPredictionResponse> {
  return apiRequest<import('../types/ml').YieldPredictionResponse>('/api/v1/ml/yield-prediction', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function detectDiseaseApi(
  file: File,
  cropHint?: string
): Promise<import('../types/ml').DiseaseDetectionResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (cropHint) formData.append('crop_hint', cropHint);

  const token = getStoredToken();
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/api/v1/ml/disease-detection`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to process leaf image.' }));
    throw new Error(errorData.detail || 'Failed to detect leaf disease.');
  }

  return res.json();
}

export async function getMLModelsMetadataApi(): Promise<import('../types/ml').AllModelsMetadataResponse> {
  return apiRequest<import('../types/ml').AllModelsMetadataResponse>('/api/v1/ml/models-metadata');
}

// ========================================================
// PHASE 5: AGENT AI FARMING MENTOR
// ========================================================

export async function agentChatApi(
  payload: import('../types/agent').AgentChatRequest
): Promise<import('../types/agent').AgentChatResponse> {
  return apiRequest<import('../types/agent').AgentChatResponse>('/api/agent/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}


