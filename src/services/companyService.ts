import { BaseService } from './baseService';
import {
  Company,
  CompanyListRequest,
  CompanyListResponse,
  CompanyCreateRequest,
  CompanyUpdateRequest,
} from '@/types/company';
import { CompanyJsonInfoResponse } from '@/types/api';

export class CompanyService extends BaseService {
  protected readonly basePath = '/master-data/v1/company';

  /**
   * Get list of companies with pagination and filters
   * @param params - Request body parameters
   * @returns Promise<CompanyListResponse>
   */
  async getCompanies(params: CompanyListRequest = {}): Promise<CompanyListResponse> {
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
    
    return this.post<CompanyListResponse>(`${this.basePath}/list`, cleanedBody);
  }

  /**
   * Get single company by ID
   * @param id - Company ID
   * @returns Promise<Company>
   */
  async getCompany(id: number): Promise<Company> {
    return this.get<Company>(`${this.basePath}/${id}`);
  }

  /**
   * Create new company
   * @param data - Company creation data
   * @returns Promise<Company>
   */
  async createCompany(data: CompanyCreateRequest): Promise<Company> {
    return this.post<Company>(this.basePath, data);
  }

  /**
   * Update company
   * @param id - Company ID
   * @param data - Company update data
   * @returns Promise<Company>
   */
  async updateCompany(id: number, data: CompanyUpdateRequest): Promise<Company> {
    return this.put<Company>(`${this.basePath}/${id}`, data);
  }

  /**
   * Partial update company
   * @param id - Company ID
   * @param data - Partial company data
   * @returns Promise<Company>
   */
  async partialUpdateCompany(id: number, data: Partial<CompanyUpdateRequest>): Promise<Company> {
    return this.patch<Company>(`${this.basePath}/${id}`, data);
  }

  /**
   * Delete company
   * @param id - Company ID
   * @returns Promise<void>
   */
  async deleteCompany(id: number): Promise<void> {
    return this.delete<void>(`${this.basePath}/${id}`);
  }

  /**
   * Export companies to CSV
   * @param params - Request body parameters
   * @returns Promise<Blob>
   */
  async exportCompanies(params: CompanyListRequest = {}): Promise<Blob> {
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
    
    return this.post<Blob>(`${this.basePath}/export`, cleanedBody);
  }

  /**
   * Get company JSON info for mapping company IDs to names
   * @deprecated Use getCompanies() instead and transform the results
   * @returns Promise<CompanyJsonInfoResponse>
   */
  async getCompanyJsonInfo(): Promise<CompanyJsonInfoResponse> {
    // This method is deprecated - use getCompanies() instead
    // Keeping for backwards compatibility but should be removed in future
    const response = await this.getCompanies({
      page: 1,
      page_size: 10000,
      order_by: 'name',
      order_type: 'asc'
    });
    
    // Transform to match CompanyJsonInfoResponse format
    const results: Record<string, string> = {};
    response.results.forEach((company) => {
      if (company.id && company.name) {
        results[company.id.toString()] = company.name;
      }
    });
    
    return { results } as CompanyJsonInfoResponse;
  }
}

export const companyService = new CompanyService();
