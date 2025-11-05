export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: number; // Changed to number to support multiple role IDs
  roleName: string; // Added role name for display
  status: "active" | "inactive" | "pending";
  lastLogin: string;
  createdAt: string;
  organisation_name?: string;
  permissions: string[];
  accessControl: string[]; // Array of allowed routes
  is_superuser?: boolean; // Added superuser flag
  role_data?: Array<{
    id: number;
    role_name: string;
  }>; // Added role data array to match API
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  role: number;
  roleName?: string;
  status: "active" | "inactive" | "pending";
  organisation_name?: string;
  password: string;
  accessControl?: string[];
  is_superuser?: boolean;
  role_data?: Array<{
    id: number;
    role_name: string;
  }>;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: number;
  roleName?: string;
  status?: "active" | "inactive" | "pending";
  organisation_name?: string;
  accessControl?: string[];
  is_superuser?: boolean;
  role_data?: Array<{
    id: number;
    role_name: string;
  }>;
}

// Route definitions for access control
export const AVAILABLE_ROUTES = {
  // Admin routes
  "admin/dashboard": "Admin Dashboard",
  "admin/user-management": "User Management",
  "admin/container-types": "Container Type Master",
  "admin/container-priority": "Priority Configuration",
  "admin/container-thresholds": "Threshold Configuration",
  "admin/port-customer-master": "Port & Customer Master",
  "admin/port-customer-master/pol-ports": "POL Master",
  "admin/port-customer-master/pod-ports": "POD Master",
  "admin/port-customer-master/customers": "Customer Records",
  "admin/shipment-upload": "Shipment Upload",
  "admin/container-planning": "Container Planning",
  "admin/assignment-results": "Assignment Results",
  "admin/repositioning-summary": "Repositioning Summary",
  "admin/validation-summary": "Validation Summary",
  "admin/test-validation": "Test Validation",
  "admin/data-backup": "Data Backup",
  "admin/system-settings": "System Settings",
  "admin/shipment-operations/uploads-history": "Uploads History",
  "admin/shipment-operations/shipment-history": "Shipment History",
  
  // User routes
  "user/dashboard": "User Dashboard",
  "user/shipment-upload": "Shipment Upload",
  "user/view-history": "View History",
  "user/shipment-history": "Shipment History",
  "user/container-planning": "Container Planning",
  "user/assignment-results": "Assignment Results",
  "user/validation-summary": "Validation Summary",
  "user/test-validation": "Test Validation",
  "user/repositioning-summary": "Repositioning Summary",
  "user/data-backup": "Data Backup",
  "user/test": "Test Page",
  "user/input-file": "Input File Viewer",
  "user/output-file": "Output File Viewer",
  
  // Public/Shared routes
  "": "Home Page",
  "signin": "Sign In",
  "signup": "Sign Up",
  "error-404": "Error 404",
} as const;

export type RouteKey = keyof typeof AVAILABLE_ROUTES;

// Default access control for roles
export const DEFAULT_ROLE_ACCESS = {
  admin: [
    // Admin-specific routes
    "admin/dashboard",
    "admin/user-management",
    "admin/container-types",
    "admin/container-priority",
    "admin/container-thresholds",
    "admin/port-customer-master",
    "admin/port-customer-master/pol-ports",
    "admin/port-customer-master/pod-ports",
    "admin/port-customer-master/customers",
    "admin/shipment-upload",
    "admin/container-planning",
    "admin/assignment-results",
    "admin/repositioning-summary",
    "admin/validation-summary",
    "admin/test-validation",
    "admin/data-backup",
    "admin/system-settings",
    "admin/shipment-operations/uploads-history",
    "admin/shipment-operations/shipment-history",
    
    // User routes (admins can access user functionality)
    "user/dashboard",
    "user/shipment-upload",
    "user/view-history",
    "user/shipment-history",
    "user/container-planning",
    "user/assignment-results",
    "user/validation-summary",
    "user/test-validation",
    "user/repositioning-summary",
    "user/data-backup",
    "user/test",
    "user/input-file",
    "user/output-file",
    
    // Public routes
    "",
    "signin",
    "signup",
    "error-404",
  ] as string[],
  user: [
    // User-specific routes
    "user/dashboard",
    "user/shipment-upload",
    "user/view-history",
    "user/shipment-history",
    "user/container-planning",
    "user/assignment-results",
    "user/validation-summary",
    "user/test-validation",
    "user/repositioning-summary",
    "user/data-backup",
    "user/test",
    "user/input-file",
    "user/output-file",
    
    // Public routes
    "",
    "signin",
    "signup",
    "error-404",
  ] as string[],
}; 