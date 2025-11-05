"use client";

// Removed useSimplifiedRBAC - now using useAuth directly
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';

// Dynamically import the appropriate dashboard component
const AdminDashboard = dynamic(() => import('./admin-page'), { ssr: false });
const UserDashboard = dynamic(() => import('./user-page'), { ssr: false });

export default function DashboardPage() {
  const { userRole, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // All authenticated users should have access to dashboard
      // No need to check route access for the main dashboard
      console.log('🔍 Dashboard: User authenticated, rendering dashboard');
    }
  }, [userRole, isAdmin, loading]);

  // Show loading while checking permissions
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-purple-600 dark:border-theme-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Render appropriate dashboard based on role
  if (isAdmin()) {
    return <AdminDashboard />;
  } else {
    return <UserDashboard />;
  }
}
