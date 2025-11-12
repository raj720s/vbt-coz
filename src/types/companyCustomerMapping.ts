// Customer within mapping
export interface MappingCustomer {
  customer_id: number;
  customer_name: string;
  is_active: boolean;
  created_on: string;
}

// Company Customer Mapping (List response item)
export interface CompanyCustomerMapping {
  company_id: number;
  company_name: string;
  customers: MappingCustomer[];
}

export interface CompanyCustomerMappingListRequest {
  page?: number;
  page_size?: number;
  order_by?: string;
  order_type?: string;
  company?: number; // API uses "company" not "company_id"
  customer?: number; // API uses "customer" not "customer_id"
  search?: string;
}

// API Request/Response types
export interface CustomerMappingApiRequest {
  company_id: number;
  customer_names: string[];
}

export interface CustomerMappingApiResponse {
  company_id: number;
  customer_names: string[];
}

// List API Response
export interface CompanyCustomerMappingListResponse {
  count: number;
  total_is_active: number;
  total_inactive: number;
  results: CompanyCustomerMapping[];
}

export interface CompanyCustomerMappingCreateRequest {
  company_id: number;
  customer_names: string[]; // API uses customer_names (strings)
}

export interface CompanyCustomerMappingUpdateRequest {
  company_id?: number;
  customer_names?: string[]; // API uses customer_names (strings)
}

// API Response for GET/PUT - matches exactly what the API returns
export interface CustomerMappingGetResponse {
  company_id: number;
  company_name: string;
  customer_names: string[];
}

// Internal response type for form usage (converted from API response)
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

