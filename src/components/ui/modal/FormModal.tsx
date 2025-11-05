"use client";
import React, { cloneElement, isValidElement } from "react";
import { Modal } from "./index";
import { CloseIcon } from "@/icons";

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  showHeader?: boolean;
  showFooter?: boolean;
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showHeader = true,
  showFooter = true,
}) => {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    "2xl": "max-w-6xl",
  };

  // Function to extract form actions from children
  const extractFormActions = (children: React.ReactNode): React.ReactNode[] => {
    const actions: React.ReactNode[] = [];
    
    const findActions = (child: React.ReactNode): void => {
      if (isValidElement(child)) {
        // Look for elements with data-form-action attribute
        if ((child.props as any)['data-form-action']) {
          actions.push(child);
          return;
        }
        
        // Recursively search children
        if ((child.props as any).children) {
          if (Array.isArray((child.props as any).children)) {
            (child.props as any).children.forEach(findActions);
          } else {
            findActions((child.props as any).children);
          }
        }
      }
    };

    if (Array.isArray(children)) {
      children.forEach(findActions);
    } else {
      findActions(children);
    }

    return actions;
  };

  // Function to remove form actions from children
  const removeFormActions = (children: React.ReactNode): React.ReactNode => {
    const removeActions = (child: React.ReactNode): React.ReactNode => {
      if (isValidElement(child)) {
        // Skip elements with data-form-action attribute
        if ((child.props as any)['data-form-action']) {
          return null;
        }
        
        // Recursively process children
        if ((child.props as any).children) {
          const newChildren = Array.isArray((child.props as any).children)
            ? (child.props as any).children.map(removeActions).filter(Boolean)
            : removeActions((child.props as any).children);
          
          return cloneElement(child, {}, newChildren);
        }
      }
      
      return child;
    };

    if (Array.isArray(children)) {
      return children.map(removeActions).filter(Boolean);
    } else {
      return removeActions(children);
    }
  };

  const formActions = showFooter ? extractFormActions(children) : [];
  const childrenWithoutActions = removeFormActions(children);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={`${sizeClasses[size as keyof typeof sizeClasses]} max-h-[80vh]`}>
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl flex flex-col max-h-[80vh]">
        {/* Header */}
        {showHeader && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close modal"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content - Scrollable area */}
        <div className="p-6 flex-1 overflow-y-auto thin-scrollbar">
          {childrenWithoutActions}
        </div>

        {/* Footer - Render form actions from children */}
        {showFooter && formActions.length > 0 && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
            {formActions}
          </div>
        )}
      </div>
    </Modal>
  );
}; 