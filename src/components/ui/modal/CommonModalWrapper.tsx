"use client";

import React from "react";
import { XIcon } from "@/icons";
import Button from "@/components/ui/button/Button";

interface CommonModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  showFooter?: boolean;
  footerContent?: React.ReactNode;
  closeButtonText?: string;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-6xl",
};

export function CommonModalWrapper({
  isOpen,
  onClose,
  title,
  children,
  size = "lg",
  showFooter = false,
  footerContent,
  closeButtonText = "Close",
}: CommonModalWrapperProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full ${sizeClasses[size]} bg-white dark:bg-gray-800 rounded-lg shadow-xl`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto thin-scrollbar max-h-[60vh]">
            {children}
          </div>

          {/* Footer */}
          {showFooter && (
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              {footerContent || (
                <Button variant="outline" onClick={onClose}>
                  {closeButtonText}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
