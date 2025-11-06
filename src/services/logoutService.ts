/**
 * Logout Service
 * 
 * Centralized service for handling logout operations.
 * This service can be used from anywhere in the application,
 * including utility files and service files that don't have
 * access to React hooks or context.
 * 
 * Benefits over Custom Events:
 * - Type-safe
 * - Direct Redux integration
 * - Easier to debug
 * - Better testability
 * - No event listener cleanup needed
 */

import { store } from '@/store';
import { logoutAction } from '@/store/slices/authSlice';
import { authService } from './authService';
import { tokenAutoRefreshService } from './tokenAutoRefreshService';
import { AUTH_STORAGE_KEYS } from '@/utils/authStateHelper';

class LogoutService {
  /**
   * Perform logout operation
   * @param redirectToSignin - Whether to redirect to signin page (default: true)
   */
  logout(redirectToSignin: boolean = true): void {
    console.log('🔐 LogoutService: Performing logout...');

    // Stop token auto-refresh service
    tokenAutoRefreshService.stopAutoRefresh();

    // Clear tokens from auth service
    authService.clearTokens();

    // Clear all auth-related storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
      localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(AUTH_STORAGE_KEYS.FALLBACK_USER);
      localStorage.removeItem('auth_user_fallback');
      localStorage.removeItem('persist:auth_user');
      
      // Clear session storage
      sessionStorage.clear();
    }

    // Dispatch Redux logout action to clear state
    store.dispatch(logoutAction());

    // Purge Redux persist storage
    if (typeof window !== 'undefined') {
      // Import persistor dynamically to avoid circular dependency
      import('@/store').then((storeModule) => {
        if (storeModule.persistor) {
          storeModule.persistor.purge();
        }
      });
    }

    console.log('✅ LogoutService: Logout completed');

    // Redirect to signin page if requested
    if (redirectToSignin && typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = '/signin';
      }, 100);
    }
  }

  /**
   * Check if user is currently logged in
   * @returns True if user is authenticated
   */
  isLoggedIn(): boolean {
    const state = store.getState();
    return state.auth.isAuthenticated && !!state.auth.token;
  }
}

// Export singleton instance
export const logoutService = new LogoutService();
export default logoutService;

