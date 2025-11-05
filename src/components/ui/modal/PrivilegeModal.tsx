"use client";

import React, { useMemo } from "react";
import { InformationCircleIcon } from "@/icons";
import Button from "@/components/ui/button/Button";
import { staticModuleDefinitions } from "@/config/staticModules";

interface PrivilegeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  privileges: string[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  showFooter?: boolean;
  footerContent?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function PrivilegeModal({
  isOpen,
  onClose,
  title,
  privileges,
  isLoading = false,
  emptyMessage = "No privileges assigned",
  emptyDescription = "Privileges are inherited from the role.",
  showFooter = true,
  footerContent,
  size = "2xl",
}: PrivilegeModalProps) {
  // Group privileges by modules
  const privilegesByModule = useMemo(() => {
    const moduleGroups: Record<number, {
      module: any;
      privileges: string[];
    }> = {};

    // Initialize all modules
    Object.values(staticModuleDefinitions.modules).forEach(module => {
      moduleGroups[module.id] = {
        module,
        privileges: []
      };
    });

    // Group privileges by their modules
    privileges.forEach(privilege => {
      Object.values(staticModuleDefinitions.modules).forEach(module => {
        if (module.privileges.includes(privilege)) {
          moduleGroups[module.id].privileges.push(privilege);
        }
      });
    });

    // Filter out modules with no privileges
    return Object.values(moduleGroups).filter(group => group.privileges.length > 0);
  }, [privileges]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full max-w-${size === "2xl" ? "6xl" : size === "xl" ? "4xl" : size === "lg" ? "2xl" : size === "md" ? "lg" : "md"} bg-white dark:bg-gray-800 rounded-lg shadow-xl`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading privileges...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total privileges: <span className="font-medium text-blue-600">{privileges.length}</span>
                </div>
                
                {privileges.length > 0 ? (
                  <div className="space-y-6">
                    {/* Module-based Privileges */}
                    {privilegesByModule.map((group) => (
                      <div key={group.module.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                                {group.module.name}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {group.module.description}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {group.privileges.length} privileges
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Module ID: {group.module.id}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {group.privileges.map((privilege) => (
                              <div
                                key={privilege}
                                className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                              >
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                  {privilege}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Summary */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white">Access Summary</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            This role has access to {privilegesByModule.length} modules with {privileges.length} total privileges
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {privilegesByModule.length}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Modules
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <InformationCircleIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>{emptyMessage}</p>
                    <p className="text-sm mt-1">{emptyDescription}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {showFooter && (
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              {footerContent || (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
