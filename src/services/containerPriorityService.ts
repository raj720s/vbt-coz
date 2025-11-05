import { BaseService } from './baseService';
import {
  ContainerPriorityResponse,
  CreateContainerPriorityRequest,
  UpdateContainerPriorityRequest,
  ContainerPriorityListRequest,
  ContainerPriorityListResponse,
} from '@/types/api';

class ContainerPriorityService extends BaseService {
  protected readonly basePath = '/master-data/v1';

  // Get container priority list with filtering and pagination
  async getContainerPriorities(params: ContainerPriorityListRequest): Promise<ContainerPriorityListResponse> {
    return this.post(this.buildEndpoint('priority', 'list'), params);
  }

  // Get single container priority by ID
  async getContainerPriority(id: number): Promise<ContainerPriorityResponse> {
    return this.get(this.buildEndpoint('priority', id));
  }

  // Create new container priority
  async createContainerPriority(data: CreateContainerPriorityRequest): Promise<ContainerPriorityResponse> {
    return this.post(this.buildEndpoint('priority'), data);
  }

  // Update container priority
  async updateContainerPriority(id: number, data: UpdateContainerPriorityRequest): Promise<ContainerPriorityResponse> {
    return this.put(this.buildEndpoint('priority', id), data);
  }

  // Patch container priority
  async patchContainerPriority(id: number, data: Partial<UpdateContainerPriorityRequest>): Promise<ContainerPriorityResponse> {
    return this.patch(this.buildEndpoint('priority', id), data);
  }

  // Delete container priority
  async deleteContainerPriority(id: number): Promise<void> {
    return this.delete(this.buildEndpoint('priority', id));
  }
}

export const containerPriorityService = new ContainerPriorityService();
