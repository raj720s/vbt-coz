"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

type SidebarContextType = {
  isExpanded: boolean;
  isMobileOpen: boolean;
  isHovered: boolean;
  activeItem: string | null;
  openSubmenu: string | null;
  contextAvailable: boolean; // New property to indicate context is ready
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  // setIsHovered: (isHovered: boolean) => void;
  setActiveItem: (item: string | null) => void;
  toggleSubmenu: (item: string) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [contextAvailable, setContextAvailable] = useState(false);

  const handleResize = useCallback(() => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    if (!mobile) {
      setIsMobileOpen(false);
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  // Initialize context availability
  useEffect(() => {
    // Sidebar context is immediately available after component mount
    setContextAvailable(true);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const toggleSubmenu = useCallback((item: string) => {
    setOpenSubmenu((prev) => (prev === item ? null : item));
  }, []);

  const setIsHoveredCallback = useCallback((hovered: boolean) => {
    setIsHovered(hovered);
  }, []);

  const setActiveItemCallback = useCallback((item: string | null) => {
    setActiveItem(item);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isExpanded: isMobile ? false : isExpanded,
        isMobileOpen,
        isHovered,
        activeItem,
        openSubmenu,
        contextAvailable,
        toggleSidebar,
        toggleMobileSidebar,
        // setIsHovered: setIsHoveredCallback,
        setActiveItem: setActiveItemCallback,
        toggleSubmenu,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

// Export useSidebar hook at the end of the file with proper error checking
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  
  // Sidebar context initializes immediately, so we don't need to check contextAvailable
  // The context is always available after the provider mounts
  
  return context;
};
