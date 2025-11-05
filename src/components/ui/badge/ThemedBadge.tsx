"use client";
import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/utils/cn';

interface ThemedBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export const ThemedBadge: React.FC<ThemedBadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className,
  ...props
}) => {
  const { themeClasses } = useTheme();

  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    primary: 'bg-theme-purple-100 text-theme-purple-800 dark:bg-theme-purple-900/20 dark:text-theme-purple-400',
    success: themeClasses.status.success,
    warning: themeClasses.status.warning,
    error: themeClasses.status.error,
    info: themeClasses.status.info,
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default ThemedBadge;
