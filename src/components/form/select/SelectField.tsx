import React from "react";

interface SelectFieldProps {
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  [key: string]: any; // For react-hook-form register props
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  placeholder = "Select an option",
  className = "",
  disabled = false,
  error,
  required = false,
  children,
  ...props
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        {...props}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? "border-red-500" : ""
        } ${className}`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {children}
      </select>
      {error && (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default SelectField;
