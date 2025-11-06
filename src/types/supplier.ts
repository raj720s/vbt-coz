export interface Supplier {
  id: number;
  company: number;
  name: string;
  code: string;
  country?: string;
  email: string;
  phone?: string;
  description?: string;
  is_active: boolean;
  created_by?: number;
  modified_by?: number;
}

export interface SupplierFormData {
  company: number;
  name: string;
  code: string;
  country?: string;
  email: string;
  phone?: string;
  description?: string;
  is_active: boolean;
}

export interface SupplierListRequest {
  page?: number;
  page_size?: number;
  order_by?: string;
  order_type?: string;
  company?: number;
  name?: string;
  code?: string;
  country?: string;
  email?: string;
  phone?: string;
  description?: string;
  is_active?: boolean;
  created_by?: number;
  created_by_name?: string;
  modified_by?: number;
  modified_by_name?: string;
  created_on_start_date?: string;
  created_on_end_date?: string;
  modified_on_start_date?: string;
  modified_on_end_date?: string;
  // Support search parameter for backwards compatibility
  search?: string;
}

export interface SupplierListResponse {
  count: number;
  total_is_active: number;
  total_inactive: number;
  next?: string;
  previous?: string;
  results: Supplier[];
}

export interface SupplierCreateRequest {
  company: number;
  name: string;
  code: string;
  country?: string;
  email: string;
  phone?: string;
  description?: string;
  is_active: boolean;
}

export interface SupplierUpdateRequest {
  company: number;
  name: string;
  code: string;
  country?: string;
  email: string;
  phone?: string;
  description?: string;
  is_active: boolean;
}

// Re-export COUNTRIES from company types for consistency
export { COUNTRIES } from './company';

