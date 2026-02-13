export const logger = {
  debug: (context: string, message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${context}] ${message}`, data ?? '');
    }
  },

  info: (context: string, message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[${context}] ${message}`, data ?? '');
    }
  },

  warn: (context: string, message: string, data?: unknown) => {
    console.warn(`[${context}] ${message}`, data ?? '');
  },

  error: (context: string, message: string, error?: unknown) => {
    const errorData = error instanceof Error 
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;
    console.error(`[${context}] ${message}`, errorData);
  },

  group: (context: string, label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`[${context}] ${label}`);
    }
  },

  groupEnd: () => {
    if (process.env.NODE_ENV === 'development') {
      console.groupEnd();
    }
  },
};

export type Logger = typeof logger;
