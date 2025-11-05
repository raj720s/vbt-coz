"use client";

import React from 'react';
import { useSidebar } from '@/context/SidebarContext';

/**
 * Example component demonstrating the new useSidebar error handling
 * This component will throw specific errors based on context state
 */
export const SidebarContextUsageExample: React.FC = () => {
  try {
    // This will throw specific errors based on context state:
    // 1. "useSidebar must be used within a SidebarProvider" - if not wrapped in provider
    // 2. "SidebarContext is not yet available" - if contextAvailable is false
    const { isExpanded, isMobileOpen, isHovered, activeItem, openSubmenu, contextAvailable } = useSidebar();
    
    return (
      <div className="p-4 border rounded-lg bg-green-50">
        <h3 className="text-lg font-semibold mb-4 text-green-800">Sidebar Context Ready</h3>
        <div className="space-y-2">
          <p><strong>Context Available:</strong> {contextAvailable ? 'Yes' : 'No'}</p>
          <p><strong>Expanded:</strong> {isExpanded ? 'Yes' : 'No'}</p>
          <p><strong>Mobile Open:</strong> {isMobileOpen ? 'Yes' : 'No'}</p>
          <p><strong>Hovered:</strong> {isHovered ? 'Yes' : 'No'}</p>
          <p><strong>Active Item:</strong> {activeItem || 'None'}</p>
          <p><strong>Open Submenu:</strong> {openSubmenu || 'None'}</p>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4 border rounded-lg bg-red-50">
        <h3 className="text-lg font-semibold mb-4 text-red-800">Sidebar Context Error</h3>
        <p className="text-red-700">
          <strong>Error:</strong> {error instanceof Error ? error.message : 'Unknown error'}
        </p>
        <div className="mt-2 text-sm text-red-600">
          <p>This error occurs when:</p>
          <ul className="list-disc list-inside mt-1">
            <li>Component is not wrapped in SidebarProvider</li>
            <li>SidebarContext is not yet available (contextAvailable: false)</li>
          </ul>
        </div>
      </div>
    );
  }
};

/**
 * Example showing how to handle the errors gracefully
 */
export const SidebarContextWithErrorHandling: React.FC = () => {
  // You can also use try-catch in the component logic
  let sidebarData = null;
  let error = null;
  
  try {
    sidebarData = useSidebar();
  } catch (err) {
    error = err;
  }
  
  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-yellow-50">
        <h3 className="text-lg font-semibold mb-4 text-yellow-800">Sidebar Context Not Ready</h3>
        <p className="text-yellow-700">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
        <p className="text-sm text-yellow-600 mt-2">
          Please wait for sidebar context to initialize or ensure the component is wrapped in SidebarProvider.
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-4 border rounded-lg bg-green-50">
      <h3 className="text-lg font-semibold mb-4 text-green-800">Sidebar Context Ready</h3>
      <div className="space-y-2">
        <p>Expanded: {sidebarData?.isExpanded ? 'Yes' : 'No'}</p>
        <p>Mobile Open: {sidebarData?.isMobileOpen ? 'Yes' : 'No'}</p>
        <p>Active Item: {sidebarData?.activeItem || 'None'}</p>
      </div>
    </div>
  );
};

/**
 * Example showing sidebar controls with error handling
 */
export const SidebarControlsExample: React.FC = () => {
  try {
    const { isExpanded, toggleSidebar, isMobileOpen, toggleMobileSidebar, contextAvailable } = useSidebar();
    
    return (
      <div className="p-4 border rounded-lg bg-blue-50">
        <h3 className="text-lg font-semibold mb-4 text-blue-800">Sidebar Controls</h3>
        <div className="space-y-4">
          <div>
            <p><strong>Context Available:</strong> {contextAvailable ? 'Yes' : 'No'}</p>
            <p><strong>Current State:</strong> {isExpanded ? 'Expanded' : 'Collapsed'}</p>
            <p><strong>Mobile State:</strong> {isMobileOpen ? 'Open' : 'Closed'}</p>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={toggleSidebar}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Toggle Sidebar
            </button>
            <button 
              onClick={toggleMobileSidebar}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Toggle Mobile
            </button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4 border rounded-lg bg-red-50">
        <h3 className="text-lg font-semibold mb-4 text-red-800">Sidebar Controls Error</h3>
        <p className="text-red-700">
          Cannot access sidebar controls: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }
};
