export interface DataCitation {
  source: string;
  data_type: 'Retrieved Data' | 'Calculated Value' | 'Model Prediction';
  metric: string;
  details: string;
}

export interface AgentChatRequest {
  message: string;
  farm_id?: string;
  latitude?: number;
  longitude?: number;
  area_hectares?: number;
  crop_name?: string;
  session_id?: string;
}

export interface AgentChatResponse {
  session_id: string;
  reply: string;
  detected_intent: string;
  tools_executed: string[];
  reasoning_steps: string[];
  data_citations: DataCitation[];
  farm_context?: Record<string, any> | null;
}
