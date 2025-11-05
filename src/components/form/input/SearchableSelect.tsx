"use client";
import React, { useState, useEffect, useRef } from "react";
import { ChevronDownIcon, ChevronUpIcon, XIcon } from "@/icons";
import Label from "@/components/form/Label";

interface SearchableSelectOption {
  id: string | number;
  name: string;
  code?: string;
  customer_code?: string;
  country?: string;
  city?: string;
}

interface SearchableSelectProps {
  id: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  onSearch: (query: string) => Promise<SearchableSelectOption[]>;
  error?: string;
  disabled?: boolean;
  className?: string;
  displayFormat?: (option: SearchableSelectOption) => string;
  searchPlaceholder?: string;
  valueExtractor?: (option: SearchableSelectOption) => string | number;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  label,
  required = false,
  placeholder = "Select an option",
  value,
  onChange,
  onSearch,
  error,
  disabled = false,
  className = "",
  displayFormat = (option) => `${option.name} (${option.code})`,
  searchPlaceholder = "Search...",
  valueExtractor = (option) => option.id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [options, setOptions] = useState<SearchableSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SearchableSelectOption | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find selected option when value changes
  useEffect(() => {
    if (value && options.length > 0) {
      // Try to find by ID first (default behavior)
      let option = options.find(opt => opt.id === value);
      
      // If not found by ID, try to find by name (for valueExtractor cases)
      if (!option) {
        option = options.find(opt => opt.name === value);
      }
      
      setSelectedOption(option || null);
    } else {
      setSelectedOption(null);
    }
  }, [value, options]);

  // Load default options on mount
  useEffect(() => {
    const loadDefaultOptions = async () => {
      setLoading(true);
      try {
        const results = await onSearch(""); // Empty string to get default results
        setOptions(results);
      } catch (error) {
        console.error("Failed to load default options:", error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    loadDefaultOptions();
  }, [onSearch]);

  // Search for options when query changes
  useEffect(() => {
    const searchOptions = async () => {
      if (searchQuery.trim().length < 2) {
        // Load default options when search query is less than 2 characters
        setLoading(true);
        try {
          const results = await onSearch("");
          setOptions(results);
        } catch (error) {
          console.error("Failed to load default options:", error);
          setOptions([]);
        } finally {
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const results = await onSearch(searchQuery);
        setOptions(results);
      } catch (error) {
        console.error("Search failed:", error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchOptions, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchQuery, onSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery("");
    }
  };

  const handleSelect = (option: SearchableSelectOption) => {
    setSelectedOption(option);
    onChange(valueExtractor(option));
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    setSelectedOption(null);
    onChange(null);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      
      <div className="relative">
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`relative w-full px-3 py-2 text-left bg-white dark:bg-gray-700 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            error
              ? "border-red-300 dark:border-red-600"
              : "border-gray-300 dark:border-gray-600"
          }`}
        >
          <span className="block truncate pr-8">
            {selectedOption ? displayFormat(selectedOption) : placeholder}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2">
            {isOpen ? (
              <ChevronUpIcon className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            )}
          </span>
        </button>
        
        {selectedOption && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-6 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto thin-scrollbar">
            {loading ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                Searching...
              </div>
            ) : options.length > 0 ? (
              options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {option.name}
                  </div>
                  {option.code && (
                    <div className="text-gray-500 dark:text-gray-400">
                      {option.code}
                      {option.country && ` • ${option.country}`}
                      {option.city && ` • ${option.city}`}
                    </div>
                  )}
                </button>
              ))
            ) : searchQuery.length >= 2 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No results found
              </div>
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                Type at least 2 characters to search
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
