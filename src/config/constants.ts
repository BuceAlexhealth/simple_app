/**
 * Application-wide constants and configuration
 * Centralized to eliminate hard-coded values and improve maintainability
 */

// UI Configuration
export const UI_CONFIG = {
  // Pagination and lists
  DEFAULT_VISIBLE_ITEMS: 6,
  LOAD_MORE_INCREMENT: 6,
  
  // Animations and transitions
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
  
  // Sizes and dimensions
  SIDEBAR_WIDTH: 288, // 72 * 4 (72 in CSS)
  HEADER_HEIGHT: 64,
  
  // Loading states
  LOADING_TIMEOUT: 5000,
  SKELETON_COUNT: 3,
} as const;

// Chat Configuration
export const CHAT_CONFIG = {
  // File upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  
  // Real-time updates
  MESSAGE_REFRESH_INTERVAL: 5000,
  CONNECTION_REFRESH_INTERVAL: 10000,
  
  // UI
  MAX_MESSAGE_LENGTH: 1000,
  MAX_VISIBLE_MESSAGES: 50,
  
  // Timeouts
  UPLOAD_TIMEOUT: 30000,
} as const;

// Order Configuration
export const ORDER_CONFIG = {
  // Status colors and labels
  STATUS_LABELS: {
    placed: 'Order Placed',
    ready: 'Ready for Pickup',
    complete: 'Completed',
    cancelled: 'Cancelled',
  } as const,
  
  STATUS_COLORS: {
    placed: 'var(--info)',
    ready: 'var(--warning)',
    complete: 'var(--success)',
    cancelled: 'var(--error)',
  } as const,
  
  // Business logic
  LOW_STOCK_THRESHOLD: 5,
  ORDER_CONFIRMATION_TIMEOUT: 2000,
  
  // Polling
  ORDER_REFRESH_INTERVAL: 5000,
  ORDER_DETAIL_REFRESH_INTERVAL: 3000,
} as const;

// Inventory Configuration
export const INVENTORY_CONFIG = {
  // Business rules
  LOW_STOCK_THRESHOLD: 10,
  CRITICAL_STOCK_THRESHOLD: 3,
  
  // EOD check
  EOD_CHECK_TIMEOUT: 2000,
  INVENTORY_REFRESH_INTERVAL: 10000,
  
  // UI
  ITEMS_PER_PAGE: 20,
  SEARCH_DEBOUNCE: 300,
} as const;

// Form Configuration
export const FORM_CONFIG = {
  // Validation
  MIN_PASSWORD_LENGTH: 8,
  MAX_MESSAGE_LENGTH: 1000,
  MAX_SEARCH_QUERY_LENGTH: 100,
  
  // UI
  INPUT_DEBOUNCE: 300,
  FORM_RESET_TIMEOUT: 1000,
  
  // File upload (for forms)
  MAX_AVATAR_SIZE: 2 * 1024 * 1024, // 2MB
  AVATAR_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
} as const;

// API Configuration
export const API_CONFIG = {
  // Timeouts
  DEFAULT_TIMEOUT: 10000,
  UPLOAD_TIMEOUT: 30000,
  
  // Retry logic
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  
  // Caching
  DEFAULT_STALE_TIME: 5 * 60 * 1000, // 5 minutes
  QUERY_STALE_TIME: 2 * 60 * 1000, // 2 minutes
  
  // Polling
  BACKGROUND_REFRESH_INTERVAL: 30000,
} as const;

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  // Toast durations
  SUCCESS_DURATION: 3000,
  ERROR_DURATION: 5000,
  WARNING_DURATION: 4000,
  INFO_DURATION: 3000,
  
  // Positioning
  POSITION: 'top-center' as const,
  
  // Messages
  MESSAGES: {
    LOGIN_SUCCESS: 'Welcome back!',
    LOGIN_ERROR: 'Invalid email or password',
    SIGNUP_SUCCESS: 'Account created successfully!',
    SIGNUP_ERROR: 'Error creating account. Please try again.',
    LOGOUT_SUCCESS: 'Logged out successfully',
    PROFILE_NOT_FOUND: 'Profile not found. Please contact support.',
    CART_UPDATED: 'Cart updated successfully',
    ORDER_CREATED: 'Order created successfully',
    ORDER_UPDATED: 'Order updated successfully',
    ORDER_NOT_FOUND: 'Order not found.',
    FILE_UPLOAD_SUCCESS: 'File uploaded successfully',
    FILE_UPLOAD_ERROR: 'Failed to upload file',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    GENERIC_ERROR: 'Something went wrong. Please try again.',
  } as const,
} as const;

// Theme Configuration
export const THEME_CONFIG = {
  // Storage
  STORAGE_KEY: 'theme',
  
  // Breakpoints
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  } as const,
  
  // Z-index layers
  Z_INDEX: {
    BASE: 0,
    DROPDOWN: 1000,
    MODAL: 2000,
    TOAST: 3000,
    TOOLTIP: 4000,
  } as const,
} as const;

// URL and Routing Configuration
export const ROUTE_CONFIG = {
  // Route patterns
  PATIENT_ROUTES: [
    '/patient',
    '/patient/cart',
    '/patient/orders',
    '/patient/pharmacies',
    '/patient/chats',
  ] as const,
  
  PHARMACY_ROUTES: [
    '/pharmacy',
    '/pharmacy/inventory',
    '/pharmacy/chats',
  ] as const,
  
  // Default redirects
    DEFAULT_PATIENT_REDIRECT: '/patient',
  DEFAULT_PHARMACY_REDIRECT: '/pharmacy',
  
  // URL patterns
  ORDER_HASH_PATTERN: '#order-',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  
  // Authentication errors
  AUTH_REQUIRED: 'You must be logged in to access this feature.',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action.',
  
  // Validation errors
  INVALID_EMAIL: 'Please enter a valid email address.',
  PASSWORD_TOO_SHORT: `Password must be at least ${FORM_CONFIG.MIN_PASSWORD_LENGTH} characters long.`,
  REQUIRED_FIELD: 'This field is required.',
  
  // Business logic errors
  INSUFFICIENT_STOCK: 'Insufficient stock available.',
  ORDER_NOT_FOUND: 'Order not found.',
  PHARMACY_NOT_CONNECTED: 'You are not connected to this pharmacy.',
  
  // File upload errors
  FILE_TOO_LARGE: `File size must be less than ${CHAT_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB.`,
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a valid image file.',
  
  // Generic errors
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again later.',
} as const;

// CSS Classes and Styling Constants
export const CSS_CLASSES = {
  // Base component classes
  BUTTON: {
    BASE: 'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium btn-premium btn-ripple transition-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-light)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:hover:transform-none relative overflow-hidden',
    LOADING: 'spinner-premium',
  },
  
  CARD: {
    BASE: 'rounded-lg border bg-[var(--card-bg)] text-[var(--text-main)] shadow-sm hover:shadow-md transition-shadow duration-200',
    INTERACTIVE: 'cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200',
  },
  
  INPUT: {
    BASE: 'flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface-bg)] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--text-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    ERROR: 'border-[var(--error)] focus-visible:ring-[var(--error)]',
  },
  
  SKELETON: {
    BASE: 'animate-pulse rounded-md bg-[var(--border-light)]',
    CARD: 'h-24 w-full',
    TEXT: 'h-4 w-full',
    AVATAR: 'h-10 w-10 rounded-full',
  },
} as const;

// Regex Patterns (extracted from OrderBubble and other components)
export const REGEX_PATTERNS = {
  // Order parsing patterns
  ORDER_AMOUNT: /(?:total|amount|price)[:\s]*\$?(\d+(?:\.\d{2})?)/i,
  ORDER_STATUS: /(?:status|state)[:\s]*(placed|ready|complete|cancelled)/i,
  ORDER_ID: /(?:order|id)[:\s]*(\w+)/i,
  PHONE_NUMBER: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
  EMAIL_ADDRESS: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  
  // Medication patterns
  MEDICATION_NAME: /\b(?:tablet|capsule|pill|medicine|medication|med)\s+([a-zA-Z\s-]+)/i,
  DOSAGE: /\b(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|units?)/i,
} as const;