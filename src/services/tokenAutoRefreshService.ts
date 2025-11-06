import { authService } from './authService';
import toast from 'react-hot-toast';

class TokenAutoRefreshService {
  private refreshInterval: NodeJS.Timeout | null = null;
  private readonly REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds
  private isRefreshing = false;
  private isLoggingOut = false; // Prevent multiple logout attempts

  /**
   * Start the auto-refresh mechanism
   * This should be called after successful login
   */
  startAutoRefresh(): void {
    // Clear any existing interval
    this.stopAutoRefresh();

    console.log('🔄 Starting token auto-refresh service (every 10 minutes)');

    // Set up the interval
    this.refreshInterval = setInterval(() => {
      this.performTokenRefresh();
    }, this.REFRESH_INTERVAL);

    // Also perform an initial refresh after 5 minutes to ensure we're proactive
    setTimeout(() => {
      this.performTokenRefresh();
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stop the auto-refresh mechanism
   * This should be called on logout or when the service is no longer needed
   */
  stopAutoRefresh(): void {
    if (this.refreshInterval) {
      console.log('🛑 Stopping token auto-refresh service');
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    // Reset refreshing flag when stopping
    this.isRefreshing = false;
  }

  /**
   * Perform the actual token refresh
   * This method handles the refresh logic and error handling
   */
  private async performTokenRefresh(): Promise<void> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      console.log('🔄 Token refresh already in progress, skipping...');
      return;
    }

    // Check if we have valid tokens
    if (!authService.hasValidTokens()) {
      console.log('❌ No valid tokens found, stopping auto-refresh');
      this.stopAutoRefresh();
      return;
    }

    try {
      this.isRefreshing = true;
      console.log('🔄 Performing automatic token refresh...');

      const refreshToken = authService.getStoredRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call the refresh API
      const newTokens = await authService.refreshToken(refreshToken);
      
      if (newTokens.access) {
        // Update the stored access token with Bearer prefix
        localStorage.setItem('auth_token', `Bearer ${newTokens.access}`);
        
        console.log('✅ Token refreshed successfully');
        
        // Show subtle success notification (only in development or for debugging)
        if (process.env.NODE_ENV === 'development') {
          toast.success('🔄 Token refreshed automatically', {
            duration: 2000,
            position: 'bottom-right'
          });
        }
        
        // Dispatch a custom event to notify other parts of the app
        window.dispatchEvent(new CustomEvent('tokenRefreshed', {
          detail: { newAccessToken: newTokens.access }
        }));
      } else {
        throw new Error('No access token received from refresh');
      }
    } catch (error: any) {
      console.error('❌ Token auto-refresh failed:', error);
      
      // Prevent multiple logout attempts
      if (this.isLoggingOut) {
        console.log('⚠️ Logout already in progress, skipping...');
        return;
      }
      
      this.isLoggingOut = true;
      
      // Stop auto-refresh immediately to prevent further retries
      this.stopAutoRefresh();
      
      // Show error notification to user
      toast.error('Session expired. Please log in again.', {
        duration: 5000,
        position: 'top-center'
      });
      
      // Use logout service to properly clear Redux state and storage
      const { logoutService } = await import('./logoutService');
      logoutService.logout(true); // true = redirect to signin
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Check if auto-refresh is currently running
   */
  isRunning(): boolean {
    return this.refreshInterval !== null;
  }

  /**
   * Get the time until next refresh (in milliseconds)
   */
  getTimeUntilNextRefresh(): number {
    if (!this.refreshInterval) {
      return 0;
    }
    return this.REFRESH_INTERVAL;
  }

  /**
   * Force an immediate token refresh
   * This can be called manually if needed
   */
  async forceRefresh(): Promise<boolean> {
    try {
      await this.performTokenRefresh();
      return true;
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
      return false;
    }
  }
}

// Create a singleton instance
export const tokenAutoRefreshService = new TokenAutoRefreshService();
export default tokenAutoRefreshService;
