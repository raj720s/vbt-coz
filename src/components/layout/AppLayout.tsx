"use client";

import AppHeader from "@/layout/AppHeader";
import Breadcrumb from "@/components/common/Breadcrumb";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="flex-1">
        <div className="p-6 container mx-auto max-w-full">
          {/* Breadcrumb navigation - appears above page content */}
          <div className="mb-4 py-2">
            <Breadcrumb />
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
