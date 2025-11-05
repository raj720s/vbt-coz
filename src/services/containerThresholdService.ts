import { BaseService } from './baseService';
import {
  ContainerThresholdResponse,
  CreateContainerThresholdRequest,
  UpdateContainerThresholdRequest,
  ContainerThresholdListRequest,
  ContainerThresholdListResponse,
} from '@/types/api';

class ContainerThresholdService extends BaseService {
  protected readonly basePath = '/master-data/v1';

  // Get container threshold list with filtering and pagination
  async getContainerThresholds(params: ContainerThresholdListRequest): Promise<ContainerThresholdListResponse> {
    return this.post(this.buildEndpoint('threshold', 'list'), params);
  }

  // Get single container threshold by ID
  async getContainerThreshold(id: number): Promise<ContainerThresholdResponse> {
    return this.get(this.buildEndpoint('threshold', id));
  }

  // Create new container threshold
  async createContainerThreshold(data: CreateContainerThresholdRequest): Promise<ContainerThresholdResponse> {
    return this.post(this.buildEndpoint('threshold'), data);
  }

  // Update container threshold
  async updateContainerThreshold(id: number, data: UpdateContainerThresholdRequest): Promise<ContainerThresholdResponse> {
    return this.put(this.buildEndpoint('threshold', id), data);
  }

  // Patch container threshold
  async patchContainerThreshold(id: number, data: Partial<UpdateContainerThresholdRequest>): Promise<ContainerThresholdResponse> {
    return this.patch(this.buildEndpoint('threshold', id), data);
  }

  // Delete container threshold
  async deleteContainerThreshold(id: number): Promise<void> {
    return this.delete(this.buildEndpoint('threshold', id));
  }
}

export const containerThresholdService = new ContainerThresholdService();
export default containerThresholdService;
