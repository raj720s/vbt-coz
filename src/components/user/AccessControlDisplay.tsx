"use client";

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { fetchRolesV2, selectRolesV2, selectRolesLoading, selectRolesError } from '@/store/slices/roleSlice';
// Removed RTK Query import - using service instead
import { roleService } from '@/services';
import { RoleListRequest, RoleListResponseV2 } from '@/types/api';

const AccessControlDisplay: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Local state for filters
  const [filters, setFilters] = useState<RoleListRequest>({
    page: 1,
    page_size: 10,
    role_name: '',
    order_by: 'created_on',
    order_type: 'desc',
    include_privilege_data: true,
  });
  
  // Removed RTK Query usage - using service instead
  
  // Redux state
  const rolesV2 = useSelector(selectRolesV2);
  const loading = useSelector(selectRolesLoading);
  const error = useSelector(selectRolesError);

  // Example 1: Using Redux slice with async thunk
  const handleFetchRolesRedux = () => {
    dispatch(fetchRolesV2(filters));
  };

  // Example 2: Using Service (replaced RTK Query)
  const handleFetchRolesService = async () => {
    try {
      const result = await roleService.getRoles(filters);
      console.log('Service result:', result);
    } catch (error) {
      console.error('Service error:', error);
    }
  };

  // Example 3: Using service directly (alternative method)
  const handleFetchRolesServiceDirect = async () => {
    try {
      const result = await roleService.getRoles(filters);
      console.log('Service result:', result);
    } catch (error) {
      console.error('Service error:', error);
    }
  };

  // Example 4: Advanced filtering
  const handleAdvancedFilter = () => {
    const advancedFilters: RoleListRequest = {
      ...filters,
      include_privilege_data: true,
      created_on_start_date: '2024-01-01T00:00:00.000Z',
      created_on_end_date: new Date().toISOString(),
      export: false,
      module_id: 1
    };
    
    dispatch(fetchRolesV2(advancedFilters));
  };

  // Example 5: Pagination
  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    dispatch(fetchRolesV2(newFilters));
  };

  // Example 6: Search by role name
  const handleSearchByName = (roleName: string) => {
    const newFilters = { ...filters, role_name: roleName, page: 1 };
    setFilters(newFilters);
    dispatch(fetchRolesV2(newFilters));
  };

  // Example 7: Export functionality
  const handleExport = async () => {
    const exportFilters: RoleListRequest = {
      ...filters,
      export: true,
      page_size: 1000 // Get all roles for export
    };
    
    try {
      const result = await roleService.getRoles(exportFilters);
      console.log('Export data:', result);
      // Here you would typically trigger download or send to export service
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Role Management API Examples</h2>
      
      {/* Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Role Name"
            value={filters.role_name}
            onChange={(e) => setFilters({ ...filters, role_name: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <select
            value={filters.order_type}
            onChange={(e) => setFilters({ ...filters, order_type: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleFetchRolesRedux}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Fetch Roles (Redux)
          </button>
          
          <button
            onClick={handleFetchRolesServiceDirect}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Fetch Roles (Service Direct)
          </button>
          
          <button
            onClick={handleFetchRolesService}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Fetch Roles (Service)
          </button>
          
          <button
            onClick={handleAdvancedFilter}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
          >
            Advanced Filter
          </button>
          
          <button
            onClick={handleExport}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Export
          </button>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="mb-4 flex items-center gap-2">
        <span>Page:</span>
        <button
          onClick={() => handlePageChange(Math.max(1, (filters.page || 1) - 1))}
          disabled={(filters.page || 1) <= 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-3 py-1 bg-gray-100 rounded">{filters.page || 1}</span>
        <button
          onClick={() => handlePageChange((filters.page || 1) + 1)}
          className="px-3 py-1 border rounded"
        >
          Next
        </button>
      </div>

      {/* Results Display */}
      {loading && <div className="text-center py-4">Loading...</div>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      {rolesV2.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Roles ({rolesV2.length})</h3>
          <div className="grid gap-4">
            {rolesV2.map((role) => (
              <div key={role.id} className="border rounded p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{role.role_name}</h4>
                    <p className="text-gray-600">{role.role_description}</p>
                    <p className="text-sm text-gray-500">
                      Privileges: {role.privilege_names}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>Created: {new Date(role.created_on).toLocaleDateString()}</p>
                    <p>Modified: {new Date(role.modified_on).toLocaleDateString()}</p>
                    <p>Created by: {role.created_by}</p>
                    <p>Modified by: {role.modified_by}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      

      {/* API Information */}
      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">API Endpoint Information</h3>
        <p className="text-sm text-gray-600">
          <strong>Endpoint:</strong> POST /api/admin/v1/role/list
        </p>
        <p className="text-sm text-gray-600">
          <strong>Method:</strong> POST with JSON body
        </p>
        <p className="text-sm text-gray-600">
          <strong>Features:</strong> Pagination, filtering, sorting, export capability
        </p>
      </div>
    </div>
  );
};

export default AccessControlDisplay; 