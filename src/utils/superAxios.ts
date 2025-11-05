import { BASEURL } from '@/config/variables';
import axios from 'axios';
import Cookies from 'js-cookie';
import { globalErrorService } from '@/services/globalErrorService';
import { getAccessToken, AUTH_STORAGE_KEYS } from '@/utils/authStateHelper';

/**
 * Helper function to handle logout and redirect when authentication fails
 * This ensures we stop all retry mechanisms and properly clean up
 */
const handleLogoutAndRedirect = () => {
  // Stop auto-refresh service to prevent infinite retries
  if (typeof window !== 'undefined') {
    // Import tokenAutoRefreshService dynamically
    import('@/services/tokenAutoRefreshService').then(({ tokenAutoRefreshService }) => {
      tokenAutoRefreshService.stopAutoRefresh();
    });
    
    // Clear all auth-related storage
    localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.FALLBACK_USER);
    localStorage.removeItem('auth_user_fallback');
    localStorage.removeItem('persist:auth_user');
    
    // Clear session storage as well
    sessionStorage.clear();
    
    // Redirect to login page
    window.location.href = '/signin';
  }
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

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry if this is already a refresh token request - logout immediately
      if (originalRequest.url?.includes('/token/refresh/')) {
        console.error('Refresh token endpoint returned 401, logging out');
        handleLogoutAndRedirect();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          // No refresh token available, logout immediately
          console.error('No refresh token available, logging out');
          handleLogoutAndRedirect();
          return Promise.reject(error);
        }

        // Import services dynamically to avoid circular dependency
          const { authService } = await import('@/services/authService');
        const { tokenAutoRefreshService } = await import('@/services/tokenAutoRefreshService');
        
        // Stop auto-refresh before attempting manual refresh to prevent conflicts
        tokenAutoRefreshService.stopAutoRefresh();
          
          // Attempt to refresh the token
          const newTokens = await authService.refreshToken(refreshToken);
          
          // Update session storage with new access token
          localStorage.setItem('auth_token', `Bearer ${newTokens.access}`);
          
          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
          
          // Retry the original request
          return superAxios(originalRequest);
      } catch (refreshError: any) {
        // Refresh failed, logout and redirect to login
        console.error('Token refresh failed:', refreshError);
        
        // If refresh token endpoint itself returned 401, don't retry
        if (refreshError.response?.status === 401) {
          console.error('Refresh token is invalid, logging out immediately');
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