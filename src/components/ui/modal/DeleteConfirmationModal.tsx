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
          button: "bg-yellow-600 hover:bg-yellow-700 border-yellow-600 hover:border-yellow-700"
        };
      case "info":
        return {
          button: "bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
        };
      default: // danger
        return {
          button: "bg-purple-700 hover:bg-purple-800 border-purple-700 hover:border-purple-800"
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header with Close Button */}
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
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
          <div className="px-6 pb-6">
            <div className="space-y-4">
              {/* Message */}
              <p className="text-base text-gray-700 dark:text-gray-300 italic">
                {message}
                {itemName && ` This action cannot be undone.`}
              </p>

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
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 pb-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="px-8 py-3 text-base font-medium border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </Button>
            
            {error ? (
              <Button
                onClick={onConfirm}
                disabled={isLoading}
                className={`${styles.button} text-white px-8 py-3 text-base font-medium rounded-lg`}
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
                className={`${styles.button} text-white px-8 py-3 text-base font-medium rounded-lg`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </div>
                ) : (
                  "Delete"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}