import { AVAILABLE_ROUTES, DEFAULT_ROLE_ACCESS, RouteKey } from "@/types/user";

/**
 * Check if a user has access to a specific route
 */
export function hasRouteAccess(userAccessControl: string[], route: string): boolean {
  return userAccessControl.includes(route);
}

/**
 * Get all available routes for a specific role
 */
export function getDefaultRoutesForRole(role: "admin" | "user"): string[] {
  return DEFAULT_ROLE_ACCESS[role];
}

/**
 * Get all available routes
 */
export function getAllAvailableRoutes(): RouteKey[] {
  return Object.keys(AVAILABLE_ROUTES) as RouteKey[];
}

/**
 * Get route display name
 */
export function getRouteDisplayName(route: RouteKey): string {
  return AVAILABLE_ROUTES[route];
}

/**
 * Filter routes by prefix (admin/ or user/)
 */
export function filterRoutesByPrefix(routes: RouteKey[], prefix: string): RouteKey[] {
  return routes.filter(route => route.startsWith(prefix));
}

/**
 * Validate if a route exists in available routes
 */
export function isValidRoute(route: string): route is RouteKey {
  return route in AVAILABLE_ROUTES;
}

/**
 * Get routes grouped by admin and user
 */
export function getGroupedRoutes() {
  const allRoutes = getAllAvailableRoutes();
  return {
    admin: filterRoutesByPrefix(allRoutes, "admin/"),
    user: filterRoutesByPrefix(allRoutes, "user/"),
    public: allRoutes.filter(route => !route.startsWith("admin/") && !route.startsWith("user/")),
  };
}

/**
 * Check if user has any admin routes access
 */
export function hasAdminAccess(userAccessControl: string[]): boolean {
  return userAccessControl.some(route => route.startsWith("admin/"));
}

/**
 * Check if user has any user routes access
 */
export function hasUserAccess(userAccessControl: string[]): boolean {
  return userAccessControl.some(route => route.startsWith("user/"));
}

/**
 * Get accessible routes for a user
 */
export function getUserAccessibleRoutes(userAccessControl: string[]): {
  adminRoutes: string[];
  userRoutes: string[];
  publicRoutes: string[];
} {
  return {
    adminRoutes: userAccessControl.filter(route => route.startsWith("admin/")),
    userRoutes: userAccessControl.filter(route => route.startsWith("user/")),
    publicRoutes: userAccessControl.filter(route => !route.startsWith("admin/") && !route.startsWith("user/")),
  };
}

/**
 * Check if a route is public (no authentication required)
 */
export function isPublicRoute(route: string): boolean {
  const publicRoutes = ["", "signin", "signup", "error-404"];
  return publicRoutes.includes(route);
}

/**
 * Check if a route requires admin role
 */
export function isAdminRoute(route: string): boolean {
  return route.startsWith("admin/");
}

/**
 * Check if user is admin based on is_superuser flag
 */
export function isUserAdmin(isSuperuser: boolean): boolean {
  return isSuperuser === true;
}

/**
 * Check if user has admin access based on role array
 */
export function hasAdminRoleAccess(userRoles: Array<{ id: number; role_name: string }>): boolean {
  return userRoles.some(role => 
    role.role_name.toLowerCase() === 'admin' || 
    role.role_name.toLowerCase() === 'administrator'
  );
}

/**
 * Check if a route requires user role
 */
export function isUserRoute(route: string): boolean {
  return route.startsWith("user/");
}

/**
 * Get required role for a specific route
 */
export function getRequiredRoleForRoute(route: string): "admin" | "user" | "public" {
  if (isPublicRoute(route)) return "public";
  if (isAdminRoute(route)) return "admin";
  if (isUserRoute(route)) return "user";
  return "public";
}

/**
 * Validate user access to a specific route based on role and access control
 */
export function validateRouteAccess(
  userRole: "admin" | "user",
  userAccessControl: string[],
  route: string
): { hasAccess: boolean; reason?: string } {
  // Public routes are accessible to everyone
  if (isPublicRoute(route)) {
    return { hasAccess: true };
  }

  // Check if user has explicit access to the route
  if (userAccessControl.includes(route)) {
    return { hasAccess: true };
  }

  // Check role-based access
  if (isAdminRoute(route) && userRole === "admin") {
    return { hasAccess: true };
  }

  if (isUserRoute(route) && userRole === "user") {
    return { hasAccess: true };
  }

  // Admins can access user routes by default
  if (isUserRoute(route) && userRole === "admin") {
    return { hasAccess: true };
  }

  // User trying to access admin route
  if (isAdminRoute(route) && userRole === "user") {
    return { 
      hasAccess: false, 
      reason: "Insufficient permissions. Admin access required." 
    };
  }

  // Route not found in access control
  return { 
    hasAccess: false, 
    reason: "Route not found in user's access control list." 
  };
}

/**
 * Get all routes that a user can access based on their role and access control
 */
export function getAccessibleRoutesForUser(
  userRole: "admin" | "user",
  userAccessControl: string[]
): RouteKey[] {
  const allRoutes = getAllAvailableRoutes();
  const accessibleRoutes: RouteKey[] = [];

  for (const route of allRoutes) {
    const validation = validateRouteAccess(userRole, userAccessControl, route);
    if (validation.hasAccess) {
      accessibleRoutes.push(route);
    }
  }

  return accessibleRoutes;
}

/**
 * Check if user can access multiple routes
 */
export function canAccessRoutes(
  userRole: "admin" | "user",
  userAccessControl: string[],
  routes: string[]
): { canAccess: boolean; inaccessibleRoutes: string[]; reasons: Record<string, string> } {
  const inaccessibleRoutes: string[] = [];
  const reasons: Record<string, string> = {};

  for (const route of routes) {
    const validation = validateRouteAccess(userRole, userAccessControl, route);
    if (!validation.hasAccess) {
      inaccessibleRoutes.push(route);
      if (validation.reason) {
        reasons[route] = validation.reason;
      }
    }
  }

  return {
    canAccess: inaccessibleRoutes.length === 0,
    inaccessibleRoutes,
    reasons
  };
}

/**
 * Generate access control list for a new user based on role
 */
export function generateAccessControlForRole(role: "admin" | "user"): string[] {
  return DEFAULT_ROLE_ACCESS[role];
}

/**
 * Add route access to user's access control
 */
export function addRouteAccess(
  currentAccessControl: string[],
  route: string
): string[] {
  if (!currentAccessControl.includes(route) && isValidRoute(route)) {
    return [...currentAccessControl, route];
  }
  return currentAccessControl;
}

/**
 * Remove route access from user's access control
 */
export function removeRouteAccess(
  currentAccessControl: string[],
  route: string
): string[] {
  return currentAccessControl.filter(r => r !== route);
}

/**
 * Check if user has access to any routes in a category
 */
export function hasCategoryAccess(
  userAccessControl: string[],
  category: "admin" | "user" | "public"
): boolean {
  switch (category) {
    case "admin":
      return hasAdminAccess(userAccessControl);
    case "user":
      return hasUserAccess(userAccessControl);
    case "public":
      return true; // Public routes are always accessible
    default:
      return false;
  }
} 