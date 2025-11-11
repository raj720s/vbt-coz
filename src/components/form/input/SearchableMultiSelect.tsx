"use client";
import React, { useState, useEffect, useRef } from "react";
import { ChevronDownIcon, ChevronUpIcon, XIcon } from "@/icons";
import Label from "@/components/form/Label";

interface SearchableMultiSelectOption {
  id: string | number;
  name: string;
  code?: string;
  customer_code?: string;
  country?: string;
  city?: string;
}

interface SearchableMultiSelectProps {
  id: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  onSearch: (query: string) => Promise<SearchableMultiSelectOption[]>;
  error?: string;
  disabled?: boolean;
  className?: string;
  displayFormat?: (option: SearchableMultiSelectOption) => string;
  searchPlaceholder?: string;
  valueExtractor?: (option: SearchableMultiSelectOption) => string | number;
  maxSelections?: number;
}

export const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
  id,
  label,
  required = false,
  placeholder = "Select options",
  value = [],
  onChange,
  onSearch,
  error,
  disabled = false,
  className = "",
  displayFormat = (option) => `${option.name}${option.code ? ` (${option.code})` : ""}`,
  searchPlaceholder = "Search...",
  valueExtractor = (option) => option.id,
  maxSelections,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [options, setOptions] = useState<SearchableMultiSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<SearchableMultiSelectOption[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Use refs to store functions to avoid infinite loops
  const onSearchRef = useRef(onSearch);
  const valueExtractorRef = useRef(valueExtractor);
  
  // Update refs when props change
  useEffect(() => {
    onSearchRef.current = onSearch;
    valueExtractorRef.current = valueExtractor;
  }, [onSearch, valueExtractor]);

  // Find selected options when value changes
  useEffect(() => {
    if (value && value.length > 0 && options.length > 0) {
      const selected = options.filter(opt => value.includes(valueExtractorRef.current(opt)));
      setSelectedOptions(selected);
    } else {
      setSelectedOptions([]);
    }
  }, [value, options]); // Removed valueExtractor from deps

  // Load default options on mount (only once)
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
  useEffect(() => {
    if (hasLoadedInitial) return;
    
    const loadDefaultOptions = async () => {
      setLoading(true);
      try {
        const results = await onSearchRef.current(""); // Empty string to get default results
        setOptions(results);
      } catch (error) {
        console.error("Failed to load default options:", error);
        setOptions([]);
      } finally {
        setLoading(false);
        setHasLoadedInitial(true);
      }
    };

    loadDefaultOptions();
  }, [hasLoadedInitial]); // Only run once

  // Search for options when query changes
  useEffect(() => {
    const searchOptions = async () => {
      if (searchQuery.trim().length < 2) {
        // Load default options when search query is less than 2 characters
        setLoading(true);
        try {
          const results = await onSearchRef.current("");
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
        const results = await onSearchRef.current(searchQuery);
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
  }, [searchQuery]); // Removed onSearch from deps

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

  const handleSelect = (option: SearchableMultiSelectOption) => {
    const optionValue = valueExtractorRef.current(option);
    
    // Check if already selected
    if (value.includes(optionValue)) {
      // Deselect
      const newValue = value.filter(v => v !== optionValue);
      onChange(newValue);
    } else {
      // Check max selections
      if (maxSelections && value.length >= maxSelections) {
        return;
      }
      // Select
      onChange([...value, optionValue]);
    }
  };

  const handleRemove = (optionValue: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = value.filter(v => v !== optionValue);
    onChange(newValue);
  };

  const handleClear = () => {
    onChange([]);
  };

  const isSelected = (option: SearchableMultiSelectOption) => {
    return value.includes(valueExtractorRef.current(option));
  };

  const getDisplayText = () => {
    if (selectedOptions.length === 0) {
      return placeholder;
    }
    if (selectedOptions.length === 1) {
      return displayFormat(selectedOptions[0]);
    }
    return `${selectedOptions.length} selected`;
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
          className={`relative w-full px-3 py-2 text-left bg-white dark:bg-gray-700 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[42px] ${
            error
              ? "border-red-300 dark:border-red-600"
              : "border-gray-300 dark:border-gray-600"
          }`}
        >
          <div className="flex flex-wrap gap-1 pr-8">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => {
                const optionValue = valueExtractorRef.current(option);
                return (
                  <span
                    key={optionValue}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-theme-purple-100 dark:bg-theme-purple-900 text-theme-purple-800 dark:text-theme-purple-200 rounded text-sm"
                  >
                    <span className="truncate max-w-[150px]">{displayFormat(option)}</span>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => handleRemove(optionValue, e)}
                        className="hover:text-theme-purple-600 dark:hover:text-theme-purple-300"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                );
              })
            ) : (
              <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
            )}
          </div>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2">
            {isOpen ? (
              <ChevronUpIcon className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            )}
          </span>
        </button>
        
        {selectedOptions.length > 0 && !disabled && (
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

      {maxSelections && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {value.length}/{maxSelections} selected
        </p>
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
              options.map((option) => {
                const optionValue = valueExtractorRef.current(option);
                const selected = isSelected(option);
                const disabledByMax = maxSelections ? value.length >= maxSelections && !selected : false;
                
                return (
                  <button
                    key={optionValue}
                    type="button"
                    onClick={() => handleSelect(option)}
                    disabled={disabledByMax}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 ${
                      selected
                        ? "bg-theme-purple-50 dark:bg-theme-purple-900/30 text-theme-purple-900 dark:text-theme-purple-200"
                        : "text-gray-900 dark:text-white"
                    } ${
                      disabledByMax ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                        selected
                          ? "bg-theme-purple-500 border-theme-purple-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}>
                        {selected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{option.name}</div>
                        {option.code && (
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            {option.code}
                            {option.country && ` • ${option.country}`}
                            {option.city && ` • ${option.city}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
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

export default SearchableMultiSelect;

