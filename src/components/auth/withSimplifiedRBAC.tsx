"use client";

import React, { ComponentType, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, AuthContextType } from '@/context/AuthContext';
import { staticModuleDefinitions } from '@/config/staticModules';

export interface SimplifiedRBACOptions {
  privilege?: string;
  route?: string;
  module?: number[];
  role?: string[];
  allowSuperUserBypass?: boolean;
  redirectTo?: string;
  fallbackComponent?: ComponentType;
  requireAuthentication?: boolean;
}

export interface SimplifiedRBACProps {
  rbacContext?: AuthContextType;
}

// Higher-order component for simplified RBAC
export function withSimplifiedRBAC<P extends object>(
  WrappedComponent: ComponentType<P & SimplifiedRBACProps>,
  options: SimplifiedRBACOptions = {}
) {
  const {
    privilege,
    route,
    module = [],
    role = [],
    allowSuperUserBypass = true,
    redirectTo = '/signin',
    fallbackComponent: FallbackComponent,
    requireAuthentication = true
  } = options;

  const WithSimplifiedRBACComponent = (props: P) => {
    const router = useRouter();
    const rbacContext = useAuth();
    const { user, loading, error, can, canVisit, canAccessModule, canAccessAnyModule, hasRole, hasAnyRole, isAdmin } = rbacContext;

    useEffect(() => {
      // Handle authentication requirement
      if (requireAuthentication && !loading && !user) {
        router.push(redirectTo);
        return;
      }

      // Handle role-based access - if user has required role, allow access regardless of privilege/module
      if (role.length > 0 && user && !loading && hasAnyRole) {
        const hasRequiredRole = hasAnyRole(role) || (allowSuperUserBypass && user.is_superuser);
        if (hasRequiredRole) {
          return; // Allow access if user has required role
        }
      }

      // Only check privilege/module/route if user doesn't have required role
      if (role.length === 0 || !hasAnyRole(role)) {
        // Handle privilege-based access
        if (privilege && user && !loading) {
          const hasRequiredPrivilege = can(privilege) || (allowSuperUserBypass && user.is_superuser);
          if (!hasRequiredPrivilege) {
            return;
          }
        }

        // Handle route-based access
        if (route && user && !loading) {
          const hasRequiredRouteAccess = canVisit(route) || (allowSuperUserBypass && user.is_superuser);
          if (!hasRequiredRouteAccess) {
            return;
          }
        }

        // Handle module-based access
        if (module.length > 0 && user && !loading) {
          const hasRequiredModuleAccess = canAccessAnyModule(module) || (allowSuperUserBypass && user.is_superuser);
          if (!hasRequiredModuleAccess) {
            return;
          }
        }
      }
    }, [user, loading, privilege, route, module, role, allowSuperUserBypass, redirectTo, requireAuthentication, router, can, canVisit, canAccessAnyModule, hasAnyRole]);


    // Show loading state
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading permissions...</p>
          </div>
        </div>
      );
    }

    // Show error state
    if (error) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      );
    }

    // Check access permissions and return detailed access info
    const getAccessInfo = () => {
      
      // If authentication is required and user is not authenticated, don't show access denied
      // The useEffect above should handle the redirect
      if (requireAuthentication && !user) return { hasAccess: false, reason: 'authentication_required' };
      
      // If no authentication required, allow access
      if (!requireAuthentication) return { hasAccess: true, reason: null };
      
      if (allowSuperUserBypass && user?.is_superuser) return { hasAccess: true, reason: null };

      // Check role
      if (role.length > 0 && !hasAnyRole(role)) {
        return { 
          hasAccess: false, 
          reason: 'role_required', 
          requiredRole: role.join(' or '),
          currentRole: user?.role_name || 'Unknown'
        };
      }

      // Check privilege
      if (privilege && !can(privilege)) {
        return { 
          hasAccess: false, 
          reason: 'privilege_required', 
          requiredPrivilege: privilege,
          userPrivileges: user?.privileges || []
        };
      }

      // Check route
      if (route && !canVisit(route)) {
        return { 
          hasAccess: false, 
          reason: 'route_required', 
          requiredRoute: route,
          userRoutes: user?.accessible_routes || []
        };
      }

      // Check module access
      if (module.length > 0 && !canAccessAnyModule(module)) {
        const moduleNames = module.map(id => {
          const moduleDef = staticModuleDefinitions.modules[id];
          return moduleDef ? moduleDef.name : `Module ${id}`;
        });
        return { 
          hasAccess: false, 
          reason: 'module_required', 
          requiredModules: moduleNames.join(' or '),
          requiredModuleIds: module,
          userModules: user?.module_access || []
        };
      }

      return { hasAccess: true, reason: null };
    };

    // Get access information
    const accessInfo = getAccessInfo();
    
    // Show fallback component if access is denied
    if (!accessInfo.hasAccess) {
      // If user is not authenticated and authentication is required, show loading while redirecting
      if (accessInfo.reason === 'authentication_required') {
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Redirecting to signin...</p>
            </div>
          </div>
        );
      }
      
      if (FallbackComponent) {
        return <FallbackComponent />;
      }
      
      // Render detailed access denied message based on the reason
      const renderAccessDeniedMessage = () => {
        switch (accessInfo.reason) {
          case 'privilege_required':
            return (
              <div className="text-center max-w-md mx-auto">
                <div className="text-yellow-600 dark:text-yellow-400 mb-4">
                  <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Denied</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You don't have the required privilege to access this page.
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Required Privilege:</strong> <code className="bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded text-xs">{accessInfo.requiredPrivilege}</code>
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                    <strong>Your Privileges:</strong> {accessInfo.userPrivileges && accessInfo.userPrivileges.length > 0 ? accessInfo.userPrivileges.join(', ') : 'None'}
                  </p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Contact your administrator to request the required privilege.
                </p>
              </div>
            );
            
          case 'role_required':
            return (
              <div className="text-center max-w-md mx-auto">
                <div className="text-yellow-600 dark:text-yellow-400 mb-4">
                  <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Denied</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You don't have the required role to access this page.
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Required Role:</strong> {accessInfo.requiredRole}
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                    <strong>Your Role:</strong> {accessInfo.currentRole}
                  </p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Contact your administrator to request the required role.
                </p>
              </div>
            );
            
          case 'module_required':
            return (
              <div className="text-center max-w-md mx-auto">
                <div className="text-yellow-600 dark:text-yellow-400 mb-4">
                  <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Denied</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You don't have access to the required module.
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Required Module:</strong> {accessInfo.requiredModules}
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                    <strong>Your Modules:</strong> {accessInfo.userModules && accessInfo.userModules.length > 0 ? accessInfo.userModules.join(', ') : 'None'}
                  </p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Contact your administrator to request access to the required module.
                </p>
              </div>
            );
            
          case 'route_required':
            return (
              <div className="text-center max-w-md mx-auto">
                <div className="text-yellow-600 dark:text-yellow-400 mb-4">
                  <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Denied</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You don't have access to this route.
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Required Route:</strong> <code className="bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded text-xs">{accessInfo.requiredRoute}</code>
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                    <strong>Your Routes:</strong> {accessInfo.userRoutes && accessInfo.userRoutes.length > 0 ? accessInfo.userRoutes.join(', ') : 'None'}
                  </p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Contact your administrator to request access to this route.
                </p>
              </div>
            );
            
          default:
            return (
              <div className="text-center">
                <div className="text-yellow-600 dark:text-yellow-400 mb-4">
                  <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Denied</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  You don't have permission to access this page.
                </p>
              </div>
            );
        }
      };
      
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          {renderAccessDeniedMessage()}
        </div>
      );
    }

    // Render the wrapped component with RBAC context
    return <WrappedComponent {...props} rbacContext={rbacContext} />;
  };

  // Set display name for debugging
  WithSimplifiedRBACComponent.displayName = `withSimplifiedRBAC(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithSimplifiedRBACComponent;
}

// Convenience HOCs for specific access types
export const withRouteAccess = <P extends object>(
  Component: ComponentType<P & SimplifiedRBACProps>,
  route: string,
  options: Omit<SimplifiedRBACOptions, 'route'> = {}
) => withSimplifiedRBAC(Component, { ...options, route });

export const withPrivilege = <P extends object>(
  Component: ComponentType<P & SimplifiedRBACProps>,
  privilege: string,
  options: Omit<SimplifiedRBACOptions, 'privilege'> = {}
) => withSimplifiedRBAC(Component, { ...options, privilege });

export const withRoleAccess = <P extends object>(
  Component: ComponentType<P & SimplifiedRBACProps>,
  roles: string[],
  options: Omit<SimplifiedRBACOptions, 'role'> = {}
) => withSimplifiedRBAC(Component, { ...options, role: roles });

export const withModuleAccess = <P extends object>(
  Component: ComponentType<P & SimplifiedRBACProps>,
  modules: number[],
  options: Omit<SimplifiedRBACOptions, 'module'> = {}
) => withSimplifiedRBAC(Component, { ...options, module: modules });

// Types are already exported above
