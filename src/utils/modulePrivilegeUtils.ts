import { staticModuleDefinitions } from '@/config/staticModules';
import { PrivilegeItemV2, ModulePrivilegeMapping } from '@/services/roleService';

/**
 * Get all available modules with their privilege mappings
 */
export function getModulePrivilegeMappings(
  privileges: PrivilegeItemV2[],
  selectedPrivileges: string[] = []
): ModulePrivilegeMapping[] {
  return Object.values(staticModuleDefinitions.modules).map(module => {
    const modulePrivileges = privileges.filter(
      privilege => privilege.module_id === module.id
    );
    
    const selectedModulePrivileges = selectedPrivileges.filter(privilegeName =>
      modulePrivileges.some(p => p.privilege_name === privilegeName)
    );

    return {
      module_id: module.id,
      module_name: module.name,
      module_description: module.description,
      module_icon: module.icon,
      module_color: module.color,
      available_privileges: modulePrivileges,
      selected_privileges: selectedModulePrivileges,
      is_expanded: false
    };
  }).filter(mapping => mapping.available_privileges.length > 0);
}

/**
 * Get privileges for a specific module
 */
export function getModulePrivileges(
  moduleId: number,
  privileges: PrivilegeItemV2[]
): PrivilegeItemV2[] {
  return privileges.filter(privilege => privilege.module_id === moduleId);
}

/**
 * Get all privileges grouped by module
 */
export function getPrivilegesByModule(
  privileges: PrivilegeItemV2[]
): Record<number, PrivilegeItemV2[]> {
  return privileges.reduce((acc, privilege) => {
    if (!acc[privilege.module_id]) {
      acc[privilege.module_id] = [];
    }
    acc[privilege.module_id].push(privilege);
    return acc;
  }, {} as Record<number, PrivilegeItemV2[]>);
}

/**
 * Check if a user has access to a specific module based on their privileges
 */
export function hasModuleAccess(
  moduleId: number,
  userPrivileges: string[]
): boolean {
  const module = staticModuleDefinitions.modules[moduleId];
  if (!module) return false;
  
  // If module has no privileges required, allow access
  if (module.privileges.length === 0) return true;
  
  // Check if user has any of the module's privileges
  return userPrivileges.some(privilege => 
    module.privileges.includes(privilege)
  );
}

/**
 * Get accessible modules for a user based on their privileges
 */
export function getAccessibleModules(userPrivileges: string[]): number[] {
  return Object.values(staticModuleDefinitions.modules)
    .filter(module => hasModuleAccess(module.id, userPrivileges))
    .map(module => module.id);
}

/**
 * Get module information by ID
 */
export function getModuleInfo(moduleId: number) {
  return staticModuleDefinitions.modules[moduleId];
}

/**
 * Get all available module IDs
 */
export function getAllModuleIds(): number[] {
  return Object.keys(staticModuleDefinitions.modules).map(Number);
}

/**
 * Get module routes (both admin and user)
 */
export function getModuleRoutes(moduleId: number): string[] {
  const module = staticModuleDefinitions.modules[moduleId];
  return module ? module.routes : [];
}

/**
 * Get module privileges
 */
export function getModulePrivilegeNames(moduleId: number): string[] {
  const module = staticModuleDefinitions.modules[moduleId];
  return module ? module.privileges : [];
}

/**
 * Check if a route belongs to a specific module
 */
export function isRouteInModule(route: string, moduleId: number): boolean {
  const module = staticModuleDefinitions.modules[moduleId];
  if (!module) return false;
  
  return module.routes.some(moduleRoute => route.startsWith(moduleRoute));
}

/**
 * Find which module a route belongs to
 */
export function findModuleForRoute(route: string): number | null {
  const moduleEntry = Object.entries(staticModuleDefinitions.modules).find(([_, module]) => {
    return module.routes.some(moduleRoute => route.startsWith(moduleRoute));
  });
  
  return moduleEntry ? parseInt(moduleEntry[0]) : null;
}

/**
 * Get privilege description from privilege name
 */
export function getPrivilegeDescription(
  privilegeName: string,
  privileges: PrivilegeItemV2[]
): string {
  const privilege = privileges.find(p => p.privilege_name === privilegeName);
  return privilege?.privilege_desc || 'No description available';
}

/**
 * Validate if a privilege belongs to a specific module
 */
export function validatePrivilegeModuleMapping(
  privilegeName: string,
  moduleId: number,
  privileges: PrivilegeItemV2[]
): boolean {
  return privileges.some(p => 
    p.privilege_name === privilegeName && p.module_id === moduleId
  );
}
