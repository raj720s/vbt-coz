import superAxios from '@/utils/superAxios';

export interface PrivilegeResponse {
  id: number;
  privilege_name: string;
  privilege_desc: string;
  module_id: string;
}

export interface PrivilegeListRequest {
  role_id: number;
}

export interface PrivilegeListResponse {
  count: number;
  results: Array<{
    module_id: string;
    privileges: Array<{
      id: number;
      privilege_name: string;
      privilege_desc: string;
    }>;
  }>;
}

class PrivilegeService {
  /**
   * Fetch privileges for a specific role
   * @param request - Request containing role_id
   * @returns Promise with privilege list
   */
  async getPrivileges(request: PrivilegeListRequest): Promise<PrivilegeListResponse> {
    try {
      const response = await superAxios.post('/admin/v1/privilege/list', request);
      console.log('🔐 PrivilegeService: getPrivileges:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching privileges:', error);
      throw error;
    }
  }

  /**
   * Extract privilege names from privilege list response
   * @param privilegeListResponse - Privilege list response with modules and privileges
   * @returns Array of privilege names (strings)
   */
  extractPrivilegeNames(privilegeListResponse: PrivilegeListResponse): string[] {
    const allPrivileges: string[] = [];
    privilegeListResponse.results.forEach(module => {
      module.privileges.forEach(privilege => {
        allPrivileges.push(privilege.privilege_name);
      });
    });
    return allPrivileges;
  }

  /**
   * Extract module IDs from privilege list response
   * @param privilegeListResponse - Privilege list response with modules and privileges
   * @returns Array of module IDs (strings)
   */
  extractModuleIds(privilegeListResponse: PrivilegeListResponse): string[] {
    return privilegeListResponse.results.map(module => module.module_id);
  }
}

export const privilegeService = new PrivilegeService();
export default privilegeService;
