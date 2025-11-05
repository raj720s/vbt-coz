"use client";

import React, { createContext, useContext, useEffect, useCallback, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { 
  loginUser, 
  fetchUserProfile, 
  fetchUserPrivileges,
  logoutAction,
  setAuthSuccess,
  setInitialized,
  setContextAvailable,
  assignCustomersToUser as assignCustomersAction,
  removeCustomersFromUser as removeCustomersAction,
  selectAuth,
  selectUser,
  selectToken,
  selectIsAuthenticated,
  selectIsInitialized,
  selectContextAvailable,
  selectAuthLoading,
  selectAuthErrors,
  selectUserRole,
  selectPermissions,
  selectRoutes,
  selectModules,
  selectIsSuperUser,
  selectAssignedCustomers,
  User,
} from "@/store/slices/authSlice";
import { authService } from "@/services/authService";
import { tokenAutoRefreshService } from "@/services/tokenAutoRefreshService";
import { staticModules } from "@/config/staticModules";

export type UserRole = "admin" | "user";

// Re-export User type from auth slice
export type { User };

export interface AuthContextType {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  contextAvailable: boolean;
  loading: boolean;
  profileLoading: boolean;
  privilegesLoading: boolean;
  error: string | null;
  profileError: string | null;
  privilegesError: string | null;
  isLoginAttempt: boolean;

  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUserProfile: () => Promise<void>;
  refreshUserPrivileges: (roleId?: number, currentUser?: User | null) => Promise<void>;

  // RBAC functionality
  userRole: number | undefined;
  permissions: string[];
  routes: string[];
  modules: number[];
  isSuperUser: boolean;
  can: (action: string) => boolean;
  canVisit: (route: string) => boolean;
  canAccessModule: (moduleId: number) => boolean;
  canAccessAnyModule: (moduleIds: number[]) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string | string[]) => boolean;
  isAdmin: () => boolean;
  canAccessCustomer: (customerId: number) => boolean;
  getAssignedCustomers: () => number[];
  assignCustomersToUser: (customerIds: number[]) => void;
  removeCustomersFromUser: (customerIds: number[]) => void;
  getUnifiedRoute: (route: string) => string;
  canAccessRoute: (route: string) => boolean;
  redirectToAppropriateDashboard: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Optimized localStorage operations with error handling (kept as fallback)
class StorageManager {
  private static readonly USER_KEY = "auth_user_fallback";
  private static readonly TOKEN_KEY = "auth_token";

  static saveUser(user: User): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user to localStorage:', error);
    }
  }

  static getUser(): User | null {
    try {
      const storedUser = localStorage.getItem(this.USER_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Failed to retrieve user from localStorage:', error);
      this.clearUser(); // Clear corrupted data
      return null;
    }
  }

  static clearUser(): void {
    try {
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.error('Failed to clear user from localStorage:', error);
    }
  }

  static getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Failed to retrieve token from localStorage:', error);
      return null;
    }
  }

  static clearAll(): void {
    try {
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem("refresh_token");
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Redux state and dispatch
  const dispatch = useAppDispatch();
  const state = useAppSelector(selectAuth);
  const user = useAppSelector(selectUser);
  const token = useAppSelector(selectToken);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isInitialized = useAppSelector(selectIsInitialized);
  const contextAvailable = useAppSelector(selectContextAvailable);
  const loading = useAppSelector(selectAuthLoading);
  const errors = useAppSelector(selectAuthErrors);
  
  const initializationRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const [isLoginAttempt, setIsLoginAttempt] = useState(false);

  // Memoized RBAC properties
  const rbacData = useMemo(() => ({
    userRole: user?.role_id,
    permissions: user?.privileges || [],
    routes: user?.accessible_routes || [],
    modules: user?.module_access || [],
    isSuperUser: user?.is_superuser || false,
  }), [user]);

  // Memoized RBAC functions
  const can = useCallback((action: string): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    return user.privileges?.includes(action) || false;
  }, [user]);

  const canVisit = useCallback((route: string): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    return user.accessible_routes?.includes(route) || false;
  }, [user]);

  const canAccessModule = useCallback((moduleId: number): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    return user.module_access?.includes(moduleId) || false;
  }, [user]);

  const canAccessAnyModule = useCallback((moduleIds: number[]): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    return moduleIds.some(moduleId => user?.module_access?.includes(moduleId));
  }, [user]);

  const hasRole = useCallback((role: string): boolean => {
    if (!user) return false;
    return user.role_name?.toLowerCase() === role.toLowerCase();
  }, [user]);

  const hasAnyRole = useCallback((roles: string | string[]): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.some(role => user?.role_name?.toLowerCase() === role.toLowerCase());
  }, [user]);

  const isAdmin = useCallback((): boolean => {
    return user?.role_id === 1 || user?.is_superuser || false;
  }, [user]);

  const canAccessCustomer = useCallback((customerId: number): boolean => {
    if (!user) return false;
    if (user.is_superuser || isAdmin()) return true;
    return true; // Can be enhanced with customer assignment logic
  }, [user, isAdmin]);

  const getAssignedCustomers = useCallback((): number[] => {
    return user?.assigned_customers || [];
  }, [user]);

  const assignCustomersToUser = useCallback((customerIds: number[]): void => {
    if (!user) return;
    dispatch(assignCustomersAction(customerIds));
    // Keep fallback localStorage sync
    const updatedUser = { ...user, assigned_customers: [...new Set([...(user.assigned_customers || []), ...customerIds])] };
    StorageManager.saveUser(updatedUser);
  }, [user, dispatch]);

  const removeCustomersFromUser = useCallback((customerIds: number[]): void => {
    if (!user) return;
    dispatch(removeCustomersAction(customerIds));
    // Keep fallback localStorage sync
    const updatedUser = { ...user, assigned_customers: (user.assigned_customers || []).filter(id => !customerIds.includes(id)) };
    StorageManager.saveUser(updatedUser);
  }, [user, dispatch]);

  const getUnifiedRoute = useCallback((route: string): string => {
    if (route.startsWith('/admin/') || route.startsWith('/user/')) {
      return route.replace(/^\/(admin|user)\//, '/');
    }
    return route;
  }, []);

  const canAccessRoute = useCallback((route: string): boolean => {

    if (!user) return false;
    if (user.is_superuser) return true;

    if (!user.rbac_initialized || !user.accessible_routes || user.accessible_routes.length === 0) {
      const basicRoutes = ['/dashboard', '/profile', '/settings', '/'];
      const unifiedRoute = getUnifiedRoute(route);
      const hasAccess = basicRoutes.includes(unifiedRoute) || basicRoutes.some(basicRoute => unifiedRoute.startsWith(basicRoute));
      return hasAccess;
    }

    const unifiedRoute = getUnifiedRoute(route);
    const hasAccess = user.accessible_routes?.includes(unifiedRoute) || false;
    return hasAccess;
  }, [user, getUnifiedRoute]);

  const redirectToAppropriateDashboard = useCallback((): string => {
    return user ? '/dashboard' : '/signin';
  }, [user]);

  // Optimized refresh functions
  const refreshUserProfile = useCallback(async (): Promise<void> => {
    if (!token) return;

    try {
      const result = await dispatch(fetchUserProfile()).unwrap();
      if (result && user) {
        // Keep fallback localStorage sync
        StorageManager.saveUser(result);
      }
    } catch (error: any) {
      console.error('Failed to refresh user profile:', error);
    }
  }, [token, user, dispatch]);

  const refreshUserPrivileges = useCallback(async (roleId?: number, currentUser?: User | null): Promise<void> => {
    const targetRoleId = roleId || user?.role_id;
    const targetUser = currentUser || user;

    if (!targetRoleId || !targetUser) return;

    try {
      const result = await dispatch(fetchUserPrivileges({ roleId: targetRoleId, user: targetUser })).unwrap();
      if (result && targetUser) {
        // Keep fallback localStorage sync
        const updatedUser = { ...targetUser, ...result };
        StorageManager.saveUser(updatedUser);
      }
    } catch (error: any) {
      console.error('Failed to refresh user privileges:', error);
    }
  }, [user, dispatch]);

  // Optimized login function
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoginAttempt(true);
    try {
      // Dispatch Redux action for login
      const result = await dispatch(loginUser({ email, password })).unwrap();
      
      // Keep fallback localStorage sync
      if (result.user) {
        StorageManager.saveUser(result.user);
      }

      // Start token auto-refresh service
      tokenAutoRefreshService.startAutoRefresh();

      return { success: true };
    } catch (error: any) {
      console.error('Login failed:', error);
      // Extract error message from various possible formats
      const errorMessage = error?.message || 
                          error?.toString() || 
                          "Login failed";
      return { success: false, error: errorMessage };
    } finally {
      setIsLoginAttempt(false);
    }
  }, [dispatch]);

  // Optimized logout function
  const logout = useCallback(() => {
    
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    tokenAutoRefreshService.stopAutoRefresh();
    StorageManager.clearAll();
    
    // Dispatch Redux logout action
    dispatch(logoutAction());
    
  }, [dispatch]);

  // Optimized initialization effect
  useEffect(() => {
    
    // Don't run if unmounted
    if (!mountedRef.current) {
      return;
    }

    if (initializationRef.current) {
      return;
    }
    
    initializationRef.current = true;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const initializeAuth = async () => {
      try {
        // Always check if component is still mounted before state updates
        if (!mountedRef.current) return;

        // Check Redux state first (persisted via redux-persist)
        if (user && token && isAuthenticated) {
          console.log('🔍 AuthContext: Restoring from Redux persisted state');
          
          const hasCompleteRBACData = user.privileges &&
            user.privileges.length > 0 &&
            user.module_access &&
            user.module_access.length > 0 &&
            user.rbac_initialized === true;

          if (!hasCompleteRBACData && user.role_id) {
            try {
              await refreshUserPrivileges(user.role_id, user);
            } catch (privilegeError) {
              console.warn('Failed to fetch privileges during initialization:', privilegeError);
            }
          }

          tokenAutoRefreshService.startAutoRefresh();
        } else {
          // Fallback to localStorage if Redux state is empty
          console.log('🔍 AuthContext: Checking localStorage fallback');
          const storedToken = StorageManager.getToken();
          const userData = StorageManager.getUser();

          if (storedToken && userData) {
            if (!mountedRef.current) return;
            
            console.log('🔍 AuthContext: Restoring from localStorage fallback');
            dispatch(setAuthSuccess({ user: userData, token: storedToken }));

            const hasCompleteRBACData = userData.privileges &&
              userData.privileges.length > 0 &&
              userData.module_access &&
              userData.module_access.length > 0 &&
              userData.rbac_initialized === true;

            if (!hasCompleteRBACData && userData.role_id) {
              try {
                await refreshUserPrivileges(userData.role_id, userData);
              } catch (privilegeError) {
                console.warn('Failed to fetch privileges during initialization:', privilegeError);
              }
            }

            tokenAutoRefreshService.startAutoRefresh();
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mountedRef.current) {
          StorageManager.clearAll();
        }
      } finally {
        if (mountedRef.current) {
          dispatch(setInitialized(true));
          dispatch(setContextAvailable(true));
        }
      }
    };

    initializeAuth();

    return () => {
      abortController.abort();
    };
  }, [user, token, isAuthenticated, dispatch, refreshUserPrivileges]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoized context value
  const contextValue = useMemo<AuthContextType>(() => ({
    // State
    user,
    token,
    isAuthenticated,
    isInitialized,
    contextAvailable,
    loading: loading.auth,
    profileLoading: loading.profile,
    privilegesLoading: loading.privileges,
    error: errors.auth,
    profileError: errors.profile,
    privilegesError: errors.privileges,
    isLoginAttempt,

    // Actions
    login,
    logout,
    refreshUserProfile,
    refreshUserPrivileges,

    // RBAC
    ...rbacData,
    can,
    canVisit,
    canAccessModule,
    canAccessAnyModule,
    hasRole,
    hasAnyRole,
    isAdmin,
    canAccessCustomer,
    getAssignedCustomers,
    assignCustomersToUser,
    removeCustomersFromUser,
    getUnifiedRoute,
    canAccessRoute,
    redirectToAppropriateDashboard,
  }), [
    user,
    token,
    isAuthenticated,
    isInitialized,
    contextAvailable,
    loading,
    errors,
    rbacData,
    login,
    logout,
    refreshUserProfile,
    refreshUserPrivileges,
    can,
    canVisit,
    canAccessModule,
    canAccessAnyModule,
    hasRole,
    hasAnyRole,
    isAdmin,
    canAccessCustomer,
    getAssignedCustomers,
    assignCustomersToUser,
    removeCustomersFromUser,
    getUnifiedRoute,
    canAccessRoute,
    redirectToAppropriateDashboard,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};