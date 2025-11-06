"use client";

import React, { useState, useEffect } from "react";
// Removed useLocalStorageData - localStorage managed by services
import { toast } from "react-hot-toast";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
} from "@tanstack/react-table";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { FormModal } from "@/components/ui/modal/FormModal";
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import { useFormModal } from "@/hooks/useFormModal";
import { PencilIcon, TrashBinIcon, PlusIcon } from "@/icons";
import Pagination from "@/components/tables/Pagination";

import { containerThresholdService, containerTypeService, polService, podService } from "@/services";

// Port data will be loaded via direct API calls when needed

import { ContainerThresholdResponse, ContainerThresholdListRequest } from "@/types/api";
import { ContainerThresholdForm, ContainerThresholdFormData } from "@/components/forms/ContainerThresholdForm";
import { withSimplifiedRBAC } from "@/components/auth/withSimplifiedRBAC";
import { useAuth } from "@/context/AuthContext";

interface TableMeta<T> {
  editRow: (row: T) => void;
  deleteRow: (id: number) => Promise<void>;
}

interface ContainerThresholdsManagerProps {
  mode: 'admin' | 'user';
}

const columnHelper = createColumnHelper<ContainerThresholdResponse>();

export const ContainerThresholdsManager: React.FC<ContainerThresholdsManagerProps> = ({ mode }) => {
  // Removed useLocalStorageData - localStorage managed by services
  
  const { can } = useAuth();
  
  // Local state for data management
  const [containerThresholds, setContainerThresholds] = useState<ContainerThresholdResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [totalInactive, setTotalInactive] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Additional data for form and table display
  const [containerTypes, setContainerTypes] = useState<any[]>([]);
  const [portOfLoading, setPortOfLoading] = useState<any[]>([]);
  const [portOfDischarge, setPortOfDischarge] = useState<any[]>([]);
  
  // Local state for filtering and pagination
  const [filters, setFilters] = useState<ContainerThresholdListRequest>({
    page: 1,
    page_size: 10,
    order_by: "container",
    order_type: "asc"
  });
  
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ContainerThresholdResponse | null>(null);

  const {
    isOpen: isModalOpen,
    isLoading: isModalLoading,
    editingItem,
    openModal,
    closeModal,
    setLoading: setModalLoading,
  } = useFormModal<ContainerThresholdResponse>();

  // Load container thresholds function
  const loadContainerThresholds = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await containerThresholdService.getContainerThresholds(filters);
      setContainerThresholds(response.results || []);
      setTotal(response.count || 0);
      setTotalActive(response.total_is_active || 0);
      setTotalInactive(response.total_inactive || 0);
      setTotalPages(Math.ceil((response.count || 0) / filters.page_size));
    } catch (error: any) {
      console.error('Error loading container thresholds:', error);
      setError(error.message || 'Failed to load container thresholds');
    } finally {
      setLoading(false);
    }
  };

  // Load additional data for form and table display
  const loadAdditionalData = async () => {
    try {
      // Load container types
      const containerTypesResponse = await containerTypeService.getContainerTypes({
        page: 1,
        page_size: 1000,
        order_by: "created_on",
        order_type: "desc"
      });
      setContainerTypes(containerTypesResponse.results || []);
      
      // Load port data
      const polResponse = await polService.getPOLs({ page: 1, page_size: 1000 });
      setPortOfLoading(polResponse.results || []);

      console.log({polResponse});
      
      // Load POD data (assuming podService exists)
      try {
        const podResponse = await podService.getPODs({ page: 1, page_size: 1000 });
        setPortOfDischarge(podResponse.results || []);
      } catch (error) {
        console.warn('POD service not available, skipping POD data load:', error);
        setPortOfDischarge([]);
      }
    } catch (error: any) {
      console.error('Error loading additional data:', error);
    }
  };

  // Load container thresholds on component mount and when filters change
  useEffect(() => {
    loadContainerThresholds();
  }, [filters]);

  // Load additional data for form and table display
  useEffect(() => {
    loadAdditionalData();
  }, []);

  // Sync table sorting with API filters
  useEffect(() => {
    if (sorting.length > 0) {
      const sortConfig = sorting[0];
      setFilters(prev => ({
        ...prev,
        order_by: sortConfig.id,
        order_type: sortConfig.desc ? 'desc' : 'asc'
      }));
    }
  }, [sorting]);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Helper function to get container name by ID
  const getContainerName = (containerId: number) => {
    const container = containerTypes.find((type: any) => type.id === containerId);
    return container ? `${container.code} - ${container.name}` : `ID: ${containerId}`;
  };

  // Helper function to get port name by ID
  const getPortName = (portId: number) => {
    if (Array.isArray(portOfLoading) && portOfLoading.length > 0) {
      // Check if the first item has a 'results' property (POLListResponse structure)
      if (portOfLoading[0] && 'results' in portOfLoading[0]) {
        // It's POLListResponse[] structure
        for (const polResponse of portOfLoading) {
          const port = polResponse.results?.find((p: any) => p.id === portId);
          if (port) return port.name;
        }
      } else {
        // It's directly an array of port objects
        const port = (portOfLoading as any[]).find((p: any) => p.id === portId);
        if (port) return port.name;
      }
    }
    return `ID: ${portId}`;
  };

  // Helper function to get port data for form
  const getPortDataForForm = () => {
    // The thunk returns response.results, so portOfLoading is actually an array of port objects
    // not POLListResponse[] as the type suggests
    if (Array.isArray(portOfLoading) && portOfLoading.length > 0) {
      // Check if the first item has a 'results' property (POLListResponse structure)
      if (portOfLoading[0] && 'results' in portOfLoading[0]) {
        // It's POLListResponse[] structure
        const ports: any[] = [];
        portOfLoading.forEach(polResponse => {
          if (polResponse.results) {
            ports.push(...polResponse.results);
          }
        });
        return ports;
      } else {
        // It's directly an array of port objects
        return portOfLoading;
      }
    }
    return [];
  };

  const columns = [
    columnHelper.accessor("container", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Container
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {getContainerName(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor("port_of_loading", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Port of Loading
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {info.getValue() ? getPortName(info.getValue()) : "Default (All POLs)"}
        </span>
      ),
    }),
    columnHelper.accessor("type", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Container Type
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("min_capacity", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Min Capacity
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("max_capacity", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Max Capacity
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("status", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Status
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          info.getValue() 
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        }`}>
          {info.getValue() ? "Active" : "Inactive"}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: (info) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => (info.table.options.meta as TableMeta<ContainerThresholdResponse>)?.editRow(info.row.original)}
            className="p-1"
          >
            <PencilIcon className="w-4 h-4" />
          </Button>
          {can("DELETE_THRESHOLD") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => (info.table.options.meta as TableMeta<ContainerThresholdResponse>)?.deleteRow(info.row.original.id)}
              className="p-1 text-red-600 hover:text-red-700"
            >
              <TrashBinIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    }),
  ];

  const table = useReactTable<ContainerThresholdResponse>({
    data: containerThresholds,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    meta: {
      editRow: (row: ContainerThresholdResponse) => {
        openModal(row);
      },
      deleteRow: async (id: number) => {
        if (!can("DELETE_THRESHOLD")) {
          toast.error("You don't have permission to delete container thresholds");
          return;
        }
        const item = containerThresholds.find(ct => ct.id === id);
        if (item) {
          setDeletingItem(item);
          setDeleteModalOpen(true);
        }
      },
    } as TableMeta<ContainerThresholdResponse>,
  });

  const handleSubmit = async (formData: ContainerThresholdFormData) => {
    try {
      setModalLoading(true);
      if (editingItem) {
        // Update existing threshold
        await containerThresholdService.updateContainerThreshold(editingItem.id, formData);
        toast.success('Container threshold updated successfully');
      } else {
        // Create new threshold
        await containerThresholdService.createContainerThreshold(formData);
        toast.success('Container threshold created successfully');
      }
      
      // Refresh the list
      await loadContainerThresholds();
      closeModal();
    } catch (error: any) {
      console.error('Error saving container threshold:', error);
      toast.error(error.message || 'Failed to save container threshold');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    
    if (!can("DELETE_THRESHOLD")) {
      toast.error("You don't have permission to delete container thresholds");
      setDeleteModalOpen(false);
      setDeletingItem(null);
      return;
    }
    
    try {
      setModalLoading(true);
      await containerThresholdService.deleteContainerThreshold(deletingItem.id);
      toast.success('Container threshold deleted successfully');
      setDeleteModalOpen(false);
      setDeletingItem(null);
      
      // Refresh the list
      await loadContainerThresholds();
    } catch (error: any) {
      console.error('Error deleting container threshold:', error);
      toast.error(error.message || 'Failed to delete container threshold');
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddNew = () => {
    openModal();
  };

  const filteredData = table.getFilteredRowModel().rows;


  // Calculate stats
  const stats = {
    total: total,
    active: totalActive,
    inactive: totalInactive,
    highCapacity: containerThresholds.filter(ct => ct.max_capacity && ct.max_capacity > 50).length,
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Threshold Configuration
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage container capacity thresholds and constraints
        </p>
        {mode === 'admin' && (
          <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            🔧 Admin Mode - Full Access
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Thresholds</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">T</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 text-sm font-bold">✓</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Inactive</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.inactive}</p>
            </div>
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <span className="text-red-600 dark:text-red-400 text-sm font-bold">✗</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">High Capacity</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.highCapacity}</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400 text-sm font-bold">H</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <Input
                placeholder="Search thresholds..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full focus:ring-theme-purple-500 focus:border-theme-purple-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter ?? ""}
              onChange={(e) => setStatusFilter(e.target.value === "" ? null : e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white text-sm min-w-[120px]"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            {/* Add Button */}
            <Button 
              type="button"
              onClick={handleAddNew} 
              size="sm"
              className="bg-theme-purple-600 hover:bg-theme-purple-700 text-white px-4 py-2 whitespace-nowrap"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Threshold
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading thresholds...</p>
            </div>
          </div>
        )}
        
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
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
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {loading ? 'Loading...' : 'No thresholds found'}
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden">
          {filteredData.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              {loading ? 'Loading...' : 'No thresholds found'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredData.map((row) => (
                <div key={row.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="space-y-3">
                    {/* Threshold Name and Status */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {row.original.container_type_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {row.original.port_name}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        row.original.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {row.original.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Threshold Details */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Min Threshold:</span>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {row.original.min_threshold || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Max Threshold:</span>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {row.original.max_threshold || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openModal(row.original)}
                          className="flex-1"
                        >
                          <PencilIcon className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(row.original.id)}
                          className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <TrashBinIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700 dark:text-gray-300 order-2 sm:order-1">
            Showing {((filters.page || 1) - 1) * (filters.page_size || 10) + 1} to{" "}
            {Math.min(
              (filters.page || 1) * (filters.page_size || 10),
              total
            )}{" "}
            of {total} results
          </div>
          <div className="order-1 sm:order-2">
            <Pagination
              currentPage={filters.page || 1}
              totalPages={totalPages}
              onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
            />
          </div>
        </div>
      )}

      {total === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-2xl text-gray-400">⚖️</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No thresholds found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Get started by creating your first threshold configuration.
          </p>
          <Button onClick={handleAddNew} className="bg-theme-purple-600 hover:bg-theme-purple-700">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Threshold
          </Button>
        </div>
      )}

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit Container Threshold" : "Add New Container Threshold"}
        size="lg"
        showFooter={false}
      >
        <ContainerThresholdForm
          initialData={editingItem ? {
            container: editingItem.container,
            port_of_loading: editingItem.port_of_loading,
            type: editingItem.type,
            min_capacity: editingItem.min_capacity,
            max_capacity: editingItem.max_capacity,
            status: editingItem.status,
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isLoading={isModalLoading}
          containerTypes={containerTypes}
          portOfLoading={portOfLoading}
          portOfDischarge={portOfDischarge}
        />
      </FormModal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Container Threshold"
        message={`Are you sure you want to delete the container threshold "${deletingItem?.type}"? This action cannot be undone.`}
        isLoading={loading}
      />
    </div>
  );
};

export default withSimplifiedRBAC(ContainerThresholdsManager, {
  privilege: "VIEW_CONTAINER_THRESHOLDS",
  module: [50], // Container Management module
  allowSuperUserBypass: true,
  redirectTo: "/dashboard"
});
