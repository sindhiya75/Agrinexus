export interface Crop {
  id: string;
  field_id: string;
  name: string;
  variety?: string | null;
  planting_date?: string | null;
  expected_harvest_date?: string | null;
  status: 'planted' | 'growing' | 'flowering' | 'harvested';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CropCreatePayload {
  name: string;
  variety?: string;
  planting_date?: string;
  expected_harvest_date?: string;
  status?: string;
  notes?: string;
}

export interface CropUpdatePayload {
  name?: string;
  variety?: string;
  planting_date?: string;
  expected_harvest_date?: string;
  status?: string;
  notes?: string;
}

export interface Field {
  id: string;
  farm_id: string;
  name: string;
  field_type?: string | null;
  area_hectares?: number | null;
  soil_type?: string | null;
  boundary_geojson?: any | null;
  created_at: string;
  updated_at: string;
  crops?: Crop[];
}

export interface FieldCreatePayload {
  name: string;
  field_type?: string;
  area_hectares?: number;
  soil_type?: string;
  boundary_geojson?: any;
}

export interface FieldUpdatePayload {
  name?: string;
  field_type?: string;
  area_hectares?: number;
  soil_type?: string;
  boundary_geojson?: any;
}

export interface Farm {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  total_area_hectares?: number | null;
  boundary_geojson?: any | null;
  created_at: string;
  updated_at: string;
  field_count?: number;
  fields?: Field[];
}

export interface FarmCreatePayload {
  name: string;
  description?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  total_area_hectares?: number;
  boundary_geojson?: any;
}

export interface FarmUpdatePayload {
  name?: string;
  description?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  total_area_hectares?: number;
  boundary_geojson?: any;
}
