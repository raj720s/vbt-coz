import { BaseService } from './baseService';
import {
  CompanyCustomerMapping,
  CompanyCustomerMappingListRequest,
  CompanyCustomerMappingListResponse,
  CompanyCustomerMappingCreateRequest,
  CompanyCustomerMappingUpdateRequest,
  CompanyCustomerMappingResponse,
} from '@/types/companyCustomerMapping';
import { COMPANY_TYPES } from '@/types/company';

// Dummy data for development
const dummyMappings: CompanyCustomerMapping[] = [
  {
    id: 1,
    company_id: 1,
    company_name: "Global Shipping Corp",
    company_type: 20,
    company_type_label: "Customer",
    customer_ids: [1, 2, 3],
    customers: [
      { id: 1, name: "ABC Logistics", customer_code: "CUST001" },
      { id: 2, name: "XYZ Transport", customer_code: "CUST002" },
      { id: 3, name: "Fast Freight Inc", customer_code: "CUST003" },
    ],
    is_active: true,
    created_on: "2024-01-15T10:00:00Z",
    modified_on: "2024-01-20T14:30:00Z",
    created_by: 1,
    modified_by: 1,
    created_by_name: "Admin User",
    modified_by_name: "Admin User",
  },
  {
    id: 2,
    company_id: 2,
    company_name: "Ocean Freight Solutions",
    company_type: 20,
    company_type_label: "Customer",
    customer_ids: [4, 5],
    customers: [
      { id: 4, name: "Maritime Logistics", customer_code: "CUST004" },
      { id: 5, name: "Sea Transport Co", customer_code: "CUST005" },
    ],
    is_active: true,
    created_on: "2024-01-16T09:00:00Z",
    modified_on: "2024-01-18T11:00:00Z",
    created_by: 1,
    modified_by: 1,
    created_by_name: "Admin User",
    modified_by_name: "Admin User",
  },
  {
    id: 3,
    company_id: 3,
    company_name: "International Cargo Ltd",
    company_type: 20,
    company_type_label: "Customer",
    customer_ids: [6, 7, 8, 9],
    customers: [
      { id: 6, name: "Worldwide Shipping", customer_code: "CUST006" },
      { id: 7, name: "Global Cargo Express", customer_code: "CUST007" },
      { id: 8, name: "Transcontinental Logistics", customer_code: "CUST008" },
      { id: 9, name: "International Freight", customer_code: "CUST009" },
    ],
    is_active: true,
    created_on: "2024-01-17T08:00:00Z",
    modified_on: "2024-01-19T16:00:00Z",
    created_by: 1,
    modified_by: 1,
    created_by_name: "Admin User",
    modified_by_name: "Admin User",
  },
  {
    id: 4,
    company_id: 4,
    company_name: "Premium Shipping Services",
    company_type: 20,
    company_type_label: "Customer",
    customer_ids: [10],
    customers: [
      { id: 10, name: "Elite Logistics Group", customer_code: "CUST010" },
    ],
    is_active: true,
    created_on: "2024-01-18T10:00:00Z",
    modified_on: "2024-01-18T10:00:00Z",
    created_by: 1,
    modified_by: 1,
    created_by_name: "Admin User",
    modified_by_name: "Admin User",
  },
  {
    id: 5,
    company_id: 5,
    company_name: "Regional Transport Co",
    company_type: 20,
    company_type_label: "Customer",
    customer_ids: [11, 12, 13, 14, 15],
    customers: [
      { id: 11, name: "Local Freight Services", customer_code: "CUST011" },
      { id: 12, name: "Regional Cargo", customer_code: "CUST012" },
      { id: 13, name: "City Logistics", customer_code: "CUST013" },
      { id: 14, name: "Metro Shipping", customer_code: "CUST014" },
      { id: 15, name: "Urban Transport", customer_code: "CUST015" },
    ],
    is_active: true,
    created_on: "2024-01-19T09:00:00Z",
    modified_on: "2024-01-21T13:00:00Z",
    created_by: 1,
    modified_by: 1,
    created_by_name: "Admin User",
    modified_by_name: "Admin User",
  },
];

// Dummy customers for search
const dummyCustomers = [
  { id: 1, name: "ABC Logistics", customer_code: "CUST001", country: "USA", city: "New York" },
  { id: 2, name: "XYZ Transport", customer_code: "CUST002", country: "UK", city: "London" },
  { id: 3, name: "Fast Freight Inc", customer_code: "CUST003", country: "Germany", city: "Berlin" },
  { id: 4, name: "Maritime Logistics", customer_code: "CUST004", country: "Netherlands", city: "Rotterdam" },
  { id: 5, name: "Sea Transport Co", customer_code: "CUST005", country: "Singapore", city: "Singapore" },
  { id: 6, name: "Worldwide Shipping", customer_code: "CUST006", country: "China", city: "Shanghai" },
  { id: 7, name: "Global Cargo Express", customer_code: "CUST007", country: "Japan", city: "Tokyo" },
  { id: 8, name: "Transcontinental Logistics", customer_code: "CUST008", country: "USA", city: "Los Angeles" },
  { id: 9, name: "International Freight", customer_code: "CUST009", country: "UAE", city: "Dubai" },
  { id: 10, name: "Elite Logistics Group", customer_code: "CUST010", country: "Switzerland", city: "Zurich" },
  { id: 11, name: "Local Freight Services", customer_code: "CUST011", country: "Canada", city: "Toronto" },
  { id: 12, name: "Regional Cargo", customer_code: "CUST012", country: "Australia", city: "Sydney" },
  { id: 13, name: "City Logistics", customer_code: "CUST013", country: "France", city: "Paris" },
  { id: 14, name: "Metro Shipping", customer_code: "CUST014", country: "Italy", city: "Milan" },
  { id: 15, name: "Urban Transport", customer_code: "CUST015", country: "Spain", city: "Madrid" },
];

export class CompanyCustomerMappingService extends BaseService {
  protected readonly basePath = '/master-data/v1/company-customer-mapping';

  /**
   * Get list of mappings with pagination and filters
   * @param params - Request body parameters
   * @returns Promise<CompanyCustomerMappingListResponse>
   */
  async getMappings(params: CompanyCustomerMappingListRequest = {}): Promise<CompanyCustomerMappingListResponse> {
    // For now, return dummy data
    // Later, replace with: return this.post<CompanyCustomerMappingListResponse>(`${this.basePath}/list`, params);
    
    let filtered = [...dummyMappings];
    
    // Apply filters
    if (params.company_id) {
      filtered = filtered.filter(m => m.company_id === params.company_id);
    }
    if (params.company_type) {
      filtered = filtered.filter(m => m.company_type === params.company_type);
    }
    if (params.customer_id) {
      filtered = filtered.filter(m => m.customer_ids.includes(params.customer_id!));
    }
    if (params.is_active !== undefined) {
      filtered = filtered.filter(m => m.is_active === params.is_active);
    }
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter(m => 
        m.company_name.toLowerCase().includes(searchLower) ||
        m.customers.some(c => c.name.toLowerCase().includes(searchLower) || c.customer_code.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply sorting
    if (params.order_by) {
      filtered.sort((a, b) => {
        const aVal = (a as any)[params.order_by!];
        const bVal = (b as any)[params.order_by!];
        const order = params.order_type === 'desc' ? -1 : 1;
        if (aVal < bVal) return -1 * order;
        if (aVal > bVal) return 1 * order;
        return 0;
      });
    }
    
    // Apply pagination
    const page = params.page || 1;
    const pageSize = params.page_size || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginated = filtered.slice(start, end);
    
    return {
      count: filtered.length,
      total_is_active: filtered.filter(m => m.is_active).length,
      total_inactive: filtered.filter(m => !m.is_active).length,
      results: paginated,
    };
  }

  /**
   * Get single mapping by ID
   * @param id - Mapping ID
   * @returns Promise<CompanyCustomerMappingResponse>
   */
  async getMapping(id: number): Promise<CompanyCustomerMappingResponse> {
    // For now, return dummy data
    // Later, replace with: return this.get<CompanyCustomerMappingResponse>(`${this.basePath}/${id}`);
    
    const mapping = dummyMappings.find(m => m.id === id);
    if (!mapping) {
      throw new Error(`Mapping with id ${id} not found`);
    }
    return mapping;
  }

  /**
   * Create new mapping
   * @param data - Mapping creation data
   * @returns Promise<CompanyCustomerMappingResponse>
   */
  async createMapping(data: CompanyCustomerMappingCreateRequest): Promise<CompanyCustomerMappingResponse> {
    // For now, return dummy data
    // Later, replace with: return this.post<CompanyCustomerMappingResponse>(this.basePath, data);
    
    // Find company (dummy - in real app, fetch from company service)
    const companyType = COMPANY_TYPES.find(ct => ct.value === 20) || COMPANY_TYPES[0];
    
    // Find customers (dummy - in real app, fetch from customer service)
    const customers = dummyCustomers.filter(c => data.customer_ids.includes(c.id));
    
    const newMapping: CompanyCustomerMapping = {
      id: dummyMappings.length + 1,
      company_id: data.company_id,
      company_name: `Company ${data.company_id}`, // Dummy name
      company_type: 20,
      company_type_label: companyType.label,
      customer_ids: data.customer_ids,
      customers: customers.map(c => ({
        id: c.id,
        name: c.name,
        customer_code: c.customer_code,
      })),
      is_active: true,
      created_on: new Date().toISOString(),
      modified_on: new Date().toISOString(),
      created_by: 1,
      modified_by: 1,
      created_by_name: "Admin User",
      modified_by_name: "Admin User",
    };
    
    dummyMappings.push(newMapping);
    return newMapping;
  }

  /**
   * Update mapping
   * @param id - Mapping ID
   * @param data - Mapping update data
   * @returns Promise<CompanyCustomerMappingResponse>
   */
  async updateMapping(id: number, data: CompanyCustomerMappingUpdateRequest): Promise<CompanyCustomerMappingResponse> {
    // For now, return dummy data
    // Later, replace with: return this.put<CompanyCustomerMappingResponse>(`${this.basePath}/${id}`, data);
    
    const mappingIndex = dummyMappings.findIndex(m => m.id === id);
    if (mappingIndex === -1) {
      throw new Error(`Mapping with id ${id} not found`);
    }
    
    const existing = dummyMappings[mappingIndex];
    
    // Update customer_ids if provided
    if (data.customer_ids) {
      const customers = dummyCustomers.filter(c => data.customer_ids!.includes(c.id));
      existing.customer_ids = data.customer_ids;
      existing.customers = customers.map(c => ({
        id: c.id,
        name: c.name,
        customer_code: c.customer_code,
      }));
    }
    
    if (data.is_active !== undefined) {
      existing.is_active = data.is_active;
    }
    
    existing.modified_on = new Date().toISOString();
    existing.modified_by = 1;
    existing.modified_by_name = "Admin User";
    
    return existing;
  }

  /**
   * Delete mapping
   * @param id - Mapping ID
   * @returns Promise<void>
   */
  async deleteMapping(id: number): Promise<void> {
    // For now, just remove from dummy data
    // Later, replace with: return this.delete<void>(`${this.basePath}/${id}`);
    
    const mappingIndex = dummyMappings.findIndex(m => m.id === id);
    if (mappingIndex === -1) {
      throw new Error(`Mapping with id ${id} not found`);
    }
    
    dummyMappings.splice(mappingIndex, 1);
  }

  /**
   * Search customers for multi-select
   * @param query - Search query
   * @returns Promise of customer options
   */
  async searchCustomers(query: string = ""): Promise<Array<{ id: number; name: string; code?: string; customer_code?: string; country?: string; city?: string }>> {
    // For now, return dummy data
    // Later, replace with actual customer service call
    
    if (!query || query.length < 2) {
      return dummyCustomers.map(c => ({
        id: c.id,
        name: c.name,
        code: c.customer_code,
        customer_code: c.customer_code,
        country: c.country,
        city: c.city,
      }));
    }
    
    const queryLower = query.toLowerCase();
    return dummyCustomers
      .filter(c => 
        c.name.toLowerCase().includes(queryLower) ||
        c.customer_code.toLowerCase().includes(queryLower) ||
        c.country.toLowerCase().includes(queryLower) ||
        c.city.toLowerCase().includes(queryLower)
      )
      .map(c => ({
        id: c.id,
        name: c.name,
        code: c.customer_code,
        customer_code: c.customer_code,
        country: c.country,
        city: c.city,
      }));
  }
}

export const companyCustomerMappingService = new CompanyCustomerMappingService();

