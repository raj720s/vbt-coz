"use client";

import { withSimplifiedRBAC } from "@/components/auth/withSimplifiedRBAC";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";

// Removed inline FormModal in favor of dedicated add/edit pages
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import Input from "@/components/form/input/InputField";
import { PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { User } from "@/types/user";

import { userService } from "@/services/userService";
import { UserListResponseV2 } from "@/types/api";
import { roleService, RoleResponse } from "@/services/roleService";

import { staticModuleDefinitions } from "@/config/staticModules";

// AG Grid imports
import type {
  ColDef,
  ICellRendererParams,
  GridReadyEvent,
  IServerSideDatasource,
  IServerSideGetRowsParams,
} from "ag-grid-community";
import { 
  AllCommunityModule, 
  ModuleRegistry,
  CsvExportModule,
} from "ag-grid-community";
import { 
  AgGridReact,
} from "ag-grid-react";
import { 
  ExcelExportModule, 
  SetFilterModule, 
  ContextMenuModule,
  ColumnMenuModule,
  ServerSideRowModelModule,
} from "ag-grid-enterprise";

// Register modules including ServerSideRowModelModule
ModuleRegistry.registerModules([
  AllCommunityModule,
  CsvExportModule,
  ExcelExportModule,
  SetFilterModule,
  ContextMenuModule,
  ColumnMenuModule,
  ServerSideRowModelModule, // Register server-side row model
]);

// Custom Cell Renderers
const UserInfoRenderer = (params: ICellRendererParams) => {
  const user = params.data;
  return (
    <div className="flex items-center">
      <div>
        <div className="font-medium text-gray-900 dark:text-white">
          {user.firstName} {user.lastName}
        </div>
      </div>
    </div>
  );
};

const StatusRenderer = (params: ICellRendererParams) => {
  const isActive = params.value === 'active';
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${
        isActive
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      }`}
    >
      {params.value}
    </span>
  );
};

const RoleRenderer = (params: ICellRendererParams) => {
  const user = params.data;
  const isSuperuser = user.is_superuser;
  const roleData = user.role_data || [];
  
  return (
    <div className="flex flex-wrap gap-1">
      {isSuperuser && (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Superuser
        </span>
      )}

      {roleData.length === 1 && (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          {roleData[0].role_name}
        </span>
      )}

      {roleData.length > 1 && (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          {roleData[roleData.length - 1].role_name}
        </span>
      )}
    
      {!isSuperuser && roleData.length === 0 && (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          No Role
        </span>
      )}
    </div>
  );
};

const OrganizationRenderer = (params: ICellRendererParams) => {
  return (
    <span className="text-sm text-gray-600 dark:text-gray-400">
      {params.value}
    </span>
  );
};

const DateRenderer = (params: ICellRendererParams) => {
  return (
    <div className="text-sm text-gray-500 dark:text-gray-400">
      {new Date(params.value).toLocaleDateString()}
    </div>
  );
};

function AdminUserManagementClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [totalInactive, setTotalInactive] = useState(0);
  const [totalSuperusers, setTotalSuperusers] = useState(0);
  const gridRef = useRef<AgGridReact<User>>(null);

  const router = useRouter();

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for roles
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  
  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await roleService.getRoles();
        setRoles(response);
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    };
    fetchRoles();
  }, []);

  // Auto-clear errors
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Create server-side datasource
  const getServerSideDatasource = useCallback((searchTerm: string = ""): IServerSideDatasource => {
    return {
      getRows: async (params: IServerSideGetRowsParams) => {
        console.log("[Datasource] - rows requested by grid: ", params.request);
        
        try {
          setLoading(true);
          setError(null);

          // Calculate page number from startRow and endRow
          const startRow = params.request.startRow || 0;
          const endRow = params.request.endRow || 10;
          const pageSize = endRow - startRow;
          const page = Math.floor(startRow / pageSize) + 1;

          // Build request parameters for your API
          const requestParams = {
            page: page,
            page_size: pageSize,
            order_by: "created_on",
            order_type: "desc",
            export: false
          };

          // Add search filter if present
          if (searchTerm) {
            requestParams.first_name = searchTerm;
          }

          // Handle sorting from AG Grid
          if (params.request.sortModel && params.request.sortModel.length > 0) {
            const sortModel = params.request.sortModel[0];
            
            // Map frontend column names to backend field names
            const columnMapping = {
              'firstName': 'first_name',
              'lastName': 'last_name',
              'email': 'email',
              'status': 'status',
              'createdAt': 'created_on',
              'organisation_name': 'organisation_name'
            };

            const backendFieldName = columnMapping[sortModel.colId] || sortModel.colId;
            requestParams.order_by = backendFieldName;
            requestParams.order_type = sortModel.sort;
          }

          // Call your API
          const response = await userService.getUsers(requestParams);
          
          // Transform API response to match User type
          const transformedUsers: User[] = response.results.map((apiUser: any) => ({
            id: apiUser.id.toString(),
            firstName: apiUser.first_name,
            lastName: apiUser.last_name,
            email: apiUser.email,
            role: apiUser.role_data?.[0]?.id || (apiUser.is_superuser ? 1 : 2),
            roleName: apiUser.role_data?.[0]?.role_name || (apiUser.is_superuser ? "Superuser" : "User"),
            status: apiUser.status ? "active" : "inactive",
            lastLogin: apiUser.last_login || apiUser.created_on,
            createdAt: apiUser.created_on,
            organisation_name: apiUser.organisation_name || "",
            permissions: apiUser.role_data?.map((role: any) => role.role_name) || [],
            accessControl: [],
            is_superuser: apiUser.is_superuser,
            role_data: apiUser.role_data || [],
          }));
          
          // Update stats from response
          setTotalCount(response.count || 0);
          
          // Calculate stats from current page data
          const activeUsers = transformedUsers.filter(user => user.status === "active").length;
          const inactiveUsers = transformedUsers.filter(user => user.status === "inactive").length;
          const superusers = transformedUsers.filter(user => user.is_superuser).length;
          
          // These are approximations based on current page - for exact counts, 
          // you'd need additional API endpoints or include stats in the response
          setTotalActive(activeUsers);
          setTotalInactive(inactiveUsers);
          setTotalSuperusers(superusers);

          // Determine if this is the last row
          const lastRow = response.count <= endRow ? response.count : undefined;

          // Call success callback with data
          params.success({
            rowData: transformedUsers,
            rowCount: lastRow,
          });

        } catch (error: any) {
          console.error('Error loading users:', error);
          setError(error.message || 'Failed to load users');
          params.fail();
        } finally {
          setLoading(false);
        }
      },
    };
  }, []);

  // Helper function to get module info
  const getModuleInfo = (moduleId: string) => {
    const module = staticModuleDefinitions.modules[parseInt(moduleId)];
    return module || {
      name: 'Unknown Module',
      description: 'Module information not available',
      color: 'gray'
    };
  };

  // Delete user functions
  const openDeleteModal = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
    setDeleteError(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
    setDeleteError(null);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      await userService.deleteUser(parseInt(userToDelete.id));
      
      toast.success('User deleted successfully');
      closeDeleteModal();
      
      // Refresh data by updating the datasource
      if (gridRef.current) {
        const api = gridRef.current.api;
        const datasource = getServerSideDatasource(globalFilter);
        api.setGridOption('serverSideDatasource', datasource);
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setDeleteError(error?.message || 'Failed to delete user');
      toast.error('Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // We need to find the user from the current grid data
    if (gridRef.current) {
      const api = gridRef.current.api;
      let foundUser: User | null = null;
      
      api.forEachNode((node) => {
        if (node.data && node.data.id === userId) {
          foundUser = node.data;
        }
      });
      
      if (foundUser) {
        openDeleteModal(foundUser);
      }
    }
  };

  // Actions Cell Renderer
  const ActionsRenderer = useCallback((params: ICellRendererParams) => {
    const handleEditClick = () => {
      router.push(`/user-management/edit?id=${params.data.id}`);
    };

    const handleDeleteClick = () => {
      handleDeleteUser(params.data.id);
    };

    return (
      <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
        <Button
          size="sm"
          variant="outline"
          onClick={handleEditClick}
          className="p-1"
        >
          <PencilIcon className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDeleteClick}
          className="p-1 text-red-600 hover:text-red-700"
        >
          <TrashBinIcon className="w-4 h-4" />
        </Button>
      </div>
    );
  }, [router]);

  // Column Definitions
  const columnDefs = useMemo<ColDef[]>(() => [
    {
      field: "actions",
      headerName: "Action",
      width: 150,
      minWidth: 150,
      cellRenderer: ActionsRenderer,
      sortable: false,
      filter: false,
      suppressMovable: true,
      lockPosition: 'left',
      checkboxSelection: false,
    },
    {
      field: "firstName",
      headerName: "User",
      minWidth: 250,
      flex: 2,
      sortable: true,
      filter: false, // Disable column-level filtering for server-side
      cellRenderer: UserInfoRenderer,
    },
    {
      field: "roleName",
      headerName: "Role",
      minWidth: 200,
      flex: 1.5,
      sortable: false, // Disable sorting for computed field
      filter: false,
      cellRenderer: RoleRenderer,
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 120,
      flex: 0.8,
      sortable: true,
      filter: false,
      cellRenderer: StatusRenderer,
    },
    {
      field: "organisation_name",
      headerName: "Organization",
      minWidth: 150,
      flex: 1,
      sortable: true,
      filter: false,
      cellRenderer: OrganizationRenderer,
    },
    {
      field: "createdAt",
      headerName: "Created",
      minWidth: 120,
      flex: 0.8,
      sortable: true,
      filter: false,
      cellRenderer: DateRenderer,
    },
  ], [ActionsRenderer]);

  // Default Column Definition
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: true,
    filter: false, // Disable default filtering for server-side
    flex: 1,
    minWidth: 100,
  }), []);

  const handleSearch = (searchTerm: string) => {
    setGlobalFilter(searchTerm);
    
    // Update the datasource with new search term
    if (gridRef.current) {
      const api = gridRef.current.api;
      const datasource = getServerSideDatasource(searchTerm);
      api.setGridOption('serverSideDatasource', datasource);
    }
  };

  // Handle grid ready event
  const handleGridReady = useCallback((params: GridReadyEvent) => {
    console.log('Grid ready event received');
    params.api!.setRowCount(20);
    
    // Create and set the datasource
    const datasource = getServerSideDatasource(globalFilter);
    params.api!.setGridOption('serverSideDatasource', datasource);
  }, [getServerSideDatasource, globalFilter]);

  const handleAddNew = () => {
    router.push('/user-management/add');
  };

  // Calculate dynamic height based on number of rows
  const gridHeight = useMemo(() => {
    const rowHeight = 42; // AG Grid default row height
    const headerHeight = 48; // Header height
    const paginationHeight = 56; // Pagination panel height
    const padding = 16; // Extra padding
    const pageSize = 10; // Default page size
    
    // Calculate height based on page size, but cap at reasonable max
    const calculatedHeight = (pageSize * rowHeight) + headerHeight + paginationHeight + padding;
    return Math.min(calculatedHeight, 600); // Max height of 600px
  }, []);

  return (
    <div className="p-0">
      {/* Header */}
      <div className="py-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage system users, roles, and permissions
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Users</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalCount}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Active Users</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalActive}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Inactive Users</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{totalInactive}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Superusers</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalSuperusers}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 py-4">
        <div className="flex-1">
          <Input
            placeholder="Search users by first name"
            value={globalFilter}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-theme-purple-600 hover:bg-theme-purple-700 text-white whitespace-nowrap"
          >
            <PlusIcon className="w-4 h-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* AG Grid Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden" style={{ height: `${gridHeight}px` }}>
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          loading={loading}
          // Server-side row model configuration
          rowModelType="serverSide"
          cacheBlockSize={10} // Number of rows per request
          pagination={true}
          paginationPageSize={10}
          paginationAutoPageSize={true}
          suppressPaginationPanel={false}
          paginationPageSizeSelector={[10, 25, 50, 100]}
          
          onGridReady={handleGridReady}
          domLayout="normal"
          animateRows={true}
          className="ag-theme-alpine"
          
          rowSelection={{ mode: "multiRow", groupSelects: "descendants" }}
          
          // Default export configurations
          defaultCsvExportParams={{
            fileName: `users_${new Date().toISOString().split('T')[0]}.csv`,
            onlySelectedAllPages: true,
          }}
          defaultExcelExportParams={{
            fileName: `users_${new Date().toISOString().split('T')[0]}.xlsx`,
            sheetName: "Users",
            onlySelectedAllPages: true,
          }}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone and will remove all associated data and permissions."
        itemName={userToDelete ? `${userToDelete.firstName} ${userToDelete.lastName}` : undefined}
        isLoading={isDeleting}
        variant="danger"
        error={deleteError}
      />
    </div>
  );
}

export default withSimplifiedRBAC(AdminUserManagementClient, {
  privilege: "VIEW_USER_LIST"
});
