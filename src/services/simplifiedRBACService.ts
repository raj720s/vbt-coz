"use client";

import { CustomerResponse } from '@/types/api';
import { staticModuleDefinitions } from '@/config/staticModules';
import { BASEURL } from '@/config/variables';
import superAxios from '@/utils/superAxios';
import { 
  getCurrentUserRoleId, 
  isMockUser as checkIfMockUser,
  getAccessToken as getAuthAccessToken,
  AUTH_STORAGE_KEYS
} from '@/utils/authStateHelper';

// Local storage keys
export const STORAGE_KEYS = {
  USER_CUSTOMER_ASSIGNMENTS: 'user_customer_assignments',
  CUSTOMERS: 'customers_data',
  USER_ASSIGNMENTS: 'user_assignments',
  RBAC_CACHE: 'rbac_cache',
  STATIC_MODULES: 'static_modules',
  MODULE_CUSTOMIZATIONS: 'module_customizations'
};

// Simplified privilege interface
export interface SimplifiedPrivilege {
  id: number;
  name: string;
}

// Simplified user interface
export interface SimplifiedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: number;
  role_name: string;
  is_superuser: boolean;
  privileges: string[]; // Array of privilege names
  accessible_routes: string[]; // Array of accessible routes
  module_access: number[]; // Array of module IDs the user can access
  assigned_customers: number[]; // Customer IDs assigned to this user
}

// Module customization interface
export interface ModuleCustomization {
  id: number;
  name: string;
  description: string;
  routes: string[];
  privileges: string[];
  is_custom: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Types for local storage data
export interface UserCustomerAssignment {
  id: number;
  user_id: number;
  customer_id: number;
  assigned_by: number;
  assigned_on: string;
  is_active: boolean;
}

export interface LocalStorageCustomer {
  id: number;
  name: string;
  customer_code: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  tax_id: string;
  is_active: boolean;
  created_on?: string;
}

export interface UserCustomerAssignmentsData {
  [userId: string]: number[]; // userId -> customerIds[]
}

class SimplifiedRBACService {
  private roleDataCache = new Map<number, {
    data: {
      privileges: string[];
      modules: number[];
      modulePrivilegeMap: Map<number, string[]>;
    };
    timestamp: number;
  }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Get authentication token (uses Redux-aware helper)
  private getAuthToken(): string {
    return getAuthAccessToken() || '';
  }

  // Clear cache for a specific role or all roles
  public clearCache(roleId?: number): void {
    if (roleId) {
      this.roleDataCache.delete(roleId);
      console.log(`🔐 SimplifiedRBACService: Cleared cache for role ${roleId}`);
    } else {
      this.roleDataCache.clear();
      console.log(`🔐 SimplifiedRBACService: Cleared all cache`);
    }
  }
  // Get all privileges (server-driven with static fallback)
  async getAllPrivileges(): Promise<SimplifiedPrivilege[]> {
    try {
      // Try to get privileges from server first
      const serverPrivileges = await this.getPrivilegesFromServer();
      if (serverPrivileges && serverPrivileges.length > 0) {
        console.log('📡 Using server privileges:', serverPrivileges.length);
        return serverPrivileges;
      }

      // Fallback to static privileges
      console.log('📁 Using static privileges as fallback');
      return this.getStaticPrivileges();
    } catch (error) {
      console.error('Error getting privileges from server, falling back to static:', error);
      return this.getStaticPrivileges();
    }
  }

  // Get all routes (server-driven with static fallback)
  async getAllRoutes(): Promise<string[]> {
    try {
      // Try to get routes from server first
      const serverRoutes = await this.getRoutesFromServer();
      if (serverRoutes && serverRoutes.length > 0) {
        console.log('📡 Using server routes:', serverRoutes.length);
        return serverRoutes;
      }

      // Fallback to static routes
      console.log('📁 Using static routes as fallback');
      return this.getStaticRoutes();
    } catch (error) {
      console.error('Error getting routes from server, falling back to static:', error);
      return this.getStaticRoutes();
    }
  }

  // Get privileges from server (now uses consolidated method)
  private async getPrivilegesFromServer(roleId?: number): Promise<SimplifiedPrivilege[]> {
    try {
      // If no roleId provided, get current user's role from session
      const currentRoleId = roleId || this.getCurrentUserRoleId();
      
      if (!currentRoleId) {
        console.warn('No role ID available for fetching privileges - this should only happen for mock users');
        // Only return static privileges for mock users
        const isMockUser = this.isMockUser();
        if (isMockUser) {
          return this.getStaticPrivileges();
        } else {
          throw new Error('No role ID available for API user');
        }
      }

      const roleData = await this.getRoleDataFromServer(currentRoleId);
      
      // Convert privilege names to SimplifiedPrivilege objects
      const privileges: SimplifiedPrivilege[] = roleData.privileges.map((name, index) => ({
        id: index + 1, // Generate simple IDs since we don't have them from the consolidated response
        name: name
      }));

      console.log(`📡 Server privileges loaded for role ${currentRoleId}:`, privileges.length);
      return privileges;
    } catch (error) {
      console.error('Failed to fetch privileges from server:', error);
      return this.getStaticPrivileges();
    }
  }

  // Helper method to get current user's role ID (uses Redux-aware helper)
  private getCurrentUserRoleId(): number | null {
    return getCurrentUserRoleId();
  }

  // Helper method to check if current user is a mock user (uses Redux-aware helper)
  private isMockUser(): boolean {
    return checkIfMockUser();
  }

  // Get routes from server
  private async getRoutesFromServer(): Promise<string[]> {
    try {
      const response = await superAxios.get('/admin/v1/routes');

      if (response.status !== 200) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = response.data;
      return data.routes || data;
    } catch (error) {
      console.error('Failed to fetch routes from server:', error);
      throw error;
    }
  }

  // Get static privileges as fallback
  private getStaticPrivileges(): SimplifiedPrivilege[] {
    const allPrivileges: SimplifiedPrivilege[] = [];
    let privilegeId = 1;

    Object.values(staticModuleDefinitions.modules).forEach(module => {
      module.privileges.forEach(privilegeName => {
        allPrivileges.push({
          id: privilegeId++,
          name: privilegeName
        });
      });
    });

    return allPrivileges;
  }

  // Get static routes as fallback
  private getStaticRoutes(): string[] {
    const allRoutes: string[] = [];

    Object.values(staticModuleDefinitions.modules).forEach(module => {
      allRoutes.push(...module.routes);
    });

    return [...new Set(allRoutes)]; // Remove duplicates
  }

  // Get privileges for a specific role (server-driven with static fallback)
  async getRolePrivileges(roleId: number): Promise<string[]> {
    try {
      // Try to get role privileges from server first
      const serverPrivileges = await this.getRolePrivilegesFromServer(roleId);
      if (serverPrivileges && serverPrivileges.length > 0) {
        console.log(`📡 Using server privileges for role ${roleId}:`, serverPrivileges.length);
        return serverPrivileges;
      }

      // Fallback to static role privileges
      console.log(`📁 Using static privileges for role ${roleId} as fallback`);
      return this.getStaticRolePrivileges(roleId);
    } catch (error) {
      console.error(`Error getting privileges for role ${roleId} from server, falling back to static:`, error);
      return this.getStaticRolePrivileges(roleId);
    }
  }

  // Consolidated method to fetch all role data in one API call with caching
  private async getRoleDataFromServer(roleId: number): Promise<{
    privileges: string[];
    modules: number[];
    modulePrivilegeMap: Map<number, string[]>;
  }> {
    // Check cache first
    const cached = this.roleDataCache.get(roleId);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      console.log(`🔐 SimplifiedRBACService: Using cached data for role ${roleId}`);
      return cached.data;
    }

    try {
      const response = await superAxios.post('/admin/v1/privilege/list', {
        role_id: roleId
      });

      if (response.status !== 200) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = response.data;
      
      // Extract all data from the module-wise structure
      const privilegeNames: string[] = [];
      const moduleIds: number[] = [];
      const modulePrivilegeMap = new Map<number, string[]>();
      
      if (data.results && Array.isArray(data.results)) {
        data.results.forEach((module: any) => {
          if (module.module_id) {
            const moduleId = parseInt(module.module_id);
            if (!isNaN(moduleId)) {
              moduleIds.push(moduleId);
              
              // Extract privileges for this module
              const modulePrivileges: string[] = [];
              if (module.privileges && Array.isArray(module.privileges)) {
                module.privileges.forEach((privilege: any) => {
                  if (privilege.privilege_name) {
                    privilegeNames.push(privilege.privilege_name);
                    modulePrivileges.push(privilege.privilege_name);
                  }
                });
              }
              
              modulePrivilegeMap.set(moduleId, modulePrivileges);
            }
          }
        });
      }

      const result = {
        privileges: privilegeNames,
        modules: moduleIds,
        modulePrivilegeMap
      };

      // Cache the result
      this.roleDataCache.set(roleId, {
        data: result,
        timestamp: Date.now()
      });

      console.log(`🔐 SimplifiedRBACService: Fetched and cached ${privilegeNames.length} privileges and ${moduleIds.length} modules for role ${roleId}`);
      console.log('🔐 Server Response Data:', {
        rawResponse: data,
        extractedPrivileges: privilegeNames,
        extractedModules: moduleIds,
        modulePrivilegeMap: Object.fromEntries(modulePrivilegeMap)
      });
      
      return result;
    } catch (error) {
      console.error('Error fetching role data from server:', error);
      throw error;
    }
  }

  // Get role privileges from server (now uses consolidated method)
  private async getRolePrivilegesFromServer(roleId: number): Promise<string[]> {
    const roleData = await this.getRoleDataFromServer(roleId);
    return roleData.privileges;
  }

  // Get static role privileges as fallback
  private getStaticRolePrivileges(roleId: number): string[] {
    const rolePrivileges: string[] = [];

    // Admin role (1) gets all privileges
    if (roleId === 1) {
      Object.values(staticModuleDefinitions.modules).forEach(module => {
        rolePrivileges.push(...module.privileges);
      });
    }
    // Manager role (2) gets limited privileges
    else if (roleId === 2) {
      const managerModules = [20, 40, 80]; // User Management, Port & Customer, Dashboard
      managerModules.forEach(moduleId => {
        const module = staticModuleDefinitions.modules[moduleId];
        if (module) {
          // Only view and edit privileges, no delete
          const limitedPrivileges = module.privileges.filter(p => 
            !p.includes('DELETE') && !p.includes('CREATE')
          );
          rolePrivileges.push(...limitedPrivileges);
        }
      });
    }
    // Regular user role (3) gets read-only privileges
    else if (roleId === 3) {
      const userModules = [40, 50, 60, 80]; // Port & Customer, Shipment, Analytics, Dashboard
      userModules.forEach(moduleId => {
        const module = staticModuleDefinitions.modules[moduleId];
        if (module) {
          // Only view privileges
          const viewPrivileges = module.privileges.filter(p => p.includes('VIEW'));
          rolePrivileges.push(...viewPrivileges);
        }
      });
    }

    return [...new Set(rolePrivileges)]; // Remove duplicates
  }

  // Get accessible routes for a specific role (server-driven with static fallback)
  async getRoleRoutes(roleId: number): Promise<string[]> {
    try {
      // Get modules from server and map to routes using static definitions
      const serverModules = await this.getRoleModulesFromServer(roleId);
      if (serverModules && serverModules.length > 0) {
        const serverRoutes = this.mapModulesToRoutes(serverModules);
        console.log(`📡 Using server-based routes for role ${roleId}:`, serverRoutes.length);
        return serverRoutes;
      }

      // Fallback to static role routes
      console.log(`📁 Using static routes for role ${roleId} as fallback`);
      return this.getStaticRoleRoutes(roleId);
    } catch (error) {
      console.error(`Error getting routes for role ${roleId} from server, falling back to static:`, error);
      return this.getStaticRoleRoutes(roleId);
    }
  }

  // Map server modules to routes using static module definitions
  private mapModulesToRoutes(moduleIds: number[]): string[] {
    const routes: string[] = [];
    
    moduleIds.forEach(moduleId => {
      const module = staticModuleDefinitions.modules[moduleId];
      if (module && module.routes) {
        routes.push(...module.routes);
      }
    });
    
    return [...new Set(routes)]; // Remove duplicates
  }

  // Get accessible modules for a specific role (server-driven with static fallback)
  async getRoleModules(roleId: number): Promise<number[]> {
    try {
      // Try to get role modules from server first
      const serverModules = await this.getRoleModulesFromServer(roleId);
      if (serverModules && serverModules.length > 0) {
        console.log(`📡 Using server modules for role ${roleId}:`, serverModules.length);
        return serverModules;
      }

      // Fallback to static role modules
      console.log(`📁 Using static modules for role ${roleId} as fallback`);
      return this.getStaticRoleModules(roleId);
    } catch (error) {
      console.error(`Error getting modules for role ${roleId} from server, falling back to static:`, error);
      return this.getStaticRoleModules(roleId);
    }
  }


  // Get role modules from server (now uses consolidated method)
  private async getRoleModulesFromServer(roleId: number): Promise<number[]> {
    const roleData = await this.getRoleDataFromServer(roleId);
    return roleData.modules;
  }

  // Get role modules and privileges mapping from server (now uses consolidated method)
  private async getRoleModulesAndPrivilegesFromServer(roleId: number): Promise<{
    modules: number[];
    privileges: string[];
    modulePrivilegeMap: Record<number, string[]>;
  }> {
    const roleData = await this.getRoleDataFromServer(roleId);
    
    // Convert Map to Record for compatibility
    const modulePrivilegeMap: Record<number, string[]> = {};
    roleData.modulePrivilegeMap.forEach((privileges, moduleId) => {
      modulePrivilegeMap[moduleId] = privileges;
    });
    
    return {
      modules: roleData.modules,
      privileges: roleData.privileges,
      modulePrivilegeMap
    };
  }

  // Get role privileges, routes, and modules from server (single API call)
  async getRoleData(roleId: number): Promise<{
    privileges: string[];
    routes: string[];
    modules: number[];
    modulePrivilegeMap: Record<number, string[]>;
  }> {
    try {
      // Check if this is a mock user
      const isMockUser = this.isMockUser();
      
      if (isMockUser) {
        console.log('📁 Using static data for mock user');
        // For mock users, use static data
        return {
          privileges: this.getStaticRolePrivileges(roleId),
          routes: this.getStaticRoleRoutes(roleId),
          modules: this.getStaticRoleModules(roleId),
          modulePrivilegeMap: this.getStaticModulePrivilegeMap(roleId)
        };
      }
      
      // For API users, get data from server
      const serverData = await this.getRoleModulesAndPrivilegesFromServer(roleId);
      console.log('📡 Using server role data:', serverData);
      
      // Add routes from static definitions based on modules
      const routes: string[] = [];
      serverData.modules.forEach(moduleId => {
        const staticModule = staticModuleDefinitions.modules[moduleId];
        if (staticModule) {
          routes.push(...staticModule.routes);
        }
      });
      
      return {
        ...serverData,
        routes: [...new Set(routes)] // Remove duplicates
      };
    } catch (error) {
      console.warn('Server unavailable, using static data as fallback:', error);
      // Fallback to static data only for mock users
      const isMockUser = this.isMockUser();
      if (isMockUser) {
        return {
          privileges: this.getStaticRolePrivileges(roleId),
          routes: this.getStaticRoleRoutes(roleId),
          modules: this.getStaticRoleModules(roleId),
          modulePrivilegeMap: this.getStaticModulePrivilegeMap(roleId)
        };
      } else {
        // For API users, throw error if server is unavailable
        throw new Error('Server unavailable and no static fallback for API users');
      }
    }
  }

  // Get static role routes as fallback
  private getStaticRoleRoutes(roleId: number): string[] {
    const roleRoutes: string[] = [];

    // Admin role (1) gets all routes
    if (roleId === 1) {
      Object.values(staticModuleDefinitions.modules).forEach(module => {
        roleRoutes.push(...module.routes);
      });
    }
    // Manager role (2) gets limited routes
    else if (roleId === 2) {
      const managerModules = [20, 40, 80]; // User Management, Port & Customer, Dashboard
      managerModules.forEach(moduleId => {
        const module = staticModuleDefinitions.modules[moduleId];
        if (module) {
          roleRoutes.push(...module.routes);
        }
      });
    }
    // Regular user role (3) gets user routes only
    else if (roleId === 3) {
      const userModules = [40, 50, 60, 80]; // Port & Customer, Shipment, Analytics, Dashboard
      userModules.forEach(moduleId => {
        const module = staticModuleDefinitions.modules[moduleId];
        if (module) {
          // Only user routes, not admin routes
          const userRoutes = module.routes.filter(route => route.startsWith('/user/'));
          roleRoutes.push(...userRoutes);
        }
      });
    }

    return [...new Set(roleRoutes)]; // Remove duplicates
  }

  // Get static role modules as fallback
  private getStaticRoleModules(roleId: number): number[] {
    // Admin role (1) gets all modules
    if (roleId === 1) {
      return Object.keys(staticModuleDefinitions.modules).map(id => parseInt(id));
    }
    // Manager role (2) gets limited modules
    else if (roleId === 2) {
      return [20, 40, 80]; // User Management, Port & Customer, Dashboard
    }
    // Regular user role (3) gets user modules only
    else if (roleId === 3) {
      return [40, 50, 60, 80]; // Port & Customer, Shipment, Analytics, Dashboard
    }

    return [];
  }

  // Get static module privilege map as fallback
  private getStaticModulePrivilegeMap(roleId: number): Record<number, string[]> {
    const modulePrivilegeMap: Record<number, string[]> = {};
    const modules = this.getStaticRoleModules(roleId);
    
    modules.forEach(moduleId => {
      const staticModule = staticModuleDefinitions.modules[moduleId];
      if (staticModule) {
        modulePrivilegeMap[moduleId] = staticModule.privileges || [];
      }
    });
    
    return modulePrivilegeMap;
  }

  // ===== MODULE MANAGEMENT CRUD OPERATIONS =====

  // Get all modules (server-driven with static fallback)
  async getAllModules(): Promise<ModuleCustomization[]> {
    try {
      // Try to get modules from server first
      const serverModules = await this.getModulesFromServer();
      if (serverModules && serverModules.length > 0) {
        console.log('📡 Using server modules:', serverModules.length);
        return serverModules;
      }

      // Fallback to static modules if server is unavailable
      console.log('📁 Using static modules as fallback');
      return this.getStaticModules();
    } catch (error) {
      console.error('Error getting modules from server, falling back to static:', error);
      return this.getStaticModules();
    }
  }

  // Get modules from server (now uses consolidated method)
  private async getModulesFromServer(): Promise<ModuleCustomization[]> {
    try {
      // Get modules for current user's role only
      const currentRoleId = this.getCurrentUserRoleId();
      
      if (!currentRoleId) {
        console.warn('No role ID available for fetching modules');
        return this.getStaticModules();
      }

      const roleData = await this.getRoleDataFromServer(currentRoleId);
      const allModules = new Map<number, ModuleCustomization>();
      
      // Map server modules to static module definitions
      roleData.modules.forEach(moduleId => {
        if (!allModules.has(moduleId)) {
          const staticModule = staticModuleDefinitions.modules[moduleId];
          if (staticModule) {
            allModules.set(moduleId, {
              id: moduleId,
              name: staticModule.name,
              description: staticModule.description,
              routes: staticModule.routes,
              privileges: staticModule.privileges,
              is_custom: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              created_by: 'system'
            });
          }
        }
      });
      
      const modulesArray = Array.from(allModules.values());
      console.log(`📡 Server modules loaded for role ${currentRoleId}:`, modulesArray.length);
      return modulesArray;
    } catch (error) {
      console.error('Failed to fetch modules from server:', error);
      throw error;
    }
  }

  // Get static modules as fallback
  private getStaticModules(): ModuleCustomization[] {
    return Object.values(staticModuleDefinitions.modules).map(module => ({
      id: module.id,
      name: module.name,
      description: module.description,
      routes: module.routes,
      privileges: module.privileges,
      is_custom: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system'
    }));
  }

  // Get custom modules from localStorage
  async getCustomModules(): Promise<ModuleCustomization[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MODULE_CUSTOMIZATIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting custom modules from storage:', error);
      return [];
    }
  }

  // Save custom modules to localStorage
  async saveCustomModules(modules: ModuleCustomization[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.MODULE_CUSTOMIZATIONS, JSON.stringify(modules));
    } catch (error) {
      console.error('Error saving custom modules to storage:', error);
      throw error;
    }
  }

  // Create a new custom module
  async createModule(moduleData: Omit<ModuleCustomization, 'id' | 'created_at' | 'updated_at' | 'is_custom'>): Promise<ModuleCustomization> {
    try {
      const customModules = await this.getCustomModules();
      
      // Generate new ID (start from 1000 to avoid conflicts with static modules)
      const newId = Math.max(1000, ...customModules.map(m => m.id), 0) + 1;
      
      const newModule: ModuleCustomization = {
        ...moduleData,
        id: newId,
        is_custom: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      customModules.push(newModule);
      await this.saveCustomModules(customModules);
      
      return newModule;
    } catch (error) {
      console.error('Error creating module:', error);
      throw error;
    }
  }

  // Update an existing custom module
  async updateModule(moduleId: number, moduleData: Partial<ModuleCustomization>): Promise<ModuleCustomization> {
    try {
      const customModules = await this.getCustomModules();
      const moduleIndex = customModules.findIndex(m => m.id === moduleId);
      
      if (moduleIndex === -1) {
        throw new Error(`Module with ID ${moduleId} not found`);
      }

      const updatedModule: ModuleCustomization = {
        ...customModules[moduleIndex],
        ...moduleData,
        id: moduleId, // Ensure ID doesn't change
        is_custom: true, // Ensure it remains custom
        updated_at: new Date().toISOString()
      };

      customModules[moduleIndex] = updatedModule;
      await this.saveCustomModules(customModules);
      
      return updatedModule;
    } catch (error) {
      console.error('Error updating module:', error);
      throw error;
    }
  }

  // Delete a custom module
  async deleteModule(moduleId: number): Promise<void> {
    try {
      const customModules = await this.getCustomModules();
      const filteredModules = customModules.filter(m => m.id !== moduleId);
      
      if (filteredModules.length === customModules.length) {
        throw new Error(`Module with ID ${moduleId} not found`);
      }

      await this.saveCustomModules(filteredModules);
    } catch (error) {
      console.error('Error deleting module:', error);
      throw error;
    }
  }

  // Get a specific module by ID
  async getModuleById(moduleId: number): Promise<ModuleCustomization | null> {
    try {
      const allModules = await this.getAllModules();
      return allModules.find(m => m.id === moduleId) || null;
    } catch (error) {
      console.error('Error getting module by ID:', error);
      return null;
    }
  }

  // ===== FUTURE API SERVICE METHODS (COMMENTED) =====
  
  /*
  // TODO: Implement when API service is ready
  
  // Create module via API
  async createModuleAPI(moduleData: Omit<ModuleCustomization, 'id' | 'created_at' | 'updated_at' | 'is_custom'>): Promise<ModuleCustomization> {
    try {
      const response = await fetch(`${BASEURL}/admin/v1/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(moduleData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create module: ${response.statusText}`);
      }

      const newModule = await response.json();
      
      // Also save to localStorage for offline access
      await this.createModule(moduleData);
      
      return newModule;
    } catch (error) {
      console.error('Error creating module via API:', error);
      throw error;
    }
  }

  // Update module via API
  async updateModuleAPI(moduleId: number, moduleData: Partial<ModuleCustomization>): Promise<ModuleCustomization> {
    try {
      const response = await superAxios.put(`/admin/v1/modules/${moduleId}`, moduleData);

      if (response.status !== 200) {
        throw new Error(`Failed to update module: ${response.statusText}`);
      }

      const updatedModule = response.data;
      
      // Also update localStorage
      await this.updateModule(moduleId, moduleData);
      
      return updatedModule;
    } catch (error) {
      console.error('Error updating module via API:', error);
      throw error;
    }
  }

  // Delete module via API
  async deleteModuleAPI(moduleId: number): Promise<void> {
    try {
      const response = await superAxios.delete(`/admin/v1/modules/${moduleId}`);

      if (response.status !== 200) {
        throw new Error(`Failed to delete module: ${response.statusText}`);
      }

      // Also delete from localStorage
      await this.deleteModule(moduleId);
    } catch (error) {
      console.error('Error deleting module via API:', error);
      throw error;
    }
  }

  // Get all modules via API
  async getAllModulesAPI(): Promise<ModuleCustomization[]> {
    try {
      const response = await superAxios.get('/admin/v1/modules');

      if (response.status !== 200) {
        throw new Error(`Failed to fetch modules: ${response.statusText}`);
      }

      const modules = response.data;
      
      // Also sync to localStorage
      const customModules = modules.filter((m: ModuleCustomization) => m.is_custom);
      await this.saveCustomModules(customModules);
      
      return modules;
    } catch (error) {
      console.error('Error fetching modules via API:', error);
      // Fallback to localStorage
      return await this.getAllModules();
    }
  }

  // Helper method to get auth token
  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || '';
  }
  */

  // Customer Management
  async getCustomers(): Promise<LocalStorageCustomer[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Return sample data if no stored data
      return this.getSampleCustomers();
    } catch (error) {
      console.error('Error getting customers from storage:', error);
      return this.getSampleCustomers();
    }
  }

  async saveCustomers(customers: LocalStorageCustomer[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch (error) {
      console.error('Error saving customers to storage:', error);
      throw error;
    }
  }

  // User-Customer Assignment Management
  async getUserCustomerAssignments(): Promise<UserCustomerAssignmentsData> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_CUSTOMER_ASSIGNMENTS);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error getting user customer assignments from storage:', error);
      return {};
    }
  }

  async saveUserCustomerAssignments(assignments: UserCustomerAssignmentsData): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_CUSTOMER_ASSIGNMENTS, JSON.stringify(assignments));
    } catch (error) {
      console.error('Error saving user customer assignments to storage:', error);
      throw error;
    }
  }

  async assignCustomersToUser(userId: number, customerIds: number[], assignedBy: number): Promise<void> {
    const assignments = await this.getUserCustomerAssignments();
    const userKey = userId.toString();
    const currentAssignments = assignments[userKey] || [];
    
    // Add new assignments (avoid duplicates)
    const newAssignments = [...new Set([...currentAssignments, ...customerIds])];
    assignments[userKey] = newAssignments;
    
    await this.saveUserCustomerAssignments(assignments);
  }

  async removeCustomersFromUser(userId: number, customerIds: number[], removedBy: number): Promise<void> {
    const assignments = await this.getUserCustomerAssignments();
    const userKey = userId.toString();
    const currentAssignments = assignments[userKey] || [];
    
    // Remove specified customers
    const newAssignments = currentAssignments.filter(id => !customerIds.includes(id));
    assignments[userKey] = newAssignments;
    
    await this.saveUserCustomerAssignments(assignments);
  }

  async getAssignedCustomers(userId: number): Promise<number[]> {
    const assignments = await this.getUserCustomerAssignments();
    return assignments[userId.toString()] || [];
  }

  // Sample Data Generation
  private getSampleCustomers(): LocalStorageCustomer[] {
    return [
      {
        id: 1,
        name: "Acme Corporation",
        customer_code: "ACME001",
        contact_person: "John Smith",
        email: "john.smith@acme.com",
        phone: "+1-555-0123",
        address: "123 Business St, New York, NY 10001",
        country: "USA",
        tax_id: "12-3456789",
        is_active: true,
        created_on: "2024-01-15T10:00:00Z"
      },
      {
        id: 2,
        name: "Global Logistics Ltd",
        customer_code: "GLOB002",
        contact_person: "Sarah Johnson",
        email: "sarah.johnson@globallog.com",
        phone: "+44-20-7946-0958",
        address: "456 Commerce Ave, London, UK",
        country: "UK",
        tax_id: "GB123456789",
        is_active: true,
        created_on: "2024-01-16T11:30:00Z"
      },
      {
        id: 3,
        name: "Tech Solutions Inc",
        customer_code: "TECH003",
        contact_person: "Mike Chen",
        email: "mike.chen@techsolutions.com",
        phone: "+86-21-1234-5678",
        address: "789 Innovation Blvd, Shanghai, China",
        country: "China",
        tax_id: "CN987654321",
        is_active: true,
        created_on: "2024-01-17T09:15:00Z"
      }
    ];
  }
}

// Export singleton instance
export const simplifiedRBACService = new SimplifiedRBACService();
