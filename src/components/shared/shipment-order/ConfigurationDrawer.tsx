"use client";
import React from "react";
import { XIcon } from "@/icons";

interface FieldConfig {
  id: string;
  name: string;
  field: string;
  mandatory: boolean;
  visible: boolean;
  type: "text" | "choice" | "date" | "numeric" | "boolean";
  description?: string;
}

interface ConfigurationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  fields: FieldConfig[];
  onFieldToggle: (fieldId: string, visible: boolean) => void;
  onReset: () => void;
}

const ConfigurationDrawer: React.FC<ConfigurationDrawerProps> = ({
  isOpen,
  onClose,
  fields,
  onFieldToggle,
  onReset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Column Configuration
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              {/* Mandatory Fields Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Mandatory Fields (Always Visible)
                </h3>
                <div className="space-y-2">
                  {fields
                    .filter(field => field.mandatory)
                    .map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {field.name}
                          </div>
                          {field.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {field.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-green-600 font-medium">
                            Always Visible
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Optional Fields Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Optional Fields (Configurable)
                </h3>
                <div className="space-y-2">
                  {fields
                    .filter(field => !field.mandatory)
                    .map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {field.name}
                          </div>
                          {field.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {field.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.visible}
                              onChange={(e) => onFieldToggle(field.id, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex gap-3">
              <button
                onClick={onReset}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Reset to Default
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationDrawer;