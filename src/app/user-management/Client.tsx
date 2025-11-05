"use client";

import { withSimplifiedRBAC } from "@/components/auth/withSimplifiedRBAC";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";

// Removed inline FormModal in favor of dedicated add/edit pages
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import Input from "@/components/form/input/InputField";
import { DownloadIcon, AlertIcon, CheckCircleIcon, TimeIcon, UserCircleIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { User } from "@/types/user";

import { userService } from "@/services/userService";
import { UserListResponseV2 } from "@/types/api";
import { roleService, RoleResponse } from "@/services/roleService";

import { staticModuleDefinitions } from "@/config/staticModules";

// AG Grid imports
import type {
  ColDef,
  ICellRendererParams,
} from "ag-grid-community";
import { 
  AllCommunityModule, 
  ModuleRegistry,
  CsvExportModule,
} from "ag-grid-community";
import { 
  AgGridReact,
} from "ag-grid-react";
import { ExcelExportModule, SetFilterModule } from "ag-grid-enterprise";

ModuleRegistry.registerModules([
  AllCommunityModule,
  CsvExportModule,
  ExcelExportModule,
  SetFilterModule,
]);

// Custom Cell Renderers
const UserInfoRenderer = (params: ICellRendererParams) => {
  const user = params.data;
  return (
    <div className="flex items-center">
      {/* <UserCircleIcon className="w-8 h-8 text-gray-400 mr-3" /> */}
      <div>
        <div className="font-medium text-gray-900 dark:text-white">
          {user.firstName} {user.lastName}
        </div>
        {/* <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div> */}
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
      {roleData.map((role: any, index: number) => (
        <span 
          key={index}
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            role.role_name === 'Vendor' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : role.role_name === 'Origin Agent'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          }`}
        >
          {role.role_name}
        </span>
      ))}
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
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [nameSearch, setNameSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [exportSelectedOnly, setExportSelectedOnly] = useState(false);
  const gridRef = useRef<AgGridReact<User>>(null);

  // Pagination state for AG Grid
  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 0,
    totalPages: 0,
    totalRecords: 0,
    pageSize: 10,
  });

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
    setDeleteError(null); // Clear any previous errors
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
    setDeleteError(null); // Clear errors when closing
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      // Call the user service to delete user
      await userService.deleteUser(parseInt(userToDelete.id));
      
      toast.success('User deleted successfully');
      closeDeleteModal();
      
      // Refresh the user list
      await fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setDeleteError(error?.message || 'Failed to delete user');
      toast.error('Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setFilterLoading(true);
      
      // Build the request body for the new POST endpoint
      const requestBody = {
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        first_name: nameSearch || undefined,
        role_name: roleFilter ? roles.find(r => r.id === roleFilter)?.role_name : undefined,
        status: statusFilter !== null ? (statusFilter ? 1 : 0) : undefined,
        order_by: undefined, // Will be handled by AG Grid sorting
        order_type: undefined, // Will be handled by AG Grid sorting
        export: false,
      };
      
      const response = await userService.getUsers(requestBody);
      
      // Set total count for pagination
      setTotalCount(response.count);
      
      // Transform API response to match our User type
      const transformedUsers: User[] = response.results.map((apiUser: any) => ({
        id: apiUser.id.toString(),
        firstName: apiUser.first_name,
        lastName: apiUser.last_name,
        email: apiUser.email,
        role: apiUser.role_data?.[0]?.id || (apiUser.is_superuser ? 1 : 2), // Use first role ID or fallback
        roleName: apiUser.role_data?.[0]?.role_name || (apiUser.is_superuser ? "Superuser" : "User"), // Use first role name or fallback
        status: apiUser.status ? "active" : "inactive",
        lastLogin: apiUser.last_login || apiUser.created_on,
        createdAt: apiUser.created_on,
        organisation_name: apiUser.organisation_name || "",
        permissions: apiUser.role_data?.map((role: any) => role.role_name) || [],
        accessControl: [], // Empty array since we're not using default routes anymore
        is_superuser: apiUser.is_superuser,
        role_data: apiUser.role_data || [],
      }));
      
      setData(transformedUsers);
      
      // Update pagination info for AG Grid
      const totalPages = Math.ceil((response.count || 0) / (pagination.pageSize || 10));
      const paginationInfo = {
        currentPage: pagination.pageIndex,
        totalPages,
        totalRecords: response.count || 0,
        pageSize: pagination.pageSize || 10,
      };
      
      setPaginationInfo(paginationInfo);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, nameSearch, roleFilter, statusFilter, roles]);

  // Fetch users on component mount and when filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Sync grid pagination with our state when data loads
  useEffect(() => {
    if (gridRef.current && paginationInfo.totalRecords > 0) {
      const api = gridRef.current.api;
      // Set the current page in the grid
      api.paginationGoToPage(paginationInfo.currentPage);
      // Update the total row count
      api.setGridOption('rowData', data);
    }
  }, [paginationInfo, data]);

  const handleDeleteUser = async (userId: string) => {
    const user = data.find(u => u.id === userId);
    if (user) {
      openDeleteModal(user);
    }
  };

  const handleClearFilters = () => {
    setNameSearch("");
    setRoleFilter(null);
    setStatusFilter(null);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
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
      width: 120,
      cellRenderer: ActionsRenderer,
      sortable: false,
      filter: false,
      suppressMovable: true,
      lockPosition: 'left',
    },
    {
      field: "firstName",
      headerName: "User",
      minWidth: 250,
      flex: 2,
      sortable: true,
      filter: true,
      cellRenderer: UserInfoRenderer,
    },
    {
      field: "roleName",
      headerName: "Role",
      minWidth: 200,
      flex: 1.5,
      sortable: true,
      filter: true,
      cellRenderer: RoleRenderer,
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 120,
      flex: 0.8,
      sortable: true,
      filter: true,
      cellRenderer: StatusRenderer,
    },
    {
      field: "organisation_name",
      headerName: "Organization",
      minWidth: 150,
      flex: 1,
      sortable: true,
      filter: true,
      cellRenderer: OrganizationRenderer,
    },
    {
      field: "createdAt",
      headerName: "Created",
      minWidth: 120,
      flex: 0.8,
      sortable: true,
      filter: true,
      cellRenderer: DateRenderer,
    },
  ], [ActionsRenderer]);

  // Default Column Definition
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    flex: 1,
    minWidth: 100,
  }), []);

  // Handle pagination changes
  const onPaginationChanged = useCallback(() => {
    if (gridRef.current) {
      const api = gridRef.current.api;
      const currentPage = api.paginationGetCurrentPage();
      const pageSize = api.paginationGetPageSize();
      
      console.log('Pagination changed:', {
        currentPage,
        pageSize,
        currentPagination: pagination
      });
      
      if (currentPage !== pagination.pageIndex || pageSize !== pagination.pageSize) {
        console.log('Updating pagination:', { currentPage, pageSize });
        setPagination({
          pageIndex: currentPage,
          pageSize: pageSize,
        });
      }
    }
  }, [pagination.pageIndex, pagination.pageSize]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = data.length;
    const active = data.filter(user => user.status === "active").length;
    const inactive = data.filter(user => user.status === "inactive").length;
    const superusers = data.filter(user => user.is_superuser).length;
    const vendors = data.filter(user => user.role_data?.some(role => role.role_name === 'Vendor')).length;
    const originAgents = data.filter(user => user.role_data?.some(role => role.role_name === 'Origin Agent')).length;
    const noRole = data.filter(user => !user.is_superuser && (!user.role_data || user.role_data.length === 0)).length;

    return { total, active, inactive, superusers, vendors, originAgents, noRole };
  }, [data]);

  const handleAddNew = () => {
    router.push('/user-management/add');
  };

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      const exportData = await userService.getUsers({
        page: 1,
        page_size: 1000,
        first_name: nameSearch || undefined,
        role_name: roleFilter ? roles.find(r => r.id === roleFilter)?.role_name : undefined,
        status: statusFilter !== null ? (statusFilter ? 1 : 0) : undefined,
        export: false,
      });
      
      // Create CSV content
      const headers = ['Name', 'Email', 'Role', 'Status', 'Organization', 'Created'];
      const csvRows = [
        headers.join(','),
        ...exportData.results.map((user: any) => [
          `"${user.first_name} ${user.last_name}"`,
          user.email,
          user.role_data?.[0]?.role_name || (user.is_superuser ? "Superuser" : "User"),
          user.status ? 'Active' : 'Inactive',
          user.organisation_name || '',
          new Date(user.created_on).toLocaleDateString()
        ].join(','))
      ];
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Users exported to CSV successfully');
    } catch (error: any) {
      console.error('Error exporting users to CSV:', error);
      toast.error('Failed to export users to CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = useCallback(() => {
    if (gridRef.current) {
      try {
        gridRef.current.api.exportDataAsExcel({
          fileName: `users_${new Date().toISOString().split('T')[0]}.xlsx`,
          sheetName: "Users",
          onlySelected: exportSelectedOnly,
        });
        toast.success("Users exported to Excel successfully");
      } catch (error: any) {
        console.error("Error exporting to Excel:", error);
        toast.error("Failed to export to Excel");
      }
    }
  }, [exportSelectedOnly]);

  return (
    <div className="p-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage system users, roles, and permissions
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <UserCircleIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Inactive</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.inactive}</p>
            </div>
            <AlertIcon className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Superusers</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.superusers}</p>
            </div>
            <UserCircleIcon className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vendors</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.vendors}</p>
            </div>
            <UserCircleIcon className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Origin Agents</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.originAgents}</p>
            </div>
            <UserCircleIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters & Controls</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Search Users */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Search Users
              </label>
              <div className="flex">
                <Input
                  placeholder="Search by first name..."
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                  className="flex-1 rounded-r-none border-r-0 focus:ring-blue-500 focus:border-blue-500"
                />
                <Button 
                  onClick={() => fetchUsers()} 
                  size="sm" 
                  className="rounded-l-none px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
                >
                  Search
                </Button>
              </div>
            </div>

            {/* Role Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Role Filter
              </label>
              <select
                value={roleFilter || ""}
                onChange={(e) => setRoleFilter(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              >
                <option value="">All Roles</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.role_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Status Filter
              </label>
              <select
                value={statusFilter === null ? "" : statusFilter.toString()}
                onChange={(e) => setStatusFilter(e.target.value === "" ? null : e.target.value === "true")}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-end space-x-3">
              <Button 
                onClick={handleClearFilters} 
                size="sm" 
                variant="outline"
                className="px-4 py-2.5 text-sm font-medium border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Clear Filters
              </Button>
              <Button 
                onClick={handleExportExcel} 
                size="sm" 
                variant="outline" 
                className="px-4 py-2.5"
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              <Button 
                onClick={handleExportCSV} 
                size="sm" 
                variant="outline" 
                className="px-4 py-2.5"
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button 
                onClick={handleAddNew} 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>

          {/* Loading Indicator */}
          {filterLoading && (
            <div className="mt-4 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Applying filters...
            </div>
          )}
        </div>
      </div>

     {/* AG Grid Table */}
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
  <div
    style={{ height: "calc(100vh - 340px)", minHeight: "500px" }}
    className="ag-theme-alpine"
  >
    <AgGridReact
      ref={gridRef}
      rowData={data}
      columnDefs={columnDefs}
      defaultColDef={defaultColDef}
      loading={loading}
      pagination={true}
      paginationPageSize={pagination.pageSize}
      paginationAutoPageSize={false}
      suppressPaginationPanel={false}
      paginationPageSizeSelector={[10, 25, 50, 100]}
      domLayout="normal"
      animateRows={true}
      suppressMenuHide={false}
      rowSelection={{ mode: "multiRow" }}
      suppressRowClickSelection={true}
      rowHeight={48}
      headerHeight={44}
      suppressCellFocus={true}
      className="transition-all duration-200 ag-theme-alpine"
    />
  </div>
</div>


      {/* Inline modal removed; using dedicated add/edit pages */}

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