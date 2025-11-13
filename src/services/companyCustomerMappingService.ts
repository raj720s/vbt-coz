import { BaseService } from './baseService';
import {
  CompanyCustomerMapping,
  CompanyCustomerMappingListRequest,
  CompanyCustomerMappingListResponse,
  CompanyCustomerMappingCreateRequest,
  CompanyCustomerMappingUpdateRequest,
  CompanyCustomerMappingResponse,
  CustomerMappingApiRequest,
  CustomerMappingApiResponse,
  CustomerMappingGetResponse,
} from '@/types/companyCustomerMapping';
import { COMPANY_TYPES } from '@/types/company';
import { customerService } from './customerService';
import { companyService } from './companyService';


export class CompanyCustomerMappingService extends BaseService {
  protected readonly basePath = '/master-data/v1/customer-mappings';

  /**
   * Get list of mappings with pagination and filters
   * @param params - Request body parameters
   * @returns Promise<CompanyCustomerMappingListResponse>
   */
  async getMappings(params: CompanyCustomerMappingListRequest = {}): Promise<CompanyCustomerMappingListResponse> {
    const requestBody: any = {
      page: params.page || 1,
      page_size: params.page_size || 10,
    };

    if (params.company) {
      requestBody.company = params.company;
    }
    if (params.customer) {
      requestBody.customer = params.customer;
    }
    if (params.order_by) {
      requestBody.order_by = params.order_by;
    }
    if (params.order_type) {
      requestBody.order_type = params.order_type;
    }
    
    // Add search filter if present
    if (params.search) {
      requestBody.name = params.search; // Search by company name
    }

    const response = await this.post<CompanyCustomerMappingListResponse>(`${this.basePath}/list`, requestBody);
    return response;
  }

  /**
   * Get single mapping by company_id
   * @param companyId - Company ID (API uses company_id as identifier)
   * @returns Promise<CompanyCustomerMappingResponse>
   */
  async getMapping(companyId: number): Promise<CompanyCustomerMappingResponse> {
    // Call API - returns { company_id, company_name, customer_names }
    const apiResponse = await this.get<CustomerMappingGetResponse>(`${this.basePath}/${companyId}`);
    
    // Fetch company details to get company_type
    let company;
    try {
      company = await companyService.getCompany(companyId);
    } catch (error) {
      throw new Error(`Failed to fetch company ${companyId}`);
    }

    // Fetch customer details by name to get customer IDs and codes
    const customerNames = Array.isArray(apiResponse.customer_names) ? apiResponse.customer_names : [];
    const customers = [];
    const customerIds = [];

    for (const customerName of customerNames) {
      try {
        const customerResponse = await customerService.getCustomers({ name: customerName, page_size: 1 });
        if (customerResponse.results && customerResponse.results.length > 0) {
          const customer = customerResponse.results[0];
          customers.push({
            id: customer.id,
            name: customer.name,
            customer_code: customer.customer_code || '',
          });
          customerIds.push(customer.id);
        }
      } catch (error) {
        console.warn(`Failed to fetch customer ${customerName}:`, error);
      }
    }

    return {
      id: companyId,
      company_id: companyId,
      company_name: apiResponse.company_name || company.name,
      company_type: company.company_type,
      company_type_label: COMPANY_TYPES.find(t => t.value === company.company_type)?.label || '',
      customer_ids: customerIds,
      customers: customers,
      is_active: apiResponse.is_active !== undefined ? apiResponse.is_active : company.is_active,
      created_on: undefined,
      modified_on: undefined,
      created_by: undefined,
      modified_by: undefined,
    };
  }

  /**
   * Create new mapping
   * @param data - Mapping creation data (with customer_names)
   * @returns Promise<CustomerMappingGetResponse> - Returns API response directly
   */
  async createMapping(data: CompanyCustomerMappingCreateRequest): Promise<CustomerMappingGetResponse> {
    // Prepare API request - matches exact API payload structure
    const apiRequest: CustomerMappingApiRequest = {
      company_id: data.company_id,
      customer_names: data.customer_names,
    };

    // Call API - API returns { company_id, company_name, customer_names }
    const response = await this.post<CustomerMappingGetResponse>(this.basePath, apiRequest);
    return response;
  }

  /**
   * Update mapping
   * @param companyId - Company ID (API uses company_id as identifier)
   * @param data - Mapping update data (with customer_names and optional is_active)
   * @returns Promise<CustomerMappingGetResponse> - Returns API response directly
   */
  async updateMapping(companyId: number, data: CompanyCustomerMappingUpdateRequest): Promise<CustomerMappingGetResponse> {
    // Prepare API request - matches exact API payload structure
    // API expects: { company_id, customer_names, is_active }
    const apiRequest: CustomerMappingApiRequest = {
      company_id: data.company_id || companyId,
      customer_names: data.customer_names || [],
    };

    // Include is_active if provided
    if (data.is_active !== undefined) {
      apiRequest.is_active = data.is_active;
    }

    // Call API - API returns { company_id, company_name, customer_names, is_active }
    const response = await this.put<CustomerMappingGetResponse>(`${this.basePath}/${companyId}`, apiRequest);
    return response;
  }

  /**
   * Delete mapping (soft delete by setting is_active to false)
   * @param companyId - Company ID (API uses company_id as identifier)
   * @param customerNames - Customer names to preserve in the mapping
   * @returns Promise<CustomerMappingGetResponse>
   */
  async deleteMapping(companyId: number, customerNames: string[]): Promise<CustomerMappingGetResponse> {
    // Soft delete by setting is_active to false
    return this.updateMapping(companyId, {
      company_id: companyId,
      customer_names: customerNames,
      is_active: false,
    });
  }

  /**
   * Search customers for multi-select
   * @param query - Search query
   * @returns Promise of customer options
   */
  async searchCustomers(query: string = ""): Promise<Array<{ id: number; name: string; code?: string; customer_code?: string; country?: string; city?: string }>> {
    try {
      const params: any = {
        page: 1,
        page_size: 50, // Get more results for selection
        is_active: true,
      };
      
      if (query && query.trim().length >= 2) {
        params.name = query.trim();
      }
      
      const response = await customerService.getCustomers(params);
      
      return (response.results || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        code: c.customer_code,
        customer_code: c.customer_code,
        country: c.country || '',
        city: '', // Customer API might not have city
      }));
    } catch (error) {
      console.error("Failed to search customers:", error);
      return [];
    }
  }
}

export const companyCustomerMappingService = new CompanyCustomerMappingService();

