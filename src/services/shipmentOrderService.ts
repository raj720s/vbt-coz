// Shipment Order Service
import { 
  ShipmentOrderResponse, 
  CreateShipmentOrderRequest,
  UpdateShipmentOrderRequest,
  ShipmentOrderStatus,
  CustomerReference,
  VendorReference,
  OriginPartnerReference,
  ShipmentListRequest,
  ShipmentListApiResponse,
  ShipmentListResponse,
  EquipmentType,
  EquipmentTypeListResponse,
  ShipmentType,
  ShipmentTypeListResponse,
  Carrier,
  CarrierListResponse,
  ShipmentOrderFormData
} from '@/types/shipmentOrder';
import superAxios from '@/utils/superAxios';
import { BASEURL } from '@/config/variables';
import { BaseService } from './baseService';

// API Request Types based on the new API documentation
export interface ShipmentOrderInput {
  vendor_booking_status?: number;
  shipper: string;
  consignee: string;
  transportation_mode?: number;
  service_type: number;
  cargo_readiness_date: string; // ISO date-time
  notify_party_1?: string;
  notify_party_2?: string;
  hs_code: string;
  cargo_description?: string | null;
  marks_and_numbers?: string | null;
  cargo_type?: number;
  dangerous_goods_notes?: string | null;
  place_of_receipt?: string | null;
  place_of_delivery?: string | null;
  carrier?: number; // Now a foreign key (ID)
  carrier_booking_number?: string | null;
  customer: number;
  pol?: number;
  pod?: number;
  pickup_address?: string;
  equipment_type?: number;
  shipment_type?: number;
  equipment_count?: string;
  equipment_no?: string;
  vessel_name?: string;
  carrier_service_contract?: string;
  incoterm?: number;
  payment_terms?: number;
  customer_reference?: string;
  vendor_reference?: string;
  agent_reference?: string;
  volume_booked?: number;
  volume_actual?: number;
  volume_shipped?: number;
  weight_booked?: number;
  weight_actual?: number;
  weight_shipped?: number;
  quantity_booked?: number;
  quantity_actual?: number;
  quantity_shipped?: number;
  custom_field_values?: ShipmentFieldValue[];
}

export interface ShipmentFieldValue {
  field: number;
  value: string;
}

export interface ShipmentRead {
  id?: number;
  vendor_booking_number?: string;
  vendor_booking_status?: number;
  shipper: string;
  consignee: string;
  transportation_mode?: number;
  service_type: number;
  cargo_readiness_date: string;
  notify_party_1?: string;
  notify_party_2?: string;
  hs_code: string;
  cargo_description?: string | null;
  marks_and_numbers?: string | null;
  cargo_type?: number;
  dangerous_goods_notes?: string | null;
  place_of_receipt?: string | null;
  place_of_delivery?: string | null;
  carrier?: number | string; // Can be ID or name
  carrier_booking_number?: string | null;
  customer: number;
  customer_name?: string;
  pol?: number;
  pod?: number;
  pickup_address?: string;
  equipment_type?: number;
  shipment_type?: number;
  equipment_count?: string;
  equipment_no?: string;
  vessel_name?: string;
  carrier_service_contract?: string;
  incoterm?: number;
  payment_terms?: number;
  customer_reference?: string;
  vendor_reference?: string;
  agent_reference?: string;
  volume_booked?: number;
  volume_actual?: number;
  weight_booked?: number;
  weight_actual?: number;
  quantity_booked?: number;
  quantity_actual?: number;
  custom_field_values?: ShipmentFieldValue[];
  created_on?: string;
  modified_on?: string | null;
  created_by?: number | null;
  modified_by?: number | null;
  is_active?: boolean;
}

class ShipmentOrderService {

  // Get list of shipment orders with filtering and pagination
  // POST /shipment/api/list
  async listShipmentOrders(request: ShipmentListRequest): Promise<ShipmentListApiResponse> {
    try {
      const response = await superAxios.post(`${BASEURL}/shipment/api/list`, request);
      return response.data;
    } catch (error) {
      console.error('Error fetching shipment orders list:', error);
      throw error;
    }
  }

  // Get single shipment order by ID
  // GET /shipment/api/shipment/{id}
  async getShipmentOrder(id: number): Promise<ShipmentRead> {
    try {
      const response = await superAxios.get(`${BASEURL}/shipment/api/shipment/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching shipment order ${id}:`, error);
      throw error;
    }
  }

  // Create new shipment order
  // POST /shipment/api/shipment
  async createShipmentOrder(data: ShipmentOrderInput): Promise<ShipmentRead> {
    try {
      // Validate data before sending
      const validationErrors = this.validateShipmentOrderData(data);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Transform data to match API requirements
      const transformedData = this.transformDataForAPI(data);
      
      const response = await superAxios.post(`${BASEURL}/shipment/api/shipment`, transformedData);
      return response.data;
    } catch (error) {
      console.error('Error creating shipment order:', error);
      throw error;
    }
  }

  // Update existing shipment order (full update)
  // PUT /shipment/api/shipment/{id}
  async updateShipmentOrder(id: number, data: ShipmentOrderInput): Promise<ShipmentRead> {
    try {
      // Validate data before sending
      const validationErrors = this.validateShipmentOrderData(data);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Transform data to match API requirements
      const transformedData = this.transformDataForAPI(data);
      
      const response = await superAxios.put(`${BASEURL}/shipment/api/shipment/${id}`, transformedData);
      return response.data;
    } catch (error) {
      console.error(`Error updating shipment order ${id}:`, error);
      throw error;
    }
  }

  // Partial update shipment order
  // PATCH /shipment/api/shipment/{id}
  async partialUpdateShipmentOrder(id: number, data: Partial<ShipmentOrderInput>): Promise<ShipmentRead> {
    try {
      // Transform data to match API requirements
      const transformedData = this.transformDataForAPI(data);
      
      const response = await superAxios.patch(`${BASEURL}/shipment/api/shipment/${id}`, transformedData);
      return response.data;
    } catch (error) {
      console.error(`Error partially updating shipment order ${id}:`, error);
      throw error;
    }
  }

  // Update shipment order status (using partial update)
  async updateShipmentOrderStatus(id: number, status: ShipmentOrderStatus): Promise<ShipmentRead> {
    return this.partialUpdateShipmentOrder(id, { vendor_booking_status: status });
  }

  // Delete shipment order
  // DELETE /shipment/api/shipment/{id}
  async deleteShipmentOrder(id: number): Promise<void> {
    try {
      await superAxios.delete(`${BASEURL}/shipment/api/shipment/${id}`);
    } catch (error) {
      console.error(`Error deleting shipment order ${id}:`, error);
      throw error;
    }
  }

  // Get customers for dropdown (filtered by user's company mapping)
  async getCustomers(query: string = ""): Promise<CustomerReference[]> {
    // TODO: Filter customers based on current user's company mapping
    // For now, using existing endpoint
    const response = await superAxios.get(`${BASEURL}/customers/short-list`);
    return response.data;
  }

  // Get carriers for dropdown
  // POST /api/master-data/v1/carrier/list
  async getCarriers(params: {
    page?: number;
    page_size?: number;
    name?: string;
    transportation_mode?: number;
    carrier_code?: string;
  } = {}): Promise<CarrierListResponse> {
    try {
      const requestBody = {
        page: params.page || 1,
        page_size: params.page_size || 50,
        ...(params.name && { name: params.name }),
        ...(params.transportation_mode && { transportation_mode: params.transportation_mode }),
        ...(params.carrier_code && { carrier_code: params.carrier_code }),
      };
      const response = await superAxios.post(`${BASEURL}/master-data/v1/carrier/list`, requestBody);
      return response.data;
    } catch (error) {
      console.error('Error fetching carriers:', error);
      throw error;
    }
  }

  // Search carriers
  async searchCarriers(query: string, limit: number = 50): Promise<Carrier[]> {
    try {
      const response = await this.getCarriers({ name: query, page_size: limit });
      return response.results || [];
    } catch (error) {
      console.error('Error searching carriers:', error);
      return [];
    }
  }

  // Get equipment types for dropdown
  // GET /api/master-data/v1/lookups/equipment-types/
  async getEquipmentTypes(params: {
    page?: number;
    page_size?: number;
  } = {}): Promise<EquipmentTypeListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.page_size) queryParams.append('page_size', params.page_size.toString());
      
      const url = `${BASEURL}/master-data/v1/lookups/equipment-types/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await superAxios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching equipment types:', error);
      throw error;
    }
  }

  // Search equipment types
  async searchEquipmentTypes(query: string = "", limit: number = 50): Promise<EquipmentType[]> {
    try {
      const response = await this.getEquipmentTypes({ page_size: limit });
      // Filter by query if provided (client-side filtering)
      let results = response.results || [];
      if (query) {
        const lowerQuery = query.toLowerCase();
        results = results.filter((eq: EquipmentType) => 
          eq.equipment_name.toLowerCase().includes(lowerQuery) ||
          eq.equipment_category?.toLowerCase().includes(lowerQuery)
        );
      }
      return results;
    } catch (error) {
      console.error('Error searching equipment types:', error);
      return [];
    }
  }

  // Get shipment types for dropdown
  // GET /api/master-data/v1/lookups/shipment-types/
  async getShipmentTypes(params: {
    page?: number;
    page_size?: number;
  } = {}): Promise<ShipmentTypeListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.page_size) queryParams.append('page_size', params.page_size.toString());
      
      const url = `${BASEURL}/master-data/v1/lookups/shipment-types/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await superAxios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching shipment types:', error);
      throw error;
    }
  }

  // Search shipment types
  async searchShipmentTypes(query: string = "", limit: number = 50): Promise<ShipmentType[]> {
    try {
      const response = await this.getShipmentTypes({ page_size: limit });
      // Filter by query if provided (client-side filtering)
      let results = response.results || [];
      if (query) {
        const lowerQuery = query.toLowerCase();
        results = results.filter((st: ShipmentType) => 
          st.shipment_type_name.toLowerCase().includes(lowerQuery) ||
          st.description?.toLowerCase().includes(lowerQuery)
        );
      }
      return results;
    } catch (error) {
      console.error('Error searching shipment types:', error);
      return [];
    }
  }

  // Generate SO number (client-side for preview)
  generateSONumber(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    // In a real implementation, this would be fetched from the server
    // For now, we'll use a random 3-digit number
    const counter = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `VBK${year}${month}${day}${counter}`;
  }

  // Transform data from form format to API format
  private transformDataForAPI(data: Partial<ShipmentOrderInput>): any {
    const transformed: any = {};

    // Required fields
    if (data.shipper !== undefined) transformed.shipper = data.shipper;
    if (data.consignee !== undefined) transformed.consignee = data.consignee;
    if (data.service_type !== undefined) transformed.service_type = data.service_type;
    if (data.cargo_readiness_date !== undefined) transformed.cargo_readiness_date = data.cargo_readiness_date;
    if (data.hs_code !== undefined) transformed.hs_code = data.hs_code;
    if (data.customer !== undefined) transformed.customer = data.customer;

    // Optional fields - only include if they have values
    if (data.vendor_booking_status !== undefined) transformed.vendor_booking_status = data.vendor_booking_status;
    if (data.transportation_mode !== undefined) transformed.transportation_mode = data.transportation_mode;
    if (data.notify_party_1 !== undefined && data.notify_party_1 !== null) transformed.notify_party_1 = data.notify_party_1;
    if (data.notify_party_2 !== undefined && data.notify_party_2 !== null) transformed.notify_party_2 = data.notify_party_2;
    if (data.cargo_description !== undefined && data.cargo_description !== null) transformed.cargo_description = data.cargo_description;
    if (data.marks_and_numbers !== undefined && data.marks_and_numbers !== null) transformed.marks_and_numbers = data.marks_and_numbers;
    if (data.cargo_type !== undefined && data.cargo_type !== null) transformed.cargo_type = data.cargo_type;
    if (data.dangerous_goods_notes !== undefined && data.dangerous_goods_notes !== null) transformed.dangerous_goods_notes = data.dangerous_goods_notes;
    if (data.place_of_receipt !== undefined && data.place_of_receipt !== null) transformed.place_of_receipt = data.place_of_receipt;
    if (data.place_of_delivery !== undefined && data.place_of_delivery !== null) transformed.place_of_delivery = data.place_of_delivery;
    if (data.carrier !== undefined && data.carrier !== null) transformed.carrier = data.carrier;
    if (data.carrier_booking_number !== undefined && data.carrier_booking_number !== null) transformed.carrier_booking_number = data.carrier_booking_number;
    
    // New foreign key fields
    if (data.pol !== undefined && data.pol !== null) transformed.pol = data.pol;
    if (data.pod !== undefined && data.pod !== null) transformed.pod = data.pod;
    if (data.equipment_type !== undefined && data.equipment_type !== null) transformed.equipment_type = data.equipment_type;
    if (data.shipment_type !== undefined && data.shipment_type !== null) transformed.shipment_type = data.shipment_type;
    
    // Additional fields
    if (data.pickup_address !== undefined && data.pickup_address !== null) transformed.pickup_address = data.pickup_address;
    if (data.equipment_count !== undefined && data.equipment_count !== null) transformed.equipment_count = data.equipment_count;
    if (data.equipment_no !== undefined && data.equipment_no !== null) transformed.equipment_no = data.equipment_no;
    if (data.vessel_name !== undefined && data.vessel_name !== null) transformed.vessel_name = data.vessel_name;
    if (data.carrier_service_contract !== undefined && data.carrier_service_contract !== null) transformed.carrier_service_contract = data.carrier_service_contract;
    if (data.incoterm !== undefined && data.incoterm !== null) transformed.incoterm = data.incoterm;
    if (data.payment_terms !== undefined && data.payment_terms !== null) transformed.payment_terms = data.payment_terms;
    if (data.customer_reference !== undefined && data.customer_reference !== null) transformed.customer_reference = data.customer_reference;
    if (data.vendor_reference !== undefined && data.vendor_reference !== null) transformed.vendor_reference = data.vendor_reference;
    if (data.agent_reference !== undefined && data.agent_reference !== null) transformed.agent_reference = data.agent_reference;
    
    // Volume/Weight/Quantity fields
    if (data.volume_booked !== undefined && data.volume_booked !== null) transformed.volume_booked = data.volume_booked;
    if (data.volume_actual !== undefined && data.volume_actual !== null) transformed.volume_actual = data.volume_actual;
    if (data.weight_booked !== undefined && data.weight_booked !== null) transformed.weight_booked = data.weight_booked;
    if (data.weight_actual !== undefined && data.weight_actual !== null) transformed.weight_actual = data.weight_actual;
    if (data.quantity_booked !== undefined && data.quantity_booked !== null) transformed.quantity_booked = data.quantity_booked;
    if (data.quantity_actual !== undefined && data.quantity_actual !== null) transformed.quantity_actual = data.quantity_actual;

    // Custom field values
    if (data.custom_field_values !== undefined && data.custom_field_values.length > 0) {
      transformed.custom_field_values = data.custom_field_values;
    }

    return transformed;
  }

  // Validate shipment order data
  private validateShipmentOrderData(data: Partial<ShipmentOrderInput>): string[] {
    const errors: string[] = [];

    // Required fields validation
    if (data.shipper !== undefined && !data.shipper?.trim()) errors.push('Shipper is required');
    if (data.consignee !== undefined && !data.consignee?.trim()) errors.push('Consignee is required');
    if (data.cargo_readiness_date !== undefined && !data.cargo_readiness_date) errors.push('Cargo readiness date is required');
    if (data.service_type !== undefined && data.service_type === null) errors.push('Service type is required');
    if (data.hs_code !== undefined && !data.hs_code?.trim()) errors.push('HS Code is required');
    if (data.customer !== undefined && !data.customer) errors.push('Customer is required');

    // Dangerous goods validation (cargo_type 15 = Dangerous Goods)
    if (data.cargo_type === 15 && (!data.dangerous_goods_notes || !data.dangerous_goods_notes.trim())) {
      errors.push('Dangerous goods notes are required when cargo type is Dangerous Goods');
    }

    // Date validation
    if (data.cargo_readiness_date) {
      const cargoDate = new Date(data.cargo_readiness_date);
      if (isNaN(cargoDate.getTime())) {
        errors.push('Invalid cargo readiness date format');
      }
    }

    // String length validations based on API constraints
    if (data.shipper && data.shipper.length > 255) errors.push('Shipper must be 255 characters or less');
    if (data.consignee && data.consignee.length > 255) errors.push('Consignee must be 255 characters or less');
    if (data.hs_code && data.hs_code.length > 50) errors.push('HS Code must be 50 characters or less');
    if (data.marks_and_numbers && data.marks_and_numbers.length > 255) errors.push('Marks and numbers must be 255 characters or less');
    if (data.place_of_receipt && data.place_of_receipt.length > 255) errors.push('Place of receipt must be 255 characters or less');
    if (data.place_of_delivery && data.place_of_delivery.length > 255) errors.push('Place of delivery must be 255 characters or less');
    // Carrier is now a number (ID), so no string length validation needed
    if (data.carrier_booking_number && data.carrier_booking_number.length > 100) errors.push('Carrier booking number must be 100 characters or less');

    // Custom field values validation
    if (data.custom_field_values) {
      data.custom_field_values.forEach((cfv, index) => {
        if (!cfv.field || cfv.field <= 0) {
          errors.push(`Custom field ${index + 1}: Field ID is required and must be greater than 0`);
        }
        if (!cfv.value || cfv.value.trim().length === 0) {
          errors.push(`Custom field ${index + 1}: Value is required and cannot be empty`);
        }
      });
    }

    return errors;
  }

  // Legacy validation method for backward compatibility
  validateShipmentOrder(data: CreateShipmentOrderRequest): string[] {
    const errors: string[] = [];

    // Required fields validation
    if (!data.shipper?.trim()) errors.push('Shipper is required');
    if (!data.consignee?.trim()) errors.push('Consignee is required');
    if (!data.cargo_readiness_date) errors.push('Cargo readiness date is required');
    if (!data.service_type) errors.push('Service type is required');
    if (!data.volume || data.volume <= 0) errors.push('Volume must be greater than 0');
    if (!data.weight || data.weight <= 0) errors.push('Weight must be greater than 0');
    if (!data.hs_code?.trim()) errors.push('HS Code is required');
    if (!data.customer) errors.push('Customer is required');

    // Dangerous goods validation (cargo_type 15 = Dangerous Goods)
    if (data.cargo_type === 15 && !data.dangerous_goods_notes?.trim()) {
      errors.push('Dangerous goods notes are required when cargo type is Dangerous Goods');
    }

    // Date validation
    if (data.cargo_readiness_date) {
      const cargoDate = new Date(data.cargo_readiness_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (cargoDate < today) {
        errors.push('Cargo readiness date cannot be in the past');
      }
    }

    return errors;
  }
}

export const shipmentOrderService = new ShipmentOrderService();
