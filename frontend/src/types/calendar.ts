import { ActivityCategory, ActivityPriority, ActivityStatus, FarmTask } from './task';

export type CalendarViewMode = 'month' | 'week' | 'day';

export interface ActivityTemplate {
  id: string;
  name: string;
  category: ActivityCategory | string;
  description: string;
  crop_name: string;
  growth_stage: string;
  days_after_sowing: number;
  default_priority: ActivityPriority;
  is_weather_sensitive: boolean;
  is_active: boolean;
}

export interface ActivitySuggestion {
  template_id?: string;
  title: string;
  category: ActivityCategory | string;
  description: string;
  growth_stage: string;
  days_after_sowing: number;
  suggested_date: string;
  priority: ActivityPriority;
  is_weather_sensitive: boolean;
  weather_warning?: string | null;
}

export interface GenerateSuggestionsResponse {
  farm_id: string;
  field_id?: string | null;
  crop_id: string;
  crop_name: string;
  variety?: string | null;
  planting_date: string;
  days_since_planting: number;
  current_growth_stage: string;
  suggestions: ActivitySuggestion[];
}

export interface GenerateSuggestionsPayload {
  farm_id: string;
  crop_id: string;
  field_id?: string | null;
  planting_date?: string | null;
}

export interface CalendarQueryParams {
  farm_id?: string;
  field_id?: string;
  crop_id?: string;
  start_date?: string;
  end_date?: string;
  status?: ActivityStatus;
  category?: ActivityCategory | string;
}

export interface CalendarDayInfo {
  date: Date;
  dateString: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  isToday: boolean;
  activities: FarmTask[];
}
