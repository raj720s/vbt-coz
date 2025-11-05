import { BaseService } from './baseService';
import {
  CreateContainerTypeRequest,
  UpdateContainerTypeRequest,
  ContainerTypeResponse,
  ContainerTypeListRequest,
  ContainerTypeListResponse,
  ApiResponse
} from '@/types/api';

export class ContainerTypeService extends BaseService {
  protected readonly basePath = '/master-data/v1';

  async createContainerType(containerTypeData: CreateContainerTypeRequest): Promise<ContainerTypeResponse> {
    return this.post<ContainerTypeResponse>(this.buildEndpoint('container'), containerTypeData);
  }

  async getContainerType(id: string | number): Promise<ContainerTypeResponse> {
    return this.get<ContainerTypeResponse>(this.buildEndpoint('container', id));
  }

  async updateContainerType(id: string | number, containerTypeData: UpdateContainerTypeRequest): Promise<ContainerTypeResponse> {
    return this.put<ContainerTypeResponse>(this.buildEndpoint('container', id), containerTypeData);
  }

  async patchContainerType(id: string | number, containerTypeData: UpdateContainerTypeRequest): Promise<ContainerTypeResponse> {
    return this.patch<ContainerTypeResponse>(this.buildEndpoint('container', id), containerTypeData);
  }

  async deleteContainerType(id: string | number): Promise<{ success: boolean }> {
    await this.delete(this.buildEndpoint('container', id));
    return { success: true };
  }

  async getContainerTypes(params: ContainerTypeListRequest = {}): Promise<ContainerTypeListResponse> {
    console.log('🔍 ContainerTypeService.getContainerTypes called with params:', params);
    console.log('🌐 Making POST request to:', this.buildEndpoint('container', 'list'));
    return this.post<ContainerTypeListResponse>(this.buildEndpoint('container', 'list'), params);
  }

  async searchContainerTypes(query: string, limit: number = 10): Promise<ContainerTypeResponse[]> {
    const response = await this.post<ContainerTypeListResponse>(this.buildEndpoint('container', 'list'), {
      name: query,
      page_size: limit
    });
    return response.results;
  }

  async getContainerTypesByStatus(status: boolean, params: Omit<ContainerTypeListRequest, 'status'> = {}): Promise<ContainerTypeListResponse> {
    return this.post<ContainerTypeListResponse>(this.buildEndpoint('container', 'list'), {
      ...params,
      status
    });
  }

  async bulkUpdateContainerTypeStatus(containerTypeIds: (string | number)[], status: boolean): Promise<{ success: boolean }> {
    const promises = containerTypeIds.map(id => this.patchContainerType(id, { status }));
    await Promise.all(promises);
    return { success: true };
  }

  async exportContainerTypes(params: ContainerTypeListRequest = {}): Promise<ContainerTypeResponse[]> {
    const response = await this.post<ContainerTypeListResponse>(this.buildEndpoint('container', 'list'), {
      ...params,
      export: true,
      page_size: 1000
    });
    return response.results;
  }

  async getContainerTypeStatistics(): Promise<ApiResponse> {
    return this.get<ApiResponse>(this.buildEndpoint('container', 'statistics'));
  }

  async validateContainerTypeCode(code: string, excludeId?: string | number): Promise<{ isUnique: boolean }> {
    try {
      const response = await this.post<ContainerTypeListResponse>(this.buildEndpoint('container', 'list'), {
        code,
        page_size: 1
      });
      const existing = response.results.find((item: ContainerTypeResponse) => item.code === code && item.id !== Number(excludeId));
      return { isUnique: !existing };
    } catch (error) {
      return { isUnique: true };
    }
  }
}

export const containerTypeService = new ContainerTypeService();
export default containerTypeService;
