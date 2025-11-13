"use client";
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShipmentOrderStatus,
  TransportationMode,
  ServiceType,
  CargoType,
  ShipmentListRequest,
  ShipmentListResponse,
} from "@/types/shipmentOrder";
import { shipmentOrderService } from "@/services/shipmentOrderService";
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { withSimplifiedRBAC, SimplifiedRBACProps } from "@/components/auth/withSimplifiedRBAC";
import { 
  PlusIcon, 
  PencilIcon, 
  TrashBinIcon, 
} from "@/icons";
import toast from "react-hot-toast";

// AG Grid imports
import type {
  ColDef,
  GridReadyEvent,
  ICellRendererParams,
  ValueFormatterParams,
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
const StatusRenderer = (params: ICellRendererParams) => {
  // Handle both numeric status codes and status_description string
  const statusCode = params.data?.vendor_booking_status as number;
  const statusDescription = params.data?.status_description as string;
  
  const statusColors: { [key: number]: string } = {
    5: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", // Draft
    10: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", // Confirmed
    15: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", // Shipped
    20: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", // Booked
    25: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200", // Modified
    30: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", // Cancelled
  };

  const getStatusText = (code: number | undefined): string => {
    const statusMap: { [key: number]: string } = {
      5: 'Draft',
      10: 'Confirmed',
      15: 'Shipped',
      20: 'Booked',
      25: 'Modified',
      30: 'Cancelled'
    };
    return statusMap[code || 5] || 'Draft';
  };

  const displayStatus = statusDescription || getStatusText(statusCode);
  const statusColor = statusColors[statusCode || 5] || statusColors[5];

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
      {displayStatus}
    </span>
  );
};

const BookingNumberRenderer = (params: ICellRendererParams) => {
  return (
    <span className="font-mono text-sm font-semibold text-purple-600 dark:text-purple-400">
      {params.value || "N/A"}
    </span>
  );
};

const DateRenderer = (params: ICellRendererParams) => {
  if (!params.value) return <span className="text-gray-400">N/A</span>;
  try {
    const date = new Date(params.value);
    return <span className="text-sm">{date.toLocaleDateString()}</span>;
  } catch {
    return <span className="text-gray-400">Invalid Date</span>;
  }
};

const NameRenderer = (params: ICellRendererParams) => {
  return (
    <span className="font-medium">
      {params.value}
    </span>
  );
};

interface ShipmentOrderManagerProps {
  rbacContext?: SimplifiedRBACProps["rbacContext"];
}

function ShipmentOrderManager({ rbacContext }: ShipmentOrderManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  const { can, isAdmin, isSuperUser } = rbacContext || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [totalInactive, setTotalInactive] = useState(0);
  const gridRef = useRef<AgGridReact<ShipmentListResponse>>(null);

  // Global filter state for search functionality
  const [globalFilter, setGlobalFilter] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ShipmentListResponse | null>(null);

  const canDeleteShipment = can?.("DELETE_SHIPMENT") || isAdmin?.() || isSuperUser;

  // Redirect to add page if action=add
  useEffect(() => {
    if (action === 'add') {
      router.push('/shipment-orders/add');
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
          const requestParams: ShipmentListRequest = {
            page: page,
            page_size: pageSize,
            order_by: "created_on",
            order_type: "desc"
          };

          // Add search filter if present (search across multiple fields)
          if (searchTerm) {
            // Search can match vendor_booking_number, shipper, consignee, carrier_booking_number, etc.
            // For now, using vendor_booking_number as primary search field
            requestParams.vendor_booking_number = searchTerm;
            // You can also add other search fields here if needed
            // requestParams.shipper = searchTerm;
            // requestParams.consignee = searchTerm;
          }

          // Handle sorting from AG Grid
          if (params.request.sortModel && params.request.sortModel.length > 0) {
            const sortModel = params.request.sortModel[0];
            requestParams.order_by = sortModel.colId;
            requestParams.order_type = sortModel.sort;
          }

          // Call your API
          const response = await shipmentOrderService.listShipmentOrders(requestParams);
          
          // Calculate active/inactive from results using is_active field
          const results = response.results || [];
          const activeCount = results.filter((item: ShipmentListResponse) => 
            item.is_active !== false && item.is_active !== undefined
          ).length;
          const inactiveCount = results.filter((item: ShipmentListResponse) => 
            item.is_active === false
          ).length;

          // Update stats from response
          setTotal(response.count || 0);
          // Note: These are approximations from current page only
          // For accurate counts, API should provide total_is_active and total_inactive
          setTotalActive(activeCount);
          setTotalInactive(inactiveCount);

          // For server-side row model with pagination, we need to return the exact row count
          const rowsThisPage = results;
          
          // Call success callback with data and total row count
          params.success({
            rowData: rowsThisPage,
            rowCount: response.count || 0, // Total number of rows available on server
          });

        } catch (error: any) {
          console.error('Error loading shipment orders:', error);
          setError(error.message || 'Failed to load shipment orders');
          params.fail();
        } finally {
          setLoading(false);
        }
      },
    };
  }, []);

  const handleDeleteClick = (order: ShipmentListResponse) => {
    if (!canDeleteShipment) {
      toast.error("You don't have permission to delete shipment orders");
      return;
    }
    setDeletingItem(order);
    setDeleteModalOpen(true);
  };

  // Actions Cell Renderer Component
  const ActionsRenderer = (params: ICellRendererParams) => {
    const handleEditClick = () => {
      router.push(`/shipment-orders/edit?id=${params.data.id}`);
    };

    const handleDeleteButtonClick = () => {
      handleDeleteClick(params.data);
    };

    return (
      <div className="flex items-center justify-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleEditClick}
          className="p-1 text-purple-600 hover:text-purple-700"
        >
          <PencilIcon className="w-4 h-4" />
        </Button>

        {canDeleteShipment && (
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
      suppressColumnsToolPanel: true,
    },
    {
      field: "vendor_booking_number",
      headerName: "Booking Number",
      minWidth: 180,
      flex: 1,
      sortable: true,
      filter: false,
      cellRenderer: BookingNumberRenderer,
    },
    {
      field: "status_description",
      headerName: "Status",
      minWidth: 120,
      flex: 1,
      sortable: true,
      filter: false,
      cellRenderer: StatusRenderer,
      valueGetter: (params) => {
        // Return status_description if available, otherwise use vendor_booking_status
        return params.data?.status_description || params.data?.vendor_booking_status;
      },
    },
    {
      field: "shipper",
      headerName: "Shipper",
      minWidth: 200,
      flex: 2,
      sortable: true,
      filter: false,
      cellRenderer: NameRenderer,
    },
    {
      field: "consignee",
      headerName: "Consignee",
      minWidth: 200,
      flex: 2,
      sortable: true,
      filter: false,
      cellRenderer: NameRenderer,
    },
    {
      field: "customer_name",
      headerName: "Customer",
      minWidth: 150,
      flex: 1,
      sortable: true,
      filter: false,
      cellRenderer: NameRenderer,
    },
    {
      field: "transportation_mode_description",
      headerName: "Transport Mode",
      minWidth: 150,
      flex: 1,
      sortable: true,
      filter: false,
      valueFormatter: (params: ValueFormatterParams) => {
        // Handle numeric IDs: 5=Ocean, 10=Air, 15=Truck, 20=Rail
        const modeMap: { [key: number]: string } = {
          5: 'Ocean',
          10: 'Air',
          15: 'Truck',
          20: 'Rail'
        };
        return modeMap[params.value as number] || params.value || "N/A";
      },
    },
    {
      field: "service_type_description",
      headerName: "Service Type",
      minWidth: 120,
      flex: 1,
      sortable: true,
      filter: false,
      valueFormatter: (params: ValueFormatterParams) => {
        // Use service_type_description if available, otherwise format numeric ID
        if (params.value) return params.value;
        const serviceType = params.data?.service_type;
        const serviceMap: { [key: number]: string } = {
          5: 'CY',
          10: 'CFS'
        };
        return serviceMap[serviceType as number] || serviceType || "N/A";
      },
    },
    {
      field: "cargo_readiness_date",
      headerName: "Cargo Readiness",
      minWidth: 150,
      flex: 1,
      sortable: true,
      filter: false,
      cellRenderer: DateRenderer,
    },
    {
      field: "volume_booked",
      headerName: "Volume Booked (CBM)",
      minWidth: 140,
      flex: 1,
      sortable: true,
      filter: false,
      valueFormatter: (params: ValueFormatterParams) => {
        return params.value ? `${params.value} CBM` : "N/A";
      },
    },
    {
      field: "weight_booked",
      headerName: "Weight Booked (KG)",
      minWidth: 140,
      flex: 1,
      sortable: true,
      filter: false,
      valueFormatter: (params: ValueFormatterParams) => {
        return params.value ? `${params.value} KG` : "N/A";
      },
    },
    {
      field: "is_active",
      headerName: "Active",
      minWidth: 100,
      flex: 0.8,
      sortable: true,
      filter: false,
      cellRenderer: (params: ICellRendererParams) => {
        const isActive = params.value !== false;
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            isActive
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}>
            {isActive ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      field: "created_on",
      headerName: "Created On",
      minWidth: 180,
      flex: 1,
      sortable: true,
      filter: false,
      hide: true,
      valueFormatter: (params: ValueFormatterParams) => {
        if (!params.value) return "N/A";
        try {
          const date = new Date(params.value);
          return date.toLocaleDateString();
        } catch {
          return "N/A";
        }
      },
    },
  ], [ActionsRenderer]);

  // Default Column Definition
  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
    }),
    []
  );

  // Handle search
  const handleSearch = (searchTerm: string) => {
    setGlobalFilter(searchTerm);
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

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    if (!canDeleteShipment) {
      toast.error("You don't have permission to delete shipment orders");
      setDeleteModalOpen(false);
      setDeletingItem(null);
      return;
    }

    try {
      setLoading(true);
      await shipmentOrderService.deleteShipmentOrder(deletingItem.id);
      toast.success("Shipment order deleted successfully");
      setDeleteModalOpen(false);
      setDeletingItem(null);
      
      // Refresh the grid
      if (gridRef.current) {
        const api = gridRef.current.api;
        api.refreshServerSide({ purge: true });
      }
    } catch (error: any) {
      console.error("Error deleting shipment order:", error);
      toast.error(error.message || "Failed to delete shipment order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-0">
      {/* Header */}
      <div className="py-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Shipment Orders
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage vendor booking shipment orders and container assignments
        </p>

        {!canDeleteShipment && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">
                <strong>Read-only mode:</strong> You can view and edit shipment orders, but cannot delete records.
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
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 py-4">
        <div className="flex-1">
          <Input
            placeholder="Search orders by Booking Number"
            value={globalFilter}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => router.push('/shipment-orders/add')}
            className="flex items-center gap-2 bg-theme-purple-600 hover:bg-theme-purple-700 text-white whitespace-nowrap"
          >
            <PlusIcon className="w-4 h-4" />
            Add Shipment Order
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
          
          // Cache configuration
          cacheBlockSize={10} // Must match paginationPageSize
          maxBlocksInCache={10} // Keep multiple pages in cache
          
          // Pagination configuration
          pagination={true}
          paginationPageSize={10} // Must match cacheBlockSize
          paginationPageSizeSelector={[10, 25, 50, 100]}
          
          // Sorting and filtering on server (handled in datasource)
          
          onGridReady={handleGridReady}
          domLayout="normal"
          animateRows={true}
          className="ag-theme-alpine"
          
          rowSelection={{ mode: "multiRow", groupSelects: "descendants" }}
          
          // Default export configurations
          defaultCsvExportParams={{
            fileName: `shipment_orders_${new Date().toISOString().split('T')[0]}.csv`,
            onlySelectedAllPages: true,
          }}
          defaultExcelExportParams={{
            fileName: `shipment_orders_${new Date().toISOString().split('T')[0]}.xlsx`,
            sheetName: "Shipment Orders",
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
        title="Delete Shipment Order"
        message={`Are you sure you want to delete the shipment order "${deletingItem?.vendor_booking_number}"? This action cannot be undone.`}
        itemName={deletingItem?.vendor_booking_number}
        isLoading={loading}
        variant="danger"
      />
    </div>
  );
}

export default withSimplifiedRBAC(ShipmentOrderManager, {
  privilege: "VIEW_SHIPMENT_ORDERS",
  module: [70],
  allowSuperUserBypass: true,
  redirectTo: "/dashboard",
});
