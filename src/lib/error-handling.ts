import { toast } from "sonner";

export interface AsyncErrorOptions {
  showToast?: boolean;
  fallbackMessage?: string;
  rethrow?: boolean;
  logLevel?: 'error' | 'warn' | 'info';
  context?: Record<string, any>;
}

/**
 * Standardized async error handler for consistent error management
 */
export const handleAsyncError = async <T>(
  operation: () => Promise<T>,
  errorMessage: string = "An error occurred",
  options: AsyncErrorOptions = { showToast: true, rethrow: true }
): Promise<T | null> => {
  const { showToast = true, fallbackMessage, rethrow = true, logLevel = 'error', context } = options;
  
  try {
    return await operation();
  } catch (error) {
    // Enhanced error logging with context
    const logData = {
      message: errorMessage,
      error: {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      },
      context,
      timestamp: new Date().toISOString()
    };

    switch (logLevel) {
      case 'warn':
        console.warn(logData);
        break;
      case 'info':
        console.info(logData);
        break;
      default:
        console.error(logData);
    }
    
    const message = error instanceof Error ? error.message : fallbackMessage || errorMessage;
    
    if (showToast) {
      toast.error(message);
    }
    
    if (rethrow) {
      throw error;
    }
    
    return null;
  }
};

/**
 * Safe toast notification that won't throw if toast fails
 */
export const safeToast = {
  success: (message: string) => {
    try {
      toast.success(message);
    } catch (error) {
      console.log("Toast success:", message);
    }
  },
  error: (message: string) => {
    try {
      toast.error(message);
    } catch (error) {
      console.error("Toast error:", message);
    }
  },
  info: (message: string) => {
    try {
      toast.info(message);
    } catch (error) {
      console.log("Toast info:", message);
    }
  }
};

/**
 * Extract error message from various error types
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return "An unexpected error occurred";
};

/**
 * Create a standardized API error response
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Log structured error for monitoring and debugging
 */
export function logStructuredError(
  error: Error | unknown,
  context: Record<string, any> = {},
  level: 'error' | 'warn' | 'info' = 'error'
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    error: {
      name: (error as Error).name || 'Unknown',
      message: (error as Error).message || String(error),
      stack: (error as Error).stack
    },
    context,
    requestId: crypto.randomUUID()
  };

  switch (level) {
    case 'warn':
      console.warn(JSON.stringify(logEntry, null, 2));
      break;
    case 'info':
      console.info(JSON.stringify(logEntry, null, 2));
      break;
    default:
      console.error(JSON.stringify(logEntry, null, 2));
  }
}