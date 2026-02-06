/**
 * Type definitions for configuration constants
 */

export type ThemeMode = 'light' | 'dark' | 'system';
export type OrderStatus = 'placed' | 'ready' | 'complete' | 'cancelled';
export type UserRole = 'patient' | 'pharmacist' | 'admin';

export type FileType = 'image/jpeg' | 'image/png' | 'image/webp';

// UI-related types
export interface UIConfig {
  readonly DEFAULT_VISIBLE_ITEMS: number;
  readonly LOAD_MORE_INCREMENT: number;
  readonly ANIMATION_DURATION: number;
  readonly DEBOUNCE_DELAY: number;
  readonly SIDEBAR_WIDTH: number;
  readonly HEADER_HEIGHT: number;
  readonly LOADING_TIMEOUT: number;
  readonly SKELETON_COUNT: number;
}

// Chat-related types
export interface ChatConfig {
  readonly MAX_FILE_SIZE: number;
  readonly SUPPORTED_FILE_TYPES: readonly FileType[];
  readonly MESSAGE_REFRESH_INTERVAL: number;
  readonly CONNECTION_REFRESH_INTERVAL: number;
  readonly MAX_MESSAGE_LENGTH: number;
  readonly MAX_VISIBLE_MESSAGES: number;
  readonly UPLOAD_TIMEOUT: number;
}

// Order-related types
export interface OrderConfig {
  readonly STATUS_LABELS: Record<OrderStatus, string>;
  readonly STATUS_COLORS: Record<OrderStatus, string>;
  readonly LOW_STOCK_THRESHOLD: number;
  readonly ORDER_CONFIRMATION_TIMEOUT: number;
  readonly ORDER_REFRESH_INTERVAL: number;
  readonly ORDER_DETAIL_REFRESH_INTERVAL: number;
}

// Inventory-related types
export interface InventoryConfig {
  readonly LOW_STOCK_THRESHOLD: number;
  readonly CRITICAL_STOCK_THRESHOLD: number;
  readonly EOD_CHECK_TIMEOUT: number;
  readonly INVENTORY_REFRESH_INTERVAL: number;
  readonly ITEMS_PER_PAGE: number;
  readonly SEARCH_DEBOUNCE: number;
}

// Form-related types
export interface FormConfig {
  readonly MIN_PASSWORD_LENGTH: number;
  readonly MAX_MESSAGE_LENGTH: number;
  readonly MAX_SEARCH_QUERY_LENGTH: number;
  readonly INPUT_DEBOUNCE: number;
  readonly FORM_RESET_TIMEOUT: number;
  readonly MAX_AVATAR_SIZE: number;
  readonly AVATAR_FILE_TYPES: readonly FileType[];
}

// API-related types
export interface ApiConfig {
  readonly DEFAULT_TIMEOUT: number;
  readonly UPLOAD_TIMEOUT: number;
  readonly MAX_RETRIES: number;
  readonly RETRY_DELAY: number;
  readonly DEFAULT_STALE_TIME: number;
  readonly QUERY_STALE_TIME: number;
  readonly BACKGROUND_REFRESH_INTERVAL: number;
}

// Notification-related types
export interface NotificationConfig {
  readonly SUCCESS_DURATION: number;
  readonly ERROR_DURATION: number;
  readonly WARNING_DURATION: number;
  readonly INFO_DURATION: number;
  readonly POSITION: 'top-center';
  readonly MESSAGES: Record<string, string>;
}

// Theme-related types
export interface ThemeConfig {
  readonly STORAGE_KEY: string;
  readonly BREAKPOINTS: Record<'SM' | 'MD' | 'LG' | 'XL' | '2XL', number>;
  readonly Z_INDEX: Record<'BASE' | 'DROPDOWN' | 'MODAL' | 'TOAST' | 'TOOLTIP', number>;
}

// Route-related types
export interface RouteConfig {
  readonly PATIENT_ROUTES: readonly string[];
  readonly PHARMACY_ROUTES: readonly string[];
  readonly DEFAULT_PATIENT_REDIRECT: string;
  readonly DEFAULT_PHARMACY_REDIRECT: string;
  readonly ORDER_HASH_PATTERN: string;
}

// CSS Classes types
export interface CssClasses {
  BUTTON: {
    readonly BASE: string;
    readonly LOADING: string;
  };
  CARD: {
    readonly BASE: string;
    readonly INTERACTIVE: string;
  };
  INPUT: {
    readonly BASE: string;
    readonly ERROR: string;
  };
  SKELETON: {
    readonly BASE: string;
    readonly CARD: string;
    readonly TEXT: string;
    readonly AVATAR: string;
  };
}

// Regex Patterns types
export interface RegexPatterns {
  ORDER_AMOUNT: RegExp;
  ORDER_STATUS: RegExp;
  ORDER_ID: RegExp;
  PHONE_NUMBER: RegExp;
  EMAIL_ADDRESS: RegExp;
  MEDICATION_NAME: RegExp;
  DOSAGE: RegExp;
}