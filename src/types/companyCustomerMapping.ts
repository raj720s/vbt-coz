export interface CompanyCustomerMapping {
  id: number;
  company_id: number;
  company_name: string;
  company_type: number;
  company_type_label: string;
  customer_ids: number[];
  customers: Array<{
    id: number;
    name: string;
    customer_code: string;
  }>;
  is_active: boolean;
  created_on?: string;
  modified_on?: string;
  created_by?: number;
  modified_by?: number;
  created_by_name?: string;
  modified_by_name?: string;
}

export interface CompanyCustomerMappingListRequest {
  page?: number;
  page_size?: number;
  order_by?: string;
  order_type?: string;
  company_id?: number;
  company_type?: number;
  customer_id?: number;
  is_active?: boolean;
  created_by?: number;
  created_by_name?: string;
  modified_by?: number;
  modified_by_name?: string;
  created_on_start_date?: string;
  created_on_end_date?: string;
  modified_on_start_date?: string;
  modified_on_end_date?: string;
  search?: string;
}

export interface CompanyCustomerMappingListResponse {
  count: number;
  total_is_active: number;
  total_inactive: number;
  next?: string;
  previous?: string;
  results: CompanyCustomerMapping[];
}

export interface CompanyCustomerMappingCreateRequest {
  company_id: number;
  customer_ids: number[];
}

export interface CompanyCustomerMappingUpdateRequest {
  company_id?: number;
  customer_ids?: number[];
  is_active?: boolean;
}

export interface CompanyCustomerMappingResponse {
  id: number;
  company_id: number;
  company_name: string;
  company_type: number;
  company_type_label: string;
  customer_ids: number[];
  customers: Array<{
    id: number;
    name: string;
    customer_code: string;
  }>;
  is_active: boolean;
  created_on?: string;
  modified_on?: string;
  created_by?: number;
  modified_by?: number;
  created_by_name?: string;
  modified_by_name?: string;
}

