/**
 * Auth State Helper Utility
 * 
 * This utility provides safe access to authentication state from Redux (primary)
 * with localStorage fallback. Should be used by services that need user data
 * outside of React components.
 */

import { User } from '@/store/slices/authSlice';

/**
 * Storage keys for authentication data
 */
export const AUTH_STORAGE_KEYS = {
  REDUX_PERSIST: 'persist:auth_user', // Redux persist key (auto-managed)
  FALLBACK_USER: 'auth_user_fallback', // Manual fallback user data
  TOKEN: 'auth_token', // Access token
  REFRESH_TOKEN: 'refresh_token', // Refresh token
} as const;

/**
 * Lazy getter for Redux store to avoid circular dependencies
 * @returns Redux store or null
 */
function getStore() {
  if (typeof window === 'undefined') return null;
  
  try {
    // Dynamically import store to avoid circular dependency
    // Store is available via window in client-side
    const storeModule = require('@/store');
    return storeModule.store || null;
  } catch (error) {
    // Store might not be available in some contexts
    return null;
  }
}

/**
 * Get current authenticated user from Redux store (primary) or localStorage (fallback)
 * 
 * Priority:
 * 1. Redux store state (if available)
 * 2. Redux persist data from localStorage
 * 3. Fallback user data from localStorage
 * 
 * @returns User object or null if not authenticated
 */
export function getCurrentUser(): User | null {
  try {
    // Priority 1: Get from Redux store (if we're in a context where store is available)
    const store = getStore();
    if (store) {
      const state = store.getState();
      if (state.auth?.user) {
        return state.auth.user;
      }
    }

    // Priority 2: Try to get from Redux persist data
    if (typeof window !== 'undefined') {
      const persistData = localStorage.getItem(AUTH_STORAGE_KEYS.REDUX_PERSIST);
      if (persistData) {
        try {
          const parsed = JSON.parse(persistData);
          if (parsed.user) {
            return parsed.user;
          }
        } catch (error) {
          console.warn('Failed to parse Redux persist data:', error);
        }
      }

      // Priority 3: Fallback to manual localStorage
      const fallbackUser = localStorage.getItem(AUTH_STORAGE_KEYS.FALLBACK_USER);
      if (fallbackUser) {
        try {
          return JSON.parse(fallbackUser);
        } catch (error) {
          console.warn('Failed to parse fallback user data:', error);
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Get current user's role ID
 * 
 * @returns Role ID or null if not available
 */
export function getCurrentUserRoleId(): number | null {
  const user = getCurrentUser();
  return user?.role_id ?? null;
}

/**
 * Get current user's ID
 * 
 * @returns User ID or null if not available
 */
export function getCurrentUserId(): string | null {
  const user = getCurrentUser();
  return user?.id ?? null;
}

/**
 * Check if current user is a superuser
 * 
 * @returns true if superuser, false otherwise
 */
export function isCurrentUserSuperUser(): boolean {
  const user = getCurrentUser();
  return user?.is_superuser ?? false;
}

/**
 * Check if current user is an admin (role_id === 1 or superuser)
 * 
 * @returns true if admin, false otherwise
 */
export function isCurrentUserAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role_id === 1 || user?.is_superuser || false;
}

/**
 * Get current user's email
 * 
 * @returns Email or null if not available
 */
export function getCurrentUserEmail(): string | null {
  const user = getCurrentUser();
  return user?.email ?? null;
}

/**
 * Check if user is authenticated
 * 
 * @returns true if user exists and is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // Check Redux store first
    const store = getStore();
    if (store) {
      const state = store.getState();
      if (state.auth?.isAuthenticated && state.auth?.user) {
        return true;
      }
    }

    // Check if we have a user in any storage
    const user = getCurrentUser();
    const token = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
    
    return !!(user && token);
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Get access token
 * 
 * @returns Access token or null
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try Redux store first
    const store = getStore();
    if (store) {
      const state = store.getState();
      if (state.auth?.token) {
        return state.auth.token;
      }
    }

    // Fallback to localStorage
    return localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

/**
 * Get refresh token
 * 
 * @returns Refresh token or null
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
}

/**
 * Get user's privileges
 * 
 * @returns Array of privilege names
 */
export function getCurrentUserPrivileges(): string[] {
  const user = getCurrentUser();
  return user?.privileges ?? [];
}

/**
 * Get user's accessible modules
 * 
 * @returns Array of module IDs
 */
export function getCurrentUserModules(): number[] {
  const user = getCurrentUser();
  return user?.module_access ?? [];
}

/**
 * Get user's accessible routes
 * 
 * @returns Array of route paths
 */
export function getCurrentUserRoutes(): string[] {
  const user = getCurrentUser();
  return user?.accessible_routes ?? [];
}

/**
 * Get user's assigned customers
 * 
 * @returns Array of customer IDs
 */
export function getCurrentUserCustomers(): number[] {
  const user = getCurrentUser();
  return user?.assigned_customers ?? [];
}

/**
 * Check if user has a specific privilege
 * 
 * @param privilege - Privilege name to check
 * @returns true if user has the privilege
 */
export function hasPrivilege(privilege: string): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  if (user.is_superuser) return true;
  return user.privileges?.includes(privilege) ?? false;
}

/**
 * Check if user can access a specific module
 * 
 * @param moduleId - Module ID to check
 * @returns true if user has access to the module
 */
export function canAccessModule(moduleId: number): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  if (user.is_superuser) return true;
  return user.module_access?.includes(moduleId) ?? false;
}

/**
 * Check if user is a mock user (for testing)
 * 
 * @returns true if user is a mock user
 */
export function isMockUser(): boolean {
  const email = getCurrentUserEmail();
  return email === 'admin@company.com' || email === 'user@company.com';
}

/**
 * Debug helper to log current auth state
 */
export function debugAuthState(): void {
  console.group('🔐 Auth State Debug');
  const store = getStore();
  console.log('Redux State:', store?.getState().auth);
  console.log('Current User:', getCurrentUser());
  console.log('Is Authenticated:', isAuthenticated());
  console.log('User Role ID:', getCurrentUserRoleId());
  console.log('Is Superuser:', isCurrentUserSuperUser());
  console.log('Is Admin:', isCurrentUserAdmin());
  console.log('Has Token:', !!getAccessToken());
  console.groupEnd();
}

