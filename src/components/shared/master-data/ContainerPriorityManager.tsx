"use client";

import { withSimplifiedRBAC } from "@/components/auth/withSimplifiedRBAC";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { FormModal } from "@/components/ui/modal/FormModal";
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import { useFormModal } from "@/hooks/useFormModal";
import { PencilIcon, TrashBinIcon, PlusIcon, HorizontaLDots } from "@/icons";
import { toast } from "react-hot-toast";
import React, { useState, useEffect, useMemo } from "react";
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Pagination from "@/components/tables/Pagination";
import { ContainerPriorityResponse, ContainerPriorityListRequest, CreateContainerPriorityRequest, UpdateContainerPriorityRequest } from "@/types/api";
import { ContainerPriorityForm, ContainerPriorityFormData } from "@/components/forms/ContainerPriorityForm";
import { containerPriorityService } from "@/services";
import { containerTypeService } from "@/services";

interface TableMeta<T> {
  editRow: (row: T) => void;
  deleteRow: (id: number) => Promise<void>;
}

const columnHelper = createColumnHelper<ContainerPriorityResponse>();

// Sortable drag handle component
function SortableDragHandle({ row }: { row: ContainerPriorityResponse }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="flex items-center justify-center w-6 h-6 cursor-grab active:cursor-grabbing">
        <HorizontaLDots className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
}



function ContainerPriorityManager() {
  const { can } = useAuth();
  // Local state for data management
  const [containerPriorities, setContainerPriorities] = useState<ContainerPriorityResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [totalInactive, setTotalInactive] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [containerTypes, setContainerTypes] = useState<any[]>([]);

  // Helper function to get container name by ID
  const getContainerName = (containerId: number) => {
    const container = containerTypes.find(type => type.id === containerId);
    return container ? `${container.code} - ${container.name}` : `ID: ${containerId}`;
  };

  // Load container types
  const loadContainerTypes = async () => {
    try {
      const response = await containerTypeService.getContainerTypes({
        page: 1,
        page_size: 1000,
        order_by: "created_on",
        order_type: "desc"
      });
      setContainerTypes(response.results);
    } catch (error) {
      console.error('Error loading container types:', error);
    }
  };

  useEffect(() => {
    if(!containerTypes.length){
      loadContainerTypes();
    }
  }, [containerTypes.length]);
  
  const columns = [
    columnHelper.display({
      id: "dragHandle",
      header: "",
      cell: (info) => <SortableDragHandle row={info.row.original} />,
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
          {getContainerName(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor("priority", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Priority
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
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
    columnHelper.accessor("max_weight", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Max Weight
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <span className="font-mono text-sm">
          {info.getValue()} kg
        </span>
      ),
    }),
    columnHelper.accessor("description", {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Description
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <span className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
          {info.getValue()}
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
            onClick={() => (info.table.options.meta as TableMeta<ContainerPriorityResponse>)?.editRow(info.row.original)}
            className="p-1"
          >
            <PencilIcon className="w-4 h-4" />
          </Button>
          {can("DELETE_PRIORITY") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => (info.table.options.meta as TableMeta<ContainerPriorityResponse>)?.deleteRow(info.row.original.id)}
              className="p-1 text-red-600 hover:text-red-700"
            >
              <TrashBinIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    }),
  ];
  
  // Local state for filtering and pagination
  const [filters, setFilters] = useState<ContainerPriorityListRequest>({
    page: 1,
    page_size: 10,
    order_by: "priority",
    order_type: "asc"
  });
  
  const [globalFilter, setGlobalFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ContainerPriorityResponse | null>(null);

  const {
    isOpen: isModalOpen,
    isLoading: isModalLoading,
    editingItem,
    openModal,
    closeModal,
    setLoading: setModalLoading,
  } = useFormModal<ContainerPriorityResponse>();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  console.log('🔍 Sensors created:', sensors);
  console.log('🔍 Container priorities on mount:', containerPriorities);

  // Load container priorities on component mount and when filters change
  useEffect(() => {
    loadContainerPriorities();
  }, [filters]);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadContainerPriorities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await containerPriorityService.getContainerPriorities(filters);
      setContainerPriorities(response.results || []);
      setTotal(response.count || 0);
      setTotalActive(response.total_is_active || 0);
      setTotalInactive(response.total_inactive || 0);
      setTotalPages(Math.ceil((response.count || 0) / (filters.page_size || 10)));
    } catch (err: any) {
      console.error('Error loading container priorities:', err);
      setError(err.message || 'Failed to load container priorities');
    } finally {
      setLoading(false);
    }
  };

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

  const table = useReactTable<ContainerPriorityResponse>({
    data: containerPriorities,
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
      editRow: (row: ContainerPriorityResponse) => {
        openModal(row);
      },
      deleteRow: async (id: number) => {
        if (!can("DELETE_PRIORITY")) {
          toast.error("You don't have permission to delete container priorities");
          return;
        }
        setDeletingItem(containerPriorities.find(item => item.id === id) || null);
        setDeleteModalOpen(true);
      },
    } as TableMeta<ContainerPriorityResponse>,
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    console.log('🔍 Drag end event triggered:', event);
    const { active, over } = event;

    if (active.id !== over?.id) {
      console.log('🔄 Items are different, processing reorder...');
      console.log('📊 Active item ID:', active.id);
      console.log('📊 Over item ID:', over?.id);
      
      const oldIndex = containerPriorities.findIndex((item) => item.id === active.id);
      const newIndex = containerPriorities.findIndex((item) => item.id === over?.id);

      console.log('📊 Old index:', oldIndex, 'New index:', newIndex);

      if (oldIndex !== -1 && newIndex !== -1) {
        console.log('✅ Valid indices found, updating priorities...');
        const newItems = arrayMove(containerPriorities, oldIndex, newIndex);
        
        // Update priority numbers based on new order (1-based indexing)
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          priority: index + 1,
        }));

        console.log('📊 Updated items with new priorities:', updatedItems);

        // Update priorities using service - update ALL items to ensure consistency
        try {
          console.log('🚀 Starting API updates for ALL items...');
          
          // Update ALL items to ensure their priorities match the new order
          for (let i = 0; i < updatedItems.length; i++) {
            const item = updatedItems[i];
            const newPriority = i + 1;
            
            console.log(`🔄 Updating item ${item.id} priority to ${newPriority}`);
            await containerPriorityService.updateContainerPriority(item.id, {
              type: item.type,
              priority: newPriority,
              max_capacity: item.max_capacity,
              max_weight: item.max_weight,
              description: item.description,
            });
            console.log(`✅ Successfully updated item ${item.id} priority to ${newPriority}`);
          }
          
          console.log('🔄 Refreshing list to show updated priorities...');
          // Refresh the list to show updated priorities
          await loadContainerPriorities();
          toast.success("Priority order updated successfully");
          console.log('✅ Priority order update completed successfully');
        } catch (error) {
          console.error('❌ Error updating priorities:', error);
          toast.error('Failed to update priority order');
          // Revert to original order on error
          await loadContainerPriorities();
        }
      } else {
        console.log('❌ Invalid indices - oldIndex:', oldIndex, 'newIndex:', newIndex);
      }
    } else {
      console.log('⏭️ Items are the same, no reorder needed');
    }
  };

  const handleSubmit = async (formData: ContainerPriorityFormData) => {
    try {
      setModalLoading(true);
      
      if (editingItem) {
        // Update existing priority
        await containerPriorityService.updateContainerPriority(editingItem.id, formData);
        toast.success('Container priority updated successfully');
      } else {
        // Create new priority
        await containerPriorityService.createContainerPriority(formData);
        toast.success('Container priority created successfully');
      }
      
      // Refresh the list
      await loadContainerPriorities();
      closeModal();
    } catch (error: any) {
      console.error('Error saving container priority:', error);
      toast.error(error.message || 'Failed to save container priority');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    
    if (!can("DELETE_PRIORITY")) {
      toast.error("You don't have permission to delete container priorities");
      setDeleteModalOpen(false);
      setDeletingItem(null);
      return;
    }
    
    try {
      setModalLoading(true);
      await containerPriorityService.deleteContainerPriority(deletingItem.id);
      toast.success('Container priority deleted successfully');
      setDeleteModalOpen(false);
      setDeletingItem(null);
      
      // Refresh the list
      await loadContainerPriorities();
    } catch (error: any) {
      console.error('Error deleting container priority:', error);
      toast.error(error.message || 'Failed to delete container priority');
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
    highPriority: containerPriorities.filter(cp => cp.priority && cp.priority <= 3).length,
    mediumPriority: containerPriorities.filter(cp => cp.priority && cp.priority > 3 && cp.priority <= 6).length,
    lowPriority: containerPriorities.filter(cp => cp.priority && cp.priority > 6).length,
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Priority Configuration
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage container priorities with drag-and-drop reordering
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Priorities</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">P</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">High Priority</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.highPriority}</p>
            </div>
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <span className="text-red-600 dark:text-red-400 text-sm font-bold">H</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Medium Priority</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.mediumPriority}</p>
            </div>
            <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 dark:text-yellow-400 text-sm font-bold">M</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Low Priority</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.lowPriority}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 text-sm font-bold">L</span>
            </div>
          </div>
        </div>
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

      {/* Filters and Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <Input
                placeholder="Search priorities..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full focus:ring-theme-purple-500 focus:border-theme-purple-500"
              />
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter ?? ""}
              onChange={(e) => setPriorityFilter(e.target.value === "" ? null : e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white text-sm min-w-[140px]"
            >
              <option value="">All Priorities</option>
              <option value="high">High (1-3)</option>
              <option value="medium">Medium (4-6)</option>
              <option value="low">Low (7+)</option>
            </select>

            {/* Add Button */}
            <Button 
              type="button"
              onClick={handleAddNew} 
              size="sm"
              className="bg-theme-purple-600 hover:bg-theme-purple-700 text-white px-4 py-2 whitespace-nowrap"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Priority
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
              <p className="text-gray-600 dark:text-gray-400">Loading priorities...</p>
            </div>
          </div>
        )}
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
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
                <SortableContext
                  items={filteredData.map(row => row.original.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        {loading ? 'Loading...' : 'No priorities found'}
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
                </SortableContext>
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden">
            {filteredData.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                {loading ? 'Loading...' : 'No priorities found'}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                <SortableContext
                  items={filteredData.map(row => row.original.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredData.map((row) => (
                    <div key={row.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="space-y-3">
                        {/* Priority Name and Order */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {row.original.container_type_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Priority Order: {row.original.priority_order}
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

                        {/* Description and Actions */}
                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Description:</span>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {row.original.description || 'No description'}
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
                </SortableContext>
              </div>
            )}
          </div>
        </DndContext>
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
            <span className="text-2xl text-gray-400">⚡</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No priorities found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Get started by creating your first priority configuration.
          </p>
          <Button onClick={handleAddNew} className="bg-theme-purple-600 hover:bg-theme-purple-700">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Priority
          </Button>
        </div>
      )}

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? "Edit Container Priority" : "Add New Container Priority"}
        size="lg"
        showFooter={false}
      >
        <ContainerPriorityForm
          initialData={editingItem ? {
            type: editingItem.type,
            priority: editingItem.priority,
            max_capacity: editingItem.max_capacity,
            max_weight: editingItem.max_weight,
            description: editingItem.description,
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isLoading={isModalLoading}
          containerTypes={containerTypes}
        />
      </FormModal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Container Priority"
        message={`Are you sure you want to delete the container priority "${deletingItem?.type}"? This action cannot be undone.`}
        isLoading={isModalLoading}
      />
    </div>
  );
}

export default withSimplifiedRBAC(ContainerPriorityManager, {
  privilege: "VIEW_CONTAINER_PRIORITY",
  module: [50], // Container Management module
  allowSuperUserBypass: true,
  redirectTo: "/dashboard"
});