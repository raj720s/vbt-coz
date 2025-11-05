"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { customerService } from '@/services/customerService';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';
import { CustomerResponse, CustomerListRequest } from '@/types/api';


interface CustomerSelectorProps {
  selectedCustomers: number[];
  onSelectionChange: (customerIds: number[]) => void;
  maxSelections?: number;
  disabled?: boolean;
  className?: string;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  selectedCustomers,
  onSelectionChange,
  maxSelections,
  disabled = false,
  className = ""
}) => {
  const { user, canAccessCustomer, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [customersData, setCustomersData] = useState<CustomerResponse[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);

  // Fetch customers using service
  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true);
      setCustomersError(null);
      const response = await customerService.getCustomers({
        page: 1,
        page_size: 1000, // Get all customers for selection
        order_by: 'name',
        order_type: 'asc'
      });
      setCustomersData(response.results);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      setCustomersError(error.message || 'Failed to fetch customers');
    } finally {
      setCustomersLoading(false);
    }
  };

  // Load customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Get all available customers
  const allCustomers = useMemo(() => {
    return customersData || [];
  }, [customersData]);

  // Get unique countries for filtering
  const countries = useMemo(() => {
    const uniqueCountries = new Set(allCustomers.map(customer => customer.country));
    return Array.from(uniqueCountries).sort();
  }, [allCustomers]);

  // Filter customers based on search term and country
  const filteredCustomers = useMemo(() => {
    return allCustomers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.country.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCountry = selectedCountry === 'all' || customer.country === selectedCountry;
      
      return matchesSearch && matchesCountry;
    });
  }, [allCustomers, searchTerm, selectedCountry]);

  // Handle customer selection toggle
  const toggleCustomer = (customerId: number) => {
    if (disabled) return;

    const isSelected = selectedCustomers.includes(customerId);
    
    if (isSelected) {
      // Remove customer
      onSelectionChange(selectedCustomers.filter(id => id !== customerId));
    } else {
      // Add customer (check max selections)
      if (maxSelections && selectedCustomers.length >= maxSelections) {
        return; // Don't add if max selections reached
      }
      onSelectionChange([...selectedCustomers, customerId]);
    }
  };

  // Select all customers
  const selectAllCustomers = () => {
    if (disabled) return;
    
    const allCustomerIds = filteredCustomers.map(customer => customer.id);
    onSelectionChange(allCustomerIds);
  };

  // Clear all selections
  const clearAllCustomers = () => {
    if (disabled) return;
    onSelectionChange([]);
  };

  // Get selected customer details
  const selectedCustomerDetails = useMemo(() => {
    return allCustomers.filter(customer => selectedCustomers.includes(customer.id));
  }, [allCustomers, selectedCustomers]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Customer Assignments</Label>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchCustomers}
            disabled={customersLoading}
            className="text-xs px-3 py-1.5"
          >
            {customersLoading ? "Loading..." : "Refresh"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={selectAllCustomers}
            disabled={disabled || customersData.length === 0 || filteredCustomers.length === 0}
            className="text-xs px-3 py-1.5"
          >
            Select All
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={clearAllCustomers}
            disabled={disabled}
            className="text-xs px-3 py-1.5"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customer-search" className="text-sm font-medium mb-2 block">
            Search Customers
          </Label>
          <Input
            id="customer-search"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={disabled}
            className="w-full"
          />
        </div>
        <div>
          <Label htmlFor="country-filter" className="text-sm font-medium mb-2 block">
            Filter by Country
          </Label>
          <select
            id="country-filter"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            disabled={disabled}
          >
            <option value="all">All Countries</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Customers Summary */}
      {selectedCustomers.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Selected Customers ({selectedCustomers.length})
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={clearAllCustomers}
              disabled={disabled}
              className="text-xs px-3 py-1.5 hover:bg-blue-100 dark:hover:bg-blue-800"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
            {selectedCustomerDetails.map((customer) => (
              <span
                key={customer.id}
                className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
              >
                <span className="truncate max-w-32">{customer.customer_code}</span>
                <button
                  onClick={() => toggleCustomer(customer.id)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 ml-1 hover:bg-blue-300 dark:hover:bg-blue-600 rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold"
                  disabled={disabled}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Customer List */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="max-h-80 overflow-y-auto thin-scrollbar">
          {customersLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Loading customers...
            </div>
          ) : customersError ? (
            <div className="p-4 text-center text-red-500 dark:text-red-400">
              Error loading customers. Please try again.
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="p-3 space-y-1">
              {filteredCustomers.map((customer) => (
                <label
                  key={customer.id}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedCustomers.includes(customer.id)}
                    onChange={() => toggleCustomer(customer.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    disabled={disabled || (maxSelections ? selectedCustomers.length >= maxSelections && !selectedCustomers.includes(customer.id) : false)}
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                        {customer.customer_code}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">-</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {customer.name}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {customer.contact_person} • {customer.country}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              {searchTerm || selectedCountry !== 'all' 
                ? "No customers found matching your search criteria." 
                : "No customers available."}
            </div>
          )}
        </div>
      </div>

      {/* Max Selections Warning */}
      {maxSelections && selectedCustomers.length >= maxSelections && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Maximum {maxSelections} customer{maxSelections > 1 ? 's' : ''} selected.
        </p>
      )}
    </div>
  );
};

export default CustomerSelector;