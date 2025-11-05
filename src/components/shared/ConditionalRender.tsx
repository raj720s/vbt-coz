"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';

interface ConditionalRenderProps {
  privilege?: string;
  module?: number | number[];
  role?: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  allowSuperUserBypass?: boolean;
}

/**
 * ConditionalRender component for privilege-based conditional rendering
 * Uses the simplified RBAC system to conditionally render content based on user permissions
 */
export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  privilege,
  module,
  role,
  children,
  fallback = null,
  allowSuperUserBypass = true
}) => {
  const { can, canAccessModule, canAccessAnyModule, hasAnyRole, isSuperUser, loading } = useAuth();

  // Show loading state while permissions are being loaded
  if (loading) {
    return null;
  }

  // Check if user has required privilege
  if (privilege && !can(privilege) && !(allowSuperUserBypass && isSuperUser)) {
    return <>{fallback}</>;
  }

  // Check if user has required module access
  if (module) {
    const moduleIds = Array.isArray(module) ? module : [module];
    const hasModuleAccess = canAccessAnyModule(moduleIds) || (allowSuperUserBypass && isSuperUser);
    if (!hasModuleAccess) {
      return <>{fallback}</>;
    }
  }

  // Check if user has required role
  if (role) {
    const hasRequiredRole = hasAnyRole(role) || (allowSuperUserBypass && isSuperUser);
    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // If all checks pass, render children
  return <>{children}</>;
};

export default ConditionalRender;
