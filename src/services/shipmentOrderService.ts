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
  ShipmentListResponse
} from '@/types/shipmentOrder';
import superAxios from '@/utils/superAxios';
import { BASEURL } from '@/config/variables';

// API Response Types based on the API documentation
export interface ShipmentOrderInput {
  vendor_booking_status?: ShipmentOrderStatus;
  shipper: string;
  consignee: string;
  transportation_mode?: 'ocean' | 'air' | 'road' | 'rail';
  service_type: 'cy' | 'cfs';
  cargo_readiness_date: string; // ISO date-time
  volume: number;
  weight: number;
  hs_code: string;
  cargo_description?: string | null;
  marks_and_numbers?: string | null;
  cargo_type?: 'normal' | 'reefer' | 'dg' | null;
  dangerous_goods_notes?: string | null;
  place_of_receipt?: string | null;
  place_of_delivery?: string | null;
  carrier?: string | null;
  carrier_booking_number?: string | null;
  customer: number;
  custom_field_values?: ShipmentFieldValue[];
}

export interface ShipmentFieldValue {
  field: number;
  value: string;
}

export interface ShipmentRead {
  id: number;
  vendor_booking_number: string;
  vendor_booking_status: ShipmentOrderStatus;
  shipper: string;
  consignee: string;
  transportation_mode?: 'ocean' | 'air' | 'road' | 'rail';
  service_type: 'cy' | 'cfs';
  cargo_readiness_date: string;
  volume: number;
  weight: number;
  hs_code: string;
  cargo_description?: string | null;
  marks_and_numbers?: string | null;
  cargo_type?: 'normal' | 'reefer' | 'dg' | null;
  dangerous_goods_notes?: string | null;
  place_of_receipt?: string | null;
  place_of_delivery?: string | null;
  carrier?: string | null;
  carrier_booking_number?: string | null;
  customer: number;
  customer_name?: string;
  created_on: string;
  modified_on?: string | null;
  created_by?: number | null;
  modified_by?: number | null;
  is_deleted?: boolean;
  custom_field_values?: ShipmentFieldValue[];
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

  // Get customers for dropdown
  async getCustomers(): Promise<CustomerReference[]> {
    const response = await superAxios.get(`${BASEURL}/customers/short-list`);
    return response.data;
  }

  // Get vendors for dropdown
  async getVendors(): Promise<VendorReference[]> {
    const response = await superAxios.get(`${BASEURL}/vendors/short-list`);
    return response.data;
  }

  // Get origin partners for dropdown
  async getOriginPartners(): Promise<OriginPartnerReference[]> {
    const response = await superAxios.get(`${BASEURL}/origin-partners/short-list`);
    return response.data;
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
    if (data.volume !== undefined) transformed.volume = data.volume;
    if (data.weight !== undefined) transformed.weight = data.weight;
    if (data.hs_code !== undefined) transformed.hs_code = data.hs_code;
    if (data.customer !== undefined) transformed.customer = data.customer;

    // Optional fields - only include if they have values
    if (data.vendor_booking_status !== undefined) transformed.vendor_booking_status = data.vendor_booking_status;
    if (data.transportation_mode !== undefined) transformed.transportation_mode = data.transportation_mode;
    if (data.cargo_description !== undefined && data.cargo_description !== null) transformed.cargo_description = data.cargo_description;
    if (data.marks_and_numbers !== undefined && data.marks_and_numbers !== null) transformed.marks_and_numbers = data.marks_and_numbers;
    if (data.cargo_type !== undefined && data.cargo_type !== null) transformed.cargo_type = data.cargo_type;
    if (data.dangerous_goods_notes !== undefined && data.dangerous_goods_notes !== null) transformed.dangerous_goods_notes = data.dangerous_goods_notes;
    if (data.place_of_receipt !== undefined && data.place_of_receipt !== null) transformed.place_of_receipt = data.place_of_receipt;
    if (data.place_of_delivery !== undefined && data.place_of_delivery !== null) transformed.place_of_delivery = data.place_of_delivery;
    if (data.carrier !== undefined && data.carrier !== null) transformed.carrier = data.carrier;
    if (data.carrier_booking_number !== undefined && data.carrier_booking_number !== null) transformed.carrier_booking_number = data.carrier_booking_number;

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
    if (data.service_type !== undefined && !data.service_type) errors.push('Service type is required');
    if (data.volume !== undefined && (!data.volume || data.volume <= 0)) errors.push('Volume must be greater than 0');
    if (data.weight !== undefined && (!data.weight || data.weight <= 0)) errors.push('Weight must be greater than 0');
    if (data.hs_code !== undefined && !data.hs_code?.trim()) errors.push('HS Code is required');
    if (data.customer !== undefined && !data.customer) errors.push('Customer is required');

    // Dangerous goods validation
    if (data.cargo_type === 'dg' && (!data.dangerous_goods_notes || !data.dangerous_goods_notes.trim())) {
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
    if (data.carrier && data.carrier.length > 255) errors.push('Carrier must be 255 characters or less');
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

    // Dangerous goods validation
    if (data.cargo_type === 'dg' && !data.dangerous_goods_notes?.trim()) {
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
