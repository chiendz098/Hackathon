import React from 'react';

// Error types
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  SERVER: 'SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// Error messages for different scenarios
const errorMessages = {
  [ErrorTypes.NETWORK]: 'Network connection error. Please check your internet connection.',
  [ErrorTypes.AUTH]: 'Authentication error. Please log in again.',
  [ErrorTypes.VALIDATION]: 'Please check your input and try again.',
  [ErrorTypes.SERVER]: 'Server error. Please try again later.',
  [ErrorTypes.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorTypes.FORBIDDEN]: 'You do not have permission to perform this action.',
  [ErrorTypes.UNKNOWN]: 'An unexpected error occurred. Please try again.'
};

// Custom error class
export class AppError extends Error {
  constructor(type, message, originalError = null) {
    super(message || errorMessages[type]);
    this.type = type;
    this.originalError = originalError;
  }
}

// Function to handle API errors
export const handleApiError = (error) => {
  if (!error.response) {
    return new AppError(ErrorTypes.NETWORK, null, error);
  }

  const { status, data } = error.response;

  switch (status) {
    case 400:
      return new AppError(ErrorTypes.VALIDATION, data.message || 'Invalid input', error);
    case 401:
      return new AppError(ErrorTypes.AUTH, 'Please log in again', error);
    case 403:
      return new AppError(ErrorTypes.FORBIDDEN, 'Access denied', error);
    case 404:
      return new AppError(ErrorTypes.NOT_FOUND, 'Resource not found', error);
    case 422:
      return new AppError(ErrorTypes.VALIDATION, data.message || 'Validation failed', error);
    case 500:
      return new AppError(ErrorTypes.SERVER, 'Internal server error', error);
    default:
      return new AppError(ErrorTypes.UNKNOWN, 'An unexpected error occurred', error);
  }
};

// Function to handle form validation errors
export const handleValidationError = (errors) => {
  return new AppError(
    ErrorTypes.VALIDATION,
    Object.values(errors).join('. '),
    errors
  );
};

// Function to show error notifications
export const showErrorNotification = (error) => {
  // This function should be implemented based on your notification system
  // For example, using toast notifications
  const message = error.message || errorMessages[error.type];
  console.error('Error:', message, error);
  
  // Example implementation with a toast library:
  // toast.error(message);
};

// Function to log errors
export const logError = (error, context = {}) => {
  // Log error to console in development
  if (import.meta.env && import.meta.env.DEV) {
    console.error('Error:', {
      type: error.type,
      message: error.message,
      originalError: error.originalError,
      context
    });
  }

  // In production, you might want to send errors to a logging service
  if (import.meta.env && import.meta.env.PROD) {
    // Example: Send to logging service
    // logger.error(error, { ...context });
  }
};

// Error boundary component for React
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || React.createElement('div', { className: 'error-boundary' },
        React.createElement('h2', null, 'Something went wrong'),
        React.createElement('p', null, 'Please try refreshing the page'),
        React.createElement('button', { onClick: () => window.location.reload() }, 'Refresh Page')
      );
    }

    return this.props.children;
  }
}

// Utility function to retry failed operations
export const retryOperation = async (operation, maxAttempts = 3, delay = 1000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
};

// Function to handle offline/online status
export const handleConnectivityChange = (online) => {
  if (!online) {
    showErrorNotification(
      new AppError(ErrorTypes.NETWORK, 'You are currently offline')
    );
  }
};

// Initialize connectivity handling
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => handleConnectivityChange(true));
  window.addEventListener('offline', () => handleConnectivityChange(false));
}

// Export a default object with all error handling utilities
export default {
  ErrorTypes,
  AppError,
  handleApiError,
  handleValidationError,
  showErrorNotification,
  logError,
  ErrorBoundary,
  retryOperation
}; 