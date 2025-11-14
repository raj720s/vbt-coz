import superAxios from '@/utils/superAxios';
import { CustomerResponse } from '@/types/api';
import { BASEURL } from '@/config/variables';

export interface UserCustomerListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CustomerResponse[];
}

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

export const userCustomerService = {
  /**
   * Get list of customers for the logged-in user
   * GET /master-data/v1/user_customers/
   * @param params - Optional query parameters (page, page_size, search, etc.)
   * @returns Promise<UserCustomerListResponse>
   */
  async getUserCustomers(params: {
    page?: number;
    page_size?: number;
    search?: string;
  } = {}): Promise<UserCustomerListResponse> {
    const cleanedParams = cleanParams(params);
    const queryString = new URLSearchParams(
      Object.entries(cleanedParams).reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    
    const url = `${BASEURL}/master-data/v1/user_customers/${queryString ? `?${queryString}` : ''}`;
    const response = await superAxios.get(url);
    return response.data;
  },

  /**
   * Get single customer by ID (for the logged-in user)
   * Since the API doesn't support getting a single customer by ID,
   * this method fetches all customers and filters by ID client-side
   * @param id - Customer ID
   * @returns Promise<CustomerResponse | null>
   */
  async getUserCustomer(id: number): Promise<CustomerResponse | null> {
    // Get all customers and filter by ID
    const response = await this.getUserCustomers({ page_size: 1000 });
    const customer = response.results.find(c => c.id === id);
    return customer || null;
  },

  /**
   * Search customers for the logged-in user
   * This method searches through the user's allowed customers
   * @param query - Search query (searches by name or customer_code)
   * @returns Promise<CustomerResponse[]>
   */
  async searchUserCustomers(query: string): Promise<CustomerResponse[]> {
    const params: any = { page_size: 50 }; // Get more results for search
    
    // Add search parameter if query is provided
    if (query.trim()) {
      params.search = query.trim();
    }
    
    const response = await this.getUserCustomers(params);
    return response.results;
  },

  /**
   * Get all customers for the logged-in user (no pagination limit)
   * Useful for dropdowns that need all available customers
   * @returns Promise<CustomerResponse[]>
   */
  async getAllUserCustomers(): Promise<CustomerResponse[]> {
    const response = await this.getUserCustomers({ page_size: 1000 });
    return response.results;
  }
};

export default userCustomerService;

