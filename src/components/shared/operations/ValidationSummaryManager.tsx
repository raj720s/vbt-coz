"use client";

import { withSimplifiedRBAC } from "@/components/auth/withSimplifiedRBAC";
import Button from "@/components/ui/button/Button";
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
  ColumnDef,
} from "@tanstack/react-table";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Pagination from "@/components/tables/Pagination";

interface ValidationError {
  id: string;
  rowNumber: number;
  field: string;
  errorMessage: string;
  value: string;
  severity: "error" | "warning";
}

interface ValidationSummary {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors: ValidationError[];
  fileName?: string;
  uploadDate?: string;
  fileSize?: number;
  storedFileName?: string;
}

const columnHelper = createColumnHelper<ValidationError>();

const columns: ColumnDef<ValidationError>[] = [
  {
    accessorKey: "rowNumber",
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        Row #
        <span className="text-xs">
          {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
        </span>
      </button>
    ),
    cell: (info) => <span>{info.getValue() as number}</span>,
  },
  {
    accessorKey: "field",
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        Field
        <span className="text-xs">
          {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
        </span>
      </button>
    ),
    cell: (info) => <span>{info.getValue() as string}</span>,
  },
  {
    accessorKey: "value",
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        Value
        <span className="text-xs">
          {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
        </span>
      </button>
    ),
    cell: (info) => (
      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded dark:bg-gray-700">
        {info.getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "errorMessage",
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        Error Message
        <span className="text-xs">
          {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
        </span>
      </button>
    ),
    cell: (info) => <span>{info.getValue() as string}</span>,
  },
  {
    accessorKey: "severity",
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        Severity
        <span className="text-xs">
          {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
        </span>
      </button>
    ),
    cell: (info) => (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          (info.getValue() as string) === "error"
            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        }`}
      >
        {info.getValue() as string}
      </span>
    ),
  },
];

function ValidationSummaryManager() {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  console.log('ValidationSummaryPage: Component rendering');

  // Get validation data from session storage or use mock data
  const getValidationSummary = (): ValidationSummary => {
    console.log('ValidationSummaryPage: Getting validation summary');
    try {
      const storedData = sessionStorage.getItem('validationResult');
      console.log('ValidationSummaryPage: Stored data:', storedData);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        console.log('ValidationSummaryPage: Parsed data:', parsed);
        return {
          totalRecords: parsed.totalRecords,
          validRecords: parsed.validRecords,
          invalidRecords: parsed.invalidRecords,
          fileName: parsed.fileName,
          uploadDate: parsed.uploadDate,
          fileSize: parsed.fileSize,
          storedFileName: parsed.storedFileName,
          errors: parsed.errors.map((error: ValidationError, index: number) => ({
            id: (index + 1).toString(),
            rowNumber: error.rowNumber,
            field: error.field,
            errorMessage: error.errorMessage,
            value: error.value,
            severity: error.severity,
          })),
        };
      }
    } catch (error) {
      console.error('Error parsing validation data:', error);
    }

    // Fallback to mock data
    return {
      totalRecords: 150,
      validRecords: 120,
      invalidRecords: 30,
      fileName: "sample_shipments.xlsx",
      uploadDate: new Date().toISOString(),
      fileSize: 2048,
      storedFileName: "sample_shipments_1234567890.xlsx",
      errors: [
        {
          id: "1",
          rowNumber: 5,
          field: "Shipment ID",
          errorMessage: "Shipment ID is required",
          value: "",
          severity: "error",
        },
        {
          id: "2",
          rowNumber: 12,
          field: "Volume",
          errorMessage: "Volume must be a positive number",
          value: "-5.2",
          severity: "error",
        },
        {
          id: "3",
          rowNumber: 18,
          field: "Customer",
          errorMessage: "Customer not found in master data",
          value: "Unknown Customer",
          severity: "warning",
        },
        {
          id: "4",
          rowNumber: 25,
          field: "POL",
          errorMessage: "Port of Loading is required",
          value: "",
          severity: "error",
        },
        {
          id: "5",
          rowNumber: 32,
          field: "Destsite",
          errorMessage: "Destination site is required",
          value: "",
          severity: "error",
        },
        {
          id: "6",
          rowNumber: 45,
          field: "Qty",
          errorMessage: "Quantity must be greater than 0",
          value: "0",
          severity: "error",
        },
      ],
    };
  };

  const [validationSummary, setValidationSummary] = useState<ValidationSummary>(getValidationSummary());

  const table = useReactTable({
    data: validationSummary.errors,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
  });

  const downloadErrorReport = () => {
    const csvContent = [
      ["Row Number", "Field", "Value", "Error Message", "Severity"],
      ...validationSummary.errors.map((error) => [
        error.rowNumber.toString(),
        error.field,
        error.value,
        error.errorMessage,
        error.severity,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "validation_errors.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Error report downloaded successfully!");
  };

  const handleProceed = () => {
    if (validationSummary.invalidRecords === 0) {
      toast.success("Proceeding to container planning...");
      router.push("/admin/container-planning");
    } else {
      toast.error("Please fix all validation errors before proceeding");
    }
  };

  const handleReupload = () => {
    router.push("/admin/shipment-upload");
  };

  const errorCount = validationSummary.errors.filter((e) => e.severity === "error").length;
  const warningCount = validationSummary.errors.filter((e) => e.severity === "warning").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Validation Summary
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review validation results and fix any errors
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={downloadErrorReport} size="sm" variant="outline">
            Download Error Report
          </Button>
          <Button onClick={handleReupload} size="sm" variant="outline">
            Re-upload
          </Button>
        </div>
      </div>

      {/* File Information */}
      {validationSummary.fileName && (
        <div className="bg-white rounded-lg shadow dark:bg-gray-800 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Uploaded File Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">File Name</p>
              <p className="text-sm text-gray-900 dark:text-white">{validationSummary.fileName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upload Date</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {validationSummary.uploadDate ? new Date(validationSummary.uploadDate).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">File Size</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {validationSummary.fileSize ? `${(validationSummary.fileSize / 1024).toFixed(2)} KB` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Actions</p>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    if (validationSummary.storedFileName) {
                      const link = document.createElement('a');
                      link.href = `/uploads/${validationSummary.storedFileName}`;
                      link.download = validationSummary.fileName || 'download';
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      toast.success('Downloading file...');
                    }
                  }}
                >
                  Download
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    if (validationSummary.storedFileName) {
                      window.open(`/uploads/${validationSummary.storedFileName}`, '_blank');
                      toast.success('Opening file in new tab...');
                    }
                  }}
                >
                  View
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-900">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Records</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{validationSummary.totalRecords}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full dark:bg-green-900">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valid Records</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{validationSummary.validRecords}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full dark:bg-red-900">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Errors</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{errorCount}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full dark:bg-yellow-900">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Warnings</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{warningCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Status */}
      <div className={`p-4 rounded-lg ${
        validationSummary.invalidRecords === 0
          ? "bg-green-50 dark:bg-green-900/20"
          : "bg-red-50 dark:bg-red-900/20"
      }`}>
        <div className="flex items-center">
          {validationSummary.invalidRecords === 0 ? (
            <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <div>
            <h3 className={`text-lg font-medium ${
              validationSummary.invalidRecords === 0
                ? "text-green-900 dark:text-green-100"
                : "text-red-900 dark:text-red-100"
            }`}>
              {validationSummary.invalidRecords === 0
                ? "All records are valid! You can proceed to container planning."
                : `${validationSummary.invalidRecords} records have validation errors. Please fix them before proceeding.`}
            </h3>
          </div>
        </div>
      </div>

      {/* Error Table */}
      {validationSummary.errors.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Validation Errors ({validationSummary.errors.length})
            </h3>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Search errors..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow dark:bg-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300"
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              className={
                                header.column.getCanSort()
                                  ? "cursor-pointer select-none"
                                  : ""
                              }
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {validationSummary.errors.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {pagination.pageIndex * pagination.pageSize + 1} to{" "}
                {Math.min(
                  (pagination.pageIndex + 1) * pagination.pageSize,
                  validationSummary.errors.length
                )}{" "}
                of {validationSummary.errors.length} results
              </div>
              <Pagination
                currentPage={pagination.pageIndex + 1}
                totalPages={Math.ceil(validationSummary.errors.length / pagination.pageSize)}
                onPageChange={(page) => setPagination(prev => ({ ...prev, pageIndex: page - 1 }))}
              />
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          onClick={handleProceed}
          size="md"
          disabled={validationSummary.invalidRecords > 0}
          className={validationSummary.invalidRecords > 0 ? "opacity-50 cursor-not-allowed" : ""}
        >
          Proceed to Container Planning
        </Button>
      </div>
    </div>
  );
}

export default withSimplifiedRBAC(ValidationSummaryManager, {
  privilege: "VIEW_VALIDATION_SUMMARY",
  module: [80], // Analytics & Reports module
  allowSuperUserBypass: true,
  redirectTo: "/dashboard"
}); 