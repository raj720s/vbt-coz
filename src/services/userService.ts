import superAxios from '@/utils/superAxios';
import { 
  UserListResponse, 
  UserListResponseV2,
  UserListParams, 
  CreateUserRequest, 
  UserResponse, 
  UserDetailResponse, 
  UserShortInfo, 
  ApiResponse,
  SuperuserModifyRequest,
  SuperuserModifyResponse,
  UserProfileResponse,
  UserJsonInfoResponse
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

export const userService = {
  // Get users list with filtering and pagination
  async getUsers(params: UserListParams = {}): Promise<UserListResponseV2> {
    const cleanedParams = cleanParams(params);
    console.log({cleanedParams});
    const response = await superAxios.post(`${BASEURL}/user/v1/list`, cleanedParams);
    // Handle API response format: { count: number, results: UserData[] }
    return response.data;
  },

  // Get single user by ID
  async getUser(id: number): Promise<UserDetailResponse> {
    const response = await superAxios.get(`${BASEURL}/user/v1/${id}`);
    return response.data;
  },

  // Get user details
  async getUserDetail(id: number): Promise<UserDetailResponse> {
    const response = await superAxios.get(`${BASEURL}/user/v1/detail/${id}`);
    return response.data;
  },

  // Get user short info
  async getUserShortInfo(id: number): Promise<UserShortInfo> {
    const response = await superAxios.get(`${BASEURL}/user/v1/short-info/${id}`);
    return response.data;
  },

  // Create new user
  async createUser(userData: CreateUserRequest): Promise<UserResponse> {
    const response = await superAxios.post(`${BASEURL}/user/v1`, userData);
    return response.data;
  },

  // Update user
  async updateUser(id: number, data: Partial<CreateUserRequest>): Promise<UserDetailResponse> {
    const updateData: any = {
      ...data,
      role_id: data.role, // role is already a number from the form transformation
    };
    // Remove role from updateData since we're using role_id
    delete updateData.role;
    
    // Include company_id if company is provided (API expects company_id for PUT)
    if (data.company !== undefined) {
      updateData.company_id = data.company;
    }
    // Remove company from updateData since we're using company_id
    delete updateData.company;
    
    const response = await superAxios.put(`${BASEURL}/user/v1/${id}`, updateData);
    return response.data;
  },

  // Delete user
  async deleteUser(id: number): Promise<ApiResponse> {
    const response = await superAxios.delete(`${BASEURL}/user/v1/${id}`);
    return response.data;
  },

  // Modify superuser status
  async modifySuperuserStatus(id: number, data: SuperuserModifyRequest): Promise<SuperuserModifyResponse> {
    const response = await superAxios.put(`${BASEURL}/user/v1/superuser/modify/${id}`, data);
    return response.data;
  },

  // Bulk update user status
  async bulkUpdateUserStatus(userIds: number[], status: boolean): Promise<ApiResponse> {
    const response = await superAxios.put(`${BASEURL}/user/v1/bulk-status`, { user_ids: userIds, status });
    return response.data;
  },

  // Get current user profile
  async getUserProfile(): Promise<UserProfileResponse> {
    const response = await superAxios.get(`${BASEURL}/user/v1/profile`);
    return response.data;
  },

  // Update current user profile
  async updateUserProfile(profileData: Partial<CreateUserRequest>): Promise<UserProfileResponse> {
    const response = await superAxios.put(`${BASEURL}/user/v1/profile`, profileData);
    return response.data;
  },

  // Get user JSON info for mapping user IDs to names
  async getUserJsonInfo(): Promise<UserJsonInfoResponse> {
    const response = await superAxios.get(`${BASEURL}/user/v1/json-info`);
    return response.data;
  }
};

export default userService;
