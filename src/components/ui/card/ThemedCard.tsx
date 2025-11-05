"use client";
import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/utils/cn';

interface ThemedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  children: React.ReactNode;
  className?: string;
}

export const ThemedCard: React.FC<ThemedCardProps> = ({
  variant = 'default',
  children,
  className,
  ...props
}) => {
  const { themeClasses } = useTheme();

  const variantClasses = {
    default: themeClasses.card.default,
    elevated: themeClasses.card.elevated,
    outlined: 'bg-white dark:bg-gray-800 border-2 border-theme-purple-200 dark:border-theme-purple-800',
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-6',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default ThemedCard;
