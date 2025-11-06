"use client";

import Button from "@/components/ui/button/Button";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Input from "@/components/form/input/InputField";
import { PencilIcon, TrashBinIcon, PlusIcon } from "@/icons";
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import toast from "react-hot-toast";

import { customerService } from "@/services";
import { CustomerResponse, CustomerListRequest, UpdateCustomerRequest } from "@/types/api";
import { withSimplifiedRBAC, SimplifiedRBACProps } from "@/components/auth/withSimplifiedRBAC";

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
  
  const [globalFilter, setGlobalFilter] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<CustomerResponse | null>(null);

  // Check if user can delete customer data using RBAC context
  const canDeleteCustomer = can?.("DELETE_CUSTOMER") || isAdmin?.() || isSuperUser;

  // Local state for customers data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [totalInactive, setTotalInactive] = useState(0);

  // Auto-clear errors after 5 seconds
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
          const requestParams: CustomerListRequest = {
            page: page,
            page_size: pageSize,
            order_by: "created_on",
            order_type: "desc"
          };

          // Add search filter if present
          if (searchTerm) {
            requestParams.name = searchTerm;
          }

          // Handle sorting from AG Grid
          if (params.request.sortModel && params.request.sortModel.length > 0) {
            const sortModel = params.request.sortModel[0];
            requestParams.order_by = sortModel.colId;
            requestParams.order_type = sortModel.sort;
          }

          // Call your API
          const response = await customerService.getCustomers(requestParams);
          
          // Update stats from response
          setTotal(response.count || 0);
          setTotalActive(response.total_is_active || 0);
          setTotalInactive(response.total_inactive || 0);

          // For server-side row model with pagination, we need to return the exact row count
          // instead of determining lastRow
          const rowsThisPage = response.results || [];
          
          // Call success callback with data and total row count
          params.success({
            rowData: rowsThisPage,
            rowCount: response.count || 0, // Total number of rows available on server
          });

        } catch (error: any) {
          console.error('Error loading customers:', error);
          setError(error.message || 'Failed to load customers');
          params.fail();
        } finally {
          setLoading(false);
        }
      },
    };
  }, []);

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
    const [isUpdating, setIsUpdating] = useState(false);
    
    const handleEditClick = () => {
      router.push(`/port-customer-master/customers/edit?id=${params.data.id}`);
    };

    const handleDeleteButtonClick = () => {
      handleDeleteClick(params.data);
    };

    const handleRestoreClick = async () => {
      if (isUpdating) return;
      
      try {
        setIsUpdating(true);
        
        // Call the updateCustomer API to set status to active
        const updateData: UpdateCustomerRequest = {
          is_active: true,
          company: params.data.company?.id || params.data.company,
          name: params.data.name,
          customer_code: params.data.customer_code,
          contact_person: params.data.contact_person,
          email: params.data.email,
          phone: params.data.phone,
          address: params.data.address,
          country: params.data.country,
          tax_id: params.data.tax_id,
        };
        
        await customerService.updateCustomer(params.data.id, updateData);
        
        toast.success(`Customer "${params.data.name}" has been activated successfully`);
        
        // Refresh the grid data
        if (gridRef.current) {
          const api = gridRef.current.api;
          const datasource = getServerSideDatasource(globalFilter);
          api.setGridOption('serverSideDatasource', datasource);
        }
        
      } catch (error: any) {
        console.error('Error activating customer:', error);
        toast.error(error.message || 'Failed to activate customer');
      } finally {
        setIsUpdating(false);
      }
    };

    // If the record is inactive, show only the restore switch button
    if (!params.data.is_active) {
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
  }, [canDeleteCustomer, router, globalFilter]);


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
      field: "name",
      headerName: "Customer Name",
      minWidth: 200,
      flex: 2,
      sortable: true,
      filter: false, // Disable column-level filtering for server-side
      cellRenderer: NameRenderer,
    },
    {
      field: "customer_code",
      headerName: "Customer Code",
      minWidth: 150,
      flex: 1,
      sortable: true,
      filter: false,
      cellRenderer: CodeRenderer,
    },
    {
      field: "company",
      headerName: "Company",
      minWidth: 150,
      flex: 1,
      sortable: true,
      filter: false,
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
      filter: false,
    },
    {
      field: "email",
      headerName: "Email",
      minWidth: 200,
      flex: 1.5,
      sortable: true,
      filter: false,
      cellRenderer: EmailRenderer,
    },
    {
      field: "phone",
      headerName: "Phone",
      minWidth: 150,
      flex: 1,
      sortable: true,
      filter: false,
      cellRenderer: PhoneRenderer,
    },
    {
      field: "country",
      headerName: "Country",
      minWidth: 150,
      flex: 1,
      sortable: true,
      filter: false,
      cellRenderer: CountryRenderer,
    },
    {
      field: "tax_id",
      headerName: "Tax ID",
      minWidth: 150,
      flex: 1,
      sortable: true,
      filter: false,
      cellRenderer: TaxIdRenderer,
    },
    {
      field: "is_active",
      headerName: "Status",
      minWidth: 120,
      flex: 0.8,
      sortable: true,
      filter: false,
      cellRenderer: StatusRenderer,
    },
  ], [ActionsRenderer, CompanyRenderer]);

  // Default Column Definition
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: true,
    filter: false, // Disable default filtering for server-side
    flex: 1,
    minWidth: 100,
  }), []);

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
      
      // Refresh data by updating the datasource
      if (gridRef.current) {
        const api = gridRef.current.api;
        const datasource = getServerSideDatasource(globalFilter);
        api.setGridOption('serverSideDatasource', datasource);
      }
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast.error(error.message || 'Failed to delete customer');
    } finally {
      setLoading(false);
    }
  };


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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Customers</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{total}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Active Customers</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalActive}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Inactive Customers</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{totalInactive}</div>
        </div>
        {/* <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">-</div>
        </div> */}
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
        style={{ height: `${gridHeight}px` }}
      >
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          loading={loading}
          
          // Server-side row model configuration
          rowModelType="serverSide"
          
          // Cache configuration
          cacheBlockSize={10} // Must match paginationPageSize
          maxBlocksInCache={10} // Keep multiple pages in cache
          
          // Pagination configuration
          pagination={true}
          paginationPageSize={10} // Must match cacheBlockSize
          paginationPageSizeSelector={[10, 25, 50, 100]}
          paginationAutoPageSize={true}
          suppressPaginationPanel={false}
          
          onGridReady={handleGridReady}
          domLayout="normal"
          animateRows={true}
          className="ag-theme-alpine"
          
          rowSelection={{ mode: "multiRow", groupSelects: "descendants" }}
          
          // Default export configurations
          defaultCsvExportParams={{
            fileName: `customers_${new Date().toISOString().split('T')[0]}.csv`,
            onlySelected: true,
            onlySelectedAllPages: true,
          }}
          defaultExcelExportParams={{
            fileName: `customers_${new Date().toISOString().split('T')[0]}.xlsx`,
            sheetName: "Customers",
            onlySelected: true,
            onlySelectedAllPages: true,
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