"use client";

import { withSimplifiedRBAC } from "@/components/auth/withSimplifiedRBAC";
import Button from "@/components/ui/button/Button";
import toast from "react-hot-toast";
import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  PaginationState,
} from "@tanstack/react-table";
import Input from "@/components/form/input/InputField";
import { DownloadIcon } from "@/icons";
import { getStoredOptimizationResults } from '@/services/cargoOptimizationService';
import Pagination from "@/components/tables/Pagination";

interface AssignmentResult {
  id: string;
  customer: string;
  shipment: string;
  optimizedContainerRef: string;
  containerType: string;
  minThreshold: number;
  maxThreshold: number;
  totalCBM: number;
  cbm: number;
  pol: string;
  destination: string;
  pugDate: string;
  pucDate: string;
  qty: number;
  totalQty: number;
  groupMixStatus: string;
  status: "assigned" | "unassigned" | "error";
  createdAt: string;
}

const columnHelper = createColumnHelper<AssignmentResult>();

function AssignmentResultsManager() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Get planning results from session storage, optimization results, or use mock data
  const getAssignmentData = (): AssignmentResult[] => {
    try {
      // First, try to get results from session storage (latest planning results)
      const storedData = sessionStorage.getItem('planningResults');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        return parsed.assignments.map((assignment: Record<string, unknown>, index: number) => ({
          id: (index + 1).toString(),
          customer: (assignment.customer as string) || '',
          shipment: (assignment.shipmentId as string) || '',
          optimizedContainerRef: (assignment.containerRef as string) || (assignment.optimizedContainerRef as string) || '',
          containerType: (assignment.containerType as string) || 'Unknown',
          minThreshold: (assignment.minThreshold as number) || 0,
          maxThreshold: (assignment.maxThreshold as number) || 0,
          totalCBM: (assignment.totalCBM as number) || (assignment.volume as number) || 0,
          cbm: (assignment.volume as number) || (assignment.cbm as number) || 0,
          pol: (assignment.pol as string) || '',
          destination: (assignment.pod as string) || (assignment.destsite as string) || '',
          pugDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '/'),
          pucDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '/'),
          qty: (assignment.qty as number) || 0,
          totalQty: (assignment.totalQty as number) || 0,
          groupMixStatus: 'Standard GroupMix',
          status: (assignment.status as "assigned" | "unassigned" | "error") || 'assigned',
          createdAt: new Date().toISOString().split('T')[0],
        }));
      }

             // Second, try to get results from cargo optimization API results
       const optimizationResults = getStoredOptimizationResults();
       if (optimizationResults && optimizationResults.results.length > 0) {
         return optimizationResults.results.map((result, index) => {
           // Calculate PUG and PUC dates based on processing date
           const processingDate = new Date(optimizationResults.processedAt);
           const pugDate = processingDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
           
           // PUC date is PUG date + 5 days
           const pucDate = new Date(processingDate);
           pucDate.setDate(pucDate.getDate() + 5);
           const pucDateStr = pucDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
           
           return {
             id: (index + 1).toString(),
             customer: result.customer || 'Unknown',
             shipment: result.shipment || `SHIP_${index + 1}`,
             optimizedContainerRef: result.optimizedContainerRef || `CONT_${index + 1}`,
             containerType: result.containerType || 'Unknown',
             minThreshold: result.minThreshold || 0,
             maxThreshold: result.maxThreshold || 0,
             totalCBM: result.totalCBM || result.cbm || 0,
             cbm: result.cbm || 0,
             pol: result.pol || 'Unknown',
             destination: result.destination || 'Unknown',
             pugDate: pugDate,
             pucDate: pucDateStr,
             qty: result.qty || 0,
             totalQty: result.totalQty || result.qty || 0,
             groupMixStatus: 'Standard GroupMix',
             status: (result.status as "assigned" | "unassigned" | "error") || "assigned",
             createdAt: processingDate.toISOString().split('T')[0],
           };
         });
       }
    } catch (error) {
      console.error('Error parsing planning results:', error);
    }

    // Fallback to mock data matching the image format
    return [
      {
        id: "1",
        customer: "BON PRIX",
        shipment: "QL302582",
        optimizedContainerRef: "CONT_001",
        containerType: "40FT",
        minThreshold: 50,
        maxThreshold: 67,
        totalCBM: 56.557,
        cbm: 56.557,
        pol: "Qingdao",
        destination: "HALDENSL",
        pugDate: "17/07/202",
        pucDate: "22/07/202",
        qty: 2873,
        totalQty: 2873,
        groupMixStatus: "Standard GroupMix",
        status: "assigned",
        createdAt: "2024-01-15",
      },
      {
        id: "2",
        customer: "BON PRIX",
        shipment: "QL302581",
        optimizedContainerRef: "CONT_002",
        containerType: "40DRY",
        minThreshold: 44.8,
        maxThreshold: 54.8,
        totalCBM: 54.024,
        cbm: 54.024,
        pol: "Qingdao",
        destination: "HALDENSL",
        pugDate: "18/07/202",
        pucDate: "23/07/202",
        qty: 3217,
        totalQty: 3217,
        groupMixStatus: "Standard GroupMix",
        status: "assigned",
        createdAt: "2024-01-15",
      },
      {
        id: "3",
        customer: "BON PRIX",
        shipment: "QL302583",
        optimizedContainerRef: "CONT_003",
        containerType: "LCL",
        minThreshold: 0,
        maxThreshold: 19.9,
        totalCBM: 53.983,
        cbm: 9.792,
        pol: "Yantian",
        destination: "HALDENSL",
        pugDate: "21/07/202",
        pucDate: "26/07/202",
        qty: 4550,
        totalQty: 4550,
        groupMixStatus: "Standard GroupMix",
        status: "assigned",
        createdAt: "2024-01-15",
      },
    ];
  };

  const [data] = useState<AssignmentResult[]>(getAssignmentData());

  // Define columns inside the component to avoid infinite re-renders
  const columns = useMemo(() => [
    columnHelper.accessor("customer", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Customer
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => <span className="font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor("shipment", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Shipment
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => <span className="font-mono text-sm">{info.getValue()}</span>
    }),
    columnHelper.accessor("optimizedContainerRef", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Optimized Container Ref
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
          {info.getValue() || "-"}
        </span>
      )
    }),
    columnHelper.accessor("containerType", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Cont. Type
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor("minThreshold", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Min. Threshold
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => <span className="text-sm">{info.getValue().toFixed(1)}</span>
    }),
    columnHelper.accessor("maxThreshold", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Max. Threshold
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => <span className="text-sm">{info.getValue().toFixed(1)}</span>
    }),
    columnHelper.accessor("totalCBM", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Total CBM
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => <span className="font-medium">{info.getValue().toFixed(2)}</span>
    }),
    columnHelper.accessor("cbm", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          CBM
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => <span className="text-sm">{info.getValue().toFixed(2)}</span>
    }),
    columnHelper.accessor("pol", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          POL
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => <span className="font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor("destination", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Destination
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => <span className="font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor("pugDate", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          PUG Date
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => <span className="text-sm">{info.getValue()}</span>
    }),
    columnHelper.accessor("pucDate", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Ship Date (PUG+5)
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => <span className="text-sm">{info.getValue()}</span>
    }),
    columnHelper.accessor("qty", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Qty
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => <span className="text-sm">{info.getValue().toLocaleString()}</span>
    }),
    columnHelper.accessor("totalQty", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Total Qty
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => <span className="font-medium">{info.getValue().toLocaleString()}</span>
    }),
    columnHelper.accessor("groupMixStatus", { 
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          GroupMix Status
          <span className="text-xs">
            {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
          </span>
        </button>
      ),
      cell: (info) => (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-300">
          {info.getValue()}
        </span>
      )
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
        <span className={`px-2 py-1 text-xs rounded-full ${
          info.getValue() === "assigned"
            ? "bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300"
            : info.getValue() === "unassigned"
            ? "bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-300"
            : "bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-300"
        }`}>
          {info.getValue()}
        </span>
      ),
    }),
  ], []);

  const filteredData = useMemo(() => data.filter(item => {
    const matchesSearch =
      item.shipment.toLowerCase().includes(globalFilter.toLowerCase()) ||
      item.customer.toLowerCase().includes(globalFilter.toLowerCase()) ||
      item.optimizedContainerRef.toLowerCase().includes(globalFilter.toLowerCase()) ||
      item.pol.toLowerCase().includes(globalFilter.toLowerCase()) ||
      item.destination.toLowerCase().includes(globalFilter.toLowerCase());

    const matchesStatus = statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  }), [data, globalFilter, statusFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
      sorting,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
  });

  const exportToExcel = () => {
    const headers = ["Customer", "Shipment", "Optimized Container Ref", "Cont. Type", "Min. Threshold", "Max. Threshold", "Total CBM", "CBM", "POL", "Destination", "PUG Date", "Ship Date (PUG+5)", "Qty", "Total Qty", "GroupMix Status", "Status"];
    
    const csvContent = [
      headers.join(","),
      ...filteredData.map(row => [
        row.customer,
        row.shipment,
        row.optimizedContainerRef,
        row.containerType,
        row.minThreshold,
        row.maxThreshold,
        row.totalCBM,
        row.cbm,
        row.pol,
        row.destination,
        row.pugDate,
        row.pucDate,
        row.qty,
        row.totalQty,
        row.groupMixStatus,
        row.status
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assignment_results.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Export completed successfully");
  };

  const getSummaryStats = useMemo(() => {
    const total = filteredData.length;
    const assigned = filteredData.filter(item => item.status === "assigned").length;
    const unassigned = filteredData.filter(item => item.status === "unassigned").length;
    const errors = filteredData.filter(item => item.status === "error").length;

    return { total, assigned, unassigned, errors };
  }, [filteredData]);

  const stats = getSummaryStats;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Assignment Results
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage container assignment results from the latest planning run
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Shipments</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.assigned}</div>
          <div className="text-sm text-green-600 dark:text-green-400">Assigned</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.unassigned}</div>
          <div className="text-sm text-yellow-600 dark:text-yellow-400">Unassigned</div>
        </div>

      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search shipments, customers, or container refs..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
            <option value="error">Error</option>
          </select>

          <Button onClick={exportToExcel} size="sm">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
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
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    row.original.status === "error" ? "bg-error-50 dark:bg-error-900/20" : ""
                  }`}
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
      {filteredData.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {pagination.pageIndex * pagination.pageSize + 1} to{" "}
            {Math.min(
              (pagination.pageIndex + 1) * pagination.pageSize,
              filteredData.length
            )}{" "}
            of {filteredData.length} results
          </div>
          <Pagination
            currentPage={pagination.pageIndex + 1}
            totalPages={Math.ceil(filteredData.length / pagination.pageSize)}
            onPageChange={(page) => setPagination(prev => ({ ...prev, pageIndex: page - 1 }))}
          />
        </div>
      )}

    </div>
  );
}

export default withSimplifiedRBAC(AssignmentResultsManager, {
  privilege: "VIEW_ASSIGNMENT_RESULTS",
  module: [80], // Analytics & Reports module
  allowSuperUserBypass: true,
  redirectTo: "/dashboard"
}); 