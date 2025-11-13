// Shipment Order Types and Interfaces

export interface CustomFieldValue {
  field: number; // Field ID
  value: string;
}

export interface ShipmentOrder {
  id?: number;
  vendor_booking_number?: string; // System-generated booking number (e.g., VBK250911001)
  vendor_booking_status: ShipmentOrderStatus;
  shipper: string;
  consignee: string;
  transportation_mode?: TransportationMode;
  cargo_readiness_date: string; // ISO date string
  service_type: ServiceType;
  volume: number;
  weight: number;
  hs_code: string;
  cargo_description?: string;
  marks_and_numbers?: string;
  cargo_type?: CargoType;
  dangerous_goods_notes?: string;
  place_of_receipt?: string;
  place_of_delivery?: string;
  carrier?: string;
  carrier_booking_number?: string;
  customer: number; // Customer ID
  custom_field_values?: CustomFieldValue[]; // Customer-specific dynamic fields
  // Timestamps
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

// Status and enum types - now using numeric IDs
export type ShipmentOrderStatus = number; // 5=Draft, 10=Confirmed, 15=Shipped, 20=Booked, 25=Modified, 30=Cancelled
export type TransportationMode = number; // 5=OceanFcl/OceanLcl, 10=Air, 15=Truck, 20=Rail
export type ServiceType = number; // 5=CY, 10=CFS
export type CargoType = number; // 5=Normal, 10=Reefer, 15=DG
export type Incoterm = number; // 5=EXW, 10=FOB, 15=FCA, 20=DAP
export type PaymentTerm = number; // 5=Prepaid, 10=Collect

export interface ShipmentOrderResponse extends ShipmentOrder {
  id: number;
  vendor_booking_number: string;
  created_at: string;
  updated_at: string;
  // Additional fields for display
  customer_name?: string;
}

export interface CreateShipmentOrderRequest extends Omit<ShipmentOrder, 'id' | 'vendor_booking_number' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'> {}

export interface UpdateShipmentOrderRequest extends Omit<ShipmentOrder, 'id' | 'vendor_booking_number' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'> {}

// Container Assignment Types
export interface ContainerAssignment {
  equipment_count: number;
  equipment_size_type: string;
  equipment_numbers: string[];
}

// Customer Dynamic Fields (from localStorage)
export interface CustomerDynamicField {
  id: string;
  label: string;
  value: string;
}

// Master Data References
export interface CustomerReference {
  id: string;
  name: string;
  customer_code: string;
}

export interface VendorReference {
  id: string;
  name: string;
  vendor_code: string;
}

export interface OriginPartnerReference {
  id: string;
  name: string;
  partner_code: string;
}

// Form Data Types
export interface ShipmentOrderFormData {
  // Basic Information
  vendor_booking_status?: number;
  shipper: string;
  consignee: string;
  transportation_mode?: number;
  service_type: number;
  cargo_readiness_date: string;
  notify_party_1?: string;
  notify_party_2?: string;
  
  // Cargo Details
  hs_code: string;
  cargo_description?: string;
  marks_and_numbers?: string;
  cargo_type?: number;
  dangerous_goods_notes?: string;
  
  // Location Details
  place_of_receipt?: string;
  place_of_delivery?: string;
  
  // Carrier Details (now foreign key)
  carrier?: number;
  carrier_booking_number?: string;
  
  // Customer Reference (foreign key)
  customer: number;
  
  // POL and POD (foreign keys)
  pol?: number;
  pod?: number;
  
  // Equipment Details
  equipment_type?: number;
  shipment_type?: number;
  equipment_count?: string;
  equipment_no?: string;
  
  // Additional Details
  pickup_address?: string;
  vessel_name?: string;
  carrier_service_contract?: string;
  incoterm?: number;
  payment_terms?: number;
  customer_reference?: string;
  vendor_reference?: string;
  agent_reference?: string;
  
  // Volume/Weight/Quantity
  volume_booked?: number;
  volume_actual?: number;
  weight_booked?: number;
  weight_actual?: number;
  quantity_booked?: number;
  quantity_actual?: number;
  
  // Custom field values
  custom_field_values?: CustomFieldValue[];
  
  // Optional ID for editing
  id?: number;
}

// Static Dropdown Options with numeric IDs
export const VENDOR_BOOKING_STATUS_OPTIONS: { value: number; label: string }[] = [
  { value: 5, label: 'Draft' },
  { value: 10, label: 'Confirmed' },
  { value: 15, label: 'Shipped' },
  { value: 20, label: 'Booked' },
  { value: 25, label: 'Modified' },
  { value: 30, label: 'Cancelled' }
];

export const TRANSPORTATION_MODE_OPTIONS: { value: number; label: string }[] = [
  { value: 5, label: 'Ocean FCL' },
  { value: 5, label: 'Ocean LCL' }, // Note: Both Ocean FCL and LCL have value 5
  { value: 10, label: 'Air' },
  { value: 15, label: 'Truck' },
  { value: 20, label: 'Rail' }
];

export const SERVICE_TYPE_OPTIONS: { value: number; label: string }[] = [
  { value: 5, label: 'CY' },
  { value: 10, label: 'CFS' }
];

export const CARGO_TYPE_OPTIONS: { value: number; label: string }[] = [
  { value: 5, label: 'Normal' },
  { value: 10, label: 'Reefer' },
  { value: 15, label: 'Dangerous Goods' }
];

export const INCOTERM_OPTIONS: { value: number; label: string }[] = [
  { value: 5, label: 'ExWorks' },
  { value: 10, label: 'FreeOnBoard' },
  { value: 15, label: 'FreeCarrier' },
  { value: 20, label: 'DeliveredAtPlace' }
];

export const PAYMENT_TERM_OPTIONS: { value: number; label: string }[] = [
  { value: 5, label: 'Prepaid' },
  { value: 10, label: 'Collect' }
];

// Legacy options for backward compatibility (if needed)
export const SHIPMENT_ORDER_STATUS_OPTIONS = VENDOR_BOOKING_STATUS_OPTIONS;

export const EQUIPMENT_SIZE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '20FT', label: '20FT Standard' },
  { value: '40FT', label: '40FT Standard' },
  { value: '40FT_HC', label: '40FT High Cube' },
  { value: '45FT_HC', label: '45FT High Cube' },
  { value: '20FT_REEFER', label: '20FT Reefer' },
  { value: '40FT_REEFER', label: '40FT Reefer' },
  { value: '20FT_TANK', label: '20FT Tank' },
  { value: '40FT_TANK', label: '40FT Tank' }
];

// API Request/Response Types for Shipment List
export interface ShipmentListRequest {
  page: number;
  page_size: number;
  order_by?: string;
  order_type?: 'asc' | 'desc' | string;
  shipper?: string;
  consignee?: string;
  vendor_booking_number?: string;
  notify_party_1?: string;
  notify_party_2?: string;
  hs_code?: string;
  cargo_description?: string;
  marks_and_numbers?: string;
  dangerous_goods_notes?: string;
  place_of_receipt?: string;
  place_of_delivery?: string;
  carrier?: string;
  carrier_booking_number?: string;
  customer?: number;
  created_by?: number;
  created_by_name?: string;
  modified_by?: number;
  modified_by_name?: string;
  created_on_start_date?: string;
  created_on_end_date?: string;
  modified_on_start_date?: string;
  modified_on_end_date?: string;
  vendor_booking_status?: number;
  transportation_mode?: number;
  service_type?: number;
  cargo_type?: number;
}

export interface ShipmentListResponse {
  id: number;
  vendor_booking_number: string;
  vendor_booking_status?: number; // Numeric status code
  status_description?: string; // Human-readable status
  shipper: string;
  consignee: string;
  transportation_mode?: number;
  service_type?: number;
  service_type_description?: string;
  cargo_readiness_date: string;
  notify_party_1?: string;
  notify_party_2?: string;
  hs_code: string;
  cargo_description?: string;
  marks_and_numbers?: string;
  cargo_type?: number;
  cargo_type_description?: string;
  dangerous_goods_notes?: string;
  place_of_receipt?: string;
  place_of_delivery?: string;
  carrier?: string;
  carrier_booking_number?: string;
  customer: number;
  customer_name?: string;
  volume_booked?: number;
  volume_actual?: number;
  weight_booked?: number;
  weight_actual?: number;
  quantity_booked?: number;
  quantity_actual?: number;
  custom_field_values?: CustomFieldValue[];
  created_on: string;
  modified_on?: string;
  created_by?: number;
  modified_by?: number;
  is_active?: boolean;
}

export interface ShipmentListApiResponse {
  results: ShipmentListResponse[];
  count: number;
  next?: string;
  previous?: string;
}

// Equipment Type Response (from lookup API)
export interface EquipmentType {
  id: number;
  equipment_name: string;
  equipment_category?: string;
  description?: string;
  mode: number;
  mode_name?: string;
  is_active: boolean;
}

export interface EquipmentTypeListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: EquipmentType[];
}

// Shipment Type Response (from lookup API)
export interface ShipmentType {
  id: number;
  shipment_type_name: string;
  description?: string;
  mode: number;
  mode_name?: string;
  is_active: boolean;
}

export interface ShipmentTypeListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: ShipmentType[];
}

// Carrier Response (from carrier list API)
export interface Carrier {
  id: number;
  name: string;
  carrier_code?: string;
  transportation_mode?: number;
  is_active?: boolean;
}

export interface CarrierListResponse {
  page: number;
  page_size: number;
  results: Carrier[];
  count?: number;
}
