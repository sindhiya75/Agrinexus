export interface DatabaseHealth {
  connected: boolean;
  postgis_installed: boolean;
  postgis_version: string | null;
  database_name: string;
  latency_ms: number | null;
  error: string | null;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  database: DatabaseHealth;
  details: Record<string, unknown>;
}

export type TabType =
  | 'dashboard'
  | 'my-farms'
  | 'smart-farm-map'
  | 'farm-analysis'
  | 'ai-mentor'
  | 'crop-planning'
  | 'irrigation'
  | 'fertilizer'
  | 'disease-detection'
  | 'settings';
