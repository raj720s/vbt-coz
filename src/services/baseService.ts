import superAxios from '@/utils/superAxios';
import { ApiResponse } from '@/types/api';

export abstract class BaseService {
  protected abstract readonly basePath: string;

  /**
   * Generic GET request
   * @param endpoint - API endpoint
   * @param params - Query parameters
   * @returns Promise<T>
   */
  protected async get<T>(endpoint: string, params?: any): Promise<T> {
    try {
      const response = await superAxios.get<T>(endpoint, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to GET ${endpoint}`);
    }
  }

  /**
   * Generic POST request
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @returns Promise<T>
   */
  protected async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await superAxios.post<T>(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to POST ${endpoint}`);
    }
  }

  /**
   * Generic PUT request
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @returns Promise<T>
   */
  protected async put<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await superAxios.put<T>(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to PUT ${endpoint}`);
    }
  }

  /**
   * Generic DELETE request
   * @param endpoint - API endpoint
   * @param data - Request body data (for DELETE with body)
   * @returns Promise<T>
   */
  protected async delete<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const config = data ? { data } : {};
      const response = await superAxios.delete<T>(endpoint, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to DELETE ${endpoint}`);
    }
  }

  /**
   * Generic PATCH request
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @returns Promise<T>
   */
  protected async patch<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await superAxios.patch<T>(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to PATCH ${endpoint}`);
    }
  }

  /**
   * Build full endpoint URL
   * @param path - Additional path segments
   * @returns Full endpoint URL
   */
  protected buildEndpoint(...path: (string | number)[]): string {
    return [this.basePath, ...path].join('/');
  }

  /**
   * Build query parameters object
   * @param params - Parameters object
   * @returns Cleaned parameters object
   */
  protected buildParams(params: Record<string, any> = {}): Record<string, any> {
    const cleanParams: Record<string, any> = {};
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value;
      }
    });
    
    return cleanParams;
  }

  /**
   * Handle API errors consistently
   * @param error - The error object
   * @param defaultMessage - Default error message
   * @returns Error with consistent format
   */
  protected handleError(error: any, defaultMessage: string): Error {
    // Handle axios response errors
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    
    // Handle axios request errors
    if (error.request && !error.response) {
      console.log(error.request);
      return new Error('Network error: No response received');
    }
    
    // Handle axios configuration errors
    if (error.code === 'ECONNABORTED') {
      return new Error('Request timeout');
    }
    
    // Handle other errors
    if (error.message) {
      return new Error(error.message);
    }
    
    return new Error(defaultMessage);
  }

  /**
   * Validate required fields
   * @param data - Data object to validate
   * @param requiredFields - Array of required field names
   * @throws Error if required fields are missing
   */
  protected validateRequiredFields(data: any, requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => {
      const value = data[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Transform response data to consistent format
   * @param response - API response
   * @returns Transformed response
   */
  protected transformResponse<T>(response: T): T {
    // Add any common transformations here
    return response;
  }

  /**
   * Retry request with exponential backoff
   * @param requestFn - Request function to retry
   * @param maxRetries - Maximum number of retries
   * @param baseDelay - Base delay in milliseconds
   * @returns Promise<T>
   */
  protected async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before retrying with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
}
