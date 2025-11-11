"use client";

import { Toaster } from 'react-hot-toast';
import { useTheme } from '@/context/ThemeContext';

export function ToasterProvider() {
  const { isDark } = useTheme();

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: isDark ? '#1d2939' : '#ffffff',
          color: isDark ? '#f9fafb' : '#1d2939',
          border: isDark ? '1px solid #344054' : '1px solid #e4e7ec',
          borderRadius: '0.75rem',
          boxShadow: isDark
            ? '0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)'
            : '0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.06)',
          padding: '1rem 1.25rem',
          marginTop: '5rem',
          fontSize: '0.875rem',
          fontWeight: '500',
        },
        success: {
          duration: 3000,
          style: {
            background: isDark ? '#054f31' : '#ecfdf3',
            color: isDark ? '#d1fadf' : '#027a48',
            border: isDark ? '1px solid #05603a' : '1px solid #a6f4c5',
          },
          iconTheme: {
            primary: '#039855', // success-600
            secondary: isDark ? '#d1fadf' : '#ffffff',
          },
        },
        error: {
          duration: 4000,
          style: {
            background: isDark ? '#7a271a' : '#fef3f2',
            color: isDark ? '#fee4e2' : '#b42318',
            border: isDark ? '1px solid #912018' : '1px solid #fecdca',
          },
          iconTheme: {
            primary: '#d92d20', // error-600
            secondary: isDark ? '#fee4e2' : '#ffffff',
          },
        },
        loading: {
          style: {
            background: isDark ? '#1d2939' : '#ffffff',
            color: isDark ? '#f9fafb' : '#1d2939',
            border: isDark ? '1px solid #344054' : '1px solid #e4e7ec',
          },
          iconTheme: {
            primary: '#501358', // brand-500/600
            secondary: isDark ? '#f9fafb' : '#ffffff',
          },
        },
      }}
    />
  );
}

