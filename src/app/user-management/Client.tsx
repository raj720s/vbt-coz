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
  ServerSideRowModelModule,
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

// const OrganizationRenderer = (params: ICellRendererParams) => {
//   return (
//     <span className="text-sm text-gray-600 dark:text-gray-400">
//       {params.value}
//     </span>
//   );
// };

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
          const requestParams: any = {
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
            const columnMapping: { [key: string]: string } = {
              'firstName': 'first_name',
              'lastName': 'last_name',
              'email': 'email',
              'status': 'status',
              'createdAt': 'created_on',
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

          // For server-side row model with pagination, return exact row count
          const rowsThisPage = transformedUsers;
          
          // Call success callback with data and total row count
          params.success({
            rowData: rowsThisPage,
            rowCount: response.count || 0, // Total number of rows available on server
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

  // Actions Cell Renderer Component
  const ActionsRenderer = (params: ICellRendererParams) => {
    const [isUpdating, setIsUpdating] = useState(false);
    
    const handleEditClick = () => {
      router.push(`/user-management/edit?id=${params.data.id}`);
    };

    const handleDeleteClick = () => {
      handleDeleteUser(params.data.id);
    };

    const handleRestoreClick = async () => {
      if (isUpdating) return;
      
      try {
        setIsUpdating(true);
        
        // Fetch full user data to get all required fields for update
        const userDetail = await userService.getUser(parseInt(params.data.id));
        
        // Get company ID from company_dict or company field (similar to edit page)
        const companyId = (userDetail as any).company_dict?.id || (userDetail as any).company;
        
        // Call the updateUser API to set status to active
        const updateData: any = {
          status: true, // Set status to active
          first_name: userDetail.first_name,
          last_name: userDetail.last_name,
          email: userDetail.email,
          role: (userDetail as any).role != null ? (userDetail as any).role : userDetail.role_id || userDetail.role_details?.id,
        };
        
        // Include company if available
        if (companyId) {
          updateData.company = companyId;
        }
        
        await userService.updateUser(parseInt(params.data.id), updateData);
        
        toast.success(`User "${params.data.firstName} ${params.data.lastName}" has been activated successfully`);
        
        // Refresh the grid data
        if (gridRef.current) {
          const api = gridRef.current.api;
          const datasource = getServerSideDatasource(globalFilter);
          api.setGridOption('serverSideDatasource', datasource);
        }
        
      } catch (error: any) {
        console.error('Error activating user:', error);
        toast.error(error.message || 'Failed to activate user');
      } finally {
        setIsUpdating(false);
      }
    };

    // If the record is inactive, show only the restore button
    if (params.data.status === "inactive") {
      return (
        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRestoreClick}
            disabled={isUpdating}
            className="px-3 py-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300 disabled:opacity-50"
          >
            {isUpdating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Activating...
              </>
            ) : (
              <>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Restore
              </>
            )}
          </Button>
        </div>
      );
    }

    // For active records, show the normal edit/delete buttons
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
  };

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
      filter: false,
      cellRenderer: UserInfoRenderer,
    },
    {
      field: "roleName",
      headerName: "Role",
      minWidth: 200,
      flex: 1.5,
      sortable: false,
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
    filter: false,
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
          
          // CRITICAL: Set serverSideStoreType to 'partial' for proper pagination
          serverSideStoreType="partial"
          
          // Cache configuration - MUST match pagination size
          cacheBlockSize={10} // Must match paginationPageSize
          maxBlocksInCache={10} // Keep multiple pages in cache
          
          // Pagination configuration
          pagination={true}
          paginationPageSize={10} // Must match cacheBlockSize
          paginationPageSizeSelector={[10, 25, 50, 100]}
          
          // CRITICAL: REMOVED paginationAutoPageSize - conflicts with server-side pagination
          
          // CRITICAL: Enable server-side infinite scroll for proper pagination
          serverSideInfiniteScroll={true}
          
          // Sorting and filtering on server
          serverSideSortOnServer={true}
          serverSideFilterOnServer={true}
          
          onGridReady={handleGridReady}
          domLayout="normal"
          animateRows={true}
          className="ag-theme-alpine"
          
          rowSelection={{ mode: "multiRow", groupSelects: "descendants" }}
          
          // Default export configurations
          defaultCsvExportParams={{
            fileName: `users_${new Date().toISOString().split('T')[0]}.csv`,
            onlySelectedAllPages: true,
            columnKeys: columnDefs
                            .map(col => col.field)
                            .filter(field => Boolean(field) && field !== 'actions') as string[], 
          }}
          defaultExcelExportParams={{
            fileName: `users_${new Date().toISOString().split('T')[0]}.xlsx`,
            sheetName: "Users",
            onlySelectedAllPages: true,
            columnKeys: columnDefs
                            .map(col => col.field)
                            .filter(field => Boolean(field) && field !== 'actions') as string[], 
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
