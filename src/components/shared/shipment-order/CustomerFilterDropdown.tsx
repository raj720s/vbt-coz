"use client";
import React, { useState, useEffect } from "react";
import { customerService } from "@/services/customerService";
import { CustomerResponse } from "@/types/api";
import { ChevronDownIcon } from "@/icons";

interface CustomerFilterDropdownProps {
  selectedCustomerId: number | null;
  onCustomerChange: (customerId: number | null) => void;
  disabled?: boolean;
}

export const CustomerFilterDropdown: React.FC<CustomerFilterDropdownProps> = ({
  selectedCustomerId,
  onCustomerChange,
  disabled = false
}) => {
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load customers
  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerService.getCustomers({
        page: 1,
        page_size: 100, // Load more customers for dropdown
      });
      setCustomers(response.results);
    } catch (error) {
      console.error("Failed to load customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected customer
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleCustomerSelect = (customer: CustomerResponse) => {
    onCustomerChange(customer.id);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    onCustomerChange(null);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="relative w-full min-w-[200px] px-3 py-2 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="block truncate">
          {selectedCustomer ? (
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {selectedCustomer.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedCustomer.customer_code}
              </div>
            </div>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">Select Customer</span>
          )}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
          </div>

          {/* Clear option */}
          <button
            onClick={handleClear}
            className="w-full px-3 py-2 text-left text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Clear Selection
          </button>

          {/* Customer list */}
          <div className="max-h-48 overflow-y-auto thin-scrollbar">
            {loading ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                Loading customers...
              </div>
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleCustomerSelect(customer)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {customer.name}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {customer.customer_code}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No customers found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
