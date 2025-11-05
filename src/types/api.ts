// User Management Types
export interface CreateUserRequest {
  status: boolean;
  first_name: string;
  last_name: string;
  email: string;
  organisation_name: string;
  role: number;
  password?: string;
  company?: number;
}
export interface UpdateUserRequest {
  status: boolean;
  first_name: string;
  last_name: string;
  email: string;
  organisation_name: string;
  role_id: number;
  password?: string;
}

export interface UserResponse {
  status: boolean;
  first_name: string;
  last_name: string;
  email: string;
  organisation_name: string;
  created_on: string;
  role_id: number;
  phone_number: string;
  is_active?: boolean;
  updated_on?: string;
  role_details?: RoleInfo;
}

export interface RoleInfo {
  id: number;
  name: string;
  description?: string;
}

export interface UserDetailResponse extends UserResponse {
  id: number;
  updated_on?: string;
  is_active?: boolean;
  role_details?: RoleInfo;
}

// New type for actual API response structure
export interface UserProfileResponse {
  id: number;
  is_superuser: boolean;
  announcement_read_flag: number;
  role: Array<{
    id: number;
    role_name: string;
  }>;
  email: string;
  first_name: string;
  last_name: string;
  created_on: string;
  last_login: string;
  status: boolean;
  country_code: string | null;
  is_deleted: boolean;
  phone_number: string | null;
  modified_on: string | null;
  organisation_name: string;
  timezone: string | null;
  country: string | null;
  created_by: number;
  modified_by: number | null;
}

export interface UserShortInfo {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  organisation_name: string;
}

export interface UserListResponse {
  status: boolean;
  data: UserDetailResponse[];
  total: number;
  page: number;
  limit: number;
}

// New user list response structure for POST /api/user/v1/list
export interface UserListResponseV2 {
  count: number;
  results: Array<{
    id: number;
    is_superuser: boolean;
    email: string;
    first_name: string;
    last_name: string;
    created_on: string;
    last_login: string;
    status: boolean;
    country_code: string | null;
    is_deleted: boolean;
    phone_number: string | null;
    modified_on: string | null;
    organisation_name: string;
    timezone: string | null;
    country: string | null;
    created_by: number | null;
    modified_by: number | null;
    role_data: Array<{
      id: number;
      role_name: string;
    }>;
  }>;
}

// User JSON Info for mapping user IDs to names
export interface UserJsonInfoResponse {
  count: number;
  results: Record<string, string>; // Key: user_id, Value: user_name
}

// Company JSON Info for mapping company IDs to names
export interface CompanyJsonInfoResponse {
  count: number;
  results: Record<string, string>; // Key: company_id, Value: company_name
}

export interface UserListParams {
  email?: string;
  is_superuser?: boolean;
  first_name?: string;
  last_name?: string;
  organisation_name?: string;
  country_code?: string;
  phone_number?: string;
  order_by?: string;
  order_type?: string;
  created_on_start_date?: string;
  created_on_end_date?: string;
  created_by?: number;
  created_by_name?: string;
  modified_on_start_date?: string;
  modified_on_end_date?: string;
  last_login_start_date?: string;
  last_login_end_date?: string;
  modified_by?: number;
  modified_by_name?: string;
  page?: number;
  page_size?: number;
  status?: number;
  role_name?: string;
  export?: boolean;
}

// Role Management Types
export interface CreateRoleRequest {
  name: string;
  description?: string;
  privileges: number[];
  is_active?: boolean;
}

export interface RoleResponse {
  id: number;
  name: string;
  description?: string;
  privileges: number[];
  is_active: boolean;
  created_on: string;
  updated_on?: string;
}

export interface RoleListResponse {
  status: boolean;
  data: RoleResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface RoleListParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
}

// New comprehensive role list types for POST /api/admin/v1/role/list
export interface RoleListRequest {
  role_name?: string;
  role_description?: string;
  include_privilege_data?: boolean;
  order_by?: string;
  created_by?: number;
  created_on_start_date?: string;
  created_on_end_date?: string;
  modified_on_start_date?: string;
  modified_on_end_date?: string;
  created_by_name?: string;
  modified_by?: number;
  modified_by_name?: string;
  export?: boolean;
  module_id?: number;
  order_type?: string;
  page?: number;
  page_size?: number;
}

export interface RoleListResponseV2 {
  id: number;
  role_name: string;
  role_description: string;
  privilege_names: string[];
  modified_on: string | null;
  modified_by: number | null;
  created_on: string;
  created_by: number;
}

// POL (Port of Loading) Management Types
export interface CreatePOLRequest {
  name: string;
  code: string;
  country: string;
  unlocode?: string;
  timezone: string;
  is_active: boolean;
  latitude: string;
  longitude: string;
  address?: string;
  description?: string;
}

export interface UpdatePOLRequest {
  name?: string;
  code?: string;
  country?: string;
  unlocode?: string;
  timezone?: string;
  is_active?: boolean;
  latitude?: string;
  longitude?: string;
  address?: string;
  description?: string;
}

export interface POLResponse {
  id: number;
  name: string;
  code: string;
  country: string;
  unlocode?: string;
  timezone: string;
  is_active: boolean;
  latitude: string;
  longitude: string;
  address?: string;
  description?: string;
  created_on?: string;
  modified_on?: string;
  created_by?: number;
  modified_by?: number;
}

export interface POLListRequest {
  name?: string;
  code?: string;
  country?: string;
  unlocode?: string;
  timezone?: string;
  latitude?: string;
  longitude?: string;
  address?: string;
  description?: string;
  created_by?: number;
  modified_by?: number;
  order_by?: string;
  order_type?: string;
  page?: number;
  page_size?: number;
}

export interface POLListResponse {
  count: number;
  results: POLResponse[];
}

// POD (Port of Destination) Management Types
export interface CreatePODRequest {
  name: string;
  code: string;
  country: string;
  unlocode?: string;
  timezone: string;
  is_active: boolean;
  latitude: string;
  longitude: string;
  address?: string;
  description?: string;
}

export interface UpdatePODRequest {
  name?: string;
  code?: string;
  country?: string;
  unlocode?: string;
  timezone?: string;
  is_active?: boolean;
  latitude?: string;
  longitude?: string;
  address?: string;
  description?: string;
}

export interface PODResponse {
  id: number;
  name: string;
  code: string;
  country: string;
  unlocode?: string;
  timezone: string;
  is_active: boolean;
  latitude: string;
  longitude: string;
  address?: string;
  description?: string;
  created_on?: string;
  modified_on?: string;
  created_by?: number;
  modified_by?: number;
}

export interface PODListRequest {
  name?: string;
  code?: string;
  country?: string;
  unlocode?: string;
  timezone?: string;
  latitude?: string;
  longitude?: string;
  address?: string;
  description?: string;
  created_by?: number;
  modified_by?: number;
  order_by?: string;
  order_type?: string;
  page?: number;
  page_size?: number;
}

export interface PODListResponse {
  count: number;
  results: PODResponse[];
}

// Customer Management Types
export interface DynamicField {
  field_name: string;
}

export interface CustomField {
  id?: number; // Optional for new fields (will be assigned by API)
  name: string;
}

export interface CreateCustomerRequest {
  company: number;
  name: string;
  customer_code: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  tax_id: string;
  is_active: boolean;
  optionals?: string[];
  custom_fields?: CustomField[];
}

export interface UpdateCustomerRequest {
  company?: number;
  name?: string;
  customer_code?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  tax_id?: string;
  is_active?: boolean;
  optionals?: string[];
  custom_fields?: CustomField[];
}

export interface CustomerResponse {
  id: number;
  company?: {
    id: number;
    name: string;
  } | number; // Support both nested object (new format) and number (legacy format)
  name: string;
  customer_code: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  tax_id: string;
  is_active: boolean;
  optionals?: string[] | Record<string, any>;
  custom_fields?: CustomField[];
  dynamic_fields?: DynamicField[];
  created_on?: string;
  modified_on?: string;
  created_by?: number;
  modified_by?: number;
}

export interface CustomerListRequest {
  name?: string;
  code?: string;
  email?: string;
  country?: string;
  city?: string;
  timezone?: string;
  order_by?: string;
  order_type?: string;
  page?: number;
  page_size?: number;
  created_by?: number;
  modified_by?: number;
  created_by_name?: string;
  created_on_start_date?: string;
  created_on_end_date?: string;
  modified_by_name?: string;
  modified_on_start_date?: string;
  modified_on_end_date?: string;
  export?: boolean;
  module_id?: number;
}

export interface CustomerListResponse {
  count: number;
  results: CustomerResponse[];
}

// Container Types Management Types
export interface CreateContainerTypeRequest {
  name: string;
  code: string;
  description: string;
  capacity: string;
  status: boolean;
}

export interface UpdateContainerTypeRequest {
  name?: string;
  code?: string;
  description?: string;
  capacity?: string;
  status?: boolean;
}

export interface ContainerTypeResponse {
  id: number;
  name: string;
  code: string;
  description: string;
  capacity: string;
  status: boolean;
  created_on?: string;
  modified_on?: string;
  created_by?: number;
  modified_by?: number;
}

export interface ContainerTypeListRequest {
  name?: string;
  code?: string;
  description?: string;
  capacity?: string;
  status?: boolean;
  order_by?: string;
  order_type?: string;
  page?: number;
  page_size?: number;
  created_by?: number;
  modified_by?: number;
  created_by_name?: string;
  created_on_start_date?: string;
  created_on_end_date?: string;
  modified_by_name?: string;
  modified_on_start_date?: string;
  modified_on_end_date?: string;
  export?: boolean;
  module_id?: number;
}

export interface ContainerTypeListResponse {
  count: number;
  results: ContainerTypeResponse[];
}

// Carrier Management Types
export interface CreateCarrierRequest {
  name: string;
  carrier_code: string;
  transportation_mode?: number;
  is_active?: boolean;
}

export interface UpdateCarrierRequest {
  name?: string;
  carrier_code?: string;
  transportation_mode?: number;
  is_active?: boolean;
}

export interface CarrierResponse {
  id: number;
  name: string;
  carrier_code: string;
  transportation_mode: number;
  is_active: boolean;
  created_on?: string;
  modified_on?: string;
  created_by?: number;
  modified_by?: number;
}

export interface CarrierListRequest {
  name?: string;
  carrier_code?: string;
  transportation_mode?: number;
  is_active?: boolean;
  order_by?: string;
  order_type?: string;
  page?: number;
  page_size?: number;
  created_by?: number;
  modified_by?: number;
  created_by_name?: string;
  created_on_start_date?: string;
  created_on_end_date?: string;
  modified_by_name?: string;
  modified_on_start_date?: string;
  modified_on_end_date?: string;
  export?: boolean;
  module_id?: number;
}

export interface CarrierListResponse {
  count: number;
  results: CarrierResponse[];
}

// Role Assignment Types
export interface RoleAssignmentRequest {
  role_id: string;
  user_ids: number[];
}

export interface RoleAssignmentResponse {
  role_id: string;
  user_ids: number[];
}

export interface Privilege {
  id: number;
  name: string;
  description?: string;
  module: string;
  action: string;
}

export interface PrivilegeListResponse {
  status: boolean;
  data: Privilege[];
  total: number;
}

export interface RoleUserResponse {
  status: boolean;
  data: {
    role: RoleResponse;
    users: UserShortInfo[];
    total_users: number;
  };
}

// Superuser Management Types
export interface SuperuserModifyRequest {
  is_superuser: boolean;
  reason?: string;
}

export interface SuperuserModifyResponse {
  status: boolean;
  message: string;
  user_id: number;
  is_superuser: boolean;
  modified_on: string;
}

// Common API Response Types
export interface ApiResponse<T = any> {
  status: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  status: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Container Priority Types
export interface ContainerPriorityResponse {
  id: number;
  type: number;
  priority: number;
  max_capacity: number;
  max_weight: number;
  description: string;
}

export interface CreateContainerPriorityRequest {
  type: number;
  priority: number;
  max_capacity: number;
  max_weight: number;
  description: string;
}

export interface UpdateContainerPriorityRequest {
  type: number;
  priority: number;
  max_capacity: number;
  max_weight: number;
  description: string;
}

export interface ContainerPriorityListRequest {
  type?: number;
  priority?: number;
  description?: string;
  max_capacity?: number;
  max_weight?: number;
  order_by?: string;
  order_type?: string;
  created_on_start_date?: string;
  created_by?: number;
  modified_by?: number;
  created_by_name?: string;
  created_on_end_date?: string;
  modified_by_name?: string;
  modified_on_start_date?: string;
  modified_on_end_date?: string;
  page: number;
  page_size: number;
  export?: boolean;
  module_id?: number;
}

export interface ContainerPriorityListResponse {
  count: number;
  results: ContainerPriorityResponse[];
}

// Container Threshold Types
export interface ContainerThresholdResponse {
  id: number;
  container: number;
  port_of_loading: number;
  type: string;
  min_capacity: number;
  max_capacity: number;
  status: boolean;
}

export interface CreateContainerThresholdRequest {
  container: number;
  port_of_loading: number;
  type: string;
  min_capacity: number;
  max_capacity: number;
  status: boolean;
}

export interface UpdateContainerThresholdRequest {
  container: number;
  port_of_loading: number;
  type: string;
  min_capacity: number;
  max_capacity: number;
  status: boolean;
}

export interface ContainerThresholdListRequest {
  container?: number;
  port_of_loading?: number;
  type?: string;
  min_capacity?: number;
  max_capacity?: number;
  status?: boolean;
  order_by?: string;
  order_type?: string;
  created_on_start_date?: string;
  created_by?: number;
  modified_by?: number;
  created_by_name?: string;
  created_on_end_date?: string;
  modified_by_name?: string;
  modified_on_start_date?: string;
  modified_on_end_date?: string;
  page: number;
  page_size: number;
  export?: boolean;
  module_id?: number;
}

export interface ContainerThresholdListResponse {
  count: number;
  results: ContainerThresholdResponse[];
}
