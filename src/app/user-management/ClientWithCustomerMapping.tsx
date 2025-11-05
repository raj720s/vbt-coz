"use client";

import { withSimplifiedRBAC } from "@/components/auth/withSimplifiedRBAC";
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, getSortedRowModel, getFilteredRowModel, getPaginationRowModel } from "@tanstack/react-table";
import { useState, useMemo, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";

import { UserForm, type UserFormData } from "@/components/forms/UserForm";
import { FormModal } from "@/components/ui/modal/FormModal";
import { CommonModalWrapper } from "@/components/ui/modal/CommonModalWrapper";
// Removed PrivilegeModal - using role management for privilege viewing
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import Input from "@/components/form/input/InputField";
import { DownloadIcon, AlertIcon, CheckCircleIcon, TimeIcon, UserCircleIcon, PencilIcon, PlusIcon, TrashBinIcon, InformationCircleIcon, UsersIcon } from "@/icons";
import { User, AVAILABLE_ROUTES } from "@/types/user";

import Pagination from "@/components/tables/Pagination";
import { userService } from "@/services/userService";
import { UserListResponseV2 } from "@/types/api";
import { roleService, RoleResponse } from "@/services/roleService";
import { simplifiedRBACService, LocalStorageCustomer } from "@/services/simplifiedRBACService";
import { useAuth } from "@/context/AuthContext";
import CustomerSelector from "@/components/forms/CustomerSelector";
import { ConditionalRender, AdminOnlyRender } from "@/components/rbac/SimplifiedRBACComponents";

// Removed useRoles - using roleService directly
import { staticModuleDefinitions } from "@/config/staticModules";

const columnHelper = createColumnHelper<User>();

interface AdminUserManagementClientProps {
  rbacContext?: any; // Simplified - using AuthContext directly
}

function AdminUserManagementClientWithCustomerMapping({ rbacContext }: AdminUserManagementClientProps) {
  const { user: currentUser, can, isAdmin } = useAuth();
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Customer mapping state
  const [customers, setCustomers] = useState<LocalStorageCustomer[]>([]);
  const [userCustomerAssignments, setUserCustomerAssignments] = useState<Record<string, number[]>>({});
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedUserForCustomerMapping, setSelectedUserForCustomerMapping] = useState<User | null>(null);
  const [selectedUserCustomers, setSelectedUserCustomers] = useState<number[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<User | null>(null);

  const openModal = (user?: User) => {
    setEditingItem(user || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Customer mapping modal functions
  const openCustomerMappingModal = async (user: User) => {
    setSelectedUserForCustomerMapping(user);
    
    try {
      // Get current customer assignments for this user
      const assignedCustomers = await simplifiedRBACService.getAssignedCustomers(parseInt(user.id));
      setSelectedUserCustomers(assignedCustomers);
      
      setIsCustomerModalOpen(true);
    } catch (error) {
      console.error('Error loading customer assignments:', error);
      toast.error('Failed to load customer assignments');
    }
  };

  const closeCustomerMappingModal = () => {
    setIsCustomerModalOpen(false);
    setSelectedUserForCustomerMapping(null);
    setSelectedUserCustomers([]);
  };

  const handleCustomerSelectionChange = (customerIds: number[]) => {
    setSelectedUserCustomers(customerIds);
  };

  const saveCustomerAssignments = async () => {
    if (!selectedUserForCustomerMapping) return;

    try {
      const userId = parseInt(selectedUserForCustomerMapping.id);
      const currentAssignments = await simplifiedRBACService.getAssignedCustomers(userId);
      
      // Find customers to add and remove
      const customersToAdd = selectedUserCustomers.filter(id => !currentAssignments.includes(id));
      const customersToRemove = currentAssignments.filter(id => !selectedUserCustomers.includes(id));
      
      // Perform assignments/removals
      if (customersToAdd.length > 0) {
        await simplifiedRBACService.assignCustomersToUser(userId, customersToAdd, parseInt(currentUser?.id || '1'));
      }
      
      if (customersToRemove.length > 0) {
        await simplifiedRBACService.removeCustomersFromUser(userId, customersToRemove, parseInt(currentUser?.id || '1'));
      }
      
      toast.success('Customer assignments updated successfully');
      closeCustomerMappingModal();
      
      // Refresh user data
      await fetchUsers();
    } catch (error) {
      console.error('Error saving customer assignments:', error);
      toast.error('Failed to save customer assignments');
    }
  };

  // Get roles from Redux
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

  // Load customers and assignments on component mount
  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        const [customersData, assignmentsData] = await Promise.all([
          simplifiedRBACService.getCustomers(),
          simplifiedRBACService.getUserCustomerAssignments()
        ]);
        
        setCustomers(customersData);
        setUserCustomerAssignments(assignmentsData);
      } catch (error) {
        console.error('Error loading customer data:', error);
      }
    };

    loadCustomerData();
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

  // Function to get customer names for a user
  const getUserCustomerNames = (userId: string): string => {
    const assignedCustomerIds = userCustomerAssignments[userId] || [];
    const assignedCustomers = customers.filter(customer => assignedCustomerIds.includes(customer.id));
    
    if (assignedCustomers.length === 0) {
      return 'No customers assigned';
    }
    
    if (assignedCustomers.length <= 2) {
      return assignedCustomers.map(c => c.customer_code).join(', ');
    }
    
    return `${assignedCustomers.slice(0, 2).map(c => c.customer_code).join(', ')} +${assignedCustomers.length - 2} more`;
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setFilterLoading(true);
      
      // Build the request body for the new POST endpoint
      const requestBody = {
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        first_name: globalFilter || undefined,
        last_name: globalFilter || undefined,
        email: globalFilter || undefined,
        organisation_name: globalFilter || undefined,
        role: roleFilter || undefined,
        is_active: statusFilter !== null ? statusFilter : undefined,
        order_by: "created_on",
        order_type: "desc"
      };

      console.log('🚀 Fetching users with request body:', requestBody);
      
      const response = await userService.getUsers(requestBody);
      console.log('📊 Users API response:', response);
      
      if (response && response.results) {
        // Transform API response to match our User type
        const transformedUsers: User[] = response.results.map((apiUser: any) => ({
          id: apiUser.id.toString(),
          firstName: apiUser.first_name,
          lastName: apiUser.last_name,
          email: apiUser.email,
          role: apiUser.is_superuser ? 1 : 2, // Map superuser to admin (1), others to user (2)
          status: apiUser.status ? "active" : "inactive",
          lastLogin: apiUser.last_login || apiUser.created_on,
          createdAt: apiUser.created_on,
          organisation_name: apiUser.organisation_name || "",
          permissions: apiUser.role_data?.[0]?.role_name ? [apiUser.role_data[0].role_name] : [],
          accessControl: [], // Empty array since we're not using default routes anymore
        }));
        setData(transformedUsers);
      } else {
        console.warn('⚠️ No results in users response');
        setData([]);
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      toast.error('Failed to fetch users');
      setData([]);
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, globalFilter, roleFilter, statusFilter]);

  // Fetch users when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const columns = useMemo(() => [
    columnHelper.accessor("firstName", {
      header: "First Name",
      cell: (info) => <span className="font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor("lastName", {
      header: "Last Name",
      cell: (info) => <span className="font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor("email", {
      header: "Email",
      cell: (info) => (
        <span className="text-blue-600 dark:text-blue-400">{info.getValue()}</span>
      )
    }),
    columnHelper.accessor("organisation_name", {
      header: "Organization",
      cell: (info) => info.getValue() || "N/A"
    }),
    columnHelper.accessor("role", {
      header: "Role",
      cell: (info) => {
        const roleId = info.getValue();
        const role = roles.find(r => r.id === roleId.toString());
        return (
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
            {role?.role_name || `Role ${roleId}`}
          </span>
        );
      }
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          info.getValue() === "active"
            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
        }`}>
          {info.getValue() === "active" ? "Active" : "Inactive"}
        </span>
      ),
    }),
    // New column for customer assignments
    columnHelper.display({
      id: "customer_assignments",
      header: "Assigned Customers",
      cell: (info) => (
        <div className="max-w-xs">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {getUserCustomerNames(info.row.original.id)}
          </span>
        </div>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: (info) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openModal(info.row.original)}
            className="p-1"
          >
            <PencilIcon className="w-4 h-4" />
          </Button>
          
          <ConditionalRender privilege="ASSIGN_CUSTOMERS_TO_USER">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openCustomerMappingModal(info.row.original)}
              className="p-1 text-blue-600 hover:text-blue-700"
              title="Manage Customer Assignments"
            >
              <UsersIcon className="w-4 h-4" />
            </Button>
          </ConditionalRender>
          
          <ConditionalRender privilege="DELETE_USER">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openDeleteModal(info.row.original)}
              className="p-1 text-red-600 hover:text-red-700"
            >
              <TrashBinIcon className="w-4 h-4" />
            </Button>
          </ConditionalRender>
        </div>
      ),
    }),
  ], [roles, userCustomerAssignments, customers]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = globalFilter === "" || 
        item.firstName.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.lastName.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.email.toLowerCase().includes(globalFilter.toLowerCase()) ||
        (item.organisation_name && item.organisation_name.toLowerCase().includes(globalFilter.toLowerCase()));

      const matchesRole = roleFilter === null || item.role === roleFilter;
      const matchesStatus = statusFilter === null || 
        (statusFilter && item.status === "active") || 
        (!statusFilter && item.status === "inactive");

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [data, globalFilter, roleFilter, statusFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleAddNew = () => {
    openModal();
  };

  const handleFormSuccess = () => {
    closeModal();
    fetchUsers();
  };

  // Delete user functions
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      await fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setDeleteError(error?.message || 'Failed to delete user');
      toast.error('Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          User Management with Customer Mapping
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage users and their customer assignments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Users</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Active Users</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {data.filter(u => u.status === "active").length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Customers</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{customers.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Users with Assignments</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {Object.keys(userCustomerAssignments).filter(userId => 
              userCustomerAssignments[userId] && userCustomerAssignments[userId].length > 0
            ).length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search users by name, email, or organization..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="flex gap-3">
          <ConditionalRender privilege="CREATE_USER">
            <Button onClick={handleAddNew} size="sm">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </ConditionalRender>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{" "}
          of {table.getFilteredRowModel().rows.length} results
        </div>
        <Pagination
          currentPage={table.getState().pagination.pageIndex + 1}
          totalPages={table.getPageCount()}
          onPageChange={(page) => table.setPageIndex(page - 1)}
        />
      </div>


      {/* User Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit User" : "Add New User"}
        size="lg"
      >
        <UserForm
          initialData={editingItem || undefined}
          onSuccess={handleFormSuccess}
          onCancel={closeModal}
          isEditing={!!editingItem}
        />
      </FormModal>

      {/* Customer Mapping Modal */}
      <FormModal
        isOpen={isCustomerModalOpen}
        onClose={closeCustomerMappingModal}
        title={`Customer Assignments - ${selectedUserForCustomerMapping?.firstName} ${selectedUserForCustomerMapping?.lastName}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Select customers to assign to this user. Users can only see data for their assigned customers.
          </div>
          
          <CustomerSelector
            selectedCustomers={selectedUserCustomers}
            onSelectionChange={handleCustomerSelectionChange}
            placeholder="Search and select customers to assign..."
          />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={closeCustomerMappingModal}
            >
              Cancel
            </Button>
            <Button
              onClick={saveCustomerAssignments}
            >
              Save Assignments
            </Button>
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete the user "${userToDelete?.firstName} ${userToDelete?.lastName}"? This action cannot be undone.`}
        itemName={userToDelete ? `${userToDelete.firstName} ${userToDelete.lastName}` : ''}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}

export default withSimplifiedRBAC(AdminUserManagementClientWithCustomerMapping, {
  privilege: "VIEW_USER_MANAGEMENT",
  role: ["1", "2"], // Admin and Manager roles
  allowSuperUserBypass: true,
  redirectTo: "/dashboard"
});

