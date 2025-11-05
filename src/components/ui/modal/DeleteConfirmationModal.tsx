"use client";

import React from "react";
import Button from "@/components/ui/button/Button";
import { TrashBinIcon, AlertIcon, RefreshIcon } from "@/icons";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  isLoading?: boolean;
  variant?: "danger" | "warning" | "info";
  error?: string | null;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Delete",
  message = "Are you sure you want to delete this item?",
  itemName,
  isLoading = false,
  variant = "danger",
  error = null
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "warning":
        return {
          icon: "text-yellow-500",
          button: "bg-yellow-600 hover:bg-yellow-700 border-yellow-600 hover:border-yellow-700",
          accent: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
        };
      case "info":
        return {
          icon: "text-blue-500",
          button: "bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700",
          accent: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
        };
      default: // danger
        return {
          icon: "text-red-500",
          button: "bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700",
          accent: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center space-y-4">
              {/* Icon */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <AlertIcon className={`h-8 w-8 ${styles.icon}`} />
              </div>
              
              {/* Message */}
              <div>
                <p className="text-base text-gray-700 dark:text-gray-300 mb-2">
                  {message}
                </p>
                
                {itemName && (
                  <div className={`inline-block px-3 py-2 rounded-lg ${styles.accent}`}>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {itemName}
                    </span>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Error occurred
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Warning Text */}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2.5"
            >
              Cancel
            </Button>
            
            {error ? (
              <Button
                onClick={onConfirm}
                disabled={isLoading}
                className={`${styles.button} text-white px-6 py-2.5`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Retrying...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <RefreshIcon className="w-4 h-4" />
                    Try Again
                  </div>
                )}
              </Button>
            ) : (
              <Button
                onClick={onConfirm}
                disabled={isLoading}
                className={`${styles.button} text-white px-6 py-2.5`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <TrashBinIcon className="w-4 h-4" />
                    Delete
                  </div>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
