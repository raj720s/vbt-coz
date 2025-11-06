"use client";

import Button from "@/components/ui/button/Button";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Input from "@/components/form/input/InputField";
import { DownloadIcon, PencilIcon, TrashBinIcon, PlusIcon } from "@/icons";
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import toast from "react-hot-toast";
import { POLResponse, POLListRequest, CreatePOLRequest, UpdatePOLRequest } from "@/types/api";
import { polService } from "@/services";
import { withSimplifiedRBAC, SimplifiedRBACProps } from "@/components/auth/withSimplifiedRBAC";

// AG Grid imports
import type {
  ColDef,
  GridReadyEvent,
  CellClickedEvent,
  ValueFormatterParams,
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
  ServerSideRowModelModule, // Import the server-side row model module
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

// Custom Cell Renderers (keeping existing ones)
const StatusRenderer = (params: ICellRendererParams) => {
  const isActive = params.value;
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${isActive
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
};

const TimezoneRenderer = (params: ICellRendererParams) => {
  return (
    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
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

const NameRenderer = (params: ICellRendererParams) => {
  return (
    <span className="font-medium">
      {params.value}
    </span>
  );
};

interface PolDataManagerProps {
  rbacContext?: SimplifiedRBACProps['rbacContext'];
}

function PolDataManager({ rbacContext }: PolDataManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  const { can, isAdmin, isSuperUser } = rbacContext || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [totalInactive, setTotalInactive] = useState(0);
  const gridRef = useRef<AgGridReact<POLResponse>>(null);

  // Global filter state for search functionality
  const [globalFilter, setGlobalFilter] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<POLResponse | null>(null);

  const canDeletePOL = can?.("DELETE_POL") || isAdmin?.() || isSuperUser;

  // Redirect to add page if action=add
  useEffect(() => {
    if (action === 'add') {
      router.push('/port-customer-master/pol-ports/add');
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
          const requestParams: POLListRequest = {
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
          const response = await polService.getPOLs(requestParams);
          
          // Update stats from response
          setTotal(response.count || 0);
          setTotalActive(response.total_is_active || 0);
          setTotalInactive(response.total_inactive || 0);

          // Determine if this is the last row
          const lastRow = response.count <= endRow ? response.count : undefined;

          // Call success callback with data
          params.success({
            rowData: response.results || [],
            rowCount: lastRow,
          });

        } catch (error: any) {
          console.error('Error loading POL ports:', error);
          setError(error.message || 'Failed to load POL ports');
          params.fail();
        } finally {
          setLoading(false);
        }
      },
    };
  }, []);

  const handleDeleteClick = (pol: POLResponse) => {
    if (!canDeletePOL) {
      toast.error("You don't have permission to delete POL data");
      return;
    }
    setDeletingItem(pol);
    setDeleteModalOpen(true);
  };

 
const ActionsRenderer = useCallback((params: ICellRendererParams) => {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleEditClick = () => {
    router.push(`/port-customer-master/pol-ports/edit?id=${params.data.id}`);
  };

  const handleDeleteButtonClick = () => {
    handleDeleteClick(params.data);
  };

  const handleRestoreClick = async () => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      // Call the updatePOL API to set status to active
      const updateData: UpdatePOLRequest = {
        is_active: true,
        country: params.data.country,
        unlocode: params.data.unlocode,
        timezone: params.data.timezone,
        latitude: params.data.latitude,
        longitude: params.data.longitude,
        name: params.data.name,
        code: params.data.code,
        address: params.data.address,
        description: params.data.description,
      };
      
      await polService.updatePOL(params.data.id, updateData);
      
      toast.success(`POL port "${params.data.name}" has been activated successfully`);
      
      // Refresh the grid data
      if (gridRef.current) {
        const api = gridRef.current.api;
        const datasource = getServerSideDatasource(globalFilter);
        api.setGridOption('serverSideDatasource', datasource);
      }
      
    } catch (error: any) {
      console.error('Error activating POL port:', error);
      toast.error(error.message || 'Failed to activate POL port');
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

      {canDeletePOL && (
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
}, [canDeletePOL, router, globalFilter]);


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
      field: "code",
      headerName: "Port Code",
      minWidth: 150,
      flex: 1,
      sortable: true,
      filter: false, // Disable column-level filtering for server-side
      cellRenderer: CodeRenderer,
    },
    {
      field: "name",
      headerName: "Port Name",
      minWidth: 200,
      flex: 2,
      sortable: true,
      filter: false,
      cellRenderer: NameRenderer,
    },
    {
      field: "country",
      headerName: "Country",
      minWidth: 150,
      flex: 1,
      sortable: true,
      filter: false,
    },
    {
      field: "unlocode",
      headerName: "UNLOCODE",
      minWidth: 150,
      flex: 1,
      sortable: true,
      filter: false,
    },
    {
      field: "timezone",
      headerName: "Timezone",
      minWidth: 150,
      flex: 1,
      sortable: true,
      filter: false,
      cellRenderer: TimezoneRenderer,
    },
    {
      field: "latitude",
      headerName: "Latitude",
      minWidth: 120,
      flex: 1,
      sortable: true,
      filter: false,
    },
    {
      field: "longitude",
      headerName: "Longitude",
      minWidth: 120,
      flex: 1,
      sortable: true,
      filter: false,
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
  ], [ActionsRenderer]);

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

    if (!canDeletePOL) {
      toast.error("You don't have permission to delete POL data");
      setDeleteModalOpen(false);
      setDeletingItem(null);
      return;
    }

    try {
      setLoading(true);
      await polService.deletePOL(deletingItem.id);
      toast.success('POL port deleted successfully');
      setDeleteModalOpen(false);
      setDeletingItem(null);
      
      // Refresh data by updating the datasource
      if (gridRef.current) {
        const api = gridRef.current.api;
        const datasource = getServerSideDatasource(globalFilter);
        api.setGridOption('serverSideDatasource', datasource);
      }
    } catch (error: any) {
      console.error('Error deleting POL port:', error);
      toast.error(error.message || 'Failed to delete POL port');
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
    params.api!.setRowCount(20);
    
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
          POL Master
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage Port of Loading (POL) ports and their configurations
        </p>

        {!canDeletePOL && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">
                <strong>Read-only mode:</strong> You can view and edit POL data, but cannot delete records.
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
          <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{total}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Active</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalActive}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Inactive</div>
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
            placeholder="Search ports by Port Name"
            value={globalFilter}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => router.push('/port-customer-master/pol-ports/add')}
            className="flex items-center gap-2 bg-theme-purple-600 hover:bg-theme-purple-700 text-white whitespace-nowrap"
          >
            <PlusIcon className="w-4 h-4" />
            Add POL Port
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
          // rowData={polData}
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
          
          rowSelection={{ mode: "multiRow" , groupSelects:"descendants" }}
          
          // Default export configurations
          defaultCsvExportParams={{
            fileName: `pol_ports_${new Date().toISOString().split('T')[0]}.csv`,
            onlySelectedAllPages: true,
          }}
          defaultExcelExportParams={{
            fileName: `pol_ports_${new Date().toISOString().split('T')[0]}.xlsx`,
            sheetName: "POL Ports",
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
        title="Delete POL Port"
        message={`Are you sure you want to delete the POL port "${deletingItem?.name}" (${deletingItem?.code})? This action cannot be undone.`}
        itemName={deletingItem?.name}
        isLoading={loading}
        variant="danger"
      />
    </div>
  );
}

export default withSimplifiedRBAC(PolDataManager, {
  privilege: "VIEW_POL_PORTS",
  module: [60],
  allowSuperUserBypass: true,
  redirectTo: "/dashboard"
});

console.log('🔐 PolDataManager loaded with role config:', [1, 2, 3]);
