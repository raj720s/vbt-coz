"use client";
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  ShipmentOrderFormData,
  ShipmentOrderStatus,
  TransportationMode,
  ServiceType,
  CargoType,
  ShipmentListRequest,
  ShipmentListResponse,
} from "@/types/shipmentOrder";
import { shipmentOrderService, ShipmentOrderInput } from "@/services/shipmentOrderService";
import { ShipmentOrderForm } from "@/components/forms/ShipmentOrderForm";
import { FormModal } from "@/components/ui/modal/FormModal";
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { withSimplifiedRBAC, SimplifiedRBACProps } from "@/components/auth/withSimplifiedRBAC";
import { 
  PlusIcon, 
  PencilIcon, 
  TrashBinIcon, 
  DownloadIcon,
  FilterIcon,
  GridIcon,
  TableIcon,
  ArrowDownIcon,
} from "@/icons";
import toast from "react-hot-toast";
import { 
  getStatusCodeForFilter,
  convertFormDataToApiFormat,
  convertApiResponseToFormFormat
} from "@/components/forms/statusUtils";
import ConfigurationDrawer from "./ConfigurationDrawer";

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
import { ExcelExportModule } from "ag-grid-enterprise";

ModuleRegistry.registerModules([
  AllCommunityModule,
  CsvExportModule,
  ExcelExportModule,
]);

// Status tabs configuration with proper API mapping
const STATUS_TABS = [
  { value: "all", label: "Total Bookings", apiValue: undefined },
  { value: "draft", label: "Draft", apiValue: "draft" },
  { value: "confirmed", label: "Confirmed", apiValue: "confirmed" },
  { value: "booked", label: "Booked", apiValue: "booked" },
  { value: "modified", label: "Modified", apiValue: "modified" },
  { value: "shipped", label: "Shipped", apiValue: "shipped" },
];

// Field configuration based on FIELD TABLE
const FIELD_CONFIGURATION = [
  // Mandatory Fields
  { id: "vendor_booking_number", name: "Vendor Booking (SO) Number", field: "vendor_booking_number", mandatory: true, visible: true, type: "text" as const, description: "System-generated, fixed format" },
  { id: "vendor_booking_status", name: "Vendor Booking Status", field: "vendor_booking_status", mandatory: true, visible: true, type: "choice" as const, description: "Draft | Confirmed | Shipped" },
  { id: "shipper", name: "Shipper", field: "shipper", mandatory: true, visible: true, type: "text" as const },
  { id: "consignee", name: "Consignee", field: "consignee", mandatory: true, visible: true, type: "text" as const },
  { id: "transportation_mode", name: "Transportation Mode", field: "transportation_mode", mandatory: true, visible: true, type: "choice" as const, description: "FCL | LCL" },
  { id: "cargo_readiness_date", name: "Cargo Readiness Date", field: "cargo_readiness_date", mandatory: true, visible: true, type: "date" as const },
  { id: "service_type", name: "Service Type", field: "service_type", mandatory: true, visible: true, type: "choice" as const, description: "CFS | CY" },
  { id: "volume", name: "Volume", field: "volume", mandatory: true, visible: true, type: "numeric" as const, description: "CBM" },
  { id: "weight", name: "Weight", field: "weight", mandatory: true, visible: true, type: "numeric" as const, description: "KG" },
  { id: "port_of_loading", name: "Port of Loading", field: "port_of_loading", mandatory: true, visible: true, type: "text" as const, description: "Free text for now" },
  { id: "port_of_discharge", name: "Port of Discharge", field: "port_of_discharge", mandatory: true, visible: true, type: "text" as const, description: "Free text for now" },
  { id: "equipment_number", name: "Equipment#", field: "equipment_number", mandatory: true, visible: true, type: "numeric" as const, description: "Mandatory to change status to 'Shipped'" },
  { id: "equipment_size_type", name: "Equipment Size/Type", field: "equipment_size_type", mandatory: true, visible: true, type: "choice" as const, description: "Mandatory to change status to 'Shipped'" },
  { id: "equipment_number_text", name: "Equipment Number", field: "equipment_number_text", mandatory: true, visible: true, type: "text" as const, description: "Field is dependent on Equipment#" },
  { id: "customer", name: "Customer", field: "customer", mandatory: true, visible: true, type: "choice" as const, description: "Derived from SupplyX" },
  { id: "vendor", name: "Vendor", field: "vendor", mandatory: true, visible: true, type: "choice" as const, description: "Derived from SupplyX Masterdata" },
  { id: "origin_partner", name: "Origin Partner", field: "origin_partner", mandatory: true, visible: true, type: "choice" as const, description: "Derived from SupplyX Masterdata" },
  
  // Optional Fields
  { id: "hs_code", name: "HS Code", field: "hs_code", mandatory: false, visible: false, type: "text" as const, description: "Free text in 1st phase" },
  { id: "cargo_description", name: "Cargo Description", field: "cargo_description", mandatory: false, visible: false, type: "text" as const },
  { id: "marks_numbers", name: "Marks & Numbers", field: "marks_numbers", mandatory: false, visible: false, type: "text" as const },
  { id: "customer_reference", name: "Customer Reference", field: "customer_reference", mandatory: false, visible: false, type: "text" as const },
  { id: "cargo_type", name: "Cargo Type", field: "cargo_type", mandatory: false, visible: false, type: "choice" as const, description: "Normal | Reefer | Dangerous Goods" },
  { id: "dangerous_goods_notes", name: "Dangerous Goods Notes", field: "dangerous_goods_notes", mandatory: false, visible: false, type: "text" as const, description: "Only if Cargo Type = dangerous goods" },
  { id: "place_of_receipt", name: "Place of Receipt", field: "place_of_receipt", mandatory: false, visible: false, type: "text" as const, description: "Free text for now" },
  { id: "place_of_delivery", name: "Place of Delivery", field: "place_of_delivery", mandatory: false, visible: false, type: "text" as const, description: "Free text for now" },
  { id: "carrier", name: "Carrier", field: "carrier", mandatory: false, visible: false, type: "text" as const },
  { id: "carrier_booking_number", name: "Carrier Booking Number", field: "carrier_booking_number", mandatory: false, visible: false, type: "text" as const },
  { id: "user_defined_field1", name: "User Defined Field 1", field: "user_defined_field1", mandatory: false, visible: false, type: "text" as const, description: "Adjustable labels per client" },
  { id: "user_defined_field2", name: "User Defined Field 2", field: "user_defined_field2", mandatory: false, visible: false, type: "text" as const, description: "Adjustable labels per client" },
  { id: "user_defined_field3", name: "User Defined Field 3", field: "user_defined_field3", mandatory: false, visible: false, type: "text" as const, description: "Adjustable labels per client" },
  { id: "user_defined_field4", name: "User Defined Field 4", field: "user_defined_field4", mandatory: false, visible: false, type: "text" as const, description: "Adjustable labels per client" },
  { id: "user_defined_field5", name: "User Defined Field 5", field: "user_defined_field5", mandatory: false, visible: false, type: "text" as const, description: "Adjustable labels per client" },
  { id: "created_on", name: "Created On", field: "created_on", mandatory: false, visible: false, type: "date" as const },
];

// Custom Cell Renderers
const StatusRenderer = (params: ICellRendererParams) => {
  const status = params.value as ShipmentOrderStatus;
  const statusColors = {
    draft: "bg-purple-100 text-purple-800",
    confirmed: "bg-blue-100 text-blue-800",
    shipped: "bg-green-100 text-green-800",
    booked: "bg-orange-100 text-orange-800",
    modified: "bg-cyan-100 text-cyan-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'draft': 'Draft',
      'confirmed': 'Confirmed',
      'booked': 'Booked',
      'modified': 'Modified',
      'shipped': 'Shipped',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  };

  return (
    <span
      className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
        statusColors[status] || statusColors.draft
      }`}
    >
      {getStatusText(status) || "Draft"}
    </span>
  );
};


const TransportationModeRenderer = (params: ICellRendererParams) => {
  const mode = params.value as TransportationMode;
  const modeIcons = {
    ocean: "🚢",
    air: "✈️",
    road: "🚛",
    rail: "🚂",
  };

  return (
    <span className="flex items-center gap-2">
      <span>{modeIcons[mode] || "🚢"}</span>
      <span className="capitalize">{mode || "Ocean"}</span>
    </span>
  );
};

const ServiceTypeRenderer = (params: ICellRendererParams) => {
  const serviceType = params.value as ServiceType;
  const serviceColors = {
    fcl: "bg-blue-100 text-blue-800",
    lcl: "bg-green-100 text-green-800",
    air: "bg-purple-100 text-purple-800",
    cy: "bg-indigo-100 text-indigo-800",
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full uppercase ${
        serviceColors[serviceType as keyof typeof serviceColors] || "bg-gray-100 text-gray-800"
      }`}
    >
      {serviceType || "CY"}
    </span>
  );
};

const CargoTypeRenderer = (params: ICellRendererParams) => {
  const cargoType = params.value as CargoType;
  const cargoColors = {
    normal: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    reefer: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    dg: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    general: "bg-gray-100 text-gray-800",
    dangerous: "bg-red-100 text-red-800",
    perishable: "bg-green-100 text-green-800",
    fragile: "bg-yellow-100 text-yellow-800",
  };

  return (
    <span
      className={`px-2 py-1 text-xs rounded-full capitalize ${
        cargoColors[cargoType as keyof typeof cargoColors] || cargoColors.normal
      }`}
    >
      {cargoType || "Normal"}
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

const BookingNumberRenderer = (params: ICellRendererParams) => {
  return (
    <span className="font-mono text-sm font-semibold text-purple-600 dark:text-purple-400">
      #{params.value || "N/A"}
    </span>
  );
};

const CustomerRenderer = (params: ICellRendererParams) => {
  return (
    <span className="font-medium text-gray-900 dark:text-gray-100">
      {params.value || "N/A"}
    </span>
  );
};


interface ShipmentOrderManagerProps {
  rbacContext?: SimplifiedRBACProps["rbacContext"];
}

const ShipmentOrderManager: React.FC<ShipmentOrderManagerProps> = ({
  rbacContext,
}) => {
  const gridRef = useRef<AgGridReact<ShipmentListResponse>>(null);
  const [shipmentOrders, setShipmentOrders] = useState<ShipmentListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ShipmentListResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ShipmentListResponse | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);
  const [fieldConfig, setFieldConfig] = useState(FIELD_CONFIGURATION);
  
  // Status counts - fetch separately for accurate counts
  const [statusCounts, setStatusCounts] = useState<{[key: string]: number}>({
    all: 0,
    draft: 0,
    confirmed: 0,
    booked: 0,
    modified: 0,
    shipped: 0,
  });

  const [filters, setFilters] = useState<ShipmentListRequest>({
    page: 1,
    page_size: 9, // Match the UI showing 9 per page
    order_by: "created_on",
    order_type: "desc",
  });

  // Pagination state
  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 1,
    totalPages: 0,
    totalRecords: 0,
    pageSize: 12,
  });

  const { can, isAdmin, isSuperUser } = rbacContext || {};
  const canDeleteShipment = can?.("DELETE_SHIPMENT") || isAdmin?.() || isSuperUser;

  // Load status counts separately
  const loadStatusCounts = async () => {
    try {
      const statusPromises = STATUS_TABS.map(async (tab) => {
        const statusFilter = {
          page: 1,
          page_size: 1, // We only need the count
          ...(tab.apiValue && { vendor_booking_status: getStatusCodeForFilter(tab.value) })
        };
        
        const response = await shipmentOrderService.listShipmentOrders(statusFilter);
        return { status: tab.value, count: response.count || 0 };
      });

      const results = await Promise.all(statusPromises);
      const newStatusCounts = results.reduce((acc, { status, count }) => {
        acc[status] = count;
        return acc;
      }, {} as {[key: string]: number});

      setStatusCounts(newStatusCounts);
    } catch (error) {
      console.error("Error loading status counts:", error);
    }
  };

  // Load shipment orders
  const loadShipmentOrders = async () => {
    try {
      setLoading(true);
      console.log('Loading shipment orders with filters:', filters);
      
      const response = await shipmentOrderService.listShipmentOrders(filters);
      console.log('API response:', response);
      
      setShipmentOrders(response.results || []);
      
      // Update pagination info
      const totalRecords = response.count || 0;
      const totalPages = Math.ceil(totalRecords / filters.page_size);
      
      setPaginationInfo({
        currentPage: filters.page,
        totalPages,
        totalRecords,
        pageSize: filters.page_size,
      });

      // Update status count for current filter
      setStatusCounts(prev => ({
        ...prev,
        [selectedStatus]: totalRecords
      }));

    } catch (error: any) {
      console.error("Error loading shipment orders:", error);
      toast.error(error.message || "Failed to load shipment orders");
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadShipmentOrders();
  }, [filters]);

  // Load status counts on component mount
  useEffect(() => {
    loadStatusCounts();
  }, []);

  // Handle status tab change
  const handleStatusChange = (statusValue: string) => {
    setSelectedStatus(statusValue);
    const statusTab = STATUS_TABS.find(tab => tab.value === statusValue);
    
    setFilters(prev => ({
      ...prev,
      page: 1,
      vendor_booking_status: statusTab?.apiValue ? getStatusCodeForFilter(statusValue) : undefined
    }));
  };

  // Handle search
  const handleSearch = (searchTerm: string) => {
    setGlobalFilter(searchTerm);
    setFilters(prev => ({
      ...prev,
      search: searchTerm,
      page: 1,
    }));
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage,
    }));
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setFilters(prev => ({
      ...prev,
      page: 1,
      page_size: newPageSize,
    }));
  };

  // Handle field configuration
  const handleFieldToggle = (fieldId: string, visible: boolean) => {
    setFieldConfig(prev => 
      prev.map(field => 
        field.id === fieldId ? { ...field, visible } : field
      )
    );
  };

  const handleResetConfiguration = () => {
    setFieldConfig(FIELD_CONFIGURATION);
  };

  const handleOpenConfigDrawer = () => {
    setIsConfigDrawerOpen(true);
  };

  const handleCreate = () => {
      setEditingOrder(null);
    setIsSubmitting(false);
    setIsModalOpen(true);
  };

  const handleEdit = (order: ShipmentListResponse) => {
    // Convert API response to form format for editing
    const formData = convertApiResponseToFormFormat(order);
    setEditingOrder(formData as any);
    setIsSubmitting(false);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (order: ShipmentListResponse) => {
    if (!canDeleteShipment) {
      toast.error("You don't have permission to delete shipment orders");
      return;
    }

    setDeletingItem(order);
    setDeleteModalOpen(true);
  };

  const handleSubmit = async (data: any) => {
    console.log("ShipmentOrderManager handleSubmit called with data:", data);
    console.log("Editing order:", editingOrder);
    console.log("Is editing:", !!editingOrder);

    if (isSubmitting) {
      console.log("Already submitting, ignoring duplicate submission");
      return;
    }

    try {
      setIsSubmitting(true);

      // Convert form data to API format with numeric codes
      const apiData = convertFormDataToApiFormat(data);
      console.log("Converted API data:", apiData);

      if (editingOrder) {
        console.log("Updating shipment order:", editingOrder.id);
        console.log("Update payload:", apiData);

        const updateResult = await shipmentOrderService.updateShipmentOrder(
          editingOrder.id,
          apiData
        );

        console.log("Update result:", updateResult);
        toast.success("Shipment order updated successfully");
      } else {
        console.log("Creating new shipment order");
        console.log("Create payload:", apiData);

        const createResult = await shipmentOrderService.createShipmentOrder(apiData);

        console.log("Create result:", createResult);
        toast.success("Shipment order created successfully");
      }
      console.log("Shipment order saved successfully");
      setIsModalOpen(false);
      setEditingOrder(null);
      await loadShipmentOrders();
      await loadStatusCounts(); // Refresh counts
    } catch (error: any) {
      console.error("Failed to save shipment order:", error);
      console.error("Error details:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
      });
      toast.error(error?.message || "Failed to save shipment order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    if (!canDeleteShipment) {
      toast.error("You don't have permission to delete shipment orders");
      setDeleteModalOpen(false);
      setDeletingItem(null);
      return;
    }

    try {
      setIsSubmitting(true);
      await shipmentOrderService.deleteShipmentOrder(deletingItem.id);
      toast.success("Shipment order deleted successfully");
      setDeleteModalOpen(false);
      setDeletingItem(null);
      await loadShipmentOrders();
    } catch (error: any) {
      console.error("Error deleting shipment order:", error);
      toast.error(error.message || "Failed to delete shipment order");
    } finally {
      setIsSubmitting(false);
    }
  };



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


  // Actions Cell Renderer
  const ActionsRenderer = useCallback(
    (params: ICellRendererParams) => {
      const handleEditClick = () => {
        handleEdit(params.data);
      };

      const handleDeleteButtonClick = () => {
        handleDeleteClick(params.data);
      };

      return (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleEditClick}
            className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded"
            title="Edit booking"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          {canDeleteShipment && (
            <button
              onClick={handleDeleteButtonClick}
              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
              title="Delete booking"
            >
              <TrashBinIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    },
    [canDeleteShipment]
  );

  // Generate column definitions based on field configuration
  const generateColumnDef = (field: any): ColDef => {
    const baseColumn: ColDef = {
      field: field.field,
      headerName: field.name,
      width: field.type === "date" ? 140 : field.type === "numeric" ? 130 : 200,
      sortable: true,
      filter: true,
    };

    // Add specific renderers and formatters based on field type and name
    switch (field.field) {
      case "vendor_booking_number":
        return { ...baseColumn, cellRenderer: BookingNumberRenderer, width: 200 };
      case "vendor_booking_status":
        return { ...baseColumn, cellRenderer: StatusRenderer, width: 180 };
      case "transportation_mode":
        return { ...baseColumn, cellRenderer: TransportationModeRenderer, width: 160 };
      case "service_type":
        return { ...baseColumn, cellRenderer: ServiceTypeRenderer, width: 130 };
      case "cargo_type":
        return { ...baseColumn, cellRenderer: CargoTypeRenderer, width: 130 };
      case "cargo_readiness_date":
      case "created_on":
        return { ...baseColumn, cellRenderer: DateRenderer, width: 150 };
      case "volume":
        return { ...baseColumn, valueFormatter: (params) => `${params.value || 0} CBM`, width: 130 };
      case "weight":
        return { ...baseColumn, valueFormatter: (params) => `${params.value || 0} KG`, width: 130 };
      default:
        return baseColumn;
    }
  };

  // Column definitions based on field configuration
  const columnDefs = useMemo<ColDef[]>(() => {
    const visibleFields = fieldConfig.filter(field => field.visible);
    const dataColumns = visibleFields.map(field => generateColumnDef(field));
    
    return [
      {
        field: "actions",
        headerName: "Action",
        minWidth: 150,
        cellRenderer: ActionsRenderer,
        sortable: false,
        filter: false,
        suppressMovable: true,
        lockPosition: 'left',
      },
      ...dataColumns,
    ];
  }, [ActionsRenderer, fieldConfig]);

  // Default Column Definition
  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
    }),
    []
  );

  const cellSelection = useMemo(() => { 
    return {
          handle: { 
              mode: 'range',
          }
      };
  }, []);


  return (
    <div className="p-0 bg-gray-50 min-h-screen">
      {/* Status Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleStatusChange(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              selectedStatus === tab.value
                ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                : "bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:text-purple-600"
            }`}
          >
            {tab.label} ({statusCounts[tab.value] || 0})
          </button>
        ))}
      </div>

      {/* Search and Controls */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Input
              placeholder="Search"
              value={globalFilter}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-10 bg-white border-gray-200"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleOpenConfigDrawer}
            className="p-2 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-white"
            title="Configure columns"
          >
            <FilterIcon className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-white">
            <ArrowDownIcon className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-white">
            <GridIcon className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-white">
            <TableIcon className="w-4 h-4" />
          </button>
          <Button 
            onClick={handleCreate} 
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-sm"
          >
            Add Booking
          </Button>
        </div>
      </div>

      {/* AG Grid Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div style={{ height: "calc(100vh - 340px)", minHeight: "500px" }} className="ag-theme-alpine">
          <AgGridReact
            ref={gridRef}
            rowData={shipmentOrders}
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
        onClose={() => {
          setIsModalOpen(false);
          setEditingOrder(null);
          setIsSubmitting(false);
        }}
        title={
          editingOrder?.id ? "Edit Shipment Order" : "Create Shipment Order"
        }
        size="xl"
      >
        <ShipmentOrderForm
          initialData={editingOrder || undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingOrder(null);
            setIsSubmitting(false);
          }}
          isLoading={isSubmitting}
        />
      </FormModal>

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
        isLoading={isSubmitting}
        variant="danger"
      />

      {/* Configuration Drawer */}
      <ConfigurationDrawer
        isOpen={isConfigDrawerOpen}
        onClose={() => setIsConfigDrawerOpen(false)}
        fields={fieldConfig}
        onFieldToggle={handleFieldToggle}
        onReset={handleResetConfiguration}
      />
    </div>
  );
};

export default withSimplifiedRBAC(ShipmentOrderManager, {
  privilege: "VIEW_SHIPMENT_ORDERS",
  module: [70],
  allowSuperUserBypass: true,
  redirectTo: "/dashboard",
});
