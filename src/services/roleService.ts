import superAxios from '@/utils/superAxios';
import { 
  RoleListRequest, 
  RoleListResponseV2, 
  ApiResponse,
  PrivilegeListResponse,
  Privilege
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

// Define role request and response interfaces
export interface CreateRoleRequest {
  role_name: string;
  role_description: string;
  privilege_names: string[];
}

export interface UpdateRoleRequest extends CreateRoleRequest {
  id?: number | string;
}

export interface RoleResponse {
  id: number;
  role_name: string;
  role_description: string;
}

export interface ModulePrivileges {
  module_id: string;
  privileges: Privilege[];
}

export const roleService = {
  // Get roles list with filtering and pagination
  async getRoles(params: RoleListRequest = {}): Promise<RoleListResponseV2[]> {
    const cleanedParams = cleanParams(params);
    const response = await superAxios.post(`admin/v1/role/list`, cleanedParams);
    // Handle API response format: { count: number, results: RoleListResponseV2[] }
    return response.data.results || response.data;
  },

  // Get single role by ID
  async getRole(id: number): Promise<RoleResponse> {
    const response = await superAxios.get(`admin/v1/role/${id}`);
    return response.data;
  },

  // Create new role
  async createRole(roleData: CreateRoleRequest): Promise<RoleResponse> {
    const { role_name, role_description, privilege_names } = roleData;
    const response = await superAxios.post(`admin/v1/role`, {
      role_name,
      role_description,
      privilege_names
    });
    return response.data;
  },

  // Update role (PUT)
  async updateRole(id: number, data: UpdateRoleRequest): Promise<RoleResponse> {
    const { role_name, role_description, privilege_names } = data;
    const response = await superAxios.put(`admin/v1/role/${id}`, {
      role_name,
      role_description,
      privilege_names
    });
    return response.data;
  },

  // Partial update role (PATCH)
  async patchRole(id: number, data: Partial<UpdateRoleRequest>): Promise<RoleResponse> {
    const response = await superAxios.patch(`admin/v1/role/${id}`, {
      ...(data.role_name && { role_name: data.role_name }),
      ...(data.role_description && { role_description: data.role_description }),
      ...(data.privilege_names && { privilege_names: data.privilege_names })
    });
    return response.data;
  },

  // Delete role
  async deleteRole(id: number): Promise<{ success: boolean; message?: string }> {
    const response = await superAxios.delete(`admin/v1/role/${id}`);
    // 204 No Content means successful deletion
    return { success: true, message: 'Role deleted successfully' };
  },

  // Get all privileges
  async getPrivileges(): Promise<{ count: number; results: ModulePrivileges[] }> {
    const response = await superAxios.post(`admin/v1/privilege/list`);
    return response.data;
  },

  // Get role privileges by role ID
  async getRolePrivileges(roleId: number): Promise<ModulePrivileges[]> {
    const response = await superAxios.post(`admin/v1/privilege/list`, { role_id: roleId });
    return response.data.results;
  },

  // Bulk update role status
  async bulkUpdateRoleStatus(roleIds: number[], isActive: boolean): Promise<ApiResponse> {
    const response = await superAxios.put(`admin/v1/role/bulk-status`, { 
      role_ids: roleIds, 
      is_active: isActive 
    });
    return response.data;
  },

  // Get role statistics
  async getRoleStatistics(): Promise<ApiResponse> {
    const response = await superAxios.get(`admin/v1/role/statistics`);
    return response.data;
  }
};

export default roleService;
