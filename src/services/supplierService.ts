import { BaseService } from './baseService';
import {
  Supplier,
  SupplierListRequest,
  SupplierListResponse,
  SupplierCreateRequest,
  SupplierUpdateRequest,
} from '@/types/supplier';

export class SupplierService extends BaseService {
  protected readonly basePath = '/master-data/v1/supplier';

  /**
   * Get list of suppliers with pagination and filters
   * @param params - Request body parameters
   * @returns Promise<SupplierListResponse>
   */
  async getSuppliers(params: SupplierListRequest = {}): Promise<SupplierListResponse> {
    // Clean up the params to send as request body
    const requestBody: any = { ...params };
    
    // Convert search parameter to name if search is provided
    if (params.search && !params.name) {
      requestBody.name = params.search;
      delete requestBody.search;
    }
    
    // Remove undefined/null values
    const cleanedBody = Object.fromEntries(
      Object.entries(requestBody).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    
    return this.post<SupplierListResponse>(`${this.basePath}/list`, cleanedBody);
  }

  /**
   * Get single supplier by ID
   * @param id - Supplier ID
   * @returns Promise<Supplier>
   */
  async getSupplier(id: number): Promise<Supplier> {
    return this.get<Supplier>(`${this.basePath}/${id}`);
  }

  /**
   * Create new supplier
   * @param data - Supplier creation data
   * @returns Promise<Supplier>
   */
  async createSupplier(data: SupplierCreateRequest): Promise<Supplier> {
    return this.post<Supplier>(this.basePath, data);
  }

  /**
   * Update supplier
   * @param id - Supplier ID
   * @param data - Supplier update data
   * @returns Promise<Supplier>
   */
  async updateSupplier(id: number, data: SupplierUpdateRequest): Promise<Supplier> {
    return this.put<Supplier>(`${this.basePath}/${id}`, data);
  }

  /**
   * Partial update supplier
   * @param id - Supplier ID
   * @param data - Partial supplier data
   * @returns Promise<Supplier>
   */
  async partialUpdateSupplier(id: number, data: Partial<SupplierUpdateRequest>): Promise<Supplier> {
    return this.patch<Supplier>(`${this.basePath}/${id}`, data);
  }

  /**
   * Delete supplier
   * @param id - Supplier ID
   * @returns Promise<void>
   */
  async deleteSupplier(id: number): Promise<void> {
    return this.delete<void>(`${this.basePath}/${id}`);
  }
}

export const supplierService = new SupplierService();

