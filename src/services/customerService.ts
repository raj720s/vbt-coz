import superAxios from '@/utils/superAxios';
import { 
  CustomerListRequest, 
  CustomerListResponse, 
  CreateCustomerRequest, 
  UpdateCustomerRequest, 
  CustomerResponse, 
  ApiResponse
} from '@/types/api';
import { BASEURL } from '@/config/variables';

// Utility function to clean parameters
function cleanParams(params: Record<string, any>): Record<string, any> {
  const cleanedParams: Record<string, any> = {};
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      cleanedParams[key] = value;
    }
  });
  
  return cleanedParams;
}

export const customerService = {
  // Get customers list with filtering and pagination
  async getCustomers(params: CustomerListRequest = {}): Promise<CustomerListResponse> {
    const cleanedParams = cleanParams(params);
    const response = await superAxios.post(`${BASEURL}/master-data/v1/customer/list`, cleanedParams);
    return response.data;
  },

  // Get single customer by ID
  async getCustomer(id: number): Promise<CustomerResponse> {
    const response = await superAxios.get(`${BASEURL}/master-data/v1/customer/${id}`);
    return response.data;
  },

  // Create new customer
  async createCustomer(customerData: CreateCustomerRequest): Promise<CustomerResponse> {
    const response = await superAxios.post(`${BASEURL}/master-data/v1/customer`, customerData);
    return response.data;
  },

  // Update customer
  async updateCustomer(id: number, data: UpdateCustomerRequest): Promise<CustomerResponse> {
    const response = await superAxios.put(`${BASEURL}/master-data/v1/customer/${id}`, data);
    return response.data;
  },

  // Patch customer
  async patchCustomer(id: number, data: UpdateCustomerRequest): Promise<CustomerResponse> {
    const response = await superAxios.patch(`${BASEURL}/master-data/v1/customer/${id}`, data);
    return response.data;
  },

  // Delete customer
  async deleteCustomer(id: number): Promise<ApiResponse> {
    const response = await superAxios.delete(`${BASEURL}/master-data/v1/customer/${id}`);
    return response.data;
  },

  // Search customers
  async searchCustomers(query: string): Promise<CustomerResponse[]> {
    const params: any = { page_size: 10 };
    
    // Only add name filter if query is not empty
    if (query.trim()) {
      params.name = query;
    }
    
    const response = await superAxios.post(`${BASEURL}/master-data/v1/customer/list`, params);
    return response.data.results;
  },

  // Get customers by country
  async getCustomersByCountry(country: string, params: Omit<CustomerListRequest, 'country'> = {}): Promise<CustomerListResponse> {
    const cleanedParams = cleanParams({ ...params, country });
    const response = await superAxios.post(`${BASEURL}/master-data/v1/customer/list`, cleanedParams);
    return response.data;
  },

  // Get customers by city
  async getCustomersByCity(city: string, params: Omit<CustomerListRequest, 'city'> = {}): Promise<CustomerListResponse> {
    const cleanedParams = cleanParams({ ...params, city });
    const response = await superAxios.post(`${BASEURL}/master-data/v1/customer/list`, cleanedParams);
    return response.data;
  }
};

export default customerService;