"use client";

import React, { useEffect, useRef, forwardRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { CalendarIcon } from "@/icons";
import Label from "@/components/form/Label";

interface DatePickerProps {
  id: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  dateFormat?: string;
  minDate?: string | Date;
  maxDate?: string | Date;
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      id,
      label,
      required = false,
      placeholder = "yyyy-mm-dd",
      value,
      onChange,
      onBlur,
      error,
      disabled = false,
      className = "",
      dateFormat = "Y-m-d",
      minDate,
      maxDate,
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const flatpickrInstance = useRef<flatpickr.Instance | null>(null);

    // Initialize flatpickr
    useEffect(() => {
      if (inputRef.current && !flatpickrInstance.current) {
        flatpickrInstance.current = flatpickr(inputRef.current, {
          mode: "single",
          static: true,
          monthSelectorType: "static",
          dateFormat: dateFormat,
          defaultDate: value || undefined,
          minDate: minDate,
          maxDate: maxDate,
          disableMobile: true, // Use flatpickr on mobile too
          onChange: (selectedDates, dateStr) => {
            onChange(dateStr);
          },
          onClose: () => {
            if (onBlur) {
              onBlur();
            }
          },
        });
      }

      return () => {
        if (flatpickrInstance.current) {
          flatpickrInstance.current.destroy();
          flatpickrInstance.current = null;
        }
      };
    }, [dateFormat, minDate, maxDate]); // Only re-initialize if these change

    // Update flatpickr when value changes externally
    useEffect(() => {
      if (flatpickrInstance.current && value !== undefined) {
        const currentDate = flatpickrInstance.current.selectedDates[0];
        const newDate = value ? new Date(value) : null;
        
        // Only update if the date actually changed
        if (
          (!currentDate && !newDate) ||
          (currentDate && newDate && currentDate.getTime() === newDate.getTime())
        ) {
          return; // No change needed
        }

        if (value) {
          flatpickrInstance.current.setDate(value, false);
        } else {
          flatpickrInstance.current.clear();
        }
      }
    }, [value]);

    // Update when disabled state changes
    useEffect(() => {
      if (flatpickrInstance.current && inputRef.current) {
        if (disabled) {
          flatpickrInstance.current.set('clickOpens', false);
          if (inputRef.current) {
            inputRef.current.disabled = true;
          }
        } else {
          flatpickrInstance.current.set('clickOpens', true);
          if (inputRef.current) {
            inputRef.current.disabled = false;
          }
        }
      }
    }, [disabled]);

    return (
      <div className={className}>
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
        <div className="relative">
          <input
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === "function") {
                ref(node);
              } else if (ref) {
                (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
              }
            }}
            id={id}
            type="text"
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-white ${
              error
                ? "border-red-300 dark:border-red-600"
                : "border-gray-300 dark:border-gray-600"
            }`}
            data-input
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <CalendarIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";

export default DatePicker;

