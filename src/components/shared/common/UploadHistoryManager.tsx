/*
"use client";

import { withSimplifiedRBAC } from "@/components/auth/withSimplifiedRBAC";      
import Button from "@/components/ui/button/Button";
import { useState, useEffect, useMemo } from "react";
// Removed useLocalStorageData - localStorage managed by services
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  PaginationState,
} from "@tanstack/react-table";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { 
  DownloadIcon, 
  EyeIcon, 
  RefreshIcon, 
  FileIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  UserIcon
} from "@/icons";
import { getUploadedFiles } from "@/utils/clientShipmentService";
import { formatFileSize } from "@/utils/formatUtils";
import { type UploadedFile, type ValidationError } from "@/utils/localStorageService";
import { ExcelViewerModal } from "@/components/ui/ExcelViewerModal";
import { getAssignmentResultByFileId, generateAssignmentResultsExcel } from "@/utils/assignmentResultsService";

interface ExtendedUploadedFile extends UploadedFile {
  errors?: ValidationError[];
  warnings?: ValidationError[];
}

interface UploadHistory {
  id: string;
  userId: string;
  userName: string;
  originalName: string;
  uploadDate: string;
  fileSize: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  status: "SUCCESS" | "FAILED" | "PENDING" | "PROCESSING";
  errors?: ValidationError[];
  warnings?: ValidationError[];
  hasOutputFile?: boolean;
  outputFileName?: string;
}

// Mock users for demonstration - in real app, this would come from API
const mockUsers = [
  { id: "user1", name: "John Doe" },
  { id: "user2", name: "Jane Smith" },
  { id: "user3", name: "Bob Johnson" },
  { id: "user4", name: "Alice Brown" },
  { id: "user5", name: "Charlie Wilson" },
];

const columnHelper = createColumnHelper<UploadHistory>();

function UploadsHistoryManager() {
  // Removed useLocalStorageData - localStorage managed by services
  
  const router = useRouter();
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [excelModal, setExcelModal] = useState<{
    isOpen: boolean;
    fileContent: string;
    fileName: string;
  }>({
    isOpen: false,
    fileContent: '',
    fileName: ''
  });

  // Load upload history on component mount
  useEffect(() => {
    loadUploadHistory();
  }, []);

  const loadUploadHistory = () => {
    try {
      setLoading(true);
      const files = getUploadedFiles();
      
      // Transform the data to match our new interface
      const historyData: UploadHistory[] = files.map((file: ExtendedUploadedFile, index: number) => {
        // Determine status based on validation results and assignment results
        let status: UploadHistory['status'] = 'PENDING';
        
        // Check if there are actual validation errors (not just warnings)
        const hasErrors = file.errors && file.errors.length > 0;
        const hasWarnings = file.warnings && file.warnings.length > 0;
        
        if (file.validRows > 0 && !hasErrors) {
          // File has valid data and no errors - check if assignment results exist
          const assignmentResult = getAssignmentResultByFileId(file.id);
          status = assignmentResult ? 'SUCCESS' : 'PROCESSING';
        } else if (hasErrors) {
          // Only fail if there are actual errors, not just warnings
          status = 'FAILED';
        } else if (file.validRows === 0 && file.invalidRows === 0) {
          status = 'PROCESSING';
        } else if (file.validRows > 0 && hasWarnings && !hasErrors) {
          // File has valid data and warnings but no errors - still processing
          status = 'PROCESSING';
        }
        
        // Assign mock user data for demonstration
        const mockUser = mockUsers[index % mockUsers.length];
        
        return {
          id: file.id,
          userId: mockUser.id,
          userName: mockUser.name,
          originalName: file.originalName,
          uploadDate: file.uploadDate,
          fileSize: file.fileSize,
          totalRows: file.totalRows || 0,
          validRows: file.validRows || 0,
          invalidRows: file.invalidRows || 0,
          status,
          errors: file.errors || [],
          warnings: file.warnings || [],
                     hasOutputFile: status === 'SUCCESS',
           outputFileName: status === 'SUCCESS' ? `${file.originalName.replace(/\.(xlsx|xls|csv)$/i, '')}_processed.csv` : undefined
        };
      });

      // Filter to show only last 3 months of data
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const filteredByDate = historyData.filter(item => 
        new Date(item.uploadDate) >= threeMonthsAgo
      );

      setUploadHistory(filteredByDate);
    } catch (error) {
      console.error('Error loading upload history:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => [
    columnHelper.accessor("userName", {
      header: "User",
      cell: (info) => (
        <div className="flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-white">
            {info.getValue()}
          </span>
        </div>
      )
    }),
    columnHelper.accessor("originalName", { 
      header: "Input File Name", 
      cell: (info) => (
        <div className="flex items-center gap-2">
          <FileIcon className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-gray-900 dark:text-white">
            {info.getValue()}
          </span>
        </div>
      )
    }),
    columnHelper.accessor("uploadDate", { 
      header: "Upload Date", 
      cell: (info) => (
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {new Date(info.getValue()).toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </span>
        </div>
      )
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => {
        const status = info.getValue();
        const statusConfig = {
          SUCCESS: { 
            label: "SUCCESS", 
            className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
          },
          FAILED: { 
            label: "FAILED", 
            className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" 
          },
          PENDING: { 
            label: "PENDING", 
            className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" 
          },
          PROCESSING: { 
            label: "PROCESSING", 
            className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" 
          }
        };
        
        const config = statusConfig[status];
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
            {config.label}
          </span>
        );
      },
    }),
    columnHelper.accessor("fileSize", {
      header: "File Size",
      cell: (info) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {formatFileSize(info.getValue())}
        </span>
      )
    }),
    columnHelper.accessor("totalRows", {
      header: "Total Records",
      cell: (info) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.display({
      id: "downloadInput",
      header: "View Input",
      cell: (info) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => viewInputFile(info.row.original)}
          className="p-1"
        >
          <EyeIcon className="w-4 h-4" />
          <span className="ml-1">View</span>
        </Button>
      ),
    }),
    columnHelper.display({
      id: "downloadOutput",
      header: "View Output",
      cell: (info) => {
        const row = info.row.original;
        if (row.status === 'SUCCESS' && row.hasOutputFile) {
          return (
            <Button
              size="sm"
              variant="outline"
              onClick={() => viewOutputFile(row)}
              className="p-1"
            >
              <EyeIcon className="w-4 h-4" />
              <span className="ml-1">View</span>
            </Button>
          );
        } else {
          return (
            <span className="text-sm text-gray-400 dark:text-gray-500 italic">
              Not Available
            </span>
          );
        }
      },
    }),
  ], []);

  const filteredData = useMemo(() => {
    return uploadHistory.filter(item => {
      const matchesSearch =
        item.originalName.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.userName.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.status.toLowerCase().includes(globalFilter.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      
      const matchesUser = selectedUser === "all" || item.userId === selectedUser;
      
      return matchesSearch && matchesStatus && matchesUser;
    });
  }, [uploadHistory, globalFilter, statusFilter, selectedUser]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    pageCount: Math.ceil(filteredData.length / pagination.pageSize),
    manualPagination: true,
  });

  const viewInputFile = (upload: UploadHistory) => {
    // Find the actual file data
    const files = getUploadedFiles();
    const file = files.find(f => f.id === upload.id);
    
    if (file && file.fileContent) {
      setExcelModal({
        isOpen: true,
        fileContent: file.fileContent,
        fileName: upload.originalName
      });
    } else {
      alert('File content not available');
    }
  };

  const viewOutputFile = (upload: UploadHistory) => {
    // Get assignment results for this file
    const assignmentResult = getAssignmentResultByFileId(upload.id);
    
    if (assignmentResult) {
      // Generate Excel content from assignment results
      const excelBlob = generateAssignmentResultsExcel(
        assignmentResult, 
        `${upload.originalName.replace('.xlsx', '')}_processed.csv`
      );
      
      // Convert blob to base64 for the modal
      const reader = new FileReader();
      reader.onload = () => {
        const base64Content = (reader.result as string).split(',')[1]; // Remove data URL prefix
        
        setExcelModal({
          isOpen: true,
          fileContent: base64Content,
          fileName: `${upload.originalName.replace('.xlsx', '')}_processed.csv`
        });
      };
      reader.readAsDataURL(excelBlob);
    } else {
      alert('No assignment results found for this file. Please run container planning first.');
    }
  };

  const exportHistory = () => {
    const headers = ["User", "Input File Name", "Upload Date", "Status", "File Size", "Total Records", "Valid Records", "Invalid Records"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map(row => [
        row.userName,
        row.originalName,
        new Date(row.uploadDate).toLocaleString(),
        row.status,
        formatFileSize(row.fileSize),
        row.totalRows,
        row.validRows,
        row.invalidRows
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "uploads_history.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setGlobalFilter("");
    setStatusFilter("all");
    setSelectedUser("all");
    setPagination({ pageIndex: 0, pageSize: 10 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading upload history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Uploads History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all shipment file uploads and their processing results. Shows last 10 upload records per user from the past 3 months.
          </p>
        </div>
        
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Uploads</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{uploadHistory.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Successful</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {uploadHistory.filter(item => item.status === 'SUCCESS').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {uploadHistory.filter(item => item.status === 'FAILED').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {uploadHistory.filter(item => item.status === 'PENDING').length}
              </p>
            </div>
          </div>
        </div>

       
      </div>

      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <Input
              placeholder="Search by file name, user, or status..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status Filter
            </label>
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "SUCCESS", label: "SUCCESS" },
                { value: "FAILED", label: "FAILED" },
                { value: "PENDING", label: "PENDING" },
                { value: "PROCESSING", label: "PROCESSING" }
              ]}
              className="w-full"
            />
          </div>

          
          <div className="flex items-end">
            <Button onClick={resetFilters} size="sm" variant="outline" className="w-full">
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

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
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
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

        <div className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              size="sm"
              variant="outline"
            >
              Previous
            </Button>
            <Button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              size="sm"
              variant="outline"
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div className="flex gap-x-2 items-baseline">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span> of{" "}
                <span className="font-medium">{table.getPageCount()}</span>
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Showing{" "}
                <span className="font-medium">
                  {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    filteredData.length
                  )}
                </span>{" "}
                of <span className="font-medium">{filteredData.length}</span> results
              </span>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  size="sm"
                  variant="outline"
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  size="sm"
                  variant="outline"
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Next
                </Button>
              </nav>
            </div>
          </div>
        </div>
      </div>


      <ExcelViewerModal
        isOpen={excelModal.isOpen}
        onClose={() => setExcelModal(prev => ({ ...prev, isOpen: false }))}
        fileContent={excelModal.fileContent}
        fileName={excelModal.fileName}
      />
    </div>
  );
}

export default withSimplifiedRBAC(UploadsHistoryManager, {
  privilege: "VIEW_UPLOADS_HISTORY",
  module: [70], // Shipment Operations module
  allowSuperUserBypass: true,
  redirectTo: "/dashboard"
});

*/