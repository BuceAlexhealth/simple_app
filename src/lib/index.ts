/**
 * Centralized exports for all utilities and configurations
 * This file provides a single entry point for commonly used utilities
 */

// Configuration constants
export * from '@/config/constants';
export * from '@/types/config';

// Utility functions
export * from '@/lib/notifications';
export * from '@/lib/order-status';

// Core utils (existing)
export { cn } from '@/lib/utils';

// Re-export commonly used types
export type { OrderStatus, InitiatorType } from '@/types';