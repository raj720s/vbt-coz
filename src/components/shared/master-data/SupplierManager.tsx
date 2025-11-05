"use client";

import Button from "@/components/ui/button/Button";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Input from "@/components/form/input/InputField";
import { PencilIcon, TrashBinIcon, PlusIcon, AlertIcon, CheckCircleIcon } from "@/icons";
import { DeleteConfirmationModal } from "@/components/ui/modal/DeleteConfirmationModal";
import toast from "react-hot-toast";
import { Supplier, SupplierListRequest, COUNTRIES } from "@/types/supplier";
import { supplierService } from "@/services/supplierService";
import { withSimplifiedRBAC, SimplifiedRBACProps } from "@/components/auth/withSimplifiedRBAC";

// AG Grid imports
import type {
  ColDef,
  GridReadyEvent,
  ICellRendererParams,
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
  ColumnMenuModule
} from "ag-grid-enterprise";

ModuleRegistry.registerModules([
  AllCommunityModule,
  CsvExportModule,
  ExcelExportModule,
  SetFilterModule,
  ContextMenuModule,
  ColumnMenuModule,
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

interface SupplierManagerProps {
  rbacContext?: SimplifiedRBACProps['rbacContext'];
}

function SupplierManager({ rbacContext }: SupplierManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  
  const { can, isAdmin, isSuperUser } = rbacContext || {};
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const gridRef = useRef<AgGridReact<Supplier>>(null);
  
  const [filters, setFilters] = useState<SupplierListRequest>({
    page: 1,
    page_size: 10,
    order_by: "name",
    order_type: "asc"
  });
  
  const [globalFilter, setGlobalFilter] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Supplier | null>(null);

  const canDeleteSupplier = can?.("DELETE_SUPPLIER") || isAdmin?.() || isSuperUser;

  // Redirect to add page if action=add
  useEffect(() => {
    if (action === 'add') {
      router.push('/supplier-management/add');
    }
  }, [action, router]);

  // Load suppliers
  useEffect(() => {
    loadSuppliers();
  }, [filters]);

  // Auto-clear errors
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await supplierService.getSuppliers(filters);
      setSuppliers(response.results || []);
      setTotal(response.count || 0);
    } catch (err: any) {
      console.error('Error loading suppliers:', err);
      setError(err.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteClick = (supplier: Supplier) => {
    if (!canDeleteSupplier) {
      toast.error("You don't have permission to delete suppliers");
      return;
    }
    
    setDeletingItem(supplier);
    setDeleteModalOpen(true);
  };

  // Actions Cell Renderer
  const ActionsRenderer = useCallback((params: ICellRendererParams) => {
    const handleEditClick = () => {
      router.push(`/supplier-management/edit?id=${params.data.id}`);
    };

    const handleDeleteButtonClick = () => {
      handleDeleteClick(params.data);
    };

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
        
        {canDeleteSupplier && (
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
  }, [canDeleteSupplier, router]);

  // Column Definitions
  const columnDefs = useMemo<ColDef[]>(() => [
    {
      field: "actions",
      headerName: "Action",
      width: 120,
      cellRenderer: ActionsRenderer,
      sortable: false,
      filter: false,
      suppressMovable: true,
      lockPosition: 'left',
      checkboxSelection: false,
    },
    {
      field: "code",
      headerName: "Supplier Code",
      minWidth: 150,
      flex: 1,
      sortable: true,
      filter: true,
      cellRenderer: CodeRenderer,
    },
    {
      field: "name",
      headerName: "Supplier Name",
      minWidth: 200,
      flex: 2,
      sortable: true,
      filter: true,
      cellRenderer: NameRenderer,
    },
    {
      field: "email",
      headerName: "Email",
      minWidth: 180,
      flex: 1.5,
      sortable: true,
      filter: true,
    },
    {
      field: "phone",
      headerName: "Phone",
      minWidth: 120,
      flex: 1,
      sortable: true,
      filter: true,
    },
    {
      field: "country",
      headerName: "Country",
      minWidth: 120,
      flex: 1,
      sortable: true,
      filter: "agSetColumnFilter",
      filterParams: {
        values: COUNTRIES.map(country => country.value),
        valueFormatter: (params: any) => {
          const country = COUNTRIES.find(c => c.value === params.value);
          return country?.label || params.value;
        },
      },
    },
    {
      field: "is_active",
      headerName: "Status",
      minWidth: 120,
      flex: 0.8,
      sortable: true,
      filter: "agSetColumnFilter",
      filterParams: {
        values: [true, false],
        valueFormatter: (params: any) => (params.value ? "Active" : "Inactive"),
      },
      cellRenderer: StatusRenderer,
    },
  ], [ActionsRenderer]);

  // Default Column Definition
  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    flex: 1,
    minWidth: 100,
  }), []);

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    if (!canDeleteSupplier) {
      toast.error("You don't have permission to delete suppliers");
      setDeleteModalOpen(false);
      setDeletingItem(null);
      return;
    }

    try {
      setLoading(true);
      await supplierService.deleteSupplier(deletingItem.id);
      toast.success('Supplier deleted successfully');
      setDeleteModalOpen(false);
      setDeletingItem(null);
      loadSuppliers();
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      toast.error(error.message || 'Failed to delete supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm: string) => {
    setGlobalFilter(searchTerm);
    setFilters(prev => ({ 
      ...prev,
      search: searchTerm,
      page: 1 
    }));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">         
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Supplier Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage suppliers, supplier codes, and supplier information
        </p>
        
        {!canDeleteSupplier && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">
                <strong>Read-only mode:</strong> You can view and edit supplier data, but cannot delete records.
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Suppliers</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{total}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Active Suppliers</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {suppliers.filter(s => s.is_active).length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Inactive Suppliers</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {suppliers.filter(s => !s.is_active).length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Countries</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {new Set(suppliers.map(s => s.country).filter(Boolean)).size}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 py-4">
        <div className="flex-1">
          <Input
            placeholder="Search suppliers by name"
            value={globalFilter}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => router.push('/supplier-management/add')}
            className="flex items-center gap-2 bg-theme-purple-600 hover:bg-theme-purple-700 text-white whitespace-nowrap"
          >
            <PlusIcon className="w-4 h-4" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* AG Grid Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden" style={{ height: '600px' }}>
        <AgGridReact
          ref={gridRef}
          rowData={suppliers}
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
          className="ag-theme-alpine"
          rowSelection={{ mode: "multiRow" }}
          defaultCsvExportParams={{
            fileName: `suppliers_${new Date().toISOString().split('T')[0]}.csv`,
            onlySelected: true,
          }}
          defaultExcelExportParams={{
            fileName: `suppliers_${new Date().toISOString().split('T')[0]}.xlsx`,
            sheetName: "Suppliers",
            onlySelected: true,
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
        title="Delete Supplier"
        message={`Are you sure you want to delete the supplier "${deletingItem?.name}" (${deletingItem?.code})? This action cannot be undone.`}
        itemName={deletingItem?.name}
        isLoading={loading}
        variant="danger"
      />
    </div>
  );
}

export default withSimplifiedRBAC(SupplierManager, {
  privilege: "VIEW_SUPPLIERS",
  module: [69],
  allowSuperUserBypass: true,
  redirectTo: "/dashboard"
});

// DEBUG: This component should have role config
console.log('🔐 SupplierManager loaded with role config:', [69]);

