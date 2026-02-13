// Utility function for debouncing to reduce CPU usage
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

import { logger } from './logger';

// Utility for safe localStorage operations
export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      return item ? JSON.parse(item) : null;
    } catch (error) {
      logger.warn('storage', 'Error reading from localStorage:', error);
      return null;
    }
  },

  set: (key: string, value: unknown): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      logger.warn('storage', 'Error writing to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.warn('storage', 'Error removing from localStorage:', error);
    }
  }
};