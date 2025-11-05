"use client";

import Button from "@/components/ui/button/Button";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Input from "@/components/form/input/InputField";
import { PencilIcon, TrashBinIcon, PlusIcon } from "@/icons";
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import toast from "react-hot-toast";

import { customerService } from "@/services";
import { CustomerResponse, CustomerListRequest } from "@/types/api";
import { withSimplifiedRBAC, SimplifiedRBACProps } from "@/components/auth/withSimplifiedRBAC";

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
import {
  ExcelExportModule,
  SetFilterModule,
  ContextMenuModule,
  ColumnMenuModule
} from "ag-grid-enterprise";

ModuleRegistry.registerModules([
  AllCommunityModule,
  CsvExportModule,
  ExcelExportModule,
  SetFilterModule,
  ContextMenuModule,
  ColumnMenuModule,
]);

// Custom Cell Renderers
const StatusRenderer = (params: ICellRendererParams) => {
  const isActive = params.value;
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${
        isActive
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
};

const CountryRenderer = (params: ICellRendererParams) => {
  return (
    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
      {params.value}
    </span>
  );
};

const CodeRenderer = (params: ICellRendererParams) => {
  return (
    <span className="font-mono text-sm font-semibold">
      {params.value}
    </span>
  );
};

// CompanyRenderer will be defined inside the component to access getCompanyName

const NameRenderer = (params: ICellRendererParams) => {
  return (
    <span className="font-medium">
      {params.value}
    </span>
  );
};

const EmailRenderer = (params: ICellRendererParams) => {
  return (
    <span className="text-sm text-blue-600 dark:text-blue-400">
      {params.value}
    </span>
  );
};

const PhoneRenderer = (params: ICellRendererParams) => {
  return (
    <span className="text-sm text-gray-600 dark:text-gray-400">
      {params.value}
    </span>
  );
};

const TaxIdRenderer = (params: ICellRendererParams) => {
  return (
    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
      {params.value}
    </span>
  );
};

interface CustomerManagerProps {
  rbacContext?: SimplifiedRBACProps['rbacContext'];
}

function CustomerManager({ rbacContext }: CustomerManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  const gridRef = useRef<AgGridReact<CustomerResponse>>(null);
  
  // Use RBAC context from withSimplifiedRBAC instead of duplicate hooks
  const { can, isAdmin, isSuperUser } = rbacContext || {};
  
  // Local state for filtering and pagination
  const [filters, setFilters] = useState<CustomerListRequest>({
    page: 1,
    page_size: 10,
    order_by: "created_on",
    order_type: "desc"
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<CustomerResponse | null>(null);

  // Check if user can delete customer data using RBAC context
  const canDeleteCustomer = can?.("DELETE_CUSTOMER") || isAdmin?.() || isSuperUser;

  // Local state for customers data
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Pagination state for AG Grid
  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 0,
    totalPages: 0,
    totalRecords: 0,
    pageSize: 10,
  });

  // Load customers on component mount and when filters change
  useEffect(() => {
    loadCustomers();
  }, [filters]);

  // Sync grid pagination with our state when data loads
  useEffect(() => {
    if (gridRef.current && paginationInfo.totalRecords > 0) {
      const api = gridRef.current.api;
      // Set the current page in the grid
      api.paginationGoToPage(paginationInfo.currentPage);
      // Update the total row count
      api.setGridOption('rowData', customers);
    }
  }, [paginationInfo, customers]);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Load customers function
  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading customers with filters:', filters);
      const response = await customerService.getCustomers(filters);
      console.log('API response:', response);
      
      setCustomers(response.results);
      setTotal(response.count);
      
      // Update pagination info for AG Grid
      const totalPages = Math.ceil((response.count || 0) / (filters.page_size || 10));
      const paginationInfo = {
        currentPage: (filters.page || 1) - 1, // Convert to 0-based for AG Grid
        totalPages,
        totalRecords: response.count || 0,
        pageSize: filters.page_size || 10,
      };
      
      console.log('Updated pagination info:', paginationInfo);
      setPaginationInfo(paginationInfo);
    } catch (err: any) {
      setError(err?.message || 'Failed to load customers');
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Redirect to add page if action=add
  useEffect(() => {
    if (action === 'add') {
      router.push('/port-customer-master/customers/add');
    }
  }, [action, router]);

  const handleDeleteClick = (customer: CustomerResponse) => {
    if (!canDeleteCustomer) {
      toast.error("You don't have permission to delete customer data");
      return;
    }
    
    setDeletingItem(customer);
    setDeleteModalOpen(true);
  };

  // Company Renderer - uses nested company object (new format) or number (legacy format)
  const CompanyRenderer = useCallback((params: ICellRendererParams) => {
    console.log('Company Renderer params:', params);
    const {company} = params.data; 
    if (!company) {
      return <span className="text-gray-400">-</span>;
    }
    
    // Handle new format: company is an object with {id, name}
    if (typeof company === 'object' && 'name' in company) {
      return (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {company.name || '-'}
        </span>
      );
    }
    
    // Legacy format: company is a number (shouldn't happen with new API, but handle gracefully)
    return <span className="text-gray-400">-</span>;
  }, []);

  // Actions Cell Renderer
  const ActionsRenderer = useCallback((params: ICellRendererParams) => {
    const handleEditClick = () => {
      router.push(`/port-customer-master/customers/edit?id=${params.data.id}`);
    };

    const handleDeleteButtonClick = () => {
      handleDeleteClick(params.data);
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
        
        {canDeleteCustomer && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleDeleteButtonClick}
            className="p-1 text-red-600 hover:text-red-700"
          >
            <TrashBinIcon className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }, [canDeleteCustomer, router]);


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
      field: "name",
      headerName: "Customer Name",
      minWidth: 200,
      flex: 2,
      sortable: true,
      filter: true,
      cellRenderer: NameRenderer,
    },
    {
      field: "customer_code",
      headerName: "Customer Code",
      minWidth: 150,
      flex: 1,
      sortable: true,
      filter: true,
      cellRenderer: CodeRenderer,
    },
    {
      field: "company",
      headerName: "Company",
      minWidth: 150,
      flex: 1,
      sortable: true,
      filter: true,
      valueGetter: (params: any) => {
        // Extract company name from nested object for sorting/filtering
        const company = params.data?.company;
        if (!company) return '';
        
        // Handle new format: company is an object with {id, name}
        if (typeof company === 'object' && 'name' in company) {
          return company.name || '';
        }
        
        // Legacy format: company is a number (shouldn't happen with new API)
        return '';
      },
      cellRenderer: CompanyRenderer,
    },
    {
      field: "contact_person",
      headerName: "Contact Person",
      minWidth: 150,
      flex: 1,
      sortable: true,
      filter: true,
    },
    {
      field: "email",
      headerName: "Email",
      minWidth: 200,
      flex: 1.5,
      sortable: true,
      filter: true,
      cellRenderer: EmailRenderer,
    },
    {
      field: "phone",
      headerName: "Phone",
      minWidth: 150,
      flex: 1,
      sortable: true,
      filter: true,
      cellRenderer: PhoneRenderer,
    },
    {
      field: "country",
      headerName: "Country",
      minWidth: 150,
      flex: 1,
      sortable: true,
      filter: true,
      cellRenderer: CountryRenderer,
    },
    {
      field: "tax_id",
      headerName: "Tax ID",
      minWidth: 150,
      flex: 1,
      sortable: true,
      filter: true,
      cellRenderer: TaxIdRenderer,
    },
    {
      field: "is_active",
      headerName: "Status",
      minWidth: 120,
      flex: 0.8,
      sortable: true,
      filter: true,
      cellRenderer: StatusRenderer,
    },
  ], [ActionsRenderer, CompanyRenderer]);

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
      
      // Update filters with new page (convert from 0-based to 1-based)
      const newPage = currentPage + 1;
      
      console.log('Pagination changed:', {
        currentPage,
        newPage,
        pageSize,
        currentFilters: filters
      });
      
      if (newPage !== filters.page || pageSize !== filters.page_size) {
        console.log('Updating filters with new pagination:', { newPage, pageSize });
        setFilters(prev => ({
          ...prev,
          page: newPage,
          page_size: pageSize,
        }));
      }
    }
  }, [filters.page, filters.page_size]);

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    // Check permission before allowing delete
    if (!canDeleteCustomer) {
      toast.error("You don't have permission to delete customer data");
      setDeleteModalOpen(false);
      setDeletingItem(null);
      return;
    }

    try {
      setLoading(true);
      await customerService.deleteCustomer(deletingItem.id);
      toast.success('Customer deleted successfully');
      setDeleteModalOpen(false);
      setDeletingItem(null);
      
      // Refresh the list
      await loadCustomers();
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast.error(error.message || 'Failed to delete customer');
    } finally {
      setLoading(false);
    }
  };


  const handleSearch = (searchTerm: string) => {
    setGlobalFilter(searchTerm);
    setFilters(prev => ({
      ...prev,
      name: searchTerm,
      page: 1,
    }));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Customer Records
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage customer information and their configurations
        </p>
        
        {/* Permission indicator */}
        {!canDeleteCustomer && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">
                <strong>Read-only mode:</strong> You can view and edit customer data, but cannot delete records.
              </span>
            </div>
          </div>
        )}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">C</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {customers.filter(c => c.is_active).length}
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 text-sm font-bold">✓</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Countries</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {new Set(customers.map(c => c.country)).size}
              </p>
            </div>
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400 text-sm font-bold">🌍</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">With Tax ID</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {customers.filter(c => c.tax_id).length}
              </p>
            </div>
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <span className="text-orange-600 dark:text-orange-400 text-sm font-bold">📄</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 py-4">
        <div className="flex-1">
          <Input
            placeholder="Search customers by Company Name"
            value={globalFilter}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => router.push('/port-customer-master/customers/add')}
            className="flex items-center gap-2 bg-theme-purple-600 hover:bg-theme-purple-700 text-white whitespace-nowrap"
          >
            <PlusIcon className="w-4 h-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* AG Grid Table */}
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
        style={{ height: "600px" }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={customers}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          loading={loading}
          pagination={true}
          paginationPageSize={filters.page_size}
          paginationAutoPageSize={false}
          suppressPaginationPanel={false}
          paginationPageSizeSelector={[10, 25, 50, 100]}
          domLayout="normal"
          animateRows={true}
          className="ag-theme-alpine"
          onPaginationChanged={onPaginationChanged}
          rowSelection={{ mode: "multiRow" }}
          defaultCsvExportParams={{
            fileName: `customers_${new Date().toISOString().split('T')[0]}.csv`,
            onlySelected: true,
          }}
          defaultExcelExportParams={{
            fileName: `customers_${new Date().toISOString().split('T')[0]}.xlsx`,
            sheetName: "Customers",
            onlySelected: true,
          }}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingItem(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer"
        message={`Are you sure you want to delete the customer "${deletingItem?.name}" (${deletingItem?.customer_code})? This action cannot be undone.`}
        itemName={deletingItem?.name}
        isLoading={loading}
        variant="danger"
      />
    </div>
  );
}

export default withSimplifiedRBAC(CustomerManager, {
  privilege: "VIEW_CUSTOMERS",
  module: [60],
  allowSuperUserBypass: true,
  redirectTo: "/dashboard"
});