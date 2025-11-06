import { BASEURL } from '@/config/variables';
import axios from 'axios';
import Cookies from 'js-cookie';
import { globalErrorService } from '@/services/globalErrorService';
import { getAccessToken, AUTH_STORAGE_KEYS } from '@/utils/authStateHelper';

/**
 * Helper function to check if error indicates token is invalid/expired
 * This checks for both 401 status and token_not_valid error code
 */
const isTokenInvalidError = (error: any): boolean => {
  // Check for 401 status
  if (error.response?.status === 401) {
    return true;
  }
  
  // Check for token_not_valid error code in response
  const errorData = error.response?.data;
  if (errorData?.code === 'token_not_valid' || errorData?.message === 'Given token not valid for any token type') {
    return true;
  }
  
  // Check messages array for token validation errors
  if (Array.isArray(errorData?.messages)) {
    const hasTokenError = errorData.messages.some((msg: any) => 
      msg.token_type === 'access' && 
      (msg.message?.includes('invalid') || msg.message?.includes('expired'))
    );
    if (hasTokenError) {
      return true;
    }
  }
  
  return false;
};

/**
 * Helper function to handle logout and redirect when authentication fails
 * Uses the logout service which directly accesses Redux store
 */
const handleLogoutAndRedirect = () => {
  // Import logout service dynamically to avoid circular dependency
  import('@/services/logoutService').then(({ logoutService }) => {
    logoutService.logout(true); // true = redirect to signin
  });
};

const getToken = () => {
  return process.env.NEXT_PUBLIC_TOKEN;
}

const superAxios = axios.create({
  baseURL: BASEURL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },  
});

// Request interceptor to add authorization header
superAxios.interceptors.request.use(req => {
  // Get token from Redux store or localStorage fallback
  const authToken = getAccessToken();
  
  // Add authorization header if token exists
  if (authToken) {
    req.headers.Authorization = authToken;
  } else {
    // Fallback to environment token for non-authenticated requests
    req.headers.Authorization = getToken();
  }

  if (req.params?.language) {
    const { language } = req.params
    req.params.ln = language || 'en';
  }
  return req;
})

superAxios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message === 'timeout of 10000ms exceeded') {
      // Show timeout error message instead of redirecting
      globalErrorService.showTimeoutError();
      return Promise.reject(error);
    }

    // Handle network errors (no internet connection, server unreachable, etc.)
    if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK' || !error.response) {
      globalErrorService.showNetworkError();
      return Promise.reject(error);
    }

    // Handle token invalid/expired errors (401 status or token_not_valid code)
    if (isTokenInvalidError(error) && !originalRequest._retry) {
      // Don't retry if this is already a refresh token request - logout immediately
      if (originalRequest.url?.includes('/token/refresh/')) {
        console.error('❌ Refresh token endpoint returned token error, logging out');
        handleLogoutAndRedirect();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          // No refresh token available, logout immediately
          console.error('❌ No refresh token available, logging out');
          handleLogoutAndRedirect();
          return Promise.reject(error);
        }

        // Import services dynamically to avoid circular dependency
        const { authService } = await import('@/services/authService');
        const { tokenAutoRefreshService } = await import('@/services/tokenAutoRefreshService');
        
        // Stop auto-refresh before attempting manual refresh to prevent conflicts
        tokenAutoRefreshService.stopAutoRefresh();
        
        console.log('🔄 Attempting to refresh access token...');
        
        // Attempt to refresh the token
        const newTokens = await authService.refreshToken(refreshToken);
        
        if (!newTokens.access) {
          throw new Error('No access token received from refresh');
        }
        
        // Update localStorage with new access token (with Bearer prefix)
        const newAccessToken = `Bearer ${newTokens.access}`;
        localStorage.setItem('auth_token', newAccessToken);
        
        console.log('✅ Access token refreshed successfully');
        
        // Restart auto-refresh service with new token
        tokenAutoRefreshService.startAutoRefresh();
        
        // Update the original request with new token
        originalRequest.headers.Authorization = newAccessToken;
        
        // Retry the original request
        return superAxios(originalRequest);
      } catch (refreshError: any) {
        // Refresh failed, logout and redirect to login
        console.error('❌ Token refresh failed:', refreshError);
        
        // Check if refresh error also indicates token is invalid
        // This happens when refresh token itself is expired (after 30 mins)
        if (isTokenInvalidError(refreshError)) {
          console.error('❌ Refresh token is invalid or expired (session expired after 30 mins), logging out immediately');
        }
        
        handleLogoutAndRedirect();
        return Promise.reject(refreshError);
      }
    }

    // Handle other server errors (5xx)
    if (error.response?.status >= 500) {
      globalErrorService.showServerError();
    }

    // Handle client errors (4xx) - but not 401 which is handled above
    if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 401) {
      let title = 'Request Error';
      let content = 'There was an error with your request. Please try again.';
      
      switch (error.response.status) {
        case 403:
          title = 'Access Forbidden';
          content = 'You do not have permission to perform this action.';
          break;
        case 404:
          title = 'Not Found';
          content = 'The requested resource was not found.';
          break;
        case 422:
          title = 'Validation Error';
          content = 'Please check your input and try again.';
          break;
        case 429:
          title = 'Too Many Requests';
          content = 'You have made too many requests. Please wait a moment and try again.';
          break;
        default:
          title = 'Request Error';
          content = `Error ${error.response.status}: ${error.response.data?.message || 'Please try again.'}`;
      }

      globalErrorService.showClientError(title, content);
    }

    return Promise.reject(error);
  }
);

export default superAxios;