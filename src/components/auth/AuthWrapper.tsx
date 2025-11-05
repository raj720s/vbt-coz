"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthLoadingMessage from "./AuthLoadingMessage";
import AccessDeniedMessage from "./AccessDeniedMessage";

interface AuthWrapperProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = ["/signin", "/signup", "/home", "/error-404"];

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  // Handle redirects and route protection
  useEffect(() => {
    // Don't redirect during login attempts
    if (auth.isLoginAttempt) {
      return;
    }

    // Don't redirect if still loading or not initialized
    if (auth.loading || !auth.isInitialized) {
      return;
    }

    // Handle root path redirect
    if (pathname === "/") {
      router.push(auth.redirectToAppropriateDashboard());
      return;
    }

    // For public routes, don't redirect
    if (isPublic) {
      return;
    }

    // For authenticated routes, redirect to signin if not authenticated
    if (!auth.isAuthenticated || !auth.user) {
      router.push("/signin");
      return;
    }

    // If user is authenticated but on signin page, redirect to dashboard
    if (pathname === "/signin" && auth.isAuthenticated && auth.user) {
      router.push("/dashboard");
    }
  }, [auth.isLoginAttempt, auth.loading, auth.isInitialized, auth.isAuthenticated, auth.user, pathname, isPublic, router, auth.redirectToAppropriateDashboard]);

  // Show loading state
  if (auth.loading || !auth.isInitialized) {
    return <AuthLoadingMessage text="Initializing..." spinnerColor="border-blue-500" />;
  }

  // For public routes, render children directly
  if (isPublic) {
    return <>{children}</>;
  }

  // Show loading if not authenticated
  if (!auth.isAuthenticated || !auth.user) {
    return <AuthLoadingMessage text="Redirecting to sign in..." spinnerColor="border-yellow-500" />;
  }

  // Check route access for authenticated users
  if (!auth.canAccessRoute(pathname)) {
    return <AccessDeniedMessage pathname={pathname} />;
  }

  // Render children for authenticated users with proper access
  return <>{children}</>;
};

export default AuthWrapper;
