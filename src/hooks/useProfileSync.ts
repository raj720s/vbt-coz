import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * Custom hook to sync user profile data and build complete user state step by step
 * This hook manages the centralized user state and syncs with auth state
 */
export const useProfileSync = () => {
  const { user, isAuthenticated, loading, profileLoading, privilegesLoading, isInitialized } = useAuth();
  const hasUpdatedProfile = useRef(false);
  
  // Initialize user state when authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isInitialized && !profileLoading && !privilegesLoading) {
      console.log('🔐 User state already initialized in AuthContext');
      hasUpdatedProfile.current = true;
    }
  }, [isAuthenticated, user, isInitialized, profileLoading, privilegesLoading]);

  return {
    user,
    userProfile: user, // Use user as profile since they're the same now
    userRole: user?.role_id || 0,
    userPrivileges: user?.privileges || [],
    loading: {
      profileLoading,
      privilegesLoading,
      isLoading: loading
    },
    errors: {
      profileError: null,
      privilegesError: null,
      error: null
    },
    isInitialized,
    isAuthenticated
  };
};