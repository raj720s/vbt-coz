import React, { forwardRef } from "react";

interface CheckboxFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  required?: boolean;
}

const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ label, error, required = false, className = "", ...props }, ref) => {
    return (
      <div>
        <label className="flex items-center">
          <input
            ref={ref}
            type="checkbox"
            className={`w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 ${className}`}
            {...props}
          />
          {label && (
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </span>
          )}
        </label>
        {error && (
          <p className="mt-1.5 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

CheckboxField.displayName = "CheckboxField";

export default CheckboxField;
