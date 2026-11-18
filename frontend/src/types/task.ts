export type ActivityCategory =
  | 'land_preparation'
  | 'sowing'
  | 'irrigation'
  | 'fertilizer'
  | 'scouting'
  | 'crop_protection'
  | 'harvest'
  | 'maintenance'
  | 'general';

export type ActivityStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type ActivityPriority = 'high' | 'medium' | 'low';
export type ActivitySource = 'manual' | 'suggested' | 'weather_alert';

export interface FarmTask {
  id: string;
  user_id?: string;
  farm_id?: string | null;
  field_id?: string | null;
  crop_id?: string | null;
  title: string;
  description?: string | null;
  due_date?: string;
  dueDate?: string; // Compatibility alias
  category: ActivityCategory | string;
  priority: ActivityPriority;
  status?: ActivityStatus;
  completed: boolean;
  start_time?: string | null;
  end_time?: string | null;
  completed_at?: string | null;
  source?: ActivitySource;
  is_weather_sensitive?: boolean;
  reminder_at?: string | null;
  created_at?: string;
  updated_at?: string;
  farm_name?: string | null;
  field_name?: string | null;
  crop_name?: string | null;
}

export interface TaskCreatePayload {
  title: string;
  description?: string | null;
  due_date?: string;
  category?: ActivityCategory | string;
  priority?: ActivityPriority;
  farm_id?: string | null;
  field_id?: string | null;
  crop_id?: string | null;
  status?: ActivityStatus;
  completed?: boolean;
  start_time?: string | null;
  end_time?: string | null;
  source?: ActivitySource;
  is_weather_sensitive?: boolean;
  reminder_at?: string | null;
}

export interface TaskUpdatePayload {
  title?: string;
  description?: string | null;
  due_date?: string;
  category?: ActivityCategory | string;
  priority?: ActivityPriority;
  status?: ActivityStatus;
  completed?: boolean;
  farm_id?: string | null;
  field_id?: string | null;
  crop_id?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  is_weather_sensitive?: boolean;
  reminder_at?: string | null;
}
