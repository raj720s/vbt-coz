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

export type ShipmentOrderStatus = 'draft' | 'confirmed' | 'booked' | 'modified' | 'cancelled' | 'shipped';
export type TransportationMode = 'ocean' | 'air' | 'road' | 'rail';
export type ServiceType = 'cy' | 'cfs';
export type CargoType = 'normal' | 'reefer' | 'dg';

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
  shipper: string;
  consignee: string;
  transportation_mode?: TransportationMode;
  cargo_readiness_date: string;
  service_type: ServiceType;
  volume: number;
  weight: number;
  
  // Required Cargo Details
  hs_code: string;
  cargo_description?: string;
  marks_and_numbers?: string;
  cargo_type?: CargoType;
  dangerous_goods_notes?: string;
  
  // Location Details
  place_of_receipt?: string;
  place_of_delivery?: string;
  
  // Carrier Details
  carrier?: string;
  carrier_booking_number?: string;
  
  // Customer Reference
  customer: number;
  
  // Custom field values
  custom_field_values?: CustomFieldValue[];
  
  // Optional ID for editing
  id?: number;
}

// Validation Schemas
export const SHIPMENT_ORDER_STATUS_OPTIONS: { value: ShipmentOrderStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'booked', label: 'Booked' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'shipped', label: 'Shipped' }
];

export const TRANSPORTATION_MODE_OPTIONS: { value: TransportationMode; label: string }[] = [
  { value: 'ocean', label: 'Ocean' },
  { value: 'air', label: 'Air' },
  { value: 'road', label: 'Road' },
  { value: 'rail', label: 'Rail' }
];

export const SERVICE_TYPE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: 'cy', label: 'CY (Container Yard)' },
  { value: 'cfs', label: 'CFS (Container Freight Station)' }
];

export const CARGO_TYPE_OPTIONS: { value: CargoType; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'reefer', label: 'Reefer' },
  { value: 'dg', label: 'Dangerous Goods' }
];

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
  order_type?: 'asc' | 'desc';
  shipper?: string;
  consignee?: string;
  vendor_booking_number?: string;
  volume?: number;
  weight?: number;
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
  vendor_booking_status?: ShipmentOrderStatus | number;
  transportation_mode?: TransportationMode | number;
  service_type?: ServiceType | number;
  cargo_type?: CargoType | number;
}

export interface ShipmentListResponse {
  id: number;
  vendor_booking_number: string;
  vendor_booking_status: ShipmentOrderStatus;
  shipper: string;
  consignee: string;
  transportation_mode: TransportationMode;
  service_type: ServiceType;
  cargo_readiness_date: string;
  volume: number;
  weight: number;
  hs_code: string;
  cargo_description: string;
  marks_and_numbers: string;
  cargo_type: CargoType;
  dangerous_goods_notes: string;
  place_of_receipt: string;
  place_of_delivery: string;
  carrier: string;
  carrier_booking_number: string;
  customer: number;
  customer_name: string;
  custom_field_values?: CustomFieldValue[];
  created_on: string;
  modified_on: string;
  created_by: number;
  modified_by: number;
}

export interface ShipmentListApiResponse {
  results: ShipmentListResponse[];
  count: number;
  next?: string;
  previous?: string;
}
