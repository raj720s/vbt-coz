"use client";
import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/utils/cn';

interface ThemedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export const ThemedInput: React.FC<ThemedInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  ...props
}) => {
  const { themeClasses } = useTheme();

  const inputClasses = cn(
    'w-full px-3 py-2 border rounded-md shadow-sm transition-colors',
    'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
    'placeholder-gray-500 dark:placeholder-gray-400',
    error 
      ? themeClasses.input.error
      : 'border-gray-300 dark:border-gray-600',
    error 
      ? themeClasses.input.error
      : themeClasses.input.focus,
    leftIcon && 'pl-10',
    rightIcon && 'pr-10',
    className
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400 dark:text-gray-500">
              {leftIcon}
            </div>
          </div>
        )}
        <input
          className={inputClasses}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="text-gray-400 dark:text-gray-500">
              {rightIcon}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-error-600 dark:text-error-400">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default ThemedInput;
