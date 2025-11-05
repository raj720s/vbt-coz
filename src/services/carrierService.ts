import { BaseService } from './baseService';
import {
  CreateCarrierRequest,
  UpdateCarrierRequest,
  CarrierResponse,
  CarrierListRequest,
  CarrierListResponse,
  ApiResponse
} from '@/types/api';

export class CarrierService extends BaseService {
  protected readonly basePath = '/master-data/v1';

  /**
   * Create a new carrier
   * @param carrierData - Carrier creation data
   * @returns Promise<CarrierResponse>
   */
  async createCarrier(carrierData: CreateCarrierRequest): Promise<CarrierResponse> {
    this.validateRequiredFields(carrierData, ['name', 'carrier_code']);
    return this.post<CarrierResponse>(this.buildEndpoint('carrier'), carrierData);
  }

  /**
   * Get carrier by ID
   * @param id - Carrier ID
   * @returns Promise<CarrierResponse>
   */
  async getCarrier(id: string | number): Promise<CarrierResponse> {
    return this.get<CarrierResponse>(this.buildEndpoint('carrier', id));
  }

  /**
   * Update carrier by ID
   * @param id - Carrier ID
   * @param carrierData - Partial carrier data to update
   * @returns Promise<CarrierResponse>
   */
  async updateCarrier(id: string | number, carrierData: UpdateCarrierRequest): Promise<CarrierResponse> {
    return this.put<CarrierResponse>(this.buildEndpoint('carrier', id), carrierData);
  }

  /**
   * Patch carrier by ID
   * @param id - Carrier ID
   * @param carrierData - Partial carrier data to update
   * @returns Promise<CarrierResponse>
   */
  async patchCarrier(id: string | number, carrierData: UpdateCarrierRequest): Promise<CarrierResponse> {
    return this.patch<CarrierResponse>(this.buildEndpoint('carrier', id), carrierData);
  }

  /**
   * Delete carrier by ID
   * @param id - Carrier ID
   * @returns Promise<{ success: boolean }>
   */
  async deleteCarrier(id: string | number): Promise<{ success: boolean }> {
    console.log('🚀 CarrierService.deleteCarrier called with:', { id });
    console.log('🌐 Making DELETE request to endpoint: /master-data/v1/carrier/{id}');
    
    try {
      const result = await this.delete<{ success: boolean }>(`/master-data/v1/carrier/${id}`);
      console.log('✅ CarrierService.deleteCarrier success:', result);
      return result;
    } catch (error) {
      console.error('❌ CarrierService.deleteCarrier error:', error);
      throw error;
    }
  }

  /**
   * Get list of carriers with filtering and pagination
   * @param params - Query parameters for filtering and pagination
   * @returns Promise<CarrierListResponse>
   */
  async getCarriers(params: CarrierListRequest = {}): Promise<CarrierListResponse> {
    const cleanParams = this.buildParams(params);
    return this.post<CarrierListResponse>(this.buildEndpoint('carrier', 'list'), cleanParams);
  }

  /**
   * Search carriers by name
   * @param query - Search query (empty string for default results)
   * @param limit - Maximum number of results
   * @returns Promise<CarrierResponse[]>
   */
  async searchCarriers(query: string, limit: number = 10): Promise<CarrierResponse[]> {
    const params: any = { page_size: limit };
    
    // Only add name filter if query is not empty
    if (query.trim()) {
      params.name = query;
    }
    
    const response = await this.post<CarrierListResponse>(this.buildEndpoint('carrier', 'list'), params);
    return response.results;
  }

  /**
   * Get carriers by transportation mode
   * @param transportationMode - Transportation mode to search for
   * @param params - Additional query parameters
   * @returns Promise<CarrierListResponse>
   */
  async getCarriersByMode(transportationMode: number, params: Omit<CarrierListRequest, 'transportation_mode'> = {}): Promise<CarrierListResponse> {
    const cleanParams = this.buildParams({ ...params, transportation_mode: transportationMode });
    return this.post<CarrierListResponse>(this.buildEndpoint('carrier', 'list'), cleanParams);
  }

  /**
   * Bulk update carrier status
   * @param carrierIds - Array of carrier IDs
   * @param isActive - New status
   * @returns Promise<{ success: boolean }>
   */
  async bulkUpdateCarrierStatus(carrierIds: (string | number)[], isActive: boolean): Promise<{ success: boolean }> {
    return this.put<{ success: boolean }>(this.buildEndpoint('carrier', 'bulk-status'), {
      carrier_ids: carrierIds,
      is_active: isActive
    });
  }

  /**
   * Export carriers data
   * @param params - Export parameters
   * @returns Promise<CarrierResponse[]>
   */
  async exportCarriers(params: CarrierListRequest = {}): Promise<CarrierResponse[]> {
    const exportParams = { ...params, export: true, page_size: 1000 };
    const response = await this.post<CarrierListResponse>(this.buildEndpoint('carrier', 'list'), exportParams);
    return response.results;
  }

  /**
   * Get carrier statistics
   * @returns Promise<ApiResponse>
   */
  async getCarrierStatistics(): Promise<ApiResponse> {
    return this.get<ApiResponse>(this.buildEndpoint('carrier', 'statistics'));
  }

  /**
   * Validate carrier code uniqueness
   * @param code - Carrier code to validate
   * @param excludeId - Carrier ID to exclude from validation (for updates)
   * @returns Promise<{ isUnique: boolean }>
   */
  async validateCarrierCode(code: string, excludeId?: string | number): Promise<{ isUnique: boolean }> {
    const params: CarrierListRequest = { carrier_code: code, page_size: 1 };
    const response = await this.getCarriers(params);
    
    if (excludeId) {
      // Filter out the current record being updated
      const filteredResults = response.results.filter(carrier => carrier.id !== Number(excludeId));
      return { isUnique: filteredResults.length === 0 };
    }
    
    return { isUnique: response.results.length === 0 };
  }
}

// Export singleton instance
export const carrierService = new CarrierService();
export default carrierService;

