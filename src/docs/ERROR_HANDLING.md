# Global Error Handling System

This document describes the global error handling system implemented in the application to provide better user experience when API errors occur.

## Overview

Instead of redirecting users to the signin page for every API error, the system now shows contextual error messages using the MessageProvider context. This provides a much better user experience by keeping users on the current page and providing clear feedback about what went wrong.

## Components

### 1. superAxios.ts
The main HTTP client with response interceptors that handle different types of errors:

- **Timeout Errors**: When requests exceed the 10-second timeout
- **Network Errors**: When there's no internet connection or server is unreachable
- **Server Errors (5xx)**: Internal server errors
- **Client Errors (4xx)**: Client-side errors (except 401 which still redirects to signin)
- **Authentication Errors (401)**: Still redirects to signin after token refresh fails

### 2. globalErrorService.ts
A singleton service that manages error display:

- Provides methods for different error types (`showTimeoutError`, `showNetworkError`, etc.)
- Manages the MessageProvider instance
- Handles error message display through the registered MessageProvider

### 3. GlobalErrorHandler.tsx
A React component that registers the MessageProvider with the global error service:

- Uses the `useMessage` hook to get the MessageProvider instance
- Registers the provider with the global error service on mount
- Cleans up the registration on unmount

## Error Types Handled

### Timeout Errors
- **Trigger**: `ECONNABORTED` or timeout message
- **Message**: "Request Timeout - The server is taking too long to respond. Please check your connection and try again."

### Network Errors
- **Trigger**: `NETWORK_ERROR`, `ERR_NETWORK`, or no response
- **Message**: "Network Error - Unable to connect to the server. Please check your internet connection and try again."

### Server Errors (5xx)
- **Trigger**: HTTP status codes 500-599
- **Message**: "Internal Server Error - The server encountered an error. Please try again later."

### Client Errors (4xx)
- **Trigger**: HTTP status codes 400-499 (except 401)
- **Messages**:
  - 403: "Access Forbidden - You do not have permission to perform this action."
  - 404: "Not Found - The requested resource was not found."
  - 422: "Validation Error - Please check your input and try again."
  - 429: "Too Many Requests - You have made too many requests. Please wait a moment and try again."
  - Default: "Request Error - [Status]: [Message]"

### Authentication Errors (401)
- **Behavior**: Still redirects to signin page after token refresh fails
- **Reason**: Authentication errors require user to re-login

## Usage

The error handling is automatic and requires no additional code in components. When an API call fails, the appropriate error message will be displayed using the existing MessageProvider system.

## Benefits

1. **Better UX**: Users stay on the current page instead of being redirected
2. **Clear Feedback**: Specific error messages help users understand what went wrong
3. **Consistent**: All errors are handled uniformly across the application
4. **Type Safe**: Full TypeScript support for error events
5. **Maintainable**: Centralized error handling logic

## Testing

To test the error handling:

1. **Timeout**: Set a very low timeout value or simulate slow network
2. **Network Error**: Disconnect internet or use invalid server URL
3. **Server Error**: Use a test endpoint that returns 5xx status
4. **Client Error**: Use a test endpoint that returns 4xx status

## Future Enhancements

- Add retry logic for transient errors
- Implement offline detection and messaging
- Add error reporting/analytics
- Customize error messages based on user role or context
