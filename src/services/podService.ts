import { BaseService } from './baseService';
import {
  CreatePODRequest,
  UpdatePODRequest,
  PODResponse,
  PODListRequest,
  PODListResponse,
  ApiResponse
} from '@/types/api';

export class PODService extends BaseService {
  protected readonly basePath = '/master-data/v1';

  /**
   * Create a new POD port
   * @param podData - POD creation data
   * @returns Promise<PODResponse>
   */
  async createPOD(podData: CreatePODRequest): Promise<PODResponse> {
    this.validateRequiredFields(podData, ['name', 'code', 'country', 'timezone', 'latitude', 'longitude']);
    return this.post<PODResponse>(this.buildEndpoint('pod'), podData);
  }

  /**
   * Get POD port by ID
   * @param id - POD port ID
   * @returns Promise<PODResponse>
   */
  async getPOD(id: string | number): Promise<PODResponse> {
    return this.get<PODResponse>(this.buildEndpoint('pod', id));
  }

  /**
   * Update POD port by ID
   * @param id - POD port ID
   * @param podData - Partial POD data to update
   * @returns Promise<PODResponse>
   */
  async updatePOD(id: string | number, podData: UpdatePODRequest): Promise<PODResponse> {
    return this.put<PODResponse>(this.buildEndpoint('pod', id), podData);
  }

  /**
   * Patch POD port by ID
   * @param id - POD port ID
   * @param podData - Partial POD data to update
   * @returns Promise<PODResponse>
   */
  async patchPOD(id: string | number, podData: UpdatePODRequest): Promise<PODResponse> {
    return this.patch<PODResponse>(this.buildEndpoint('pod', id), podData);
  }

  /**
   * Delete POD port by ID
   * @param id - POD port ID
   * @returns Promise<{ success: boolean }>
   */
  async deletePOD(id: string | number): Promise<{ success: boolean }> {
    console.log('🚀 PODService.deletePOD called with:', { id });
    console.log('🌐 Making DELETE request to endpoint: /master-data/v1/pod/{id}');
    
    try {
      const result = await this.delete<{ success: boolean }>(`/master-data/v1/pod/${id}`);
      console.log('✅ PODService.deletePOD success:', result);
      return result;
    } catch (error) {
      console.error('❌ PODService.deletePOD error:', error);
      throw error;
    }
  }

  /**
   * Get list of POD ports with filtering and pagination
   * @param params - Query parameters for filtering and pagination
   * @returns Promise<PODListResponse>
   */
  async getPODs(params: PODListRequest = {}): Promise<PODListResponse> {
    const cleanParams = this.buildParams(params);
    return this.post<PODListResponse>(this.buildEndpoint('pod', 'list'), cleanParams);
  }

  /**
   * Search POD ports by name
   * @param query - Search query (empty string for default results)
   * @param limit - Maximum number of results
   * @returns Promise<PODResponse[]>
   */
  async searchPODs(query: string, limit: number = 10): Promise<PODResponse[]> {
    const params: any = { page_size: limit };
    
    // Only add name filter if query is not empty
    if (query.trim()) {
      params.name = query;
    }
    
    const response = await this.post<PODListResponse>(this.buildEndpoint('pod', 'list'), params);
    return response.results;
  }

  /**
   * Get POD ports by country
   * @param country - Country name to search for
   * @param params - Additional query parameters
   * @returns Promise<PODListResponse>
   */
  async getPODsByCountry(country: string, params: Omit<PODListRequest, 'country'> = {}): Promise<PODListResponse> {
    const cleanParams = this.buildParams({ ...params, country });
    return this.post<PODListResponse>(this.buildEndpoint('pod', 'list'), cleanParams);
  }

  /**
   * Get POD ports by UNLOCODE
   * @param unlocode - UNLOCODE to search for
   * @param params - Additional query parameters
   * @returns Promise<PODListResponse>
   */
  async getPODsByUnlocode(unlocode: string, params: Omit<PODListRequest, 'unlocode'> = {}): Promise<PODListResponse> {
    const cleanParams = this.buildParams({ ...params, unlocode });
    return this.post<PODListResponse>(this.buildEndpoint('pod', 'list'), cleanParams);
  }

  /**
   * Bulk update POD port status
   * @param podIds - Array of POD port IDs
   * @param isActive - New status
   * @returns Promise<{ success: boolean }>
   */
  async bulkUpdatePODStatus(podIds: (string | number)[], isActive: boolean): Promise<{ success: boolean }> {
    return this.put<{ success: boolean }>(this.buildEndpoint('pod', 'bulk-status'), {
      pod_ids: podIds,
      is_active: isActive
    });
  }

  /**
   * Export POD ports data
   * @param params - Export parameters
   * @returns Promise<PODResponse[]>
   */
  async exportPODs(params: PODListRequest = {}): Promise<PODResponse[]> {
    const exportParams = { ...params, page_size: 1000 };
    const response = await this.post<PODListResponse>(this.buildEndpoint('pod', 'list'), exportParams);
    return response.results;
  }

  /**
   * Get POD port statistics
   * @returns Promise<ApiResponse>
   */
  async getPODStatistics(): Promise<ApiResponse> {
    return this.get<ApiResponse>(this.buildEndpoint('pod', 'statistics'));
  }

  /**
   * Validate POD port code uniqueness
   * @param code - POD port code to validate
   * @param excludeId - POD ID to exclude from validation (for updates)
   * @returns Promise<{ isUnique: boolean }>
   */
  async validatePODCode(code: string, excludeId?: string | number): Promise<{ isUnique: boolean }> {
    const params: PODListRequest = { code, page_size: 1 };
    const response = await this.getPODs(params);
    
    if (excludeId) {
      // Filter out the current record being updated
      const filteredResults = response.results.filter(pod => pod.id !== Number(excludeId));
      return { isUnique: filteredResults.length === 0 };
    }
    
    return { isUnique: response.results.length === 0 };
  }
}

// Export singleton instance
export const podService = new PODService();
export default podService;
