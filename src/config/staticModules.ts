export interface StaticModule {
  id: number;
  name: string;
  description: string;
  routes: string[];
  privileges: string[];
  icon?: string;
  color?: string;
  group?: string;
  adminOnly?: boolean;
  userOnly?: boolean;
}

export const staticModules: Record<number, StaticModule> = {
  // Module 10: Role Management
  10: {
    id: 10,
    name: "Role Management",
    description: "Manage system roles and role configurations",
    routes: ["/role-management"],
    privileges: ["CREATE_ROLE", "VIEW_ROLE_LIST", "VIEW_ROLE", "UPDATE_ROLE", "DELETE_ROLE"],
    icon: "shield-check",
    color: "blue",
    group: "admin",
    adminOnly: true
  },
  
  // Module 20: Privilege Management
  20: {
    id: 20,
    name: "Privilege Management",
    description: "Manage system privileges and permissions",
    routes: ["/privilege-management"],
    privileges: ["VIEW_PRIVILEGE_LIST"],
    icon: "key",
    color: "purple",
    group: "admin",
    adminOnly: true
  },
  
  // Module 30: Role Permission Management
  30: {
    id: 30,
    name: "Role Permission Management",
    description: "Manage role-permission assignments and configurations",
    routes: ["/role-permission-management"],
    privileges: ["CREATE_ROLE_PERMISSION", "VIEW_ROLE_PERMISSION_LIST"],
    icon: "link",
    color: "indigo",
    group: "admin",
    adminOnly: true
  },
  
  // Module 40: User Management
  40: {
    id: 40,
    name: "User Management",
    description: "Manage users, user profiles, and user operations",
    routes: ["/user-management"],
    privileges: ["VIEW_USER_LIST", "CREATE_USER", "VIEW_USER", "VIEW_USER_SHORT_INFO_LIST", "UPDATE_USER", "DELETE_USER", "UPDATE_USER_PASSWORD", "UPDATE_USER_STATUS"],
    icon: "users",
    color: "green",
    group: "admin",
    adminOnly: true
  },
  
  // Module 50: Container Management (Master Data)
  50: {
    id: 50,
    name: "Container Management",
    description: "Manage container types, thresholds, and planning",
    routes: ["/container-types", "/container-thresholds", "/container-priority", "/container-planning"],
    privileges: [
      "VIEW_CONTAINER_TYPES", "CREATE_CONTAINER_TYPE", "UPDATE_CONTAINER_TYPE", "DELETE_CONTAINER_TYPE",
      "VIEW_CONTAINER_THRESHOLDS", "CREATE_THRESHOLD", "UPDATE_THRESHOLD", "DELETE_THRESHOLD",
      "VIEW_CONTAINER_PRIORITY", "CREATE_PRIORITY", "UPDATE_PRIORITY", "DELETE_PRIORITY",
      "VIEW_CONTAINER_PLANNING", "CREATE_PLAN", "UPDATE_PLAN", "DELETE_PLAN"
    ],
    icon: "box",
    color: "orange",
    group: "master-data"
  },
  
  // Module 60: Port & Customer Management
  60: {
    id: 60,
    name: "Port & Customer Management",
    description: "Manage ports, customers, and port-customer relationships",
    routes: ["/port-customer-master", "/port-customer-master/customers", "/port-customer-master/pol-ports", "/port-customer-master/pod-ports"],
    privileges: [
      "VIEW_PORT_CUSTOMER_MASTER", "VIEW_POL_PORTS", "VIEW_POD_PORTS", "VIEW_CUSTOMERS",
      "CREATE_PORT", "UPDATE_PORT", "DELETE_PORT", "CREATE_CUSTOMER", "UPDATE_CUSTOMER", "DELETE_CUSTOMER",
      "EXPORT_CUSTOMERS", "EXPORT_POL_PORTS", "EXPORT_POD_PORTS"
    ],
    icon: "building-office",
    color: "teal",
    group: "master-data"
  },

  // Module 65: Company Management
  65: {
    id: 65,
    name: "Company Management",
    description: "Manage companies, company types, and company relationships",
    routes: ["/company-management"],
    privileges: [
      "VIEW_COMPANIES", "CREATE_COMPANY", "VIEW_COMPANY", "UPDATE_COMPANY", "DELETE_COMPANY",
      "EXPORT_COMPANIES", "VIEW_COMPANY_TYPES", "MANAGE_COMPANY_RELATIONSHIPS"
    ],
    icon: "building-office-2",
    color: "indigo",
    group: "master-data"
  },

  // Module 66: Company Customer Mappings
  66: {
    id: 66,
    name: "Company Customer Mappings",
    description: "Manage mappings between companies and customers",
    routes: ["/company-customer-mappings"],
    privileges: [
      "VIEW_COMPANY_CUSTOMER_MAPPINGS", "CREATE_COMPANY_CUSTOMER_MAPPING", "VIEW_COMPANY_CUSTOMER_MAPPING",
      "UPDATE_COMPANY_CUSTOMER_MAPPING", "DELETE_COMPANY_CUSTOMER_MAPPING", "EXPORT_COMPANY_CUSTOMER_MAPPINGS"
    ],
    icon: "link",
    color: "violet",
    group: "master-data"
  },

  // Module 68: Carrier Management
  68: {
    id: 68,
    name: "Carrier Management",
    description: "Manage carriers, carrier codes, and transportation modes",
    routes: ["/carrier-management"],
    privileges: [
      "VIEW_CARRIERS", "CREATE_CARRIER", "VIEW_CARRIER", "UPDATE_CARRIER", "DELETE_CARRIER",
      "EXPORT_CARRIERS"
    ],
    icon: "truck",
    color: "cyan",
    group: "master-data"
  },
  
  // Module 69: Supplier Management
  69: {
    id: 69,
    name: "Supplier Management",
    description: "Manage suppliers, supplier codes, and supplier information",
    routes: ["/supplier-management"],
    privileges: [
      "VIEW_SUPPLIERS", "CREATE_SUPPLIER", "VIEW_SUPPLIER", "UPDATE_SUPPLIER", "DELETE_SUPPLIER",
      "EXPORT_SUPPLIERS"
    ],
    icon: "shopping-bag",
    color: "green",
    group: "master-data"
  },
  
  // Module 70: Shipment Operations
  70: {
    id: 70,
    name: "Shipment Operations",
    description: "Manage shipment uploads, processing, and operations",
    routes: ["/shipment-upload", "/shipment-operations", "/shipment-operations/uploads-history"],
    privileges: [
      "VIEW_SHIPMENT_UPLOAD", "CREATE_SHIPMENT", "UPDATE_SHIPMENT", "DELETE_SHIPMENT",
      "VIEW_SHIPMENT_HISTORY", "VIEW_UPLOADS_HISTORY", "VIEW_INPUT_FILE", "VIEW_OUTPUT_FILE",
      "UPLOAD_SHIPMENT_FILE", "PROCESS_SHIPMENT", "EXPORT_SHIPMENT_DATA"
    ],
    icon: "truck",
    color: "red",
    group: "shipment"
  },
  
  // Module 75: Shipment Order Management
  75: {
    id: 75,
    name: "Shipment Order Management",
    description: "Manage vendor booking shipment orders and container assignments",
    routes: ["/shipment-orders"],
    privileges: [
      "VIEW_SHIPMENT_ORDERS", "CREATE_SHIPMENT_ORDER", "VIEW_SHIPMENT_ORDER", "UPDATE_SHIPMENT_ORDER",
      "DELETE_SHIPMENT_ORDER", "ASSIGN_CONTAINER", "UPDATE_SHIPMENT_STATUS", "EXPORT_SHIPMENT_ORDERS"
    ],
    icon: "clipboard-document-list",
    color: "purple",
    group: "shipment"
  },
  
  // Module 80: Analytics & Reports
  80: {
    id: 80,
    name: "Analytics & Reports",
    description: "View analytics, validation results, and generate reports",
    routes: ["/assignment-results", "/validation-summary"],
    privileges: [
      "VIEW_ASSIGNMENT_RESULTS", "VIEW_VALIDATION_SUMMARY", "VIEW_REPOSITIONING_SUMMARY",
      "VIEW_TEST_VALIDATION", "EXPORT_ASSIGNMENT_DATA", "EXPORT_VALIDATION_DATA",
      "EXPORT_REPOSITIONING_DATA", "RUN_TEST_VALIDATION"
    ],
    icon: "chart-bar",
    color: "yellow",
    group: "shipment"
  },
  
  // Module 90: System Administration
  90: {
    id: 90,
    name: "System Administration",
    description: "System settings, data backup, and administrative tasks",
    routes: ["/system-admin"],
    privileges: [
      "VIEW_SYSTEM_SETTINGS", "UPDATE_SYSTEM_SETTINGS", "DELETE_SYSTEM_SETTINGS",
      "VIEW_DATA_BACKUP", "CREATE_DATA_BACKUP", "RESTORE_DATA_BACKUP", "DELETE_DATA_BACKUP"
    ],
    icon: "cog",
    color: "gray",
    group: "admin",
    adminOnly: true
  },
  
  // Module 100: Dashboard
  100: {
    id: 100,
    name: "Dashboard",
    description: "Main dashboard and overview",
    routes: ["/dashboard"],
    privileges: ["VIEW_DASHBOARD", "VIEW_USER_DASHBOARD", "VIEW_ADMIN_DASHBOARD"],
    icon: "home",
    color: "blue",
    group: "main"
  }
};

// Export modules as an array for easier iteration
export const staticModulesArray = Object.values(staticModules);

// Export modules as an object with modules property for backward compatibility
export const staticModuleDefinitions = {
  modules: staticModules
};

export default staticModules;
