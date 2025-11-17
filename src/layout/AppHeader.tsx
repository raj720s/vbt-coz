"use client";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  HiOutlineChip,
  HiOutlineCalendar,
  HiOutlineCog,
  HiOutlineChevronDown,
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlineCube,
  HiOutlineUserGroup,
  HiOutlineChartBar,
  HiOutlineDotsHorizontal,
  HiOutlineShieldCheck,
  HiOutlineKey,
  HiOutlineLink,
  HiOutlineTruck,
  HiOutlineOfficeBuilding,
} from "react-icons/hi";
import { HiOutlineCircleStack } from "react-icons/hi2";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { user, isAuthenticated, canAccessModule } = useAuth();
  const { themeClasses } = useTheme();
  const pathname = usePathname();

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  const isAdmin = user?.is_superuser || user?.role_id === 1;

  // Enhanced navigation items based on sidebar structure
  const navItems = useMemo(() => {
    if (!user) return [];
    
    const items = [
     
      {
        id: "vendor-booking",
        name: "Vendor Booking Management",
        icon: <HiOutlineCalendar className="w-5 h-5" />,
        isActive: pathname.includes("/shipment-orders") || 
                  pathname.includes("/shipment-operations") ||
                  pathname.includes("/shipment-upload") ||
                  pathname.includes("/assignment-results"),
        subItems: [
          
          { name: "Shipment Orders", path: "/shipment-orders", moduleId: 75 },
          // { name: "Shipment Operations", path: "/shipment-operations", moduleId: 75 },
          // { name: "Upload Shipments", path: "/shipment-upload", moduleId: 75 },
          // { name: "Assignment Results", path: "/assignment-results", moduleId: 75 },
        ],
      },
    ];

    if (isAdmin) {
      items.push({
        id: "admin-config",
        name: "Admin Configuration",
        icon: <HiOutlineCog className="w-5 h-5" />,
        isActive: pathname.includes("/user-management") || 
                  pathname.includes("/role-management"),
        subItems: [
          { name: "User Management", path: "/user-management", moduleId: 40 },
          { name: "Role Management", path: "/role-management", moduleId: 10 },
        ],
      },
      {
        id: "master-data",
        name: "Master Data Management",
        icon: <HiOutlineCircleStack className="w-5 h-5" />,
        isActive: pathname.includes("/port-customer-master") || 
                  pathname.includes("/container-types") ||
                  pathname.includes("/container-priority") ||
                  pathname.includes("/container-thresholds") ||
                  pathname.includes("/company-management") ||
                       pathname.includes("/port-customer-master/company-customer-mappings") ||
                  pathname.includes("/carrier-management") ||
                  pathname.includes("/supplier-management"),
        subItems: [
          { name: "Company", path: "/company-management", moduleId: 65 },
          { name: "Customer", path: "/port-customer-master/customers", moduleId: 60 },
          { name: "Company Customer Mappings", path: "/port-customer-master/company-customer-mappings", moduleId: 66 },
          { name: "Port Of Loading", path: "/port-customer-master/pol-ports", moduleId: 60 },
          { name: "Port Of Discharge", path: "/port-customer-master/pod-ports", moduleId: 60 },
          { name: "Carrier", path: "/carrier-management", moduleId: 68 },
          // { name: "Supplier Management", path: "/supplier-management", moduleId: 69 },
          // { name: "Container Types", path: "/container-types", moduleId: 50 },
          // { name: "Container Priority", path: "/container-priority", moduleId: 50 },
          // { name: "Container Thresholds", path: "/container-thresholds", moduleId: 50 },
        ],
      },
    );
    }

    return items;
  }, [pathname, isAdmin, user]);

  const toggleDropdown = (dropdownId: string) => {
    setActiveDropdown(activeDropdown === dropdownId ? null : dropdownId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.nav-dropdown')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Don't render header if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="sticky top-0 flex w-full bg-brand-500 dark:bg-brand-500 shadow-lg z-50">
      <div className="flex items-center justify-between w-full px-6 py-3">
        {/* Left side - Logo */}
        <div className="flex items-center">
          <Link href="/" className="mr-8 inline-flex gap-2">
            <Image src="/assets/logo.png" alt="Logo" width={27} height={24} />
            <h1 className="text-xl font-bold  text-white -mb-1">
              Vendor Booking Tool
            </h1>
          </Link>
        </div>

        {/* Center - Desktop Navigation Menu */}
        <nav className={`hidden lg:flex items-center space-x-2 flex-1 ${isAdmin ? 'justify-center' : 'justify-start'}`}>
          {navItems.map((item) => {
            // Dropdown item
            return (
              <div key={item.id} className="relative nav-dropdown">
                <button
                  onClick={() => toggleDropdown(item.id)}
                  className={`flex items-center gap-3 px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    item.isActive
                      ? 'bg-theme-purple-300 text-brand-800 dark:bg-brand-800 dark:text-white'
                      : 'text-white/90 hover:bg-theme-purple-300 hover:text-brand-800 dark:hover:bg-brand-800 dark:hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                  <HiOutlineChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeDropdown === item.id ? 'rotate-180' : 'rotate-0'
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {activeDropdown === item.id && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
                    <div className="py-2">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.path}
                          href={subItem.path}
                          className={`block px-4 py-3 text-sm transition-colors ${
                            pathname === subItem.path
                              ? 'bg-brand-500 text-white dark:bg-brand-800 dark:text-white font-medium border-l-3 border-brand-500'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-theme-purple-300 hover:text-brand-800 dark:hover:bg-brand-800 dark:hover:text-white'
                          }`}
                          onClick={() => setActiveDropdown(null)}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right side - User actions */}
        <div className="flex items-center gap-4">
          {/* Dark Mode Toggler */}
          {/* <ThemeToggleButton /> */}
          
          {/* Notification with badge */}
          {/* <div className="relative">
            <button className="flex items-center justify-center w-10 h-10 text-white/90 rounded-lg hover:bg-white/10 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-purple-800"></span>
            </button>
          </div>
           */}
          {/* User Area */}
          <UserDropdown /> 
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={toggleApplicationMenu}
          className="flex items-center justify-center w-10 h-10 text-white/80 rounded-lg hover:bg-white/10 lg:hidden ml-4"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isApplicationMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-brand-500 border-t border-brand-700 shadow-lg">
          <div className="px-4 py-4">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <div key={item.id} className="nav-dropdown">
                  <button
                    onClick={() => toggleDropdown(item.id)}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      item.isActive
                        ? 'bg-theme-purple-300 text-brand-800 dark:bg-brand-800 dark:text-white'
                        : 'text-white/90 hover:bg-theme-purple-300 hover:text-brand-800 dark:hover:bg-brand-800 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    <HiOutlineChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        activeDropdown === item.id ? 'rotate-180' : 'rotate-0'
                      }`}
                    />
                  </button>

                  {/* Mobile Dropdown */}
                  {activeDropdown === item.id && (
                    <div className="mt-2 ml-auto space-y-1">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.path}
                          href={subItem.path}
                          className={`block px-4 py-2 text-sm rounded-md transition-colors ${
                            pathname === subItem.path
                              ? 'bg-brand-800 text-white dark:bg-brand-800 dark:text-white font-medium'
                              : 'text-white/80 hover:bg-brand-800 hover:text-white dark:hover:bg-brand-800 dark:hover:text-white'
                          }`}
                          onClick={() => {
                            setActiveDropdown(null);
                            setApplicationMenuOpen(false);
                          }}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader;