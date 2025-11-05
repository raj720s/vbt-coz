"use client";

import { withSimplifiedRBAC } from "@/components/auth/withSimplifiedRBAC";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";
import { FormModal } from "@/components/ui/modal/FormModal";
import { CommonModalWrapper } from "@/components/ui/modal/CommonModalWrapper";
import { PrivilegeModal } from "@/components/ui/modal/PrivilegeModal";
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import { useFormModal } from "@/hooks/useFormModal";
import Input from "@/components/form/input/InputField";
import { DownloadIcon, AlertIcon, CheckCircleIcon, UserCircleIcon, PencilIcon, PlusIcon, TrashBinIcon, EyeIcon, InformationCircleIcon } from "@/icons";
import { roleService } from "@/services/roleService";
import { CreateRoleRequest, UpdateRoleRequest } from "@/services/roleService";
import { RoleListResponseV2 } from "@/types/api";
import { RoleForm } from "@/components/forms/RoleForm";
import { staticModuleDefinitions } from "@/config/staticModules";
import { useUsersJson } from "@/hooks/useCommonData";
import { useSelector } from "react-redux";

// AG Grid imports
import type {
  ColDef,
  ICellRendererParams,
  GridApi,
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

// Helper function to get module information
const getModuleInfo = (moduleId: string) => {
  const module = staticModuleDefinitions.modules[parseInt(moduleId)];
  return module || {
    name: `Module ${moduleId}`,
    description: "Unknown module",
    icon: "AlertIcon",
    color: "gray"
  };
};

function AdminRoleManagementClient() {
  const gridRef = useRef<AgGridReact<RoleListResponseV2>>(null);
  
  // State management for roles
  const [roles, setRoles] = useState<RoleListResponseV2[]>([]);
  const [rolesWithPrivileges, setRolesWithPrivileges] = useState<RoleListResponseV2[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [privileges, setPrivileges] = useState<{ count: number; results: any[] } | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  
  // Pagination state
  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 1,
    totalPages: 0,
    totalRecords: 0,
    pageSize: 10,
  });

  const autoSizeStrategy = useMemo(() => ({
    type: 'fitGridWidth',
    defaultMinWidth: 100,
    columnLimits: [
      {
        colId: 'role_name',
        minWidth: 150
      },
      {
        colId: 'role_description', 
        minWidth: 200
      },
      {
        colId: 'actions',
        minWidth: 120
      }
    ]
  }), []);

  // Get users JSON data using specialized useUsersJson hook
  const { usersJson, loading: usersLoading, error: usersError, refresh: refreshUsers } = useUsersJson();

  // Helper function to get user name by ID
  const getUserName = useCallback((userId: number | null): string => {
    if (!userId || !usersJson) return '-';
    const userName = usersJson[userId.toString()];
    return userName || `User ${userId}`;
  }, [usersJson]);

  
  
  // Fetch roles function
  const fetchRoles = useCallback(async (page = 1, pageSize = 10, searchTerm = '', orderBy = 'created_on', orderType = 'desc') => {
    try {
      setLoading(true);
      setError(null);
      
      // Build request parameters
      const requestParams = {
        include_privilege_data: true,
        role_name: searchTerm || undefined,
        order_by: orderBy,
        order_type: orderType,
        page: page,
        page_size: pageSize,
      };
      
      const response = await roleService.getRoles(requestParams);
      console.log('Roles API response:', response);
      
      // Handle paginated response format: { count: number, results: RoleListResponseV2[] }
      if (Array.isArray(response)) {
        setRoles(response);
        setRolesWithPrivileges(response);
        setTotalCount(response.length);
        setPaginationInfo({
          currentPage: 1,
          totalPages: 1,
          totalRecords: response.length,
          pageSize: response.length,
        });
      } else {
        const results = (response as any).results || [];
        const count = (response as any).count || 0;
        
        setRoles(results);
        setRolesWithPrivileges(results);
        setTotalCount(count);
        
        const totalPages = Math.ceil(count / pageSize);
        setPaginationInfo({
          currentPage: page,
          totalPages,
          totalRecords: count,
          pageSize,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch roles');
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load roles on component mount
  useEffect(() => {
    fetchRoles();
  }, []); // Empty dependency array - only run on mount

  // AG Grid Cell Renderers
  const DateRenderer = (params: ICellRendererParams) => {
    if (!params.value) return <span className="text-gray-400">N/A</span>;
    try {
      const date = new Date(params.value);
      return <span className="text-sm">{date.toLocaleDateString()}</span>;
    } catch {
      return <span className="text-gray-400">Invalid Date</span>;
    }
  };

  const UserRenderer = (params: ICellRendererParams) => {
    const userId = params.value;
    if (!userId) return <span className="text-gray-400">-</span>;
    
    if (usersLoading) {
      return <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>;
    }
    
    return (
      <div className="flex items-center">
        <span className="text-sm text-gray-900 dark:text-white">
          {getUserName(userId)}
        </span>
      </div>
    );
  };

  const PrivilegesRenderer = (params: ICellRendererParams) => {
    return (
      <button
        onClick={() => openPrivilegesModal(params.data)}
        className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">View</span>
          <span>privileges</span>
          <InformationCircleIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
        </div>
      </button>
    );
  };

  


  const {
    isOpen: isModalOpen,
    isLoading: isModalLoading,
    editingItem,
    openModal,
    closeModal,
    setLoading: setModalLoading,
  } = useFormModal<RoleListResponseV2>();

  // Privileges modal state
  const [isPrivilegesModalOpen, setIsPrivilegesModalOpen] = useState(false);
  const [selectedRolePrivileges, setSelectedRolePrivileges] = useState<string[]>([]);
  const [selectedRoleName, setSelectedRoleName] = useState("");
  const [isLoadingPrivileges, setIsLoadingPrivileges] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleListResponseV2 | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch privileges on component mount
  useEffect(() => {
    fetchPrivileges();
  }, []);

  // Handle search
  const handleSearch = (searchTerm: string) => {
    setGlobalFilter(searchTerm);
    fetchRoles(1, paginationInfo.pageSize, searchTerm);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    fetchRoles(newPage, paginationInfo.pageSize, globalFilter);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    fetchRoles(1, newPageSize, globalFilter);
  };

  // Note: We're using custom pagination, so we don't need onPaginationChanged
  // AG Grid pagination is disabled and we handle it with our custom controls

  const fetchPrivileges = async () => {
    try {
      const response = await roleService.getPrivileges();
      console.log('🔍 Privileges API response:', response);
      
      console.log('📊 Response structure:', {
        count: response.count,
        resultsType: typeof response.results,
        resultsIsArray: Array.isArray(response.results),
        resultsLength: response.results?.length,
        firstItem: response.results?.[0],
        sampleResults: response.results?.slice(0, 3)
      });
      setPrivileges(response);
    } catch (error) {
      console.error('Error fetching privileges:', error);
      toast.error('Failed to fetch privileges');
    }
  };

  const handleCreateRole = async (roleData: CreateRoleRequest) => {
    try {
      setModalLoading(true);
      
      const response = await roleService.createRole(roleData);
      
      toast.success('Role created successfully');
      
      // Refresh the role list
      fetchRoles(paginationInfo.currentPage, paginationInfo.pageSize, globalFilter);
      
      // Close the modal
      closeModal();
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('Failed to create role');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditRole = async (roleData: UpdateRoleRequest) => {
    if (!editingItem) return;
    
    try {
      setModalLoading(true);
      
      const response = await roleService.updateRole(editingItem.id, roleData);
      
      toast.success('Role updated successfully');
      
      // Refresh the role list
      fetchRoles(paginationInfo.currentPage, paginationInfo.pageSize, globalFilter);
      
      // Close the modal
      closeModal();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    // Find the role by ID to show in the delete modal
    const role = roles.find(r => r.id.toString() === roleId);
    if (role) {
      openDeleteModal(role);
    }
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      setIsDeleting(true);
      console.log('🚀 Deleting role:', roleToDelete);
      
      const result = await roleService.deleteRole(roleToDelete.id);
      console.log('✅ Delete result:', result);
      
      if (result.success) {
        toast.success(result.message || `Role "${roleToDelete.role_name}" deleted successfully`);
        setDeleteError(null); // Clear any errors on success
        closeDeleteModal();
        // Refresh the roles list
        await fetchRoles(paginationInfo.currentPage, paginationInfo.pageSize, globalFilter);
      } else {
        // Handle service response error - result only has success boolean
        const errorMessage = result.message || 'Failed to delete role';
        setDeleteError(errorMessage);
        toast.error(errorMessage);
        console.error('❌ Service error response:', result);
      }
    } catch (error: any) {
      console.error('❌ Error deleting role:', error);
      
      // Extract error message from different error types
      let errorMessage = 'Failed to delete role';
      
      if (error.response?.data?.message) {
        // API error response
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        // API error response with error field
        errorMessage = error.response.data.error;
      } else if (error.message) {
        // JavaScript error
        errorMessage = error.message;
      } else if (error.statusText) {
        // HTTP status text
        errorMessage = error.statusText;
      }
      
      setDeleteError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };



  const handleSubmit = async (roleData: CreateRoleRequest | UpdateRoleRequest) => {
    if (editingItem) {
      await handleEditRole(roleData as UpdateRoleRequest);
    } else {
      await handleCreateRole(roleData as CreateRoleRequest);
    }
  };

  const openPrivilegesModal = async (role: RoleListResponseV2) => {
    console.log('🔍 Opening privileges modal for role:', role);
    console.log('📊 Role ID:', role.id);
    console.log('📊 Role privilege_names:', role.privilege_names);
    
    setIsLoadingPrivileges(true);
    
    try {
      // Use privilege_names directly from the role object since they're already available
      if (role.privilege_names && role.privilege_names.length > 0) {
        console.log('📊 Using privilege_names from role object:', role.privilege_names);
        
        setSelectedRolePrivileges(role.privilege_names || []);
        setSelectedRoleName(role.role_name);
        setIsPrivilegesModalOpen(true);
      } else {
        console.log('⚠️ No privilege_names in role object, falling back to API call');
        
        // Fallback to API call if no privilege_names available
       const rolePrivileges = await roleService.getRolePrivileges(role.id);
        console.log('📊 Role privileges API response:', rolePrivileges);
      
      const privilegeNames = rolePrivileges.flatMap(module => 
        module.privileges?.map(p => p.name) || []
      );
        console.log('📊 Extracted privilege names from API:', privilegeNames);
      
      setSelectedRolePrivileges(privilegeNames);
      setSelectedRoleName(role.role_name);
      setIsPrivilegesModalOpen(true);
      }
    } catch (error) {
      console.error('❌ Error fetching role privileges:', error);
      toast.error('Failed to fetch role privileges');
      // Fallback to empty privileges
      setSelectedRolePrivileges([]);
      setSelectedRoleName(role.role_name);
      setIsPrivilegesModalOpen(true);
    } finally {
      setIsLoadingPrivileges(false);
    }

  };

  const closePrivilegesModal = () => {
    setIsPrivilegesModalOpen(false);
    setSelectedRolePrivileges([]);
    setSelectedRoleName("");
  };

  // Delete role functions
  const openDeleteModal = (role: RoleListResponseV2) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
    setDeleteError(null); // Clear any previous errors
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setRoleToDelete(null);
    setDeleteError(null); // Clear errors when closing
  };

  // Actions Cell Renderer
  const ActionsRenderer = useCallback(
    (params: ICellRendererParams) => {
      const handleEditClick = () => {
        openModal(params.data);
      };

      const handleDeleteClick = () => {
        handleDeleteRole(params.data.id.toString());
      };

      return (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
            onClick={handleEditClick}
            className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
            title="Edit role"
        >
            <PencilIcon className="w-4 h-4" />
        </button>
        <button
            onClick={handleDeleteClick}
            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
            title="Delete role"
        >
            <TrashBinIcon className="w-4 h-4" />
        </button>
        </div>
      );
    },
    [openModal, handleDeleteRole]
  );

  // Server-side filtering is now handled in fetchRoles

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef[]>(() => [
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 120,
      sortable: false,
      filter: false,
      cellRenderer: ActionsRenderer,
      suppressMovable: true,
      lockPosition: 'left',
    },
    {
      field: "role_name",
      headerName: "Role Name",
      width: 200,
      flex: 1.5,
      sortable: true,
      filter: true,
      cellRenderer: (params: ICellRendererParams) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {params.value}
          </div>
      ),
    },
    {
      field: "role_description",
      headerName: "Role Description",
      width: 300,
      flex: 1,
      sortable: true,
      filter: true,
      cellRenderer: (params: ICellRendererParams) => (
        <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
          {params.value || 'No description'}
          </div>
        ),
    },
    {
      field: "privilege_names",
      headerName: "Privileges",
      width: 150,
      flex: 1,
      sortable: false,
      filter: false,
      cellRenderer: PrivilegesRenderer,
    },
    {
      field: "created_by",
      headerName: "Created By",
      width: 150,
      flex: 1,
      sortable: true,
      filter: true,
      cellRenderer: UserRenderer,
    },
    {
      field: "created_on",
      headerName: "Created On",
      width: 150,
      flex: 1,
      sortable: true,
      filter: true,
      cellRenderer: DateRenderer,
    },
    {
      field: "modified_by",
      headerName: "Modified By",
      width: 150,
      flex: 1,
      sortable: true,
      filter: true,
      cellRenderer: UserRenderer,
    },
    {
      field: "modified_on",
      headerName: "Modified On",
      width: 150,
      flex: 1,
      sortable: true,
      filter: true,
      cellRenderer: DateRenderer,
    },
  ], [PrivilegesRenderer, UserRenderer, ActionsRenderer, usersLoading, getUserName]);

  // Default Column Definition
  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
    }),
    []
  );

  // Calculate stats
  const stats = useMemo(() => {
    const total = totalCount;
    const active = totalCount; // All roles are considered active
    
    // Calculate total privileges - handle different response structures
    let totalPrivileges = 0;
    if (privileges && privileges.results) {
      if (typeof privileges.results === 'object' && !Array.isArray(privileges.results)) {
        // If results is an object with module keys
        if (Array.isArray(Object.values(privileges.results)[0])) {
          totalPrivileges = Object.values(privileges.results).flat().length;
        }
      } else if (Array.isArray(privileges.results)) {
        // If results is a direct array
        totalPrivileges = privileges.results.length;
      }
    }

    return { total, active, totalPrivileges };
  }, [totalCount, privileges]);

  const handleAddNew = () => {
    openModal();
  };

  const handleExport = () => {
    // Implement export functionality
    toast.success('Export functionality coming soon');
  };

  const clearSearch = () => {
    setGlobalFilter("");
    fetchRoles(1, paginationInfo.pageSize, "");
  };


  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Roles</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchRoles} className="bg-blue-600 hover:bg-blue-700">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Role Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage system roles, permissions, and access control
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Roles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <UserCircleIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Roles</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Privileges</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalPrivileges}</p>
            </div>
            <AlertIcon className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

                    {/* Search and Controls */}
       <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow mb-6">
         <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
           <div className="flex-1 max-w-md">
             <Input
               placeholder="Search by role name..."
               value={globalFilter}
               onChange={(e) => handleSearch(e.target.value)}
               className="w-full"
             />
           </div>
           <div className="flex items-center space-x-2">
             {globalFilter && (
               <Button onClick={clearSearch} size="sm" variant="outline">
                 Clear Search
               </Button>
             )}
             {usersError && (
               <Button onClick={refreshUsers} size="sm" variant="outline" className="text-orange-600 border-orange-300 hover:bg-orange-50">
                 <UserCircleIcon className="w-4 h-4 mr-2" />
                 Refresh Users
               </Button>
             )}
             <Button onClick={handleAddNew} size="sm">
               <PlusIcon className="w-4 h-4 mr-2" />
               Add Role
             </Button>
           </div>
         </div>
       </div>

      {/* AG Grid Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {usersLoading && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <p className="text-sm text-blue-700">Loading user data...</p>
            </div>
          </div>
        )}
        
        <div style={{ height: "calc(100vh - 400px)", minHeight: "500px" }} className="ag-theme-alpine">
          <AgGridReact
            ref={gridRef}
            rowData={roles}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            loading={loading}
            pagination={true}
            paginationPageSize={paginationInfo.pageSize}
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
          />
        </div>
      </div>



             {/* Form Modal */}
       <FormModal
         isOpen={isModalOpen}
         onClose={closeModal}
         title={editingItem ? "Edit Role" : "Add New Role"}
         size="lg"
         showHeader={true}
         showFooter={true}
       >
         <RoleForm
            initialData={editingItem ? {
              id: editingItem.id,
              role_name: editingItem.role_name,
              role_description: editingItem.role_description,
              privilege_names: editingItem.privilege_names || []
            } : undefined}
           privileges={privileges}
           rolesWithPrivileges={rolesWithPrivileges}
           onSubmit={handleSubmit}
           onCancel={closeModal}
           isLoading={isModalLoading}
         />
       </FormModal>

               {/* Privileges Modal */}
        <PrivilegeModal
          isOpen={isPrivilegesModalOpen}
          onClose={closePrivilegesModal}
          title={`Privileges for ${selectedRoleName}`}
          privileges={selectedRolePrivileges}
          isLoading={isLoadingPrivileges}
          emptyMessage="No privileges assigned to this role."
          emptyDescription="You can assign privileges when editing the role."
          showFooter={true}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={confirmDeleteRole}
          title="Delete Role"
          message="Are you sure you want to delete this role? This action cannot be undone and will remove all associated privileges and user assignments."
          itemName={roleToDelete?.role_name}
          isLoading={isDeleting}
          variant="danger"
          error={deleteError}
        />
      </div>
    );
  }

  export default withSimplifiedRBAC(AdminRoleManagementClient,{
    privilege: "VIEW_ROLE_MANAGEMENT", // Minimum required privilege to access
    role: ["1"], // Only admin users (role 1) can access
    allowSuperUserBypass: true, // Superusers can always access
    redirectTo: "/dashboard" // Redirect if no access  
  })
