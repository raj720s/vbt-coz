"use client";

import { usePathname } from "next/navigation";
import AppLayout from "./AppLayout";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = ["/signin", "/signup", "/home", "/error-404"];

const ConditionalLayout: React.FC<ConditionalLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  // For public routes, render children without layout
  if (isPublic) {
    return <>{children}</>;
  }

  // For authenticated routes, wrap with AppLayout
  return <AppLayout>{children}</AppLayout>;
};

export default ConditionalLayout;
