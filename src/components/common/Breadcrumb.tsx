"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HiChevronRight, HiHome } from 'react-icons/hi';

interface BreadcrumbItem {
  label: string;
  href: string;
  isLast?: boolean;
}

interface BreadcrumbProps {
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ className = "" }) => {
  const pathname = usePathname();

  // Function to generate breadcrumb items from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(segment => segment !== '');
    
    // If we're at the root, return empty array
    if (pathSegments.length === 0) {
      return [];
    }

    const breadcrumbs: BreadcrumbItem[] = [];
    let currentPath = '';

    // Always start with home
    breadcrumbs.push({
      label: 'Home',
      href: '/dashboard',
    });

    // Generate breadcrumbs for each path segment
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Convert segment to readable label
      const label = formatSegmentLabel(segment);
      
      // Check if this is the last segment
      const isLast = index === pathSegments.length - 1;
      
      breadcrumbs.push({
        label,
        href: currentPath,
        isLast,
      });
    });

    return breadcrumbs;
  };

  // Function to format segment labels
  const formatSegmentLabel = (segment: string): string => {
    // Handle special cases
    const specialCases: Record<string, string> = {
      'port-customer-master': 'Master Data',
      'pol-ports': 'POL Ports',
      'pod-ports': 'POD Ports',
      'customers': 'Customers',
      'container-types': 'Container Types',
      'container-thresholds': 'Container Thresholds',
      'container-priority': 'Container Priority',
      'container-planning': 'Container Planning',
      'assignment-results': 'Assignment Results',
      'validation-summary': 'Validation Summary',
      'shipment-upload': 'Shipment Upload',
      'shipment-operations': 'Shipment Operations',
      'uploads-history': 'Upload History',
      'user-management': 'User Management',
      'role-management': 'Role Management',
      'privilege-management': 'Privilege Management',
      'role-permission-management': 'Role Permissions',
      'system-administration': 'System Administration',
      'add': 'Add',
      'edit': 'Edit',
    };

    // Return special case or format the segment
    if (specialCases[segment]) {
      return specialCases[segment];
    }

    // Convert kebab-case to Title Case
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't render if we're at the dashboard (only home breadcrumb)
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((item, index) => (
          <li key={`${item.href}-${index}`} className="flex items-center">
            {index > 0 && (
              <HiChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 mx-2" />
            )}
            
            {item.isLast ? (
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
              >
                {index === 0 ? (
                  <div className="flex items-center">
                    <HiHome className="w-4 h-4 mr-1" />
                    {item.label}
                  </div>
                ) : (
                  item.label
                )}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;

