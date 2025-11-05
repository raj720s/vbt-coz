import { BaseService } from './baseService';
import {
  CreatePOLRequest,
  UpdatePOLRequest,
  POLResponse,
  POLListRequest,
  POLListResponse,
  ApiResponse
} from '@/types/api';

export class POLService extends BaseService {
  protected readonly basePath = '/master-data/v1';

  /**
   * Create a new POL port
   * @param polData - POL creation data
   * @returns Promise<POLResponse>
   */
  async createPOL(polData: CreatePOLRequest): Promise<POLResponse> {
    this.validateRequiredFields(polData, ['name', 'code', 'country', 'timezone', 'latitude', 'longitude']);
    return this.post<POLResponse>(this.buildEndpoint('pol'), polData);
  }

  /**
   * Get POL port by ID
   * @param id - POL port ID
   * @returns Promise<POLResponse>
   */
  async getPOL(id: string | number): Promise<POLResponse> {
    return this.get<POLResponse>(this.buildEndpoint('pol', id));
  }

  /**
   * Update POL port by ID
   * @param id - POL port ID
   * @param polData - Partial POL data to update
   * @returns Promise<POLResponse>
   */
  async updatePOL(id: string | number, polData: UpdatePOLRequest): Promise<POLResponse> {
    return this.put<POLResponse>(this.buildEndpoint('pol', id), polData);
  }

  /**
   * Delete POL port by ID
   * @param id - POL port ID
   * @returns Promise<{ success: boolean }>
   */
  async deletePOL(id: string | number): Promise<{ success: boolean }> {
    console.log('🚀 POLService.deletePOL called with:', { id });
    console.log('🌐 Making DELETE request to endpoint: /master-data/v1/pol/{id}');
    
    try {
      const result = await this.delete<{ success: boolean }>(`/master-data/v1/pol/${id}`);
      console.log('✅ POLService.deletePOL success:', result);
      return result;
    } catch (error) {
      console.error('❌ POLService.deletePOL error:', error);
      throw error;
    }
  }

  /**
   * Get list of POL ports with filtering and pagination
   * @param params - Query parameters for filtering and pagination
   * @returns Promise<POLListResponse>
   */
  async getPOLs(params: POLListRequest = {}): Promise<POLListResponse> {
    const cleanParams = this.buildParams(params);
    return this.post<POLListResponse>(this.buildEndpoint('pol', 'list'), cleanParams);
  }

  /**
   * Search POL ports by name
   * @param query - Search query (empty string for default results)
   * @param limit - Maximum number of results
   * @returns Promise<POLResponse[]>
   */
  async searchPOLs(query: string, limit: number = 10): Promise<POLResponse[]> {
    const params: any = { page_size: limit };
    
    // Only add name filter if query is not empty
    if (query.trim()) {
      params.name = query;
    }
    
    const response = await this.post<POLListResponse>(this.buildEndpoint('pol', 'list'), params);
    return response.results;
  }

  /**
   * Get POL ports by country
   * @param country - Country name to search for
   * @param params - Additional query parameters
   * @returns Promise<POLListResponse>
   */
  async getPOLsByCountry(country: string, params: Omit<POLListRequest, 'country'> = {}): Promise<POLListResponse> {
    const cleanParams = this.buildParams({ ...params, country });
    return this.post<POLListResponse>(this.buildEndpoint('pol', 'list'), cleanParams);
  }

  /**
   * Get POL ports by UNLOCODE
   * @param unlocode - UNLOCODE to search for
   * @param params - Additional query parameters
   * @returns Promise<POLListResponse>
   */
  async getPOLsByUnlocode(unlocode: string, params: Omit<POLListRequest, 'unlocode'> = {}): Promise<POLListResponse> {
    const cleanParams = this.buildParams({ ...params, unlocode });
    return this.post<POLListResponse>(this.buildEndpoint('pol', 'list'), cleanParams);
  }

  /**
   * Bulk update POL port status
   * @param polIds - Array of POL port IDs
   * @param isActive - New status
   * @returns Promise<{ success: boolean }>
   */
  async bulkUpdatePOLStatus(polIds: (string | number)[], isActive: boolean): Promise<{ success: boolean }> {
    return this.put<{ success: boolean }>(this.buildEndpoint('pol', 'bulk-status'), {
      pol_ids: polIds,
      is_active: isActive
    });
  }

  /**
   * Export POL ports data
   * @param params - Export parameters
   * @returns Promise<POLResponse[]>
   */
  async exportPOLs(params: POLListRequest = {}): Promise<POLResponse[]> {
    const exportParams = { ...params, page_size: 1000 };
    const response = await this.post<POLListResponse>(this.buildEndpoint('pol', 'list'), exportParams);
    return response.results;
  }

  /**
   * Get POL port statistics
   * @returns Promise<ApiResponse>
   */
  async getPOLStatistics(): Promise<ApiResponse> {
    return this.get<ApiResponse>(this.buildEndpoint('pol', 'statistics'));
  }

  /**
   * Validate POL port code uniqueness
   * @param code - POL port code to validate
   * @param excludeId - POL ID to exclude from validation (for updates)
   * @returns Promise<{ isUnique: boolean }>
   */
  async validatePOLCode(code: string, excludeId?: string | number): Promise<{ isUnique: boolean }> {
    const params: POLListRequest = { code, page_size: 1 };
    const response = await this.getPOLs(params);
    
    if (excludeId) {
      // Filter out the current record being updated
      const filteredResults = response.results.filter(pol => pol.id !== Number(excludeId));
      return { isUnique: filteredResults.length === 0 };
    }
    
    return { isUnique: response.results.length === 0 };
  }
}

// Export singleton instance
export const polService = new POLService();
export default polService;
