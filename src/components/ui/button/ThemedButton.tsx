"use client";
import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/utils/cn';

interface ThemedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  ...props
}) => {
  const { themeClasses } = useTheme();

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: `${themeClasses.button.primary} focus:ring-theme-purple-500`,
    secondary: `${themeClasses.button.secondary} focus:ring-theme-purple-500`,
    outline: `${themeClasses.button.outline} focus:ring-theme-purple-500`,
    ghost: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 focus:ring-gray-500',
    danger: 'bg-error-500 hover:bg-error-600 text-white focus:ring-error-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default ThemedButton;
