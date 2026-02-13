import { toast } from 'sonner';
import { NOTIFICATION_CONFIG, ERROR_MESSAGES } from '@/config/constants';

/**
 * Standardized notification utilities
 * Centralizes all toast notifications with consistent messaging and behavior
 */

export const notifications = {
  /**
   * Success notification with standard duration and styling
   */
  success: (message?: string, options?: { duration?: number }) => {
    const finalMessage = message || NOTIFICATION_CONFIG.MESSAGES.GENERIC_ERROR;
    toast.success(finalMessage, {
      duration: options?.duration || NOTIFICATION_CONFIG.SUCCESS_DURATION,
      position: NOTIFICATION_CONFIG.POSITION,
    });
  },

  /**
   * Error notification with standard duration and styling
   */
  error: (message?: string, options?: { duration?: number }) => {
    const finalMessage = message || ERROR_MESSAGES.GENERIC_ERROR;
    toast.error(finalMessage, {
      duration: options?.duration || NOTIFICATION_CONFIG.ERROR_DURATION,
      position: NOTIFICATION_CONFIG.POSITION,
    });
  },

  /**
   * Warning notification with standard duration and styling
   */
  warning: (message: string, options?: { duration?: number }) => {
    toast.warning(message, {
      duration: options?.duration || NOTIFICATION_CONFIG.WARNING_DURATION,
      position: NOTIFICATION_CONFIG.POSITION,
    });
  },

  /**
   * Info notification with standard duration and styling
   */
  info: (message: string, options?: { duration?: number }) => {
    toast.info(message, {
      duration: options?.duration || NOTIFICATION_CONFIG.INFO_DURATION,
      position: NOTIFICATION_CONFIG.POSITION,
    });
  },

  /**
   * Pre-defined notifications for common actions
   */
  login: {
    success: () => notifications.success(NOTIFICATION_CONFIG.MESSAGES.LOGIN_SUCCESS),
    error: () => notifications.error(NOTIFICATION_CONFIG.MESSAGES.LOGIN_ERROR),
  },

  signup: {
    success: () => notifications.success(NOTIFICATION_CONFIG.MESSAGES.SIGNUP_SUCCESS),
    error: () => notifications.error(NOTIFICATION_CONFIG.MESSAGES.SIGNUP_ERROR),
  },

  logout: {
    success: () => notifications.success(NOTIFICATION_CONFIG.MESSAGES.LOGOUT_SUCCESS),
  },

  cart: {
    updated: () => notifications.success(NOTIFICATION_CONFIG.MESSAGES.CART_UPDATED),
  },

  order: {
    created: () => notifications.success(NOTIFICATION_CONFIG.MESSAGES.ORDER_CREATED),
    updated: () => notifications.success(NOTIFICATION_CONFIG.MESSAGES.ORDER_UPDATED),
    notFound: () => notifications.error(NOTIFICATION_CONFIG.MESSAGES.ORDER_NOT_FOUND),
  },

  file: {
    uploadSuccess: () => notifications.success(NOTIFICATION_CONFIG.MESSAGES.FILE_UPLOAD_SUCCESS),
    uploadError: () => notifications.error(NOTIFICATION_CONFIG.MESSAGES.FILE_UPLOAD_ERROR),
    tooLarge: () => notifications.error(ERROR_MESSAGES.FILE_TOO_LARGE),
    invalidType: () => notifications.error(ERROR_MESSAGES.INVALID_FILE_TYPE),
  },

  network: {
    error: () => notifications.error(ERROR_MESSAGES.NETWORK_ERROR),
    timeout: () => notifications.error(ERROR_MESSAGES.TIMEOUT_ERROR),
  },

  auth: {
    required: () => notifications.warning(ERROR_MESSAGES.AUTH_REQUIRED),
    insufficientPermissions: () => notifications.error(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS),
    profileNotFound: () => notifications.error(NOTIFICATION_CONFIG.MESSAGES.PROFILE_NOT_FOUND),
  },

  validation: {
    invalidEmail: () => notifications.error(ERROR_MESSAGES.INVALID_EMAIL),
    passwordTooShort: () => notifications.error(ERROR_MESSAGES.PASSWORD_TOO_SHORT),
    requiredField: (fieldName?: string) => {
      const message = fieldName ? `${fieldName} is required` : ERROR_MESSAGES.REQUIRED_FIELD;
      notifications.error(message);
    },
  },

  business: {
    insufficientStock: () => notifications.error(ERROR_MESSAGES.INSUFFICIENT_STOCK),
    pharmacyNotConnected: () => notifications.error(ERROR_MESSAGES.PHARMACY_NOT_CONNECTED),
  },

  chat: {
    message: () => notifications.success('Message sent'),
  },
};

/**
 * Safe error handler for components
 * Centralizes error logging and user notification
 */
export const handleError = (error: unknown, context?: string) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  // Log to console for debugging
  console.error(`Error${context ? ` in ${context}` : ''}:`, {
    error,
    message: errorMessage,
    context,
    timestamp: new Date().toISOString(),
  });

  // Show user-friendly notification
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    notifications.network.error();
  } else if (errorMessage.includes('timeout')) {
    notifications.network.timeout();
  } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
    notifications.auth.insufficientPermissions();
  } else {
    notifications.error(errorMessage);
  }
};

/**
 * Debounce utility function
 * Prevents excessive function calls
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Format utilities for consistent data display
 */
export const format = {
  /**
   * Format currency with proper decimal places
   */
  currency: (amount: number, currency = 'INR'): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  /**
   * Format date with consistent pattern
   */
  date: (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  },

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  relativeTime: (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

    return format.date(dateObj);
  },

  /**
   * Format file size with proper units
   */
  fileSize: (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  },

  /**
   * Format medication name with proper capitalization
   */
  medicationName: (name: string): string => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  /**
   * Truncate text with ellipsis
   */
  truncate: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
  },
};

/**
 * Validation utilities
 */
export const validation = {
  /**
   * Validate email format
   */
  email: (email: string): boolean => {
    const emailRegex = REGEX_PATTERNS.EMAIL_ADDRESS;
    return emailRegex.test(email);
  },

  /**
   * Validate password strength
   */
  password: (password: string): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    if (password.length < FORM_CONFIG.MIN_PASSWORD_LENGTH) {
      errors.push(ERROR_MESSAGES.PASSWORD_TOO_SHORT);
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate phone number format
   */
  phoneNumber: (phone: string): boolean => {
    const phoneRegex = REGEX_PATTERNS.PHONE_NUMBER;
    return phoneRegex.test(phone);
  },

  /**
   * Validate file type for uploads
   */
  fileType: (file: File, allowedTypes: readonly string[]): boolean => {
    return allowedTypes.includes(file.type as FileType);
  },

  /**
   * Validate file size for uploads
   */
  fileSize: (file: File, maxSize: number): boolean => {
    return file.size <= maxSize;
  },
};

// Import the regex patterns and form config
import { REGEX_PATTERNS } from '@/config/constants';
import { FORM_CONFIG } from '@/config/constants';
import type { FileType } from '@/types/config';