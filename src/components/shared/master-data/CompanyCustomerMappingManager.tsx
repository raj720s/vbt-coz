"use client";

import Button from "@/components/ui/button/Button";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Input from "@/components/form/input/InputField";
import { PencilIcon, TrashBinIcon, PlusIcon, AlertIcon, CheckCircleIcon } from "@/icons";
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import toast from "react-hot-toast";
import { 
  CompanyCustomerMapping, 
  CompanyCustomerMappingListRequest,
  CompanyCustomerMappingListResponse,
} from "@/types/companyCustomerMapping";
import { companyCustomerMappingService } from "@/services/companyCustomerMappingService";
import { withSimplifiedRBAC, SimplifiedRBACProps } from "@/components/auth/withSimplifiedRBAC";
import SearchableMultiSelect from "@/components/form/input/SearchableMultiSelect";

// AG Grid imports
import type {
  ColDef,
  GridReadyEvent,
  ICellRendererParams,
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
      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
        isActive
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      }`}
    >
      {isActive ? (
        <>
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Active
        </>
      ) : (
        <>
          <AlertIcon className="w-3 h-3 mr-1" />
          Inactive
        </>
      )}
    </span>
  );
};

const NameRenderer = (params: ICellRendererParams) => {
  return (
    <span className="font-medium text-gray-900 dark:text-white">
      {params.value}
    </span>
  );
};

// Customers Multi-select Cell Renderer for AG Grid
const CustomersCellRenderer = (params: ICellRendererParams) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>(params.data?.customer_ids || []);
  const cellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedCustomerIds(params.data?.customer_ids || []);
  }, [params.data?.customer_ids]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cellRef.current && !cellRef.current.contains(event.target as Node)) {
        setIsEditing(false);
      }
    };

    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isEditing]);

  const handleSave = async () => {
    try {
      await companyCustomerMappingService.updateMapping(params.data.id, {
        customer_ids: selectedCustomerIds,
      });
      params.data.customer_ids = selectedCustomerIds;
      params.data.customers = params.data.customers.filter((c: any) => 
        selectedCustomerIds.includes(c.id)
      );
      params.api.refreshCells({ rowNodes: [params.node!] });
      setIsEditing(false);
      toast.success("Customers updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update customers");
    }
  };

  const searchCustomers = async (query: string) => {
    try {
      const results = await companyCustomerMappingService.searchCustomers(query);
      return results;
    } catch (e) {
      console.error("Failed to fetch customers:", e);
      return [];
    }
  };

  if (isEditing) {
    return (
      <div ref={cellRef} className="w-full" onClick={(e) => e.stopPropagation()}>
        <SearchableMultiSelect
          id={`customer-select-${params.data.id}`}
          label=""
          placeholder="Select customers"
          value={selectedCustomerIds}
          onChange={(value) => setSelectedCustomerIds(value as number[])}
          onSearch={searchCustomers}
          displayFormat={(option: any) => `${option.name} (${option.customer_code || option.code})`}
          searchPlaceholder="Search customers..."
          className="w-full"
        />
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            className="text-xs px-2 py-1"
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedCustomerIds(params.data?.customer_ids || []);
              setIsEditing(false);
            }}
            className="text-xs px-2 py-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  const customers = params.data?.customers || [];
  const displayText = customers.length > 0
    ? customers.map((c: any) => c.name).join(", ")
    : "No customers";

  return (
    <div
      className="w-full cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
      onClick={() => setIsEditing(true)}
      title={displayText}
    >
      <div className="flex flex-wrap gap-1">
        {customers.length > 0 ? (
          customers.slice(0, 3).map((customer: any) => (
            <span
              key={customer.id}
              className="inline-flex items-center px-2 py-1 text-xs bg-theme-purple-100 dark:bg-theme-purple-900 text-theme-purple-800 dark:text-theme-purple-200 rounded"
            >
              {customer.name}
            </span>
          ))
        ) : (
          <span className="text-gray-400 dark:text-gray-500 text-sm">No customers</span>
        )}
        {customers.length > 3 && (
          <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
            +{customers.length - 3} more
          </span>
        )}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Click to edit
      </div>
    </div>
  );
};

interface CompanyCustomerMappingManagerProps {
  rbacContext?: SimplifiedRBACProps['rbacContext'];
}

function CompanyCustomerMappingManager({ rbacContext }: CompanyCustomerMappingManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  
  const { can, isAdmin, isSuperUser } = rbacContext || {};
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [totalInactive, setTotalInactive] = useState(0);
  const gridRef = useRef<AgGridReact<CompanyCustomerMapping>>(null);
  
  const [globalFilter, setGlobalFilter] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<CompanyCustomerMapping | null>(null);

  const canDeleteMapping = can?.("DELETE_COMPANY_CUSTOMER_MAPPING") || isAdmin?.() || isSuperUser;

  // Redirect to add page if action=add
  useEffect(() => {
    if (action === 'add') {
      router.push('/company-customer-mappings/add');
    }
  }, [action, router]);

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
          const requestParams: CompanyCustomerMappingListRequest = {
            page: page,
            page_size: pageSize,
            order_by: "company_name",
            order_type: "asc"
          };

          // Add search filter if present
          if (searchTerm) {
            requestParams.search = searchTerm;
          }

          // Handle sorting from AG Grid
          if (params.request.sortModel && params.request.sortModel.length > 0) {
            const sortModel = params.request.sortModel[0];
            requestParams.order_by = sortModel.colId;
            requestParams.order_type = sortModel.sort;
          }

          // Call your API
          const response = await companyCustomerMappingService.getMappings(requestParams);
          
          // Update stats from response
          setTotal(response.count || 0);
          setTotalActive(response.total_is_active || 0);
          setTotalInactive(response.total_inactive || 0);

          // For server-side row model with pagination, return exact row count
          const rowsThisPage = response.results || [];
          const lastRow = response.count || 0;

          params.success({
            rowData: rowsThisPage,
            rowCount: lastRow,
          });
        } catch (err: any) {
          console.error("Error fetching mappings:", err);
          setError(err.message || "Failed to load mappings");
          params.fail();
        } finally {
          setLoading(false);
        }
      },
    };
  }, []);

  // Handle grid ready
  const handleGridReady = useCallback((params: GridReadyEvent) => {
    const datasource = getServerSideDatasource(globalFilter);
    params.api.setGridOption("serverSideDatasource", datasource);
  }, [getServerSideDatasource, globalFilter]);

  // Refresh grid when global filter changes
  useEffect(() => {
    if (gridRef.current?.api) {
      const datasource = getServerSideDatasource(globalFilter);
      gridRef.current.api.setGridOption("serverSideDatasource", datasource);
    }
  }, [globalFilter, getServerSideDatasource]);

  // Actions Cell Renderer
  const ActionsRenderer = useCallback((params: ICellRendererParams) => {
    const handleEditClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(`/company-customer-mappings/edit?id=${params.data.id}`);
    };

    const handleDeleteButtonClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setDeletingItem(params.data);
      setDeleteModalOpen(true);
    };

    // For inactive records, show restore button
    if (!params.data.is_active) {
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
        
        {canDeleteMapping && (
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
  }, [canDeleteMapping, router, globalFilter]);

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
      field: "company_name",
      headerName: "Company Name",
      minWidth: 200,
      flex: 2,
      sortable: true,
      filter: false,
      cellRenderer: NameRenderer,
    },
    {
      field: "company_type_label",
      headerName: "Company Type",
      minWidth: 150,
      flex: 1,
      sortable: true,
      filter: false,
    },
    {
      field: "customers",
      headerName: "Customers",
      minWidth: 300,
      flex: 3,
      sortable: false,
      filter: false,
      cellRenderer: CustomersCellRenderer,
      editable: false,
    },
    {
      field: "is_active",
      headerName: "Status",
      width: 120,
      minWidth: 120,
      sortable: true,
      filter: false,
      cellRenderer: StatusRenderer,
    },
  ], [ActionsRenderer]);

  // Default Column Definition
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: true,
    filter: false,
  }), []);

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    try {
      setLoading(true);
      await companyCustomerMappingService.deleteMapping(deletingItem.id);
      toast.success("Mapping deleted successfully");
      
      // Refresh grid
      if (gridRef.current?.api) {
        const datasource = getServerSideDatasource(globalFilter);
        gridRef.current.api.setGridOption("serverSideDatasource", datasource);
      }
      
      setDeleteModalOpen(false);
      setDeletingItem(null);
    } catch (err: any) {
      console.error("Error deleting mapping:", err);
      toast.error(err.message || "Failed to delete mapping");
    } finally {
      setLoading(false);
    }
  };

  const gridHeight = 600;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Company Customer Mappings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage mappings between companies and customers
          </p>
        </div>
        <Button
          onClick={() => router.push("/company-customer-mappings/add")}
          className="flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Add Mapping
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Mappings</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{total}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalActive}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Inactive</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{totalInactive}</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by company name or customer name..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full"
            />
          </div>
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
          // @ts-ignore
          serverSideStoreType="partial"
          
          // Cache configuration - MUST match pagination size
          cacheBlockSize={10} // Must match paginationPageSize
          maxBlocksInCache={10} // Keep multiple pages in cache
          
          // Pagination configuration
          pagination={true}
          paginationPageSize={10} // Must match cacheBlockSize
          paginationPageSizeSelector={[10, 25, 50, 100]}
          
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
            fileName: `company_customer_mappings_${new Date().toISOString().split('T')[0]}.csv`,
            onlySelectedAllPages: true,
          }}
          defaultExcelExportParams={{
            fileName: `company_customer_mappings_${new Date().toISOString().split('T')[0]}.xlsx`,
            sheetName: "Company Customer Mappings",
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
        itemName={deletingItem?.company_name || "this mapping"}
        isLoading={loading}
      />
    </div>
  );
}

export default withSimplifiedRBAC(CompanyCustomerMappingManager, {
  privilege: "VIEW_COMPANY_CUSTOMER_MAPPINGS"
});

